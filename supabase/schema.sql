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
