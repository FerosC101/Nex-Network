// Supabase Edge Function — tells the team a new registration has arrived.
//
// Sent with Resend's shared domain, which can only deliver to the Resend
// account owner. That is a hard limit for student invites, but exactly right
// here: this only ever goes to the team's own inbox, so no domain purchase is
// needed. Student invites stay on send-invite until a domain is verified.
//
// Deploy:  supabase functions deploy notify-registration --no-verify-jwt
// Secrets: RESEND_API_KEY, NOTIFY_TO, WEBHOOK_SECRET

interface WebhookPayload {
  type: string;
  record: Record<string, unknown> | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const esc = (v: unknown) =>
  String(v ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);

Deno.serve(async (req) => {
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

  const key = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('NOTIFY_TO');
  if (!key || !to) return json({ error: 'notify secrets not configured' }, 500);

  const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
  const where = [row.city, row.province].filter(Boolean).join(', ');
  const interests = Array.isArray(row.interests) ? row.interests.join(', ') : '';
  const admin = `${Deno.env.get('SITE_URL') ?? 'https://nex-network.vercel.app'}/admin`;

  // The fields that actually decide the review come first: where they study
  // and where they live are what verify a Batangas student.
  const rows: [string, unknown][] = [
    ['School', row.school],
    ['Course', `${row.course_program ?? ''} · ${row.year_level ?? ''}`],
    ['Location', where],
    ['Email', row.email],
    ['Mobile', row.mobile_number],
    ['Age', row.age],
    ['Interests', interests],
  ];
  if (row.building_status) rows.push(['Building', row.building_status]);
  if (row.project_name) rows.push(['Project', row.project_name]);
  if (row.additional_notes) rows.push(['Notes', row.additional_notes]);

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Nex Network <onboarding@resend.dev>',
      to: [to],
      subject: `New registration — ${name || 'someone'}`,
      text:
        `${name} just registered for Nex.\n\n` +
        rows.map(([k, v]) => `${k}: ${v ?? ''}`).join('\n') +
        `\n\nReview: ${admin}`,
      html:
        `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#222;">` +
        `<p style="margin:0 0 14px;"><strong>${esc(name)}</strong> just registered for Nex.</p>` +
        `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
        rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:3px 14px 3px 0;color:#777;vertical-align:top;">${k}</td>` +
              `<td style="padding:3px 0;">${esc(v)}</td></tr>`,
          )
          .join('') +
        `</table>` +
        `<p style="margin:18px 0 0;"><a href="${admin}">Review in the queue →</a></p>` +
        `</div>`,
    }),
  });

  if (!send.ok) {
    const detail = await send.text();
    console.error('notify failed', send.status, detail);
    return json({ error: 'send failed', status: send.status, detail }, 502);
  }

  return json({ notified: to });
});
