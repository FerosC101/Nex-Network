-- Email the team whenever a registration arrives.
--
-- Run AFTER deploying the notify-registration Edge Function.
-- Replace <PROJECT_REF> and <WEBHOOK_SECRET> before running, and do not
-- commit this file with the real values — the repo is public.
--
-- pg_net posts asynchronously, so a slow or failing notification never blocks
-- or rolls back the registration itself. A student's signup must never fail
-- because the team's inbox was unreachable.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_team_on_registration()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify-registration',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('type', 'INSERT', 'record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists members_notify_team on public.members;
create trigger members_notify_team
  after insert on public.members
  for each row
  execute function public.notify_team_on_registration();

-- Turn it off with:
--   drop trigger if exists members_notify_team on public.members;
