// Supabase Edge Function — verifies a Turnstile token, then writes the
// registration with the service role.
//
// This exists because a CAPTCHA on the page alone is decorative: the REST
// endpoint is publicly writable with the publishable key, so a bot never has
// to load the site. Moving the insert here, and dropping the public insert
// policy (see supabase/lock-down-insert.sql), is what makes the check real.
//
// Deploy:  supabase functions deploy register --no-verify-jwt
// Secrets: TURNSTILE_SECRET_KEY   from the Cloudflare Turnstile dashboard
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const UNIQUE_VIOLATION = '23505';

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

/** Only these columns are accepted; anything else a client sends is ignored. */
const ALLOWED_COLUMNS = new Set([
  'first_name', 'last_name', 'preferred_name', 'email', 'mobile_number', 'age',
  'province', 'city', 'school', 'course_program', 'year_level',
  'interests', 'other_interest', 'goals', 'other_goal', 'additional_notes',
  'building_status', 'project_name', 'project_description',
  'collaboration_needs', 'other_collaboration_need',
  'agreed_to_terms', 'consented_at',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: { token?: string; registration?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return json({ error: 'captcha not configured' }, 500);

  if (!body.token) return json({ error: 'captcha_required' }, 400);

  // Cloudflare sees the client IP; passing it tightens the check.
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', body.token);
  const ip = req.headers.get('CF-Connecting-IP') ?? req.headers.get('x-forwarded-for');
  if (ip) form.append('remoteip', ip.split(',')[0].trim());

  const verify = await fetch(VERIFY_URL, { method: 'POST', body: form });
  const outcome = (await verify.json()) as { success: boolean; 'error-codes'?: string[] };
  if (!outcome.success) {
    console.warn('turnstile rejected', outcome['error-codes']);
    return json({ error: 'captcha_failed' }, 403);
  }

  const submitted = body.registration ?? {};
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(submitted)) {
    if (ALLOWED_COLUMNS.has(key)) row[key] = value;
  }

  // Set server-side, never taken from the client: a caller must not be able to
  // arrive pre-approved or pre-invited.
  row.status = 'pending';
  row.reviewed_at = null;
  row.reviewed_by = null;
  row.review_notes = null;
  row.invite_sent_at = null;
  row.auth_user_id = null;
  if (row.agreed_to_terms !== true) return json({ error: 'consent_required' }, 400);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await admin.from('members').insert(row);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return json({ error: 'duplicate' }, 409);
    console.error('insert failed', error.message);
    return json({ error: 'insert_failed' }, 500);
  }

  return json({ ok: true }, 201);
});
