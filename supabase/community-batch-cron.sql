-- Nex Network — send the Messenger Community migration email in hourly
-- batches of 25, entirely inside the database.
--
-- Why here rather than a scheduled agent somewhere else: the webhook secret
-- already lives in this database (auto-invite.sql posts it on every approval),
-- so scheduling the batches here means the secret never has to be copied
-- anywhere new. It also needs no laptop, terminal or session left open for the
-- ten hours this takes.
--
-- !! Replace <WEBHOOK_SECRET> before running. Do NOT commit this file with the
-- !! real value in place — this repo is public.
--
-- Prerequisite: community-migration.sql (adds community_notified_at).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Every hour, on the hour. The function takes the next 25 members who have no
-- community_notified_at stamp, so each run naturally continues where the last
-- one stopped and there is no offset to get wrong. Once everyone is stamped
-- the call still fires but sends nothing, which is harmless — see the unschedule
-- statement at the bottom for how to stop it.
select cron.schedule(
  'nex-community-migration',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://kbtjvnytsmutwkrmycnw.supabase.co/functions/v1/send-community',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('dryRun', false, 'limit', 25),
    -- A batch of 25 with a deliberate 400ms gap between messages runs well past
    -- pg_net's 5s default; without this the request is aborted mid-batch.
    timeout_milliseconds := 300000
  );
  $$
);

-- Watch it run:
--   select * from cron.job_run_details
--   where jobname = 'nex-community-migration'
--   order by start_time desc limit 10;
--
-- How many are left:
--   select count(*) from members
--   where status = 'approved' and community_notified_at is null;
--
-- Stop it once that count reaches 0:
--   select cron.unschedule('nex-community-migration');
