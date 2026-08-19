-- Fix: public registration inserts were blocked by RLS (42501).
--
-- The original policy was granted `to anon`. Supabase's newer publishable
-- keys (sb_publishable_…) do not reliably resolve to that role, so the policy
-- never matched and every registration was rejected.
--
-- Granting `to public` makes it role-agnostic. This does NOT loosen security:
-- the `with check` clause is what constrains the insert, and there is still no
-- SELECT/UPDATE/DELETE policy, so the public key can create a pending
-- registration and nothing else — it cannot read the member list back, edit a
-- row, or approve itself.

-- 1. What's actually there right now (run this first, it's informative)
select relrowsecurity as rls_enabled
from pg_class where oid = 'public.members'::regclass;

select policyname, roles, cmd, with_check
from pg_policies where schemaname = 'public' and tablename = 'members';

-- 2. Recreate the insert policy so any API role can register
drop policy if exists "Public can register" on public.members;

create policy "Public can register"
  on public.members
  for insert
  to public
  with check (
    agreed_to_terms = true
    -- Applicants cannot self-approve: registrations must enter the queue as pending.
    and status = 'pending'
    and reviewed_at is null
    and invite_sent_at is null
  );

-- 3. Confirm it landed
select policyname, roles, cmd
from pg_policies where schemaname = 'public' and tablename = 'members';
