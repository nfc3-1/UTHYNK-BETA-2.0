create extension if not exists "uuid-ossp";

create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text unique,
  username text,
  age_band text default '18_plus',
  onboarding_goal text,
  onboarding_experience text,
  onboarding_style text default 'balanced',
  reasoning_score integer default 70,
  xp integer default 0,
  streak integer default 0,
  rank text default 'Observer',
  primary_trait text default 'Analytical',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.user_profiles(id) on delete set null,
  email text unique not null,
  username text,
  age_band text default '18_plus',
  onboarding_goal text,
  onboarding_style text default 'balanced',
  xp integer default 0,
  streak integer default 0,
  rank text default 'Observer',
  reasoning_score integer default 70,
  primary_trait text default 'Analytical',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  session_key text not null,
  conversation_id text,
  started_at timestamptz default now(),
  last_activity_at timestamptz default now(),
  message_count integer default 0,
  xp_earned integer default 0,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.claims (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  session_key text,
  conversation_id text,
  challenge_id text,
  challenge_category text,
  thinking_lens text,
  prompt text,
  claim_text text,
  ai_analysis text,
  contrarian_response text,
  follow_up text,
  reasoning_score integer,
  xp_awarded integer default 0,
  trait_detected text,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  verifier jsonb default '{}'::jsonb,
  memory_snapshot jsonb,
  created_at timestamptz default now()
);

create table if not exists public.user_traits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  trait_name text not null,
  trait_score integer default 50,
  evidence_count integer default 0,
  last_evidence text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles
add column if not exists age_band text default '18_plus';

alter table public.user_profiles
add column if not exists onboarding_goal text;

alter table public.user_profiles
add column if not exists onboarding_experience text;

alter table public.user_profiles
add column if not exists onboarding_style text default 'balanced';

create table if not exists public.reasoning_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  session_id text,
  conversation_id text,
  challenge_id text not null,
  challenge_category text,
  prompt text,
  response text,
  ai_analysis text,
  contrarian_response text,
  follow_up text,
  reasoning_score integer,
  xp_awarded integer default 0,
  trait_detected text,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  verifier_score integer,
  orchestration_category text,
  cadence_key text,
  memory_snapshot jsonb,
  created_at timestamptz default now()
);

alter table public.user_profiles
add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists user_profiles_auth_user_idx
on public.user_profiles(auth_user_id)
where auth_user_id is not null;

alter table public.reasoning_sessions
add column if not exists session_id text;

alter table public.reasoning_sessions
add column if not exists conversation_id text;

alter table public.reasoning_sessions
add column if not exists strengths jsonb default '[]'::jsonb;

alter table public.reasoning_sessions
add column if not exists weaknesses jsonb default '[]'::jsonb;

alter table public.reasoning_sessions
add column if not exists verifier_score integer;

alter table public.reasoning_sessions
add column if not exists orchestration_category text;

alter table public.reasoning_sessions
add column if not exists cadence_key text;

alter table public.reasoning_sessions
add column if not exists memory_snapshot jsonb;

create table if not exists public.cognitive_traits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  trait_name text not null,
  trait_score integer default 50,
  updated_at timestamptz default now()
);

create table if not exists public.reasoning_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  evidence_score integer default 50,
  adaptability_score integer default 50,
  emotional_control_score integer default 50,
  incentives_score integer default 50,
  dominant_trait text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reasoning_followups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  session_id text,
  conversation_id text,
  challenge_id text not null,
  challenge_category text,
  follow_up text not null,
  cadence_key text,
  created_at timestamptz default now()
);

alter table public.reasoning_followups
add column if not exists session_id text;

alter table public.reasoning_followups
add column if not exists conversation_id text;

create table if not exists public.reasoning_verifier_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  session_id text,
  conversation_id text,
  challenge_id text not null,
  challenge_category text,
  ai_score integer,
  verifier_score integer,
  blended_score integer,
  rubric text,
  signals jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.reasoning_verifier_scores
