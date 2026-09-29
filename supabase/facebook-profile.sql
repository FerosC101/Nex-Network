-- Nex Network — collect Facebook profiles instead of handing out a chat link.
--
-- Run this in the SQL editor BEFORE deploying the updated lookup-invite
-- function; without these columns every Facebook submission fails.
--
-- Messenger invite links kept breaking and, once shared, could not be taken
-- back. So the team now adds each approved member to the group chat by hand.
-- An approved member submits their Facebook profile link on the site (the
-- "Find my invite" box, which the approval email now points at), and the team
-- works through the list in /admin.

alter table public.members
  add column if not exists facebook_url text,
  add column if not exists facebook_submitted_at timestamptz,
  add column if not exists added_to_chat_at timestamptz;

comment on column public.members.facebook_url is
  'Facebook profile link the approved member submitted, so the team can add them to the group chat.';
comment on column public.members.facebook_submitted_at is
  'When facebook_url was submitted. Set once; a second submission is refused so a guessed email cannot overwrite it.';
comment on column public.members.added_to_chat_at is
  'Set by the team in /admin once the member has actually been added to the group chat.';

-- The admin "To add" list: submitted, not yet added, oldest first.
create index if not exists members_to_add_idx
  on public.members (facebook_submitted_at)
  where facebook_url is not null and added_to_chat_at is null;

-- Who is waiting to be added:
--   select first_name, last_name, school, facebook_url, facebook_submitted_at
--   from members
--   where facebook_url is not null and added_to_chat_at is null
--   order by facebook_submitted_at;
