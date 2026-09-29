// Supabase Edge Function — a one-off to the most recently approved members,
// whose approval email carried a Messenger invite link that no longer works.
// It points them at the site to send us their Facebook profile instead, the
// same form new approvals now get (see send-invite and lookup-invite).
//
// Who gets it: the `count` (default 50) most recently approved members from
// before `approvedBefore` — set that to when the new send-invite went live, so
// anyone approved since, who already got the new email, is left out. The same
// two values must be passed on every call so the group stays the same across
// batches; each send is stamped in relinked_at so nobody is emailed twice.
// Anyone who has already sent a profile, or been added, is skipped.
//
// Scoped to status='approved' on purpose: the group chat must never reach
// someone pending or declined.
//
// Call with {"dryRun": true, ...} to see who would receive it, and with
// {"testTo": "you@example.com"} to send yourself one copy first.
//
// Deploy: supabase functions deploy send-relink --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Same landing as send-invite: the lookup box, already run for this address. */
function profileFormUrl(site: string, email: string) {
  return `${site}/?find=${encodeURIComponent(email)}#find-invite`;
}

function relinkEmail(name: string, formUrl: string, contact: string, site: string) {
  const safeName = name.replace(/[<>&]/g, '');
  const text =
    `Hi ${safeName},\n\n` +
    `When we approved you, we sent a Messenger link to join the Nex group chat. ` +
    `That link has stopped working — sorry about that.\n\n` +
    `If you're already in the group chat, you can ignore this.\n\n` +
    `If not: our Messenger invite link is down right now, so for the moment we're adding ` +
    `everyone to the group chat by hand. Send us your Facebook profile here and we'll add you:\n` +
    `${formUrl}\n\n` +
    `Introduce yourself when you join: what you're studying, what you're into, and ` +
    `anything you're building or want to build.\n\n` +
    `- Nex Network\n${contact}`;

  return {
    subject: 'Your Nex group chat link stopped working — here’s the fix',
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
          <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.25;">Still want in? One quick step.</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#2b2a33;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;color:#4a4855;font-size:15px;line-height:1.65;">
            When we approved you, we sent a Messenger link to join the Nex group chat. That link
            has stopped working — sorry about that.
          </p>
          <p style="margin:0 0 14px;color:#4a4855;font-size:15px;line-height:1.65;">
            <strong style="color:#2b2a33;">If you're already in the group chat, you can ignore this.</strong>
            If not, send us your Facebook profile and we'll add you.
          </p>
          <p style="margin:0 0 22px;padding:12px 14px;background:#f4f4f6;border-radius:10px;color:#6b6876;font-size:13px;line-height:1.6;">
            Why not just a new link? Our Messenger invite link is down right now, so for the
            moment we're adding everyone to the group chat by hand.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#5cd6d7;">
            <a href="${formUrl}" style="display:inline-block;padding:14px 28px;color:#10171a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Send my Facebook profile →</a>
          </td></tr></table>
          <p style="margin:20px 0 0;color:#8b8794;font-size:13px;line-height:1.6;">
            If the button doesn't work:<br>
            <a href="${formUrl}" style="color:#2a9d9e;word-break:break-all;">${formUrl}</a>
          </p>
          <p style="margin:20px 0 0;color:#4a4855;font-size:15px;line-height:1.65;">
            Introduce yourself when you join: what you're studying, what you're into, and
            anything you're building or want to build.
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
  const testTo: string | undefined = body?.testTo;
  const count: number = Number(body?.count ?? 50);
  // Kept under the function's wall clock: one SMTP connection per message
  // plus a pause adds up, and a timeout mid-run is exactly what the stamp
  // exists to survive, but not something to court.
  const limit: number = Number(body?.limit ?? 25);

  const sender = Deno.env.get('SENDER_EMAIL');
  const contact = Deno.env.get('CONTACT_EMAIL') ?? sender ?? '';
  const site = (Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app').replace(/\/$/, '');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPassword = Deno.env.get('SMTP_PASSWORD');
  if (!sender || !smtpUser || !smtpPassword) return json({ error: 'secrets not configured' }, 500);

  const newClient = () =>
    new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? 465),
        tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });

  // Even a fresh connection can hang, so no single message is allowed to eat
  // the request budget the rest of the batch needs.
  const withTimeout = <T,>(work: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      work,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
      ),
    ]);

  const sendOne = (to: string, mail: ReturnType<typeof relinkEmail>) => {
    const client = newClient();
    return withTimeout(
      client.send({
        from: `Nex Network <${sender}>`,
        to,
        replyTo: contact || undefined,
        subject: mail.subject,
        content: mail.text,
        html: mail.html,
        headers: { 'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>` },
      }),
      20_000,
    ).finally(() => withTimeout(client.close(), 5_000).catch(() => { /* already gone */ }));
  };

  // Before the recipient query, so it works before the migration is applied.
  if (testTo) {
    try {
      await sendOne(testTo, relinkEmail('Vince', profileFormUrl(site, testTo), contact, site));
    } catch (err) {
      return json({ error: 'test send failed', detail: String(err) }, 502);
    }
    return json({ test: true, sentTo: testTo });
  }

  // Required, not defaulted to "now": the group has to be identical on every
  // call, and "now" moves — each batch would pick up whoever was approved in
  // between and push someone older out of the top 50 before they were reached.
  const approvedBefore = String(body?.approvedBefore ?? '');
  if (Number.isNaN(Date.parse(approvedBefore))) {
    return json({ error: 'approvedBefore (an ISO timestamp) is required' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // The fixed group first — the most recent `count` approvals, stamped or not
  // — and only then drop whoever is already done. Filtering first would let
  // the window slide past the 50th person on every re-run.
  const { data, error } = await admin
    .from('members')
    .select('id, email, first_name, preferred_name, relinked_at, facebook_url, added_to_chat_at')
    .eq('status', 'approved')
    .lt('reviewed_at', approvedBefore)
    .order('reviewed_at', { ascending: false })
    .limit(count);

  if (error) return json({ error: error.message }, 500);
  const group = data ?? [];
  const recipients = group.filter((m) => !m.relinked_at && !m.facebook_url && !m.added_to_chat_at);

  if (dryRun) {
    return json({
      dryRun: true,
      group: group.length,
      alreadySentOrDone: group.length - recipients.length,
      wouldSendTo: recipients.length,
      recipients: recipients.map((r) => r.email),
      textPreview: relinkEmail(
        recipients[0]?.preferred_name?.trim() || recipients[0]?.first_name || 'there',
        profileFormUrl(site, recipients[0]?.email ?? 'someone@example.com'),
        contact,
        site,
      ).text,
    });
  }

  const batch = recipients.slice(0, limit);
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const person of batch) {
    const mail = relinkEmail(
      person.preferred_name?.trim() || person.first_name,
      profileFormUrl(site, person.email),
      contact,
      site,
    );
    try {
      await sendOne(person.email, mail);
      sent.push(person.email);
      // Stamped the moment the send succeeds, so a crash mid-batch can never
      // cause a repeat: the next call simply skips whoever is stamped.
      await admin.from('members').update({ relinked_at: new Date().toISOString() }).eq('id', person.id);
    } catch (err) {
      failed.push({ email: person.email, error: String(err) });
    }
    // A burst is what relays and receivers treat as spam.
    await new Promise((r) => setTimeout(r, 400));
  }

  return json({
    sent: sent.length,
    failed: failed.length,
    failures: failed,
    remaining: recipients.length - sent.length,
    sentTo: sent,
  });
});
