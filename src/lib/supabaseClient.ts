import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | null = null;

/**
 * Lazily-created Supabase client. Returns null when env vars aren't
 * configured yet (e.g. local dev before `.env` is filled in) so callers
 * can fail gracefully instead of crashing the whole app.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!env.isSupabaseConfigured) return null;
  if (!client) {
    client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
}
