// Supabase Edge Function — a one-off follow-up to approved members who may
// never have received their invite, because Gmail was silently dropping and
// deferring mail before the move to Brevo.
//
// Scoped to status='approved' on purpose. The group chat link is the thing
// the whole review step exists to protect, so it must never go to someone
// pending or declined.
//
// Call with {"dryRun": true} to see who would receive it and the rendered
// email, without sending anything.
//
// Deploy: supabase functions deploy send-bump --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function bumpEmail(name: string, link: string, contact: string, site: string) {
  const safeName = name.replace(/[<>&]/g, '');
  const text =
    `Hi ${safeName},\n\n` +
    `You joined Nex Network a little while ago and we sent your group chat invite — ` +
    `but our emails were having delivery trouble, so there's a good chance it never ` +
    `reached you.\n\n` +
    `If you're already in the chat, you can ignore this.\n\n` +
    `If not, here's the link:\n${link}\n\n` +
    `Introduce yourself when you join: what you're studying, what you're into, and ` +
    `anything you're building or want to build.\n\n` +
    `Sorry for the delay — and thanks for being one of the first.\n\n` +
    `- Nex Network\n${contact}`;

  return {
    subject: 'Your Nex group chat invite (in case you missed it)',
    text,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="background:#1b1a1f;padding:32px 32px 8px;">
          <img src="${site}/email-logo-3d.png" width="64" height="64" alt="Nex Network"
               style="display:block;border:0;color:#5cd6d7;font-size:14px;font-weight:600;" />
        </td></tr>
        <tr><td align="center" style="background:#1b1a1f;padding:0 32px 28px;">
          <p style="margin:0 0 6px;color:#5cd6d7;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;">Nex Network</p>
          <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.25;">Did you miss this?</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#2b2a33;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;color:#4a4855;font-size:15px;line-height:1.65;">
            You joined Nex Network a little while ago and we sent your group chat invite —
            but our emails were having delivery trouble, so there's a good chance it never
            reached you.
          </p>
          <p style="margin:0 0 20px;color:#4a4855;font-size:15px;line-height:1.65;">
            <strong>If you're already in the chat, you can ignore this.</strong> If not,
            here's the link:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#5cd6d7;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;color:#10171a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Join the group chat →</a>
          </td></tr></table>
          <p style="margin:20px 0 0;color:#8b8794;font-size:13px;line-height:1.6;">
            If the button doesn't work:<br>
            <a href="${link}" style="color:#2a9d9e;word-break:break-all;">${link}</a>
          </p>
          <p style="margin:20px 0 0;color:#4a4855;font-size:15px;line-height:1.65;">
            Introduce yourself when you join: what you're studying, what you're into, and
            anything you're building or want to build.
          </p>
          <p style="margin:16px 0 0;color:#4a4855;font-size:15px;line-height:1.65;">
            Sorry for the delay — and thanks for being one of the first.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #eceaf0;">
          <p style="margin:0;color:#8b8794;font-size:13px;line-height:1.6;">
            Nex Network · Learn. Build. Collaborate. Compete. Connect.<br>
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
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected || req.headers.get('x-webhook-secret') !== expected) {
    return json({ error: 'unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false;
  // Send a single copy somewhere for review before the real run. Worth doing
  // every time: the list is 81 people and there is no unsend.
  const testTo: string | undefined = body?.testTo;

  const link = Deno.env.get('NEX_INVITE_LINK');
  const sender = Deno.env.get('SENDER_EMAIL');
  const contact = Deno.env.get('CONTACT_EMAIL') ?? sender ?? '';
  const site = (Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app').replace(/\/$/, '');
  if (!link || !sender) return json({ error: 'secrets not configured' }, 500);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await admin
    .from('members')
    .select('id, email, first_name, preferred_name')
    .eq('status', 'approved')
    .order('created_at');

  if (error) return json({ error: error.message }, 500);
  const recipients = data ?? [];

  if (testTo) {
    const mail = bumpEmail('Vince', link, contact, site);
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? 465),
        tls: true,
        auth: { username: Deno.env.get('SMTP_USER')!, password: Deno.env.get('SMTP_PASSWORD')! },
      },
    });
    try {
      await client.send({
        from: `Nex Network <${sender}>`,
        to: testTo,
        replyTo: contact || undefined,
        subject: mail.subject,
        content: mail.text,
        html: mail.html,
        headers: { 'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>` },
      });
      await client.close();
    } catch (err) {
      try { await client.close(); } catch { /* already closed */ }
      return json({ error: 'test send failed', detail: String(err) }, 502);
    }
    return json({ test: true, sentTo: testTo, wouldSendTo: recipients.length });
  }

  if (dryRun) {
    const sample = recipients[0];
    const preview = bumpEmail(
      sample?.preferred_name?.trim() || sample?.first_name || 'there',
      link, contact, site,
    );
    return json({
      dryRun: true,
      wouldSendTo: recipients.length,
      recipients: recipients.map((r) => r.email),
      subject: preview.subject,
      textPreview: preview.text,
    });
  }

  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(Deno.env.get('SMTP_PORT') ?? 465),
      tls: true,
      auth: { username: Deno.env.get('SMTP_USER')!, password: Deno.env.get('SMTP_PASSWORD')! },
    },
  });

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const person of recipients) {
    const mail = bumpEmail(person.preferred_name?.trim() || person.first_name, link, contact, site);
    try {
      await client.send({
        from: `Nex Network <${sender}>`,
        to: person.email,
        replyTo: contact || undefined,
        subject: mail.subject,
        content: mail.text,
        html: mail.html,
        headers: { 'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>` },
      });
      sent.push(person.email);
    } catch (err) {
      failed.push({ email: person.email, error: String(err) });
    }
    // A brief gap between messages: a burst is what relays and receivers
    // treat as spam, and this only has to run once.
    await new Promise((r) => setTimeout(r, 900));
  }
  try { await client.close(); } catch { /* already closed */ }

  return json({ sent: sent.length, failed: failed.length, failures: failed });
});
