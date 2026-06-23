-- ============================================================
-- Compound Habit Tracker — Supabase Schema
-- Run this in: Supabase dashboard → SQL editor → New query
-- ============================================================

-- 1. Profiles (one per user, extends auth.users)
create table if not exists public.profiles (
  id                uuid references auth.users on delete cascade primary key,
  coins             integer      not null default 480,
  streak            integer      not null default 0,
  best_streak       integer      not null default 0,
  ex_targets        jsonb        not null default '{"pushups":24,"squats":30,"plank":55,"lunges":20}'::jsonb,
  milestones_paid   integer[]    not null default array[]::integer[],
  history           integer[]    not null default array[3,4,2,5,4,5,6]::integer[],
  week_num          integer,
  quest_id          text,
  quest_progress    integer      not null default 0,
  quest_claimed     boolean      not null default false,
  last_active_date  date,
  updated_at        timestamptz  not null default now()
);

-- 2. Daily logs (one per user per day)
create table if not exists public.daily_logs (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references auth.users on delete cascade not null,
  date             date        not null,
  checks           jsonb       not null default '{}'::jsonb,
  mood             integer,
  energy_goal      integer     not null default 480,
  energy_plan      jsonb       not null default '[]'::jsonb,
  time_allocation  jsonb       not null default '{"sleep":7,"work":5,"exercise":1,"reading":1,"scroll":3,"gaming":1,"tv":1,"chores":5}'::jsonb,
  streak_bumped    boolean     not null default false,
  updated_at       timestamptz not null default now(),
  unique(user_id, date)
);

-- 3. Learned entries (multiple per day)
create table if not exists public.learned_entries (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users on delete cascade not null,
  date       date        not null,
  text       text        not null,
  created_at timestamptz not null default now()
);

-- 4. Exercise logs (one per exercise per day)
create table if not exists public.exercise_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users on delete cascade not null,
  date        date        not null,
  exercise_id text        not null,
  reps_done   integer     not null,
  updated_at  timestamptz not null default now(),
  unique(user_id, date, exercise_id)
);

-- 5. Redeemed rewards (append-only log)
create table if not exists public.redeemed_rewards (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users on delete cascade not null,
  reward_id   text        not null,
  reward_name text,
  cost        integer,
  redeemed_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — users only see their own data
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.daily_logs       enable row level security;
alter table public.learned_entries  enable row level security;
alter table public.exercise_logs    enable row level security;
alter table public.redeemed_rewards enable row level security;

-- Profiles
create policy "profiles: own rows" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- Daily logs
create policy "daily_logs: own rows" on public.daily_logs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Learned entries
create policy "learned_entries: own rows" on public.learned_entries
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Exercise logs
create policy "exercise_logs: own rows" on public.exercise_logs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Redeemed rewards
create policy "redeemed_rewards: own rows" on public.redeemed_rewards
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile row when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
