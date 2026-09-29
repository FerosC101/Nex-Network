// Supabase Edge Function — let a registered student check their status by
// email and, once approved, send us their Facebook profile so the team can add
// them to the group chat.
//
// It used to hand back a Messenger invite link. Those links kept dying and,
// once out, could be forwarded to anyone, so the team now adds each member by
// hand instead. The approval email points here (the "Find my invite" box).
//
// Two calls, both POST:
//   { email }               status lookup
//   { email, facebookUrl }  submit the profile — approved members only, once
//
// A profile is accepted only for status='approved'. Someone pending or
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

const FACEBOOK_HOST = /^(?:(?:www|m|mobile|web)\.)?(?:facebook|fb)\.com$/i;

// Top-level paths that are Facebook features rather than someone's profile.
// Without this, a pasted group or post link would look like a username.
const NOT_A_PROFILE = new Set([
  'groups', 'pages', 'events', 'login', 'watch', 'marketplace', 'messages',
  'gaming', 'reel', 'reels', 'stories', 'photo', 'photos', 'video', 'videos',
  'home.php', 'photo.php', 'story.php', 'permalink.php', 'hashtag', 'search',
  'friends', 'notifications', 'settings', 'help', 'policies', 'privacy',
]);

/**
 * Turns whatever someone pastes into one canonical profile URL, or null.
 *
 * People copy their profile from wherever they happen to be — the app's
 * "Copy link" gives /share/<code>, desktop gives /<username> or
 * /profile.php?id=<n>, and mobile web gives m.facebook.com. All of those are
 * fine. A group, post or reel link is not, and neither is anything that is not
 * Facebook, since the team will open this link to find the person.
 */
function normalizeFacebookUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;

  // A bare username, e.g. "juan.delacruz". Facebook usernames are at least
  // five letters, digits or dots.
  if (/^[a-z0-9.]{5,50}$/i.test(raw) && !NOT_A_PROFILE.has(raw.toLowerCase())) {
    return `https://www.facebook.com/${raw}`;
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!FACEBOOK_HOST.test(url.hostname)) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  if (parts[0].toLowerCase() === 'profile.php') {
    const id = url.searchParams.get('id');
    return id && /^\d{5,20}$/.test(id) ? `https://www.facebook.com/profile.php?id=${id}` : null;
  }

  // The app's "Copy link to profile". Post, reel and video shares use
  // /share/p/, /share/r/, /share/v/ — two segments — and are rejected.
  if (parts[0].toLowerCase() === 'share') {
    return parts.length === 2 && /^[a-z0-9_-]{4,40}$/i.test(parts[1])
      ? `https://www.facebook.com/share/${parts[1]}/`
      : null;
  }

  if (
    parts[0].toLowerCase() === 'people' &&
    parts.length >= 3 &&
    /^[\w%.-]{1,100}$/.test(parts[1]) &&
    /^\d{5,20}$/.test(parts[2])
  ) {
    return `https://www.facebook.com/people/${parts[1]}/${parts[2]}/`;
  }

  // /<username>, optionally followed by a tab like /about — keep the profile.
  const username = parts[0];
  if (/^[a-z0-9.]{5,50}$/i.test(username) && !NOT_A_PROFILE.has(username.toLowerCase())) {
    return `https://www.facebook.com/${username}`;
  }
  return null;
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
  const isSubmission = typeof body?.facebookUrl === 'string';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  // Checked before touching the database so a bad paste costs nothing and
  // the person gets told straight away what is wrong.
  const facebookUrl = isSubmission ? normalizeFacebookUrl(body.facebookUrl) : null;
  if (isSubmission && !facebookUrl) {
    return json({ error: 'invalid_facebook_url' }, 400);
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

  // Only the columns this response can possibly need. No names beyond the
  // greeting, no phone numbers, and never the submitted profile itself —
  // anyone can type an address in here.
  const { data, error } = await admin
    .from('members')
    .select('id, status, preferred_name, first_name, facebook_url, added_to_chat_at')
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

  const name = (data.preferred_name?.trim() || data.first_name) ?? null;

  if (!isSubmission) {
    return json({
      status: 'approved',
      name,
      facebookSubmitted: Boolean(data.facebook_url),
      addedToChat: Boolean(data.added_to_chat_at),
    });
  }

  // Once only. Anyone who knows a member's email can reach this, so letting a
  // second submission overwrite the first would let them swap in their own
  // account. Corrections go through the team, who can see both.
  const { data: updated, error: updateError } = await admin
    .from('members')
    .update({ facebook_url: facebookUrl, facebook_submitted_at: new Date().toISOString() })
    .eq('id', data.id)
    .eq('status', 'approved')
    .is('facebook_url', null)
    .select('id');

  if (updateError) {
    console.error('facebook submit failed', updateError.message);
    return json({ error: 'submit_failed' }, 500);
  }

  if (!updated?.length) {
    return json({ status: 'approved', name, facebookSubmitted: true, addedToChat: Boolean(data.added_to_chat_at), alreadySubmitted: true });
  }

  return json({ status: 'approved', name, facebookSubmitted: true, addedToChat: false, justSubmitted: true });
});
