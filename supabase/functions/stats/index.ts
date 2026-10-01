// Supabase Edge Function — the public member and school counts shown on the
// site. The public key can't read `members` (by design), so this returns two
// numbers and nothing else: no names, emails, or school list.
//
// Members are approved registrations only — people the team has verified —
// not every form submission. Schools are distinct school names among them,
// normalised so "Batangas State University" and "batangas state university "
// count once.
//
// Deploy: supabase functions deploy stats --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  // The numbers move slowly; let browsers and the edge reuse them briefly.
  'Cache-Control': 'public, max-age=300, s-maxage=300',
};

const normalise = (school: string) =>
  school.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Abbreviations people type instead of the full name. Keys and values are in
// normalised form. Add to this when the breakdown shows a new duplicate.
const ALIASES: Record<string, string> = {
  kll: 'kolehiyo ng lungsod ng lipa',
};

/**
 * Collapses spellings of the same school onto one key. Beyond the aliases, a
 * name that is another name plus more words ("sti college lipa" vs "sti",
 * "… cavite campus") is treated as that school — campuses and branches count
 * once, which keeps the number conservative rather than inflated.
 */
function canonicalise(names: string[]): Map<string, string> {
  const keys = [...new Set(names.map((n) => ALIASES[n] ?? n))].sort((a, b) => a.length - b.length);
  const roots: string[] = [];
  const toRoot = new Map<string, string>();
  for (const key of keys) {
    const root = roots.find((r) => key.startsWith(`${r} `)) ?? key;
    if (root === key) roots.push(key);
    toRoot.set(key, root);
  }
  return new Map(names.map((n) => [n, toRoot.get(ALIASES[n] ?? n)!]));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: HEADERS });
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: HEADERS });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Only the school column, only for approved members.
  const { data, error } = await admin.from('members').select('school').eq('status', 'approved');
  if (error) {
    console.error('stats query failed', error.message);
    return new Response(JSON.stringify({ error: 'unavailable' }), { status: 500, headers: HEADERS });
  }

  const names = (data ?? []).map((row) => normalise(row.school ?? '')).filter(Boolean);
  const canonical = canonicalise(names);
  const schools = new Set(canonical.values());

  // Team-only breakdown, for checking how names were grouped. Gated by the
  // same secret the database triggers use, so it is never public.
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') === secret) {
    const tally = new Map<string, number>();
    for (const name of names) {
      const key = canonical.get(name)!;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    const breakdown = [...tally].sort((a, b) => b[1] - a[1]);
    return new Response(JSON.stringify({ members: data?.length ?? 0, schools: schools.size, breakdown }), {
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
    });
  }

  return new Response(JSON.stringify({ members: data?.length ?? 0, schools: schools.size }), { headers: HEADERS });
});
