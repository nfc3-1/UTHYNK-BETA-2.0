create extension if not exists "uuid-ossp";

alter table public.user_profiles
add column if not exists is_studio_admin boolean not null default false,
add column if not exists studio_role text;

create table if not exists public.studio_campaigns (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.user_profiles(id) on delete set null,
  name text not null,
  objective text not null,
  audience text,
  status text not null default 'draft',
  offer text,
  core_message text,
  brand_pillar text,
  campaign_type text,
  landing_page_url text,
  start_date date,
  end_date date,
  enabled_platforms text[] not null default array['linkedin','facebook','instagram','threads'],
  campaign_brief jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_posts (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete cascade,
  created_by uuid references public.user_profiles(id) on delete set null,
  platform text not null,
  hook text not null,
  body text,
  caption text,
  cta text,
  hashtags text[] not null default '{}',
  asset_prompt text,
  graphic_format text,
  status text not null default 'draft',
  scheduled_for timestamptz,
  scheduled_time text,
  scheduled_timezone text default 'America/Chicago',
  approval_decision text not null default 'needs_review',
  approval_notes text,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  publishing_error text,
  external_post_id text,
  retry_count integer not null default 0,
  idempotency_key text,
  content_package jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_assets (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete set null,
  post_id uuid references public.studio_posts(id) on delete set null,
  created_by uuid references public.user_profiles(id) on delete set null,
  asset_type text not null,
  title text not null,
  storage_path text,
  generation_prompt text,
  status text not null default 'prompt_ready',
  metadata jsonb not null default '{}'::jsonb,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_channels (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.user_profiles(id) on delete set null,
  platform text not null unique,
  label text,
  enabled boolean not null default true,
  cadence text,
  notes text,
  connection_status text not null default 'not_connected',
  account_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_approvals (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete cascade,
  post_id uuid references public.studio_posts(id) on delete cascade,
  asset_id uuid references public.studio_assets(id) on delete set null,
  decision text not null default 'needs_review',
  notes text,
  reviewed_by uuid references public.user_profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.studio_schedules (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete cascade,
  post_id uuid references public.studio_posts(id) on delete cascade,
  platform text not null,
  scheduled_for timestamptz not null,
  scheduled_timezone text not null default 'America/Chicago',
  status text not null default 'scheduled',
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  idempotency_key text not null unique,
  last_attempt_at timestamptz,
  published_at timestamptz,
  failure_reason text,
  manual_override boolean not null default false,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_platform_connections (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.user_profiles(id) on delete set null,
  platform text not null,
  account_id text,
  account_name text,
  account_label text,
  token_secret_ref text,
  connection_status text not null default 'not_connected',
  scopes text[] not null default '{}',
  token_expires_at timestamptz,
  last_refreshed_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_metrics (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete set null,
  post_id uuid references public.studio_posts(id) on delete set null,
  platform text,
  metric_type text not null,
  metric_value numeric not null default 0,
  external_post_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz default now(),
  imported_at timestamptz default now()
);

create table if not exists public.studio_audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.user_profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.product_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.studio_campaigns enable row level security;
alter table public.studio_posts enable row level security;
alter table public.studio_assets enable row level security;
alter table public.studio_channels enable row level security;
alter table public.studio_approvals enable row level security;
alter table public.studio_schedules enable row level security;
alter table public.studio_platform_connections enable row level security;
alter table public.studio_metrics enable row level security;
alter table public.studio_audit_log enable row level security;
alter table public.product_events enable row level security;

create index if not exists studio_campaigns_created_idx on public.studio_campaigns(created_at desc);
create index if not exists studio_posts_campaign_idx on public.studio_posts(campaign_id, created_at desc);
create unique index if not exists studio_posts_idempotency_idx on public.studio_posts(idempotency_key) where idempotency_key is not null;
create index if not exists studio_assets_campaign_idx on public.studio_assets(campaign_id, created_at desc);
create index if not exists studio_channels_platform_idx on public.studio_channels(platform);
create unique index if not exists studio_platform_connections_platform_uidx on public.studio_platform_connections(platform);
create index if not exists studio_schedules_due_idx on public.studio_schedules(status, scheduled_for);
create index if not exists studio_metrics_post_idx on public.studio_metrics(post_id, occurred_at desc);
create index if not exists studio_audit_log_entity_idx on public.studio_audit_log(entity_type, entity_id, created_at desc);
create index if not exists product_events_type_created_idx on public.product_events(event_type, created_at desc);

create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  );
$$;

drop policy if exists "Studio admins can manage campaigns" on public.studio_campaigns;
create policy "Studio admins can manage campaigns" on public.studio_campaigns for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage posts" on public.studio_posts;
create policy "Studio admins can manage posts" on public.studio_posts for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage assets" on public.studio_assets;
create policy "Studio admins can manage assets" on public.studio_assets for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage channels" on public.studio_channels;
create policy "Studio admins can manage channels" on public.studio_channels for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage approvals" on public.studio_approvals;
create policy "Studio admins can manage approvals" on public.studio_approvals for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage schedules" on public.studio_schedules;
create policy "Studio admins can manage schedules" on public.studio_schedules for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage platform connections" on public.studio_platform_connections;
create policy "Studio admins can manage platform connections" on public.studio_platform_connections for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can manage metrics" on public.studio_metrics;
create policy "Studio admins can manage metrics" on public.studio_metrics for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Studio admins can read audit log" on public.studio_audit_log;
create policy "Studio admins can read audit log" on public.studio_audit_log for select to authenticated using (public.is_studio_admin());

drop policy if exists "Studio admins can insert audit log" on public.studio_audit_log;
create policy "Studio admins can insert audit log" on public.studio_audit_log for insert to authenticated with check (public.is_studio_admin());

drop policy if exists "Users can insert product events" on public.product_events;
create policy "Users can insert product events"
on public.product_events
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.id = product_events.user_id
    and profile.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Users can read their product events" on public.product_events;
create policy "Users can read their product events"
on public.product_events
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.id = product_events.user_id
    and profile.auth_user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('studio-assets', 'studio-assets', false)
on conflict (id) do nothing;
