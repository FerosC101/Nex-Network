/**
 * Centralized runtime configuration.
 *
 * Every value that differs between environments lives here, sourced from
 * Vite env vars. Nothing below should be hardcoded elsewhere in the app.
 *
 * Note there is deliberately no community-chat link here. Registration is
 * reviewed first — the Nex team confirms the applicant really is a student
 * in Batangas and only then emails them the group chat invite. Shipping the
 * invite URL to the browser would hand it to everyone who opened the page,
 * which is exactly what the review step exists to prevent.
 */

function readEnv(key: string, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export const env = {
  /** Where applicants can reply with questions about their application. */
  contactEmail: readEnv('VITE_CONTACT_EMAIL', 'hello@nexnetwork.ph'),

  /** The address the invite email will arrive from, so applicants can whitelist it. */
  senderEmail: readEnv('VITE_SENDER_EMAIL', 'hello@nexnetwork.ph'),

  /** Rough turnaround shown on the success screen — copy only, no logic depends on it. */
  reviewWindow: readEnv('VITE_REVIEW_WINDOW', 'a few days'),

  /**
   * Cloudflare Turnstile site key (public by design).
   *
   * When empty the widget is skipped entirely and registration posts straight
   * to Supabase, exactly as before — so the site keeps working before Turnstile
   * is configured. Protection only becomes real once the register Edge
   * Function is deployed AND the public insert policy is dropped; until then a
   * bot can bypass the widget by calling the REST endpoint directly.
   */
  turnstileSiteKey: readEnv('VITE_TURNSTILE_SITE_KEY'),

  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY'),

  /** True once a Turnstile site key is configured. */
  get isCaptchaEnabled(): boolean {
    return Boolean(this.turnstileSiteKey);
  },

  /** True once real Supabase credentials are supplied via env vars. */
  get isSupabaseConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  },
} as const;
