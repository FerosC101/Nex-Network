// Supabase Edge Function — emails the approval when a registration is
// approved, then stamps invite_sent_at so nobody double-sends.
//
// The email no longer carries a Messenger link. Those links kept dying and
// could be forwarded to anyone once sent. Instead it sends the member to the
// site, where they submit their Facebook profile and the team adds them to
// the group chat by hand (see lookup-invite and supabase/facebook-profile.sql).
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
// Also used:
//   SENDER_EMAIL     the "from" address (match SMTP_USER when using Gmail)
//   WEBHOOK_SECRET   shared secret the database trigger sends in a header
//   SITE_URL         optional, origin of the site the email links to and
//                    serves its images from (default https://nex-network.vercel.app)
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
 * Where the email sends people: the "Find my invite" box, opened and already
 * looked up for this address, so an approved member lands on the Facebook
 * form with nothing to type but the profile link.
 */
function profileFormUrl(site: string, email: string) {
  return `${site}/?find=${encodeURIComponent(email)}#find-invite`;
}

/**
 * A deliberately plain alternative, off by default.
 *
 * Mail from a personal Gmail account wrapped in a designed template with
 * remote images and a CTA button looks more like marketing to a filter. This
 * reads like a note a person typed, which is what it actually is — and what
 * Gmail's own infrastructure is least suspicious of.
 *
 * Set EMAIL_STYLE=plain to use it if spam placement becomes a real problem.
 */
function plainInvite(name: string, formUrl: string, contact: string) {
  const safeName = name.replace(/[<>&]/g, '');
  const text =
    `Hi ${safeName},\n\n` +
    `You're in — we checked your details and you're now part of Nex Network, ` +
    `a community of student builders across Batangas.\n\n` +
    `To join the group chat, send us your Facebook profile here and we'll add you:\n${formUrl}\n\n` +
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
        .map((para) =>
          `<p>${para.split(formUrl).join(`<a href="${formUrl}">${formUrl}</a>`).replace(/\n/g, '<br>')}</p>`)
        .join('') +
      `</div>`,
  };
}

function brandedInvite(name: string, formUrl: string, contact: string, site: string) {
  const safeName = name.replace(/[<>&]/g, '');
  return {
    subject: 'Your Nex Network invite — welcome aboard',
    text:
      `Hi ${safeName},\n\n` +
      `You're in. We checked your details and you're now part of Nex Network — a community of student builders across Batangas.\n\n` +
      `To join the group chat, send us your Facebook profile here and we'll add you:\n${formUrl}\n\n` +
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
          <p style="margin:0 0 22px;color:#4a4855;font-size:15px;line-height:1.65;">
            <strong style="color:#2b2a33;">One last step:</strong> send us your Facebook profile and
            we'll add you to the group chat. It takes ten seconds.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#5cd6d7;">
            <a href="${formUrl}" style="display:inline-block;padding:14px 28px;color:#10171a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Send my Facebook profile →</a>
          </td></tr></table>
          <p style="margin:22px 0 0;color:#4a4855;font-size:15px;line-height:1.65;">
            Once you're in, introduce yourself: what you're studying, what you're into, and anything
            you're building or want to build. That's usually all it takes for someone to find you.
          </p>
          <p style="margin:24px 0 0;color:#8b8794;font-size:13px;line-height:1.6;">
            If the button doesn't work, use this link:<br>
            <a href="${formUrl}" style="color:#2a9d9e;word-break:break-all;">${formUrl}</a>
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
  const sender = Deno.env.get('SENDER_EMAIL') ?? smtpUser;
  const contact = Deno.env.get('CONTACT_EMAIL') ?? sender ?? '';
  const canSend = (smtpUser && smtpPassword) || resendKey;
  if (!canSend || !sender) {
    return json({ error: 'function secrets not configured' }, 500);
  }

  // Absolute URLs are required in email; keep the origin configurable so a
  // custom domain later doesn't silently break every image and link.
  const site = (Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app').replace(/\/$/, '');
  const formUrl = profileFormUrl(site, row.email);
  const name = row.preferred_name?.trim() || row.first_name;
  // Branded by default: the team would rather send the designed email and
  // tell students to check spam than send a plainer one that lands better.
  // EMAIL_STYLE=plain switches to the stripped-back version, which reads as a
  // personal note and gets filtered less — worth reaching for if spam
  // placement ever costs more than the polish is worth.
  const mail =
    Deno.env.get('EMAIL_STYLE') === 'plain'
      ? plainInvite(name, formUrl, contact)
      : brandedInvite(name, formUrl, contact, site);

  // On any failure, leave invite_sent_at null so the row stays in "Awaiting
  // invite" in the admin UI and can be sent by hand. Failing loudly beats a
  // silent drop — nobody should fall through the cracks unnoticed.
  // Resend takes over only once RESEND_FROM names a sender on a domain
  // verified in Resend. The API key alone is not enough: with Resend's test
  // domain the service refuses any recipient except the account owner, so
  // switching on the key by itself would silently break every student invite.
  // Setting RESEND_FROM is the deliberate signal that the domain is ready.
  const resendFrom = Deno.env.get('RESEND_FROM');
  const useResend = Boolean(resendKey && resendFrom);
  if (!useResend && smtpUser && smtpPassword) {
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? 465),
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
        from: `Nex Network <${resendFrom ?? sender}>`,
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
