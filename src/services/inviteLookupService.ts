import { env } from '@/config/env';

export type InviteLookup =
  | { status: 'approved'; name: string | null; link: string }
  | { status: 'pending' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

/**
 * Looks up an existing registration by email so an approved member can
 * recover their group chat link without waiting on another email.
 *
 * Goes through an Edge Function rather than querying `members` directly:
 * the public key has no read policy (by design, so nobody can enumerate
 * members), and the invite link is a server-side secret that must only be
 * released for an approved row.
 */
export async function lookupInvite(email: string): Promise<InviteLookup> {
  if (!env.isSupabaseConfigured) {
    return { status: 'error', message: 'Lookup is temporarily unavailable. Please try again shortly.' };
  }

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/functions/v1/lookup-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.supabaseAnonKey },
      body: JSON.stringify({ email }),
    });
  } catch {
    return { status: 'error', message: 'Could not reach the server. Check your connection and try again.' };
  }

  if (response.status === 429) {
    return { status: 'error', message: 'Too many tries. Wait a minute and try again.' };
  }

  const data = (await response.json().catch(() => ({}))) as Partial<InviteLookup> & { error?: string };

  if (!response.ok) {
    if (data.error === 'invalid_email') {
      return { status: 'error', message: 'That doesn\'t look like a valid email address.' };
    }
    return { status: 'error', message: 'Something went wrong looking that up. Please try again.' };
  }

  if (data.status === 'approved' && typeof data.link === 'string') {
    return { status: 'approved', name: data.name ?? null, link: data.link };
  }
  if (data.status === 'pending') return { status: 'pending' };
  return { status: 'not_found' };
}
