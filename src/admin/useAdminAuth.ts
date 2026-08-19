import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

/**
 * Magic-link auth for the review queue.
 *
 * Passwordless on purpose: there are a handful of admins, and a password is
 * one more thing to leak or reset. Signing in proves control of the address,
 * and `supabase/admin.sql` decides whether that address is allowed in.
 *
 * Being signed in is NOT the same as being an admin — anyone can request a
 * link. `isAdmin` reflects the database's answer, and the RLS policies are
 * what actually enforce it; this flag only decides what UI to show.
 */
export function useAdminAuth() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) {
      setIsAdmin(session ? false : null);
      return;
    }
    // Ask the database, rather than trusting anything in the client.
    supabase.rpc('is_admin').then(({ data, error }) => {
      setIsAdmin(error ? false : Boolean(data));
    });
  }, [supabase, session]);

  const sendMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) return { error: 'Auth is not configured.' };
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  return { session, isAdmin, loading, sendMagicLink, signOut };
}
