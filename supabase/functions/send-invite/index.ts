// Supabase Edge Function — emails the community invite when a registration
// is approved, then stamps invite_sent_at so nobody double-sends.
//
// Runs on Deno, not in the app bundle. Deploy with:
//   supabase functions deploy send-invite --no-verify-jwt
//
// Two ways to send, picked by which secret is present:
//
//   Gmail SMTP (no domain required — recommended to start)
//     SMTP_USER        the Nex mailbox, e.g. nexnetwork@gmail.com
//     SMTP_PASSWORD    a Google App Password (needs 2FA on the account).
//                      NOT the account password.
//
//   Resend (needs a domain you own; better once Nex has one)
//     RESEND_API_KEY   Resend API key
//
// Gmail wins on deliverability without a domain because Google is genuinely
// the sender, so SPF/DKIM/DMARC all align. Sending as @gmail.com through a
// third-party provider does not align, and tends to land in spam.
//
// Always required:
//   NEX_INVITE_LINK  the Messenger group chat link — deliberately a secret,
//                    never committed and never shipped to the browser
//   SENDER_EMAIL     the "from" address (match SMTP_USER when using Gmail)
//   WEBHOOK_SECRET   shared secret the database trigger sends in a header
//   SITE_URL         optional, origin serving the email images
//                    (default https://nex-network.vercel.app)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    email: string;
    first_name: string;
    preferred_name: string | null;
    status: string;
    invite_sent_at: string | null;
  } | null;
  old_record: { status: string } | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * A deliberately plain alternative, off by default.
 *
 * Mail from a personal Gmail account carrying an m.me invite link already
 * looks like phishing to a filter; wrapping it in a designed template with
 * remote images and a CTA button pushes it further. This reads like a note a
 * person typed, which is what it actually is — and what Gmail's own
 * infrastructure is least suspicious of.
 *
 * Set EMAIL_STYLE=plain to use it if spam placement becomes a real problem.
 */
function plainInvite(name: string, link: string, contact: string) {
  const safeName = name.replace(/[<>&]/g, '');
  const text =
    `Hi ${safeName},\n\n` +
    `You're in — we checked your details and you're now part of Nex Network, ` +
    `a community of student builders across Batangas.\n\n` +
    `Here's the group chat:\n${link}\n\n` +
    `Introduce yourself when you join: what you're studying, what you're into, ` +
    `and anything you're building or want to build. That's usually all it takes ` +
    `for someone to find you.\n\n` +
    `No experience required. Just start.\n\n` +
    `- Nex Network\n${contact}`;
  return {
    subject: 'Your Nex Network invite',
    text,
    html:
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;` +
      `font-size:15px;line-height:1.6;color:#222;">` +
      text
        .split('\n\n')
        .map((para) => `<p>${para.replace(/\n/g, '<br>').replace(link, `<a href="${link}">${link}</a>`)}</p>`)
        .join('') +
      `</div>`,
  };
}

