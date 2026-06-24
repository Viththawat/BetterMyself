# Exercise editor — design spec

**Date:** 2026-06-24
**Status:** Approved, ready for implementation plan

## Problem

Exercise data is currently split across two places: the exercise list itself
(`EXERCISES` in `src/constants.js` — name/unit, hardcoded, shared by every
user) and each exercise's growing target number (`profiles.ex_targets`, a
jsonb column, already per-user but keyed by the hardcoded ids and only
editable by the existing "+8% on hit" auto-growth logic in `logExercise()`).

The user wants two things on the Movement screen (`src/screens/Exercise.jsx`):
1. Manually type in a new target number for an exercise, instead of only
   being able to grow it by hitting the current one.
2. Add, rename, or remove the exercises themselves — the same kind of
   per-user customization already built for habits and rewards.

This mirrors the habit/reward editor shipped earlier today (see
`2026-06-24-habit-reward-editor-design.md`) but with one twist: exercises
need their name/unit/target consolidated into a single editable row, where
habits/rewards didn't have that split to deal with.

## Data model

One new table, `custom_exercises`, same per-user RLS pattern as the other
six tables:

```sql
create table if not exists public.custom_exercises (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  unit       text not null default 'reps',   -- 'reps' or 'sec'
  target     integer not null default 10,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_exercises enable row level security;

drop policy if exists "custom_exercises: own rows" on public.custom_exercises;
create policy "custom_exercises: own rows" on public.custom_exercises
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Seeding

The first time `loadData()` finds zero rows in `custom_exercises` for a
user, it seeds from the current hardcoded exercise list (`EXERCISES`,
renamed `DEFAULT_EXERCISES`, kept only as seed data) — **using that user's
current `profiles.ex_targets` values as the seeded target**, not the
hardcoded starting defaults (24/30/55/20), so existing progress carries
over instead of resetting. If `profiles.ex_targets` is null (a user who
somehow has no profile row yet), fall back to the hardcoded starting
defaults (kept as `DEFAULT_EX_TARGETS`, used only by this seed path).

`profiles.ex_targets` is not touched or dropped by this change — the
column simply stops being read or written by the app once `target` lives
on each `custom_exercises` row instead. No destructive migration.

### What replaces `s.exTargets`

Today, `s.exTargets` is a separate `{ [exerciseId]: targetNumber }` map,
looked up by id wherever a target is needed (`s.exTargets[ex.id]`). After
this change, target lives directly on each exercise object — `s.exercises`
becomes the array of `{ id, name, unit, target }` rows from
`custom_exercises`, the same shape habits/rewards already use (e.g. a
habit object carries its own `coins`, not a separate lookup map). Anywhere
that read `s.exTargets[ex.id]` reads `ex.target` instead. `s.exTargets` is
removed entirely — it's not needed once target is a field on the row.

`s.exDone` (today's logged reps per exercise, from `exercise_logs`) is
unrelated to this and is unchanged — it's genuinely a different concept
(today's progress vs. the growing target ceiling) and stays keyed by
exercise id exactly as today (which will now be a UUID instead of a fixed
slug — same low-risk, self-correcting-next-day situation as habit checks
keyed by id, already accepted in the habit/reward editor spec).

### Auto-growth now writes to `custom_exercises`

`logExercise(ex, reps)` currently mutates a copy of `exTargets` and relies
on the existing 800ms-debounced `scheduleSync` (which only ever wrote to
`profiles`/`daily_logs`) to persist it. Going forward, when `reps >=
target` triggers growth, `logExercise` writes the new `target` value
straight to that exercise's `custom_exercises` row with an immediate
(non-debounced) Supabase update — same immediacy as the habit/reward CRUD
methods — and updates the matching object inside the local `s.exercises`
array. The rest of `logExercise` (today's `exercise_logs` upsert, coins,
streak, quest tracking) is unchanged.

## UI

### Movement screen — manual target edit

A pencil icon next to the existing "Target · 24 reps" text on each
exercise card. Clicking it swaps that text for an inline `Stepper` (same
component used elsewhere) pre-filled with the current target, plus
Save/Cancel. Save calls `updateExercise(ex.id, { name: ex.name, unit:
ex.unit, target: newTarget })` — carrying the unchanged name/unit through,
since the CRUD method's signature matches the Manage screen's full-row
edit form. Cancel reverts without saving. This target-edit toggle is a
separate piece of local state from the existing reps-`Stepper` + "Log set"
control already on the card — both stay independently visible and
usable; there's no shared "editing" state to coordinate, unlike the
Manage screen's one-row-at-a-time edit/display swap.

### Manage screen — exercise list editing

A third section, "Your exercises," added to the existing Manage screen,
same row/edit/delete/add pattern as "Your habits" and "Your rewards":
- Row: name, unit, target, with pencil/trash icon buttons.
- Inline add/edit form: name (text), unit (`<select>`: reps/sec), target
  (`Stepper`). Save disabled when name is empty (trimmed). Delete via
  native `confirm()`.
- Uses `addExercise`, `updateExercise`, `deleteExercise` — same three-method
  CRUD shape as habits/rewards.

### Empty state

Same convention as habits/rewards: the exercise list can be deleted down
to zero. When `s.exercises` is empty, the Movement screen shows "No
exercises yet — add some in Manage." instead of the exercise grid, and the
Manage screen's exercise section shows the equivalent "add one below"
message.

## Implementation shape

- `src/constants.js`: `EXERCISES` renamed `DEFAULT_EXERCISES`.
  `DEFAULT_EX_TARGETS` stays exactly where it already is, inline in
  `src/hooks/useStore.js` — it's only ever used by the seed path inside
  that file.
- `src/hooks/useStore.js`:
  - `loadData()` fetches `custom_exercises` alongside the existing
    parallel queries; seeds it from `DEFAULT_EXERCISES` +
    `profRes.data?.ex_targets` (fallback `DEFAULT_EX_TARGETS`) if empty.
  - Exposes `s.exercises`; removes `s.exTargets` entirely.
  - New methods: `addExercise`, `updateExercise`, `deleteExercise` —
    immediate Supabase writes, same pattern as the habit/reward methods.
  - `logExercise()` updated to read/grow target via `s.exercises` instead
    of `s.exTargets`, and to persist growth via an immediate
    `custom_exercises` update instead of relying on `scheduleSync`.
- `src/screens/Exercise.jsx`: reads `s.exercises` instead of importing
  `EXERCISES`; `ExRow` gains the pencil-icon inline target editor; empty
  state added.
- `src/screens/Manage.jsx`: add an `ExercisesSection` following the same
  shape as `HabitsSection`/`RewardsSection`.
- `src/components/ui.jsx`: no new icons needed — `pencil`/`trash`/`plus`
  already exist from the habit/reward editor.

## Out of scope

- Reordering exercises (`sort_order` exists, unused, same as habits/rewards).
- Changing the auto-growth percentage/step logic itself (still +8%, or
  +5 sec for plank specifically) — only how the resulting number is
  *stored*, not how it's *computed*, changes.
- Per-exercise history/charts — not part of this request.
