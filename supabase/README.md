# Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough to start).
2. Open **SQL Editor** and run [`schema.sql`](./schema.sql) once. It creates the `members` table, indexes, and row-level security policy.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
4. Put both in a `.env` file at the project root (copy `.env.example`). Restart `npm run dev` after adding them.

Until these are set, the app still runs — the registration form detects the missing config and shows a clear "registration is temporarily unavailable" state instead of crashing, so you can build/preview the UI before wiring the database.

## The review queue

Every registration inserts as `status = 'pending'`. The RLS policy enforces this — a tampered client **cannot** self-approve, because the insert policy requires `status = 'pending'`, `reviewed_at is null`, and `invite_sent_at is null`.

The team's job is to verify the applicant really is a student in Batangas, then email them the group chat invite.

```sql
-- The queue: who's waiting, oldest first
select id, created_at, first_name, last_name, email, school, course_program,
       year_level, province, city
from members
where status = 'pending'
order by created_at;

-- Approve someone (then send them the invite email)
update members
set status = 'approved',
    reviewed_at = now(),
    reviewed_by = 'your-name'
where email = 'student@example.com';

-- Record that the invite actually went out, so nobody double-sends
update members
set invite_sent_at = now()
where email = 'student@example.com' and status = 'approved';

-- Approved but not yet emailed — your send list
select first_name, preferred_name, email
from members
where status = 'approved' and invite_sent_at is null
order by reviewed_at;

-- Turn someone down, with a reason for the record
update members
set status = 'rejected', reviewed_at = now(), reviewed_by = 'your-name',
    review_notes = 'Not currently enrolled in Batangas'
where email = 'someone@example.com';
```

## Viewing and matching members

The `anon` key used by the public site can only **insert** rows — it cannot read the member list back. To query, use the Supabase Table Editor or SQL Editor in the dashboard (signed in with your Supabase account).

```sql
-- Students who listed UI/UX Design as an interest
select first_name, last_name, email, school
from members
where status = 'approved' and 'UI/UX Design' = any(interests);

-- Students looking for testers on their own project
select first_name, last_name, project_name, project_description
from members
where status = 'approved' and 'Find testers for my project' = any(goals);

-- Students open to being testers for someone else
select first_name, last_name, email
from members
where status = 'approved' and 'Testers' = any(collaboration_needs);

-- Potential hackathon teammates at a given school
select first_name, last_name, email, course_program, year_level
from members
where status = 'approved'
  and 'Hackathons' = any(interests)
  and 'Find teammates' = any(goals)
  and school ilike '%Batangas State%';

-- Everyone with a project already underway
select first_name, last_name, project_name, collaboration_needs
from members
where status = 'approved' and building_status in ('Yes', 'I have an idea');
```

## Extending the schema later

Each future feature from the brief (profiles, project listings, collaboration board, events, mentorship matching, notifications, …) should be a **new table with a `member_id uuid references members(id)`**, added as its own migration — not a rewrite of `members`. `members.auth_user_id` is already reserved for wiring up Supabase Auth if/when members get log-in access to their own profile.

For an authenticated `/admin` view inside this app, query `members` with the **service role key from a server context only** — never expose that key to the browser. The `members_status_created_idx` index already covers the review-queue read pattern.
