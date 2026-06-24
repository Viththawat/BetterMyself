-- ============================================================
-- Custom habits & rewards — per-user editable lists
-- Run this in: Supabase dashboard → SQL editor → New query
-- ============================================================

create table public.custom_habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  area       text not null,
  coins      integer not null default 10,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.custom_rewards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  note       text,
  cost       integer not null,
  area       text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_habits  enable row level security;
alter table public.custom_rewards enable row level security;

create policy "custom_habits: own rows" on public.custom_habits
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "custom_rewards: own rows" on public.custom_rewards
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
