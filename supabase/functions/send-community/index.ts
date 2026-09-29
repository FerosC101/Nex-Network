// Supabase Edge Function — the one-off announcement that Nex is moving from
// the group chat to a Messenger Community.
//
// A group chat stops working somewhere around a couple of hundred people:
// every message pings everyone, introductions scroll away in an hour, and
// there is nowhere to put a conversation that only some members care about.
// A Community has channels, so this is a move the growth forced.
//
// Scoped to status='approved', the same rule send-invite and send-bump follow.
// The community link is the thing the whole review step exists to protect, so
// it must never reach someone pending or declined.
//
// Call with {"dryRun": true} (the default) to see who would receive it and the
// rendered email, without sending anything.
//
// Deploy: supabase functions deploy send-community --no-verify-jwt
//
// Requires the community link in NEX_INVITE_LINK — set that to the Community
// URL before running, so the invite, bump and lookup paths all point at the
// new home too rather than stranding people in a chat nobody is reading.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

// The milestone this email is thanking people for. Kept here rather than
// counted from the table on purpose: `members` holds registrations at every
// status, so a live count would quietly disagree with the number the team has
// been saying publicly. Update these two lines when the next one lands.
const MEMBER_COUNT = '250+';
const SCHOOL_COUNT = '19';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function communityEmail(name: string, link: string, contact: string, site: string) {
  const safeName = name.replace(/[<>&]/g, '');
  const text =
    `Hi ${safeName},\n\n` +
    `Nex Network is moving to a Messenger Community — and you're invited to come with us.\n\n` +
    `Here's the new home:\n${link}\n\n` +
    `First, a thank you. We're now ${MEMBER_COUNT} student builders from ${SCHOOL_COUNT} schools across ` +
    `Batangas. That happened in months, and it happened because people kept showing ` +
    `up, kept introducing themselves, and kept building in the open.\n\n` +
    `That's also why we're moving. One group chat can't hold ${MEMBER_COUNT} people ` +
    `without burying everything that matters. A Community gives us channels — so ` +
    `introductions, projects, opportunities and questions each get their own room, ` +
    `and you can find the people working on what you're working on.\n\n` +
    `Join whenever you're ready. Say hi when you get in: what you're studying, what ` +
    `you're into, and anything you're building or want to build.\n\n` +
    `Let's keep the Nex Network going, and let's keep it growing.\n\n` +
    `- Nex Network\n${contact}`;

  return {
    subject: `We're moving to a Messenger Community — join us (and thank you)`,
    text,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <!-- Transparent PNG on the dark header so both halves of the mark stay
             visible. Many clients block images, so the dark block and heading
             have to carry the message on their own if it never loads. -->
        <tr><td align="center" style="background:#1b1a1f;padding:36px 32px 8px;">
          <img src="${site}/email-logo-3d.png" width="72" height="72" alt="Nex Network"
               style="display:block;border:0;color:#5cd6d7;font-size:14px;font-weight:600;" />
        </td></tr>
        <tr><td align="center" style="background:#1b1a1f;padding:0 32px 32px;">
          <p style="margin:0 0 6px;color:#5cd6d7;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;">Nex Network</p>
          <h1 style="margin:0;color:#ffffff;font-size:27px;line-height:1.22;">We're moving to a Community</h1>
        </td></tr>
        <tr><td style="padding:30px 32px 4px;">
          <p style="margin:0 0 16px;color:#2b2a33;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 22px;color:#4a4855;font-size:15px;line-height:1.65;">
            Nex Network is moving to a <strong>Messenger Community</strong> — and you're
            invited to come with us.
          </p>
        </td></tr>
        <!-- The milestone, as two figures rather than a sentence: this is the
             part people forward to a friend. -->
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2fbfb;border-radius:12px;">
            <tr>
              <td align="center" style="padding:18px 8px;width:50%;">
                <p style="margin:0;color:#12797a;font-size:26px;font-weight:700;line-height:1.1;">${MEMBER_COUNT}</p>
                <p style="margin:4px 0 0;color:#4a4855;font-size:12px;letter-spacing:.06em;text-transform:uppercase;">student builders</p>
              </td>
              <td align="center" style="padding:18px 8px;width:50%;border-left:1px solid #d9efef;">
                <p style="margin:0;color:#12797a;font-size:26px;font-weight:700;line-height:1.1;">${SCHOOL_COUNT}</p>
                <p style="margin:4px 0 0;color:#4a4855;font-size:12px;letter-spacing:.06em;text-transform:uppercase;">schools</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:22px 32px 28px;">
          <p style="margin:0 0 16px;color:#4a4855;font-size:15px;line-height:1.65;">
            First, a thank you. That's where we are now, across Batangas — reached in
            months, and only because people kept showing up, kept introducing
            themselves, and kept building in the open.
          </p>
          <p style="margin:0 0 16px;color:#4a4855;font-size:15px;line-height:1.65;">
            It's also why we're moving. One group chat can't hold ${MEMBER_COUNT} people without
            burying everything that matters. A Community gives us channels — so
            introductions, projects, opportunities and questions each get their own
            room, and you can find the people working on what you're working on.
          </p>
          <p style="margin:0 0 24px;color:#4a4855;font-size:15px;line-height:1.65;">
            Join whenever you're ready. Say hi when you get in: what you're studying,
            what you're into, and anything you're building or want to build.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#5cd6d7;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;color:#10171a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Join the Nex Community →</a>
          </td></tr></table>
          <p style="margin:24px 0 0;color:#8b8794;font-size:13px;line-height:1.6;">
            If the button doesn't work, use this link:<br>
            <a href="${link}" style="color:#2a9d9e;word-break:break-all;">${link}</a>
          </p>
          <p style="margin:24px 0 0;color:#2b2a33;font-size:15px;line-height:1.65;">
            Let's keep the Nex Network going, and let's keep it growing.
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
  // Dry by default: this goes to the whole approved list and there is no
  // unsend. Sending has to be the deliberate choice, not the accident.
  const dryRun = body?.dryRun !== false;
  // Send a single copy somewhere for review before the real run. Worth doing
  // every time — read it on a phone, which is where it will be opened.
  const testTo: string | undefined = body?.testTo;
  // Batched for the same reason send-bump is: the whole list can outrun the
  // function's wall clock, and a timeout mid-run would leave no record of who
  // was already emailed.
  //
  // There is deliberately no `offset`. The query already excludes everyone
  // stamped, so each call naturally starts where the last one stopped, and an
  // offset on top of a shrinking list would step *past* people — permanently
  // stranding them once `remaining` reached zero. Call this repeatedly with
  // the same arguments instead; it is the absence of the parameter that makes
  // that safe.
  const limit: number = Number(body?.limit ?? 25);

  const link = Deno.env.get('NEX_INVITE_LINK');
  const sender = Deno.env.get('SENDER_EMAIL');
  const contact = Deno.env.get('CONTACT_EMAIL') ?? sender ?? '';
  const site = (Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app').replace(/\/$/, '');
  if (!link || !sender) return json({ error: 'secrets not configured' }, 500);

  // Refuse to send rather than deliver a dead link to the entire membership.
  // Angle brackets in the URL would be parsed as an HTML tag and swallow the
  // fallback text, leaving an email whose only purpose silently fails.
  if (!/^https:\/\//.test(link) || /[<>]/.test(link)) {
    console.error('NEX_INVITE_LINK is not a usable https URL:', link);
    return json({ error: 'invite link is not a valid https URL' }, 500);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const newClient = () =>
    new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? 465),
        tls: true,
        auth: { username: Deno.env.get('SMTP_USER')!, password: Deno.env.get('SMTP_PASSWORD')! },
      },
    });

  // Belt and braces: denomailer blocks forever on a relay-closed socket
  // instead of throwing, so no single message is allowed to eat the request
  // budget the rest of the batch needs.
  const withTimeout = <T,>(work: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      work,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
      ),
    ]);

  // Deliberately ahead of the recipient query: a test send is about whether the
  // email itself renders and lands, and must not be blocked by the state of the
  // member list — including the case where community_notified_at has not been
  // added yet, which is exactly when you most want to preview this.
  if (testTo) {
    const mail = communityEmail('Vince', link, contact, site);
    const client = newClient();
    try {
      await withTimeout(
        client.send({
          from: `Nex Network <${sender}>`,
          to: testTo,
          replyTo: contact || undefined,
          subject: mail.subject,
          content: mail.text,
          html: mail.html,
          headers: { 'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>` },
        }),
        20_000,
      );
    } catch (err) {
      try { await withTimeout(client.close(), 5_000); } catch { /* already gone */ }
      return json({ error: 'test send failed', detail: String(err) }, 502);
    }
    try { await withTimeout(client.close(), 5_000); } catch { /* already gone */ }
    return json({ test: true, sentTo: testTo });
  }

  // Only approved members, and only those not already told. Stamping each row
  // as it sends makes this safe to re-run: a timeout mid-batch can no longer
  // cause anyone to receive the same announcement twice.
  const { data, error } = await admin
    .from('members')
    .select('id, email, first_name, preferred_name')
    .eq('status', 'approved')
    .is('community_notified_at', null)
    .order('created_at');

  if (error) return json({ error: error.message }, 500);
  const recipients = data ?? [];

  if (dryRun) {
    const sample = recipients[0];
    const preview = communityEmail(
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
  // closes a connection after a handful of sends, and a reused client stalls
  // the entire run on the dead socket.
  const batch = recipients.slice(0, limit);
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const person of batch) {
    const mail = communityEmail(
      person.preferred_name?.trim() || person.first_name,
      link, contact, site,
    );
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
          headers: {
            'List-Unsubscribe': `<mailto:${contact}?subject=unsubscribe>`,
            'X-Entity-Ref-ID': person.id,
          },
        }),
        20_000,
      );
      sent.push(person.email);
      // Stamped the moment the send succeeds, so a crash mid-batch can never
      // cause a repeat: the next run simply skips whoever is already stamped.
      await admin
        .from('members')
        .update({ community_notified_at: new Date().toISOString() })
        .eq('id', person.id);
    } catch (err) {
      failed.push({ email: person.email, error: String(err) });
    }
    try { await withTimeout(client.close(), 5_000); } catch { /* already gone */ }
    // A brief gap between messages: a burst is what relays and receivers treat
    // as spam, and this only has to run once.
    await new Promise((r) => setTimeout(r, 400));
  }

  // `remaining` counts what is still unstamped, so it subtracts what actually
  // sent rather than the batch size: an address that failed is still owed this
  // email and must keep showing up here.
  return json({
    sent: sent.length,
    failed: failed.length,
    failures: failed,
    batchSize: batch.length,
    remaining: Math.max(0, recipients.length - sent.length),
    sentTo: sent,
  });
});