add column if not exists session_id text;

alter table public.reasoning_verifier_scores
add column if not exists conversation_id text;

create table if not exists public.daily_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  completed_date date not null,
  challenge_count integer default 1,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.feedback_submissions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.user_profiles(id) on delete set null,
  event_type text not null default 'provided_feedback',
  context text,
  message text not null,
  page_path text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.feedback_submissions
enable row level security;

alter table public.user_profiles enable row level security;
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.claims enable row level security;
alter table public.user_traits enable row level security;
alter table public.reasoning_sessions enable row level security;
alter table public.cognitive_traits enable row level security;
alter table public.reasoning_profiles enable row level security;
alter table public.reasoning_followups enable row level security;
alter table public.reasoning_verifier_scores enable row level security;
alter table public.daily_progress enable row level security;

create index if not exists reasoning_sessions_user_idx
on public.reasoning_sessions(user_id);

create index if not exists reasoning_sessions_user_created_idx
on public.reasoning_sessions(user_id, created_at desc);

create index if not exists reasoning_sessions_conversation_idx
on public.reasoning_sessions(user_id, conversation_id, created_at desc);

create unique index if not exists reasoning_profiles_user_idx
on public.reasoning_profiles(user_id);

create index if not exists reasoning_followups_user_created_idx
on public.reasoning_followups(user_id, created_at desc);

create index if not exists reasoning_verifier_scores_user_created_idx
on public.reasoning_verifier_scores(user_id, created_at desc);

create unique index if not exists cognitive_traits_user_trait_idx
on public.cognitive_traits(user_id, trait_name);

create index if not exists daily_progress_user_idx
on public.daily_progress(user_id);

create unique index if not exists users_profile_idx
on public.users(profile_id)
where profile_id is not null;

create index if not exists users_auth_user_idx
on public.users(auth_user_id)
where auth_user_id is not null;

create unique index if not exists sessions_user_session_key_idx
on public.sessions(user_id, session_key);

create index if not exists sessions_user_activity_idx
on public.sessions(user_id, last_activity_at desc);

create index if not exists claims_user_created_idx
on public.claims(user_id, created_at desc);

create index if not exists claims_conversation_idx
on public.claims(user_id, conversation_id, created_at desc);

create unique index if not exists user_traits_user_trait_idx
on public.user_traits(user_id, trait_name);

create index if not exists feedback_submissions_created_idx
on public.feedback_submissions(created_at desc);

create index if not exists feedback_submissions_profile_created_idx
on public.feedback_submissions(profile_id, created_at desc)
where profile_id is not null;

create unique index if not exists feedback_submissions_one_soft_launch_survey_idx
on public.feedback_submissions(profile_id)
where profile_id is not null
and event_type in (
  'soft_launch_survey_prompted',
  'soft_launch_survey_dismissed',
  'soft_launch_survey_completed'
);

alter table public.user_profiles
add column if not exists is_studio_admin boolean not null default false;

alter table public.user_profiles
add column if not exists studio_role text;

