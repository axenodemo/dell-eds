-- JSW Motors teaser — lead capture schema
-- Flat, CSV/SQL-exportable; maps 1:1 to Salesforce/Marketing Cloud contact fields.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  mobile text not null,
  email text,
  consent boolean not null default false,
  campaign_id text,
  utm_source text,
  utm_medium text,
  user_agent text,
  page text
);

create index if not exists leads_created_at_idx on public.leads (created_at);
create index if not exists leads_mobile_idx on public.leads (mobile);

-- Lock the table down completely for anon/authenticated clients.
-- No policies are defined on purpose: with RLS enabled and zero policies,
-- neither SELECT nor INSERT is possible with the public anon key.
-- Only the Edge Function (service role, bypasses RLS) can write.
alter table public.leads enable row level security;

-- Per-IP rate limiting store used by the submit-lead Edge Function.
-- Only hashed IPs are stored (SHA-256 with server-side salt), never raw IPs.
create table if not exists public.rate_events (
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_events_ip_idx on public.rate_events (ip_hash, created_at);

alter table public.rate_events enable row level security;
