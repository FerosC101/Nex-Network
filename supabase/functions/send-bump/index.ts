// Supabase Edge Function — a one-off follow-up to approved members who may
// never have received their invite, because Gmail was silently dropping and
// deferring mail before the move to Brevo.
//
// Scoped to status='approved' on purpose. The community link is the thing
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
    `You joined Nex Network a little while ago and we sent your community invite — ` +
    `but our emails were having delivery trouble, so there's a good chance it never ` +
    `reached you.\n\n` +
    `If you're already in, you can ignore this.\n\n` +
    `If not, here's the link:\n${link}\n\n` +
    `Introduce yourself when you join: what you're studying, what you're into, and ` +
    `anything you're building or want to build.\n\n` +
    `Sorry for the delay — and thanks for being one of the first.\n\n` +
    `- Nex Network\n${contact}`;

  return {
    subject: 'Your Nex community invite (in case you missed it)',
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
            You joined Nex Network a little while ago and we sent your community invite —
            but our emails were having delivery trouble, so there's a good chance it never
            reached you.
          </p>
          <p style="margin:0 0 20px;color:#4a4855;font-size:15px;line-height:1.65;">
            <strong>If you're already in, you can ignore this.</strong> If not,
            here's the link:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#5cd6d7;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;color:#10171a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Join the community →</a>
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
  // Batched on purpose. 81 sends can outrun the function's wall clock, and a
  // timeout mid-run would leave no record of who was already emailed — which
  // risks double-sending on a retry. Small batches keep that knowable.
  const offset: number = Number(body?.offset ?? 0);
  // Someone approved an hour ago has an unread invite sitting in their inbox;
  // "Did you miss this?" would only confuse them. Default to nudging people
  // whose invite has had at least a day to be missed.
  const minInviteAgeHours: number = Number(body?.minInviteAgeHours ?? 24);
  const limit: number = Number(body?.limit ?? 25);

  const link = Deno.env.get('NEX_INVITE_LINK');
  const sender = Deno.env.get('SENDER_EMAIL');
  const contact = Deno.env.get('CONTACT_EMAIL') ?? sender ?? '';
  const site = (Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app').replace(/\/$/, '');
  if (!link || !sender) return json({ error: 'secrets not configured' }, 500);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  // Only people who have not already been bumped. Stamping each row as it
  // sends makes this safe to re-run: a timeout mid-batch can no longer cause
  // anyone to receive the same email twice.
  const { data, error } = await admin
    .from('members')
    .select('id, email, first_name, preferred_name')
    .eq('status', 'approved')
    .is('bumped_at', null)
    .not('invite_sent_at', 'is', null)
    .lt(
      'invite_sent_at',
      new Date(Date.now() - minInviteAgeHours * 3_600_000).toISOString(),
    )
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

  // One connection per message, not one for the whole batch. Brevo's relay
  // closes a connection after a handful of sends, and denomailer blocks
  // forever on the dead socket instead of throwing — which is what stalled an
  // earlier run at four messages and took the whole request down with it.
  const newClient = () =>
    new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? 465),
        tls: true,
        auth: { username: Deno.env.get('SMTP_USER')!, password: Deno.env.get('SMTP_PASSWORD')! },
      },
    });

  // Belt and braces: even a fresh connection can hang, so no single message is
  // allowed to eat the request budget the rest of the batch needs.
  const withTimeout = <T,>(work: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      work,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
      ),
    ]);

  const batch = recipients.slice(offset, offset + limit);
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const person of batch) {
    const mail = bumpEmail(person.preferred_name?.trim() || person.first_name, link, contact, site);
    const client = newClient();
    try {
      await withTimeout(
        client.send({
          from: `Nex Network <${sender}>`,
          to: person.email,
          replyTo: contact || undefined,
          subject: mail.subject,
          content: mail.text,
          html: mail.html,
          headers: { 'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>` },
        }),
        20_000,
      );
      sent.push(person.email);
      // Stamped the moment the send succeeds, so a crash mid-batch can never
      // cause a repeat: the next run simply skips whoever is already stamped.
      await admin.from('members').update({ bumped_at: new Date().toISOString() }).eq('id', person.id);
    } catch (err) {
      failed.push({ email: person.email, error: String(err) });
    }
    try { await withTimeout(client.close(), 5_000); } catch { /* already gone */ }
    // A brief gap between messages: a burst is what relays and receivers
    // treat as spam, and this only has to run once.
    await new Promise((r) => setTimeout(r, 400));
  }

  return json({
    sent: sent.length,
    failed: failed.length,
    failures: failed,
    offset,
    batchSize: batch.length,
    totalApproved: recipients.length,
    remaining: Math.max(0, recipients.length - (offset + batch.length)),
    sentTo: sent,
  });
});
