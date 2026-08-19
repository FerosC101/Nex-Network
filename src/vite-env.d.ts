/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_EMAIL: string;
  readonly VITE_SENDER_EMAIL: string;
  readonly VITE_REVIEW_WINDOW: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
