// Supabase Edge Function — let an already-registered student look their own
// invite link back up by email.
//
// This exists because email is a lossy channel. Invites land in spam, get
// deleted, or (as happened before the move off Gmail) are silently dropped by
// the receiving provider. Without this, the only recovery path is messaging
// the team by hand.
//
// The link is only ever returned for status='approved'. Someone pending or
// declined gets their status and nothing else — the review step is the whole
// point of the system and this must not become a way around it.
//
// Deploy: supabase functions deploy lookup-invite --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// Guessing one classmate's address is easy; harvesting the member list one
// address at a time should not be. The counter lives in the database because
// Edge Function memory cannot hold it — requests are spread across isolates
// that share nothing and are recycled constantly, so an in-process Map sees
// almost every request as the first one.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

/** Hashed, never stored in the clear: this only needs to recognise a repeat. */
async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function rateLimited(
  admin: ReturnType<typeof createClient>,
  ip: string,
): Promise<boolean> {
  const ipHash = await hashIp(ip);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error } = await admin
    .from('lookup_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);

  // Fail open rather than locking everyone out if the table is missing, but
  // say so loudly — a silently unlimited endpoint is the thing to avoid.
  if (error) {
    console.error('rate limit check failed, allowing request:', error.message);
    return false;
  }

  await admin.from('lookup_attempts').insert({ ip_hash: ipHash });

  // Occasional opportunistic sweep; no cron needed for a table this small.
  if (Math.random() < 0.02) {
    await admin
      .from('lookup_attempts')
      .delete()
      .lt('created_at', new Date(Date.now() - 86_400_000).toISOString());
  }

  return (count ?? 0) >= MAX_PER_WINDOW;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? '').trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'not_configured' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  if (await rateLimited(admin, ip)) {
    return json({ error: 'too_many_requests' }, 429);
  }

  // Only the columns this response can possibly need. No names, no phone
  // numbers, nothing that would turn a guessed address into a data leak.
  const { data, error } = await admin
    .from('members')
    .select('status, preferred_name, first_name')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    console.error('lookup failed', error.message);
    return json({ error: 'lookup_failed' }, 500);
  }

  if (!data) return json({ status: 'not_found' });

  if (data.status !== 'approved') {
    // 'rejected' is deliberately reported as 'pending'. Someone declined
    // learning so from an automated form is a bad way to find out, and the
    // team may still want to reverse it.
    return json({ status: 'pending' });
  }

  const link = Deno.env.get('NEX_INVITE_LINK');
  if (!link || !/^https:\/\//.test(link) || /[<>]/.test(link)) {
    console.error('NEX_INVITE_LINK is not a usable https URL');
    return json({ error: 'link_unavailable' }, 500);
  }

  return json({
    status: 'approved',
    name: (data.preferred_name?.trim() || data.first_name) ?? null,
    link,
  });
});
