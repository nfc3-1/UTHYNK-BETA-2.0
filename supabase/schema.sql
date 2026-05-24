create extension if not exists "uuid-ossp";

create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
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
  created_at timestamptz default now()
);

create table if not exists public.cognitive_traits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  trait_name text not null,
  trait_score integer default 50,
  updated_at timestamptz default now()
);

create table if not exists public.daily_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  completed_date date not null,
  challenge_count integer default 1,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

create index if not exists reasoning_sessions_user_idx
on public.reasoning_sessions(user_id);

create index if not exists daily_progress_user_idx
on public.daily_progress(user_id);
