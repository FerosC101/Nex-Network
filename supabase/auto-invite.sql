-- Nex Network — fire the invite email when a registration is approved.
--
-- Run this AFTER schema.sql and admin.sql, and AFTER deploying the
-- send-invite Edge Function.
--
-- !! Replace the two placeholders below before running. Do NOT commit this
-- !! file with the real values filled in — this repo is public.
--
--   <PROJECT_REF>     kbtjvnytsmutwkrmycnw
--   <WEBHOOK_SECRET>  the same random string you set with
--                     `supabase secrets set WEBHOOK_SECRET=...`
--                     Generate one with: openssl rand -hex 32
--
-- How it works: pg_net posts the changed row to the Edge Function
-- asynchronously, so a slow or failing email never blocks or rolls back the
-- approval. If the send fails, invite_sent_at stays null and the row keeps
-- showing under "Awaiting invite" in /admin for a manual send.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_invite_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Only the pending -> approved transition, and never for someone who has
  -- already been sent their invite.
  if new.status = 'approved'
     and coalesce(old.status, '') is distinct from 'approved'
     and new.invite_sent_at is null then

    perform net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-invite',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', '<WEBHOOK_SECRET>'
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'members',
        'record', to_jsonb(new),
        'old_record', to_jsonb(old)
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists members_invite_on_approval on public.members;
create trigger members_invite_on_approval
  after update of status on public.members
  for each row
  execute function public.notify_invite_on_approval();

-- Check it's wired:
--   select tgname from pg_trigger where tgrelid = 'public.members'::regclass;
