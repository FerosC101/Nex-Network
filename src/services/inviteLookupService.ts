import { env } from '@/config/env';

export type InviteLookup =
  | {
      status: 'approved';
      name: string | null;
      /** A Facebook profile is already on file — the form is not shown again. */
      facebookSubmitted: boolean;
      /** The team has already added them to the group chat. */
      addedToChat: boolean;
      /** This very request saved the profile. */
      justSubmitted?: boolean;
    }
  | { status: 'pending' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: 'That doesn\'t look like a valid email address.',
  invalid_facebook_url:
    'That doesn\'t look like a Facebook profile link. Open your profile, tap ⋯ → Copy link, and paste it here.',
};

/**
 * Looks up an existing registration by email. An approved member then sends
 * us their Facebook profile through `submitFacebookProfile`, and the team adds
 * them to the group chat by hand.
 *
 * Goes through an Edge Function rather than querying `members` directly:
 * the public key has no read or update policy (by design, so nobody can
 * enumerate or edit members), and only an approved row may take a profile.
 */
export function lookupInvite(email: string): Promise<InviteLookup> {
  return callLookup({ email });
}

/** Saves the member's Facebook profile. Accepted once, and only when approved. */
export function submitFacebookProfile(email: string, facebookUrl: string): Promise<InviteLookup> {
  return callLookup({ email, facebookUrl });
}

async function callLookup(body: { email: string; facebookUrl?: string }): Promise<InviteLookup> {
  if (!env.isSupabaseConfigured) {
    return { status: 'error', message: 'Lookup is temporarily unavailable. Please try again shortly.' };
  }

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/functions/v1/lookup-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.supabaseAnonKey },
      body: JSON.stringify(body),
    });
  } catch {
    return { status: 'error', message: 'Could not reach the server. Check your connection and try again.' };
  }

  if (response.status === 429) {
    return { status: 'error', message: 'Too many tries. Wait a minute and try again.' };
  }

  const data = (await response.json().catch(() => ({}))) as {
    status?: string;
    name?: string | null;
    facebookSubmitted?: boolean;
    addedToChat?: boolean;
    justSubmitted?: boolean;
    error?: string;
  };

  if (!response.ok) {
    return {
      status: 'error',
      message: ERROR_MESSAGES[data.error ?? ''] ?? 'Something went wrong. Please try again.',
    };
  }

  if (data.status === 'approved') {
    return {
      status: 'approved',
      name: data.name ?? null,
      facebookSubmitted: Boolean(data.facebookSubmitted),
      addedToChat: Boolean(data.addedToChat),
      justSubmitted: Boolean(data.justSubmitted),
    };
  }
  if (data.status === 'pending') return { status: 'pending' };
  return { status: 'not_found' };
}
