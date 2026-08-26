-- Rate-limit store for the invite lookup endpoint.
--
-- Edge Functions cannot rate-limit in memory: requests are spread across
-- isolates that do not share state and are recycled constantly, so a
-- per-instance counter never sees more than a request or two. The limit has to
-- live somewhere both durable and shared, which means the database.
--
-- Addresses are stored as a SHA-256 hash, never in the clear — this table only
-- needs to recognise a repeat visitor, not identify anyone.

create table if not exists public.lookup_attempts (
  id bigserial primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists lookup_attempts_ip_time
  on public.lookup_attempts (ip_hash, created_at desc);

-- Nothing but the service role (which bypasses RLS) may touch this. Enabling
-- RLS with no policy is what makes that true for the public key.
alter table public.lookup_attempts enable row level security;
