-- ============================================================
-- Custom exercises — per-user editable exercise list + targets
-- Run this in: Supabase dashboard → SQL editor → New query
-- ============================================================

create table if not exists public.custom_exercises (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  unit       text not null default 'reps',
  target     integer not null default 10,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_exercises enable row level security;

drop policy if exists "custom_exercises: own rows" on public.custom_exercises;
create policy "custom_exercises: own rows" on public.custom_exercises
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