function brandedInvite(name: string, link: string, contact: string, site: string) {
  const safeName = name.replace(/[<>&]/g, '');
  return {
    subject: 'Your Nex Network invite — welcome aboard',
    text:
      `Hi ${safeName},\n\n` +
      `You're in. We checked your details and you're now part of Nex Network — a community of student builders across Batangas.\n\n` +
      `Here's the group chat:\n${link}\n\n` +
      `Introduce yourself when you join: what you're studying, what you're into, and anything you're building or want to build. That's usually all it takes for someone to find you.\n\n` +
      `No experience required. Just start.\n\n— Nex Network\n${contact}`,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <!-- The mark on the dark header: transparent PNG, so the header colour
             shows through and both halves of the S stay visible. Many clients
             block images, so the dark block and the heading carry the message
             on their own if it never loads. -->
        <tr><td align="center" style="background:#1b1a1f;padding:36px 32px 8px;">
          <img src="${site}/email-logo-3d.png" width="72" height="72" alt="Nex Network"
               style="display:block;border:0;color:#5cd6d7;font-size:14px;font-weight:600;" />
        </td></tr>
        <tr><td align="center" style="background:#1b1a1f;padding:0 32px 32px;">
          <p style="margin:0 0 6px;color:#5cd6d7;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;">Nex Network</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2;">You're in.</h1>
        </td></tr>
        <tr><td style="padding:30px 32px 28px;">
          <p style="margin:0 0 16px;color:#2b2a33;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;color:#4a4855;font-size:15px;line-height:1.65;">
            You're in. We checked your details and you're now part of Nex Network — a community of
            student builders across Batangas.
          </p>
          <p style="margin:0 0 24px;color:#4a4855;font-size:15px;line-height:1.65;">
            Introduce yourself when you join: what you're studying, what you're into, and anything
            you're building or want to build. That's usually all it takes for someone to find you.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#5cd6d7;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;color:#10171a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Join the group chat →</a>
          </td></tr></table>
          <p style="margin:24px 0 0;color:#8b8794;font-size:13px;line-height:1.6;">
            If the button doesn't work, use this link:<br>
            <a href="${link}" style="color:#2a9d9e;word-break:break-all;">${link}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #eceaf0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <!-- The mark is white-on-top, cyan-below, so it disappears against
                 the white card. A dark chip keeps both halves visible. -->
            <td style="padding-right:10px;" valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td align="center" style="background:#1b1a1f;border-radius:8px;padding:6px;">
                  <img src="${site}/email-logo.png" width="22" height="22" alt=""
                       style="display:block;border:0;" />
                </td>
              </tr></table>
            </td>
            <td valign="middle">
              <p style="margin:0;color:#2b2a33;font-size:13px;font-weight:600;">Nex Network</p>
              <p style="margin:0;color:#8b8794;font-size:12px;">Learn. Build. Collaborate. Compete. Connect.</p>
            </td>
          </tr></table>
          <p style="margin:14px 0 0;color:#8b8794;font-size:13px;line-height:1.6;">
            No experience required. Just start.<br>
            Questions? Reply to this email or reach us at
            <a href="mailto:${contact}" style="color:#2a9d9e;">${contact}</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

Deno.serve(async (req) => {
  // Only the database trigger knows this secret. Without it the function
  // would be an open endpoint anyone could use to fire invite emails.
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected || req.headers.get('x-webhook-secret') !== expected) {
    return json({ error: 'unauthorized' }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const row = payload.record;
  if (!row) return json({ skipped: 'no record' });

  // Only on the pending -> approved transition, and never twice.
  const becameApproved = row.status === 'approved' && payload.old_record?.status !== 'approved';
  if (!becameApproved) return json({ skipped: 'not a new approval' });
  if (row.invite_sent_at) return json({ skipped: 'invite already sent' });

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPassword = Deno.env.get('SMTP_PASSWORD');
  const link = Deno.env.get('NEX_INVITE_LINK');
  const sender = Deno.env.get('SENDER_EMAIL') ?? smtpUser;
  const contact = Deno.env.get('CONTACT_EMAIL') ?? sender ?? '';
  const canSend = (smtpUser && smtpPassword) || resendKey;
  if (!canSend || !link || !sender) {
    return json({ error: 'function secrets not configured' }, 500);
  }

  // Refuse to send rather than deliver a dead invite. A placeholder left in
  // NEX_INVITE_LINK still "works" everywhere else — the email sends, the row
  // gets stamped — but the button does nothing and the fallback text vanishes,
  // because angle brackets are parsed as an HTML tag. Failing here keeps the
  // row in "Awaiting invite" instead of silently stranding someone.
  if (!/^https:\/\//.test(link) || /[<>]/.test(link)) {
    console.error('NEX_INVITE_LINK is not a usable https URL:', link);
    return json({ error: 'invite link is not a valid https URL' }, 500);
  }

  // Absolute URLs are required in email; keep the origin configurable so a
  // custom domain later doesn't silently break every image.
  const site = (Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app').replace(/\/$/, '');
  const name = row.preferred_name?.trim() || row.first_name;
  // Branded by default: the team would rather send the designed email and
  // tell students to check spam than send a plainer one that lands better.
  // EMAIL_STYLE=plain switches to the stripped-back version, which reads as a
  // personal note and gets filtered less — worth reaching for if spam
  // placement ever costs more than the polish is worth.
  const mail =
    Deno.env.get('EMAIL_STYLE') === 'plain'
      ? plainInvite(name, link, contact)
      : brandedInvite(name, link, contact, site);

  // On any failure, leave invite_sent_at null so the row stays in "Awaiting
  // invite" in the admin UI and can be sent by hand. Failing loudly beats a
  // silent drop — nobody should fall through the cracks unnoticed.
  // Resend wins when configured. It is the better transport — a real sending
  // identity on a domain you own, rather than a personal mailbox — so once a
  // key exists there is no reason to prefer SMTP. This ordering also means
  // switching over is one `supabase secrets set`, with the Gmail path left in
  // place as a fallback if the key is ever removed.
  if (!resendKey && smtpUser && smtpPassword) {
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });
    try {
      await client.send({
        from: `Nex Network <${sender}>`,
        to: row.email,
        replyTo: contact || undefined,
        subject: mail.subject,
        content: mail.text,
        html: mail.html,
        // Signals to Gmail that this is legitimate mail with a real opt-out,
        // which meaningfully affects whether it lands in spam.
        headers: {
          'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>`,
          'X-Entity-Ref-ID': row.id,
        },
      });
      await client.close();
    } catch (err) {
      console.error('smtp failed', err);
      try { await client.close(); } catch { /* already closed */ }
      return json({ error: 'send failed', detail: String(err) }, 502);
    }
  } else {
    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Nex Network <${sender}>`,
        to: [row.email],
        reply_to: contact || undefined,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });

    if (!send.ok) {
      const detail = await send.text();
      console.error('resend failed', send.status, detail);
      return json({ error: 'send failed', status: send.status, detail }, 502);
    }
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await admin
    .from('members')
    .update({ invite_sent_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('invite_sent_at', null);

  if (error) console.error('stamp failed', error.message);

  return json({ sent: true, to: row.email, stamped: !error });
});
