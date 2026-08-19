import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

/**
 * Email + password auth for the review queue.
 *
 * Deliberately not magic links. Supabase's built-in SMTP is rate limited to a
 * couple of messages an hour, links are single-use so email scanners routinely
 * burn them before a human clicks (otp_expired), and the redirect has to be
 * allow-listed per domain. For a handful of admins a password is simply more
 * reliable, and it removes email from the critical path of getting in.
 *
 * There is no sign-up here on purpose: admin users are created in the Supabase
 * dashboard. Being signed in is also NOT the same as being an admin — `isAdmin`
 * reflects the database's answer, and the RLS policies are what actually
 * enforce access. This flag only decides which UI to show.
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
    // Ask the database rather than trusting anything in the client.
    supabase.rpc('is_admin').then(({ data, error }) => {
      setIsAdmin(error ? false : Boolean(data));
    });
  }, [supabase, session]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Auth is not configured.' };
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  return { session, isAdmin, loading, signIn, signOut };
}
