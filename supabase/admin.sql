-- Nex Network — admin access
--
-- Run this AFTER schema.sql. It adds:
--   * an allow-list of admin emails
--   * RLS policies letting those admins read and review registrations
--
-- Design notes
-- ------------
-- * Sign-in is email + password, not magic links: Supabase's built-in SMTP
--   is rate limited to a couple of messages an hour, and single-use links get
--   burned by email scanners before a human clicks them (otp_expired). Create
--   admin users in the dashboard under Authentication -> Users -> Add user,
--   ticking "Auto Confirm User".
-- * Admins are keyed by EMAIL, not auth.users.id, so you can authorise a
--   teammate before they have ever signed in. There is no chicken-and-egg
--   bootstrap: add the address here, they sign in with a magic link, and
--   the policies match on the email inside their JWT.
-- * is_admin() is SECURITY DEFINER so it can read public.admins even though
--   the calling user cannot. Without that, checking "am I an admin?" would
--   itself be blocked by RLS.
-- * The public registration policy from schema.sql is untouched: anonymous
--   visitors still insert pending rows and nothing else.

create table if not exists public.admins (
  email text primary key,
  note text,
  added_at timestamptz not null default now()
);

comment on table public.admins is 'Allow-list of Nex team emails permitted to review registrations.';

-- Seed the first admin. Add teammates with:
--   insert into public.admins (email, note) values ('them@example.com', 'name');
insert into public.admins (email, note)
values ('vincevillar02@gmail.com', 'Vince — founder')
on conflict (email) do nothing;

alter table public.admins enable row level security;

-- Admins may see the allow-list; nobody else can enumerate the team.
drop policy if exists "Admins can read the allow-list" on public.admins;
create policy "Admins can read the allow-list"
  on public.admins
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Is the caller on the allow-list? SECURITY DEFINER so the lookup itself
-- isn't subject to the RLS above.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where lower(admins.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admins can read the queue.
drop policy if exists "Admins can read members" on public.members;
create policy "Admins can read members"
  on public.members
  for select
  to authenticated
  using (public.is_admin());

-- Admins can review: flip status, leave notes, stamp invite_sent_at.
drop policy if exists "Admins can review members" on public.members;
create policy "Admins can review members"
  on public.members
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Deliberately no DELETE policy. Rejecting sets status='rejected' so there is
-- a record of the decision; removing a row entirely stays a manual, deliberate
-- act in the SQL editor.
