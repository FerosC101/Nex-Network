import { useEffect, useState } from 'react';
import { env } from '@/config/env';

export interface NexStats {
  /** Approved members — people the team has verified. */
  members: number;
  /** Distinct schools among them, with spelling variants merged. */
  schools: number;
  /** False while showing the fallback figures. */
  live: boolean;
}

// The figures the team used publicly before live counts existed. Both are
// lower bounds of the real numbers, so showing them on a failed request is
// understated rather than wrong.
const FALLBACK: NexStats = { members: 250, schools: 19, live: false };

/**
 * Live member and school counts from the `stats` Edge Function, which returns
 * only the two numbers — the public key itself can't read members.
 */
export function useNexStats(): NexStats {
  const [stats, setStats] = useState<NexStats>(FALLBACK);

  useEffect(() => {
    if (!env.isSupabaseConfigured) return;
    const controller = new AbortController();
    fetch(`${env.supabaseUrl}/functions/v1/stats`, {
      headers: { apikey: env.supabaseAnonKey },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { members?: unknown; schools?: unknown }) => {
        if (typeof d.members === 'number' && typeof d.schools === 'number' && d.members > 0) {
          setStats({ members: d.members, schools: d.schools, live: true });
        }
      })
      .catch(() => {
        /* keep the fallback */
      });
    return () => controller.abort();
  }, []);

  return stats;
}
