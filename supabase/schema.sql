-- Nex Network — registration database schema
-- Target: Supabase (Postgres). Run in the SQL editor, or via the CLI:
--   supabase db push
--
-- Design notes
-- ------------
-- * `members` is the single source of truth for a registration. Tag-like
--   fields (interests, goals, collaboration_needs) are Postgres arrays with
--   GIN indexes rather than join tables — enough for fast "any of these
--   tags" filtering and matching queries today, without the join overhead.
--   If/when true many-to-many querying is needed (e.g. weighting or
--   normalizing tag vocab), these can be migrated into lookup tables
--   without touching the rest of the app — the TypeScript layer only talks
--   to `members` via src/services/registrationService.ts.
-- * Registration is REVIEWED, not instant. Every row lands as
--   status='pending'. The Nex team confirms the applicant really is a
--   student in Batangas, flips them to 'approved', and only then emails
--   the community group chat invite. The chat link lives with the team,
--   never in the client bundle.
-- * `auth_user_id` is a forward-looking, nullable anchor. Nothing uses it
--   yet, but it lets a future "claim your profile / log in" feature attach
--   Supabase Auth to an existing registration without a schema rewrite.
-- * Everything future-proofed in the brief (profiles, project listings,
--   collaboration board, opportunity board, hackathon announcements,
--   events, mentorship matching, notifications) is deliberately NOT built
--   here. Each would be its own table with a `member_id` foreign key back
--   to `members.id`, added as a later migration.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Step 1: Basic information
  first_name text not null,
  last_name text not null,
  preferred_name text default '',
  email text not null unique,
  mobile_number text not null,
  age smallint not null check (age between 13 and 99),
  province text not null,
  city text not null,

  -- Step 2: Student information
  school text not null,
  course_program text not null,
  year_level text not null check (
    year_level in (
      'Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year',
      '4th Year', 'Graduate', 'Other'
    )
  ),

  -- Step 3: Interests
  interests text[] not null default '{}',
  other_interest text default '',

  -- Step 4: Community goals
  goals text[] not null default '{}',
  other_goal text default '',
  additional_notes text default '',

  -- Optional builder profile
  building_status text check (
    building_status is null or building_status in (
      'Yes', 'Not yet', 'I have an idea', 'I''m looking for a project to join'
    )
  ),
  project_name text default '',
  project_description text default '',
  collaboration_needs text[] not null default '{}',
  other_collaboration_need text default '',

  -- Consent
  agreed_to_terms boolean not null default false,
  consented_at timestamptz,

  -- Review workflow: the team verifies the applicant is a Batangas student
  -- before the group chat invite is emailed out.
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected')
  ),
  reviewed_at timestamptz,
  reviewed_by text,
  review_notes text,
  invite_sent_at timestamptz,

  -- Forward-looking, unused today — see design notes above
  auth_user_id uuid references auth.users (id) on delete set null
);

comment on table public.members is 'Nex Network community registrations — the core member record.';
comment on column public.members.status is 'pending until the team verifies the applicant is a Batangas student; the group chat invite is emailed only on approved.';
comment on column public.members.invite_sent_at is 'Set when the community group chat invite email has actually gone out — prevents double-sending.';

-- Fast "any of these tags" filtering for admin views and future matchmaking
-- (e.g. "students interested in UI/UX", "students looking for testers").
create index if not exists members_interests_gin on public.members using gin (interests);
create index if not exists members_goals_gin on public.members using gin (goals);
create index if not exists members_collaboration_needs_gin on public.members using gin (collaboration_needs);

-- Common admin filter/sort columns.
create index if not exists members_school_idx on public.members (school);
create index if not exists members_province_city_idx on public.members (province, city);
create index if not exists members_year_level_idx on public.members (year_level);
create index if not exists members_building_status_idx on public.members (building_status);
create index if not exists members_created_at_idx on public.members (created_at desc);
-- The review queue is the team's most frequent read: pending, oldest first.
create index if not exists members_status_created_idx on public.members (status, created_at desc);

-- Row Level Security: the public registration form may only INSERT its own
-- row, using the anon key. Reading the member list (for the admin/matching
-- views described in the brief) requires the service role key or an
-- authenticated "admin" policy added later — never the public anon key.
alter table public.members enable row level security;

drop policy if exists "Public can register" on public.members;
-- `to public` rather than `to anon`: Supabase's newer publishable keys
-- (sb_publishable_…) do not reliably resolve to the anon role, and a policy
-- scoped to anon silently rejects every registration with 42501. The
-- `with check` clause below is what actually constrains the insert.
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

-- No SELECT/UPDATE/DELETE policy is defined for `anon` on purpose: the
-- public site can create members but not read or edit them back.