create table if not exists public.studio_campaigns (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.user_profiles(id) on delete set null,
  name text not null,
  objective text not null,
  audience text,
  channel text,
  status text not null default 'draft',
  campaign_brief jsonb default '{}'::jsonb,
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
  asset_prompt text,
  status text not null default 'idea',
  scheduled_for timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_media_assets (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete set null,
  created_by uuid references public.user_profiles(id) on delete set null,
  asset_type text not null,
  title text not null,
  storage_path text,
  generation_prompt text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.studio_platform_connections (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.user_profiles(id) on delete set null,
  platform text not null,
  account_label text,
  token_secret_ref text,
  connection_status text not null default 'not_connected',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_analytics_events (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete set null,
  post_id uuid references public.studio_posts(id) on delete set null,
  platform text,
  event_type text not null,
  event_value numeric,
  metadata jsonb default '{}'::jsonb,
  occurred_at timestamptz default now()
);

create table if not exists public.studio_weekly_approvals (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.studio_campaigns(id) on delete cascade,
  week_start date not null,
  status text not null default 'draft',
  approval_notes text,
  reviewed_by uuid references public.user_profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.studio_platform_connections is
'Private Studio platform settings. Store token material in a secrets manager; token_secret_ref stores only a secure reference.';

alter table public.studio_campaigns enable row level security;
alter table public.studio_posts enable row level security;
alter table public.studio_media_assets enable row level security;
alter table public.studio_platform_connections enable row level security;
alter table public.studio_analytics_events enable row level security;
alter table public.studio_weekly_approvals enable row level security;

create index if not exists studio_campaigns_created_idx
on public.studio_campaigns(created_at desc);

create index if not exists studio_posts_campaign_idx
on public.studio_posts(campaign_id, created_at desc);

create index if not exists studio_media_assets_campaign_idx
on public.studio_media_assets(campaign_id, created_at desc);

create index if not exists studio_platform_connections_platform_idx
on public.studio_platform_connections(platform);

create index if not exists studio_analytics_events_campaign_idx
on public.studio_analytics_events(campaign_id, occurred_at desc);

create index if not exists studio_weekly_approvals_campaign_week_idx
on public.studio_weekly_approvals(campaign_id, week_start desc);

alter table public.studio_campaigns
add column if not exists enabled_platforms text[] not null default array['LinkedIn','Facebook','Instagram','Threads'],
add column if not exists offer text,
add column if not exists core_message text,
add column if not exists brand_pillar text,
add column if not exists campaign_type text,
add column if not exists landing_page_url text,
add column if not exists start_date date,
add column if not exists end_date date,
add column if not exists utm_source text;

alter table public.studio_posts
add column if not exists caption text,
add column if not exists cta text,
add column if not exists hashtags text[] not null default '{}',
add column if not exists content_package jsonb not null default '{}'::jsonb,
add column if not exists approval_decision text not null default 'needs_review',
add column if not exists approval_notes text,
add column if not exists graphic_format text,
add column if not exists scheduled_timezone text default 'America/Chicago';

create table if not exists public.studio_channel_settings (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.user_profiles(id) on delete set null,
  platform text not null unique,
  enabled boolean not null default true,
  cadence text,
  notes text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.studio_channel_settings enable row level security;

create index if not exists studio_channel_settings_platform_idx
on public.studio_channel_settings(platform);

drop policy if exists "Studio admins can manage campaigns" on public.studio_campaigns;
drop policy if exists "Studio admins can manage posts" on public.studio_posts;
drop policy if exists "Studio admins can manage media assets" on public.studio_media_assets;
drop policy if exists "Studio admins can manage platform connections" on public.studio_platform_connections;
drop policy if exists "Studio admins can manage analytics events" on public.studio_analytics_events;
drop policy if exists "Studio admins can manage weekly approvals" on public.studio_weekly_approvals;
drop policy if exists "Studio admins can manage channel settings" on public.studio_channel_settings;

create policy "Studio admins can manage campaigns"
on public.studio_campaigns
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);

create policy "Studio admins can manage posts"
on public.studio_posts
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);

create policy "Studio admins can manage media assets"
on public.studio_media_assets
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);

create policy "Studio admins can manage platform connections"
on public.studio_platform_connections
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);

create policy "Studio admins can manage analytics events"
on public.studio_analytics_events
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);

create policy "Studio admins can manage weekly approvals"
on public.studio_weekly_approvals
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);

create policy "Studio admins can manage channel settings"
on public.studio_channel_settings
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
)
with check (
  exists (
    select 1 from public.user_profiles profile
    where profile.auth_user_id = (select auth.uid())
    and (profile.is_studio_admin = true or profile.studio_role in ('owner', 'admin'))
  )
);
