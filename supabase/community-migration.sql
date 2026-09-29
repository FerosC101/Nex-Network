-- Nex Network — the move from the group chat to a Messenger Community.
--
-- Run this in the SQL editor BEFORE invoking the send-community Edge
-- Function; without the column the function's query fails outright.
--
-- Same pattern as invite_sent_at: a stamp per member, so a run that times out
-- halfway through can be resumed without anyone receiving the announcement
-- twice. There is no unsend, so "never send twice" has to be a property of the
-- data, not of remembering where the last batch stopped.

alter table public.members
  add column if not exists community_notified_at timestamptz;

comment on column public.members.community_notified_at is
  'Set when the Messenger Community migration announcement has actually gone out — prevents double-sending.';

-- bumped_at belongs to the earlier send-bump run and was added by hand at the
-- time. Included here so a database rebuilt from these files still satisfies
-- that function's query.
alter table public.members
  add column if not exists bumped_at timestamptz;

comment on column public.members.bumped_at is
  'Set when the one-off "did you miss this?" invite follow-up has gone out — prevents double-sending.';

-- Who is still to be told:
--   select count(*) from members
--   where status = 'approved' and community_notified_at is null;
