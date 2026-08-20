-- Close direct public writes to members.
--
-- Run this ONLY after:
--   1. the `register` Edge Function is deployed
--   2. TURNSTILE_SECRET_KEY is set
--   3. VITE_TURNSTILE_SITE_KEY is set in Vercel and the site redeployed
--
-- Until then the site still inserts directly and this would break
-- registration. Verify a real submission works first.
--
-- Why: while this policy exists, a bot can POST to /rest/v1/members with the
-- publishable key and never load the page, so the CAPTCHA is decorative.
-- Dropping it forces every registration through the function, which verifies
-- the token server-side before writing.

drop policy if exists "Public can register" on public.members;

-- The Edge Function uses the service role, which bypasses RLS, so it keeps
-- working. Nothing else can insert.

-- To roll back (registration breaks if the function is unavailable):
--
--   create policy "Public can register"
--     on public.members for insert to public
--     with check (
--       agreed_to_terms = true and status = 'pending'
--       and reviewed_at is null and invite_sent_at is null
--     );
