# Habit & reward editor — design spec

**Date:** 2026-06-24
**Status:** Approved, ready for implementation plan

## Problem

`HABITS` (daily check-ins) and `REWARDS` (shop items) are hardcoded arrays in
`src/constants.js`, shared by every user with no way to customize them. The
user wants to edit their own daily habits and shop rewards to fit their
routine, without touching code.

Out of scope: `QUESTS` and `MILESTONES` (in `src/economy.js`) are not part of
this feature — only daily habits and shop rewards.

## Data model

Two new Supabase tables, following the same per-user RLS pattern as the
existing five tables (`profiles`, `daily_logs`, `learned_entries`,
`exercise_logs`, `redeemed_rewards`):

```sql
create table public.custom_habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  area       text not null,        -- one of: mind, body, calm, rest, fuel
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
  area       text,                 -- free-text tag, e.g. "Treat" — optional
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_habits  enable row level security;
alter table public.custom_rewards enable row level security;

create policy "custom_habits: own rows" on public.custom_habits
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "custom_rewards: own rows" on public.custom_rewards
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Seeding

The first time `useStore`'s `loadData()` runs for a user and finds zero rows
in `custom_habits`, it bulk-inserts the current hardcoded habit list
(renamed `DEFAULT_HABITS`, kept only as seed data) as that user's starting
rows. Same for `custom_rewards` from `DEFAULT_REWARDS`. After seeding, the
app reads/writes only the Supabase rows — the hardcoded arrays are never
read directly by any screen again, only used as the one-time seed source.

## UI

### Entry point

A gear icon button that opens the new `Manage` screen (`#manage` route).
Placed in **two** spots so it's reachable regardless of viewport:

- **Mobile** — in the `.topbar` (visible ≤860px), next to the existing
  streak/coins display.
- **Desktop** — in the `Sidebar`, near the wallet/sign-out area (the
  `.topbar` is `display:none` on desktop, so the mobile-only placement
  alone would make it unreachable there).

Not added as a full nav item in `BottomNav`/`Sidebar` nav list — avoids
crowding the existing 6-item bottom nav on mobile.

### Manage screen layout

Two stacked sections, "Your habits" and "Your rewards", each a `Card`
containing:
- A list of rows: name, area tag (habits) or note/tag (rewards), coins/cost
  value, with a pencil (edit) and trash (delete) icon button per row.
- An "+ Add" button at the bottom of the list.

Clicking edit or add swaps that row into an inline form (same form
component handles both add and edit):

- **Habit form:** name (text input), area (dropdown showing the labels
  Mind/Body/Calm/Rest/Fuel, but storing the matching lowercase `AREAS` id
  — `mind`/`body`/`calm`/`rest`/`fuel` — so `areaProgress()` and the
  Today screen's area lookup keep working unchanged), coins (`Stepper`
  component, reused from `ui.jsx`)
- **Reward form:** name (text input), note (text input, optional), cost
  (`Stepper`), tag (text input, optional free text, e.g. "Treat")

Validation: name is required (non-empty, trimmed) for both habits and
rewards; coins/cost are clamped to >= 0 by the `Stepper`'s `min` prop.
Save is disabled while name is empty. Save/Cancel buttons close the form.
Delete uses a native `confirm()` prompt — no new modal component needed.

### Empty state

Habits/rewards can be deleted down to zero. When `s.habits` is empty, the
Today screen shows a message ("No habits yet — add some in Manage")
instead of the check-in list. When `s.rewards` is empty, the Rewards
screen shows an equivalent message instead of the shop grid.

## Implementation shape

- `src/constants.js`: `HABITS`/`REWARDS` renamed to `DEFAULT_HABITS`/
  `DEFAULT_REWARDS`, used only by the seeding logic.
- `src/hooks/useStore.js`:
  - `loadData()` fetches `custom_habits`/`custom_rewards` alongside the
    existing parallel queries; seeds them from the defaults if empty.
  - Exposes `s.habits` / `s.rewards` on state.
  - New methods: `addHabit`, `updateHabit`, `deleteHabit`, `addReward`,
    `updateReward`, `deleteReward` — these write directly to Supabase
    immediately (no 800ms debounce; edits are infrequent, unlike daily
    activity ticks).
  - `areaProgress(s)` reads `s.habits` instead of the static `HABITS`
    import.
- `src/screens/Today.jsx`: reads `s.habits` from the store instead of
  importing `HABITS`; renders the empty-state message when empty.
- `src/screens/Rewards.jsx`: reads `s.rewards` from the store instead of
  importing `REWARDS`; renders the empty-state message when empty.
- `src/screens/Manage.jsx` (new): the editor screen described above.
- `src/components/ui.jsx`: add `pencil` (edit), `trash`, and `gear` icons
  to the `Icon` object.
- `src/components/Nav.jsx` (Sidebar): add the gear icon button near the
  wallet/sign-out area.
- `src/App.jsx`: add the gear icon button to the `.topbar` JSX; add a
  `'manage'` case to the screen-routing `switch`.

## Out of scope

- Quests (`QUESTS`) and streak milestones (`MILESTONES`) — not editable
  by this feature.
- Reordering habits/rewards via drag-and-drop — `sort_order` column exists
  for future use but this feature only needs to support insertion order
  (new items append).
- Editing the five fixed `AREAS` (Mind/Body/Calm/Rest/Fuel) — habits only
  pick from the existing fixed set, areas themselves stay hardcoded.
