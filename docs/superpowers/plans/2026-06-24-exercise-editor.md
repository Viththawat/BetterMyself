# Exercise Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user manually set an exercise's target number, and add/edit/delete the exercises themselves, by consolidating the hardcoded exercise list and the per-user `profiles.ex_targets` jsonb column into one new per-user Supabase table.

**Architecture:** A new `custom_exercises` table (same RLS pattern as the other six tables) replaces both the hardcoded `EXERCISES` array and `profiles.ex_targets`. `useStore.js` seeds it once per user from the current defaults — using the user's *existing* `ex_targets` values as the seed target, not the original starting numbers, so progress isn't lost. The Movement screen gets an inline pencil-icon target editor; the Manage screen gets a third section for adding/editing/deleting exercises, reusing the exact component pattern already used for habits and rewards.

**Tech Stack:** React 18, Vite, Supabase JS v2. No test framework is configured in this project — same as the prior habit/reward editor work, verification here is manual: run the dev server, exercise the feature in the browser, confirm state in the Supabase Table Editor.

**Lesson carried over from the habit/reward editor:** that work shipped a production crash because `seedState()` (the pre-fetch default state) didn't define `habits`/`rewards`, and a real React render can briefly use that stale seed state before the data fetch resolves (a timing gap between `user` becoming available and `useStore`'s effect re-running). This plan's `seedState()` change for `exercises` includes a safe `[]` default from the very first step, not as a follow-up fix.

---

### Task 1: Supabase migration for `custom_exercises`

**Files:**
- Create: `supabase/003_custom_exercises.sql`

- [ ] **Step 1: Write the migration file**

```sql
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
```

This is idempotent from the start (`create table if not exists`, `drop policy if exists` before `create policy`) — safe to run more than once.

- [ ] **Step 2: Run it in Supabase**

In the Supabase dashboard: **SQL Editor → New query**, paste the contents of `supabase/003_custom_exercises.sql`, click **Run**.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the table exists**

In the Supabase dashboard: **Table Editor** → confirm `custom_exercises` appears in the table list with 0 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/003_custom_exercises.sql
git commit -m "Add custom_exercises table"
```

---

### Task 2: Wire custom exercises through the data layer

**Files:**
- Modify: `src/constants.js:56-61` (rename `EXERCISES`)
- Modify: `src/hooks/useStore.js` (imports, `seedState`, `logExercise`, new CRUD methods, `loadData`, return value)
- Modify: `src/screens/Exercise.jsx` (whole file)

- [ ] **Step 1: Rename the hardcoded array in constants.js**

In `src/constants.js`, change:

```js
export const EXERCISES = [
```
to:
```js
export const DEFAULT_EXERCISES = [
```

(Only the declaration line changes — the array contents stay identical.)

- [ ] **Step 2: Update useStore.js's import and seedState**

In `src/hooks/useStore.js`, change the import from:

```js
import { DEFAULT_HABITS, DEFAULT_REWARDS, AREAS, ACTIVITIES } from '../constants';
```
to:
```js
import { DEFAULT_HABITS, DEFAULT_REWARDS, DEFAULT_EXERCISES, AREAS, ACTIVITIES } from '../constants';
```

Then change `seedState()` from:

```js
function seedState() {
  return {
    coins: 480, streak: 0, bestStreak: 0,
    day: todayKey(), checks: {}, mood: null,
    learned: [], exTargets: DEFAULT_EX_TARGETS, exDone: {},
    energyGoal: 480, energyPlan: [],
    time: { ...DEFAULT_TIME }, redeemed: [],
    history: [3, 4, 2, 5, 4, 5, 6], streakBumped: false,
    milestonesPaid: [], week: weekNum(),
    questId: pickQuestId(), questProgress: 0, questClaimed: false,
    habits: [], rewards: [],
  };
}
```
to:
```js
function seedState() {
  return {
    coins: 480, streak: 0, bestStreak: 0,
    day: todayKey(), checks: {}, mood: null,
    learned: [], exDone: {},
    energyGoal: 480, energyPlan: [],
    time: { ...DEFAULT_TIME }, redeemed: [],
    history: [3, 4, 2, 5, 4, 5, 6], streakBumped: false,
    milestonesPaid: [], week: weekNum(),
    questId: pickQuestId(), questProgress: 0, questClaimed: false,
    habits: [], rewards: [], exercises: [],
  };
}
```

(`exTargets` is removed — target now lives on each exercise object instead of a separate map. `exercises: []` is the safe default this plan is specifically careful to include from the start.)

- [ ] **Step 3: Rewrite logExercise to read/grow target from the exercise object, not a separate map**

Change `logExercise` from:

```js
  const logExercise = useCallback((ex, reps) => setS(p => {
    const target = p.exTargets[ex.id];
    let next = { ...p, exDone: { ...p.exDone, [ex.id]: reps } };
    if (user) supabase.from('exercise_logs').upsert(
      { user_id: user.id, date: todayKey(), exercise_id: ex.id, reps_done: reps, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,exercise_id' }
    );
    if (reps >= target) {
      const grow = ex.id === 'plank' ? 5 : Math.max(1, Math.round(target * 0.08));
      const gain = Math.round(20 * comboMult(p.streak));
      const pct = comboPct(p.streak);
      next.exTargets = { ...p.exTargets, [ex.id]: target + grow };
      next.coins = p.coins + gain;
      next = trackQuest(next, 'exercise');
      setTimeout(() => toast(`${ex.name} crushed!`, `Next: ${target + grow} ${ex.unit} · +${gain} coins${pct > 0 ? ` (+${pct}% combo)` : ''}`), 0);
    }
    next = maybeBumpStreak(next);
    scheduleSync(next);
    return next;
  }), [user?.id, scheduleSync]);
```
to:
```js
  const logExercise = useCallback((ex, reps) => setS(p => {
    let next = { ...p, exDone: { ...p.exDone, [ex.id]: reps } };
    if (user) supabase.from('exercise_logs').upsert(
      { user_id: user.id, date: todayKey(), exercise_id: ex.id, reps_done: reps, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,exercise_id' }
    );
    if (reps >= ex.target) {
      const grow = ex.unit === 'sec' ? 5 : Math.max(1, Math.round(ex.target * 0.08));
      const newTarget = ex.target + grow;
      const gain = Math.round(20 * comboMult(p.streak));
      const pct = comboPct(p.streak);
      next.exercises = p.exercises.map(e => e.id === ex.id ? { ...e, target: newTarget } : e);
      next.coins = p.coins + gain;
      next = trackQuest(next, 'exercise');
      if (user) supabase.from('custom_exercises').update({ target: newTarget }).eq('id', ex.id);
      setTimeout(() => toast(`${ex.name} crushed!`, `Next: ${newTarget} ${ex.unit} · +${gain} coins${pct > 0 ? ` (+${pct}% combo)` : ''}`), 0);
    }
    next = maybeBumpStreak(next);
    scheduleSync(next);
    return next;
  }), [user?.id, scheduleSync]);
```

Note the growth check changed from `ex.id === 'plank'` to `ex.unit === 'sec'` — exercise ids are about to become database-generated UUIDs (not the fixed string `'plank'`), so checking `unit` (which stays a meaningful `'reps'`/`'sec'` value regardless of id) is the correct, id-independent way to detect a time-based exercise. The `supabase.from('custom_exercises').update(...)` call is fire-and-forget (not awaited) — same style as the `exercise_logs` upsert two lines above it in this same function. Do not route this through the `updateExercise` method added in the next step; that method is `async` and calls its own `setS`, which would conflict with the `setS` updater this code is already inside.

- [ ] **Step 4: Add CRUD methods for exercises**

In `src/hooks/useStore.js`, immediately before the final `return { s, loading, ... }` line inside `useStore`, add:

```js
  const addExercise = useCallback(async (vals) => {
    if (!user) return;
    const { data, error } = await supabase.from('custom_exercises')
      .insert({ user_id: user.id, name: vals.name, unit: vals.unit, target: vals.target })
      .select().single();
    if (error) { toast('Could not add exercise', error.message); return; }
    setS(p => ({ ...p, exercises: [...p.exercises, data] }));
  }, [user?.id]);

  const updateExercise = useCallback(async (id, vals) => {
    if (!user) return;
    const { data, error } = await supabase.from('custom_exercises')
      .update({ name: vals.name, unit: vals.unit, target: vals.target })
      .eq('id', id).select().single();
    if (error) { toast('Could not update exercise', error.message); return; }
    setS(p => ({ ...p, exercises: p.exercises.map(e => e.id === id ? data : e) }));
  }, [user?.id]);

  const deleteExercise = useCallback(async (id) => {
    if (!user) return;
    const { error } = await supabase.from('custom_exercises').delete().eq('id', id);
    if (error) { toast('Could not delete exercise', error.message); return; }
    setS(p => ({ ...p, exercises: p.exercises.filter(e => e.id !== id) }));
  }, [user?.id]);

```

Then change the return statement from:

```js
  return { s, loading, bindToast, toast, toggleHabit, setMood, addLearning, removeLearning, logExercise, addActivity, removeActivity, setTime, redeem, resetDay, addHabit, updateHabit, deleteHabit, addReward, updateReward, deleteReward };
```
to:
```js
  return { s, loading, bindToast, toast, toggleHabit, setMood, addLearning, removeLearning, logExercise, addActivity, removeActivity, setTime, redeem, resetDay, addHabit, updateHabit, deleteHabit, addReward, updateReward, deleteReward, addExercise, updateExercise, deleteExercise };
```

- [ ] **Step 5: Fetch and seed custom_exercises in loadData, using the existing ex_targets values**

Change the `loadData` function's `Promise.all` block from:

```js
async function loadData(userId) {
  const today = todayKey();
  const [profRes, dailyRes, learnRes, exRes, redRes, habitsRes, rewardsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('learned_entries').select('*').eq('user_id', userId).eq('date', today).order('created_at', { ascending: false }),
    supabase.from('exercise_logs').select('*').eq('user_id', userId).eq('date', today),
    supabase.from('redeemed_rewards').select('*').eq('user_id', userId).order('redeemed_at', { ascending: false }).limit(20),
    supabase.from('custom_habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('custom_rewards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ]);

  let habits = habitsRes.data || [];
  if (habits.length === 0) {
    const seed = DEFAULT_HABITS.map(h => ({ user_id: userId, name: h.name, area: h.area, coins: h.coins }));
    const { data } = await supabase.from('custom_habits').insert(seed).select();
    habits = data || [];
  }

  let rewards = rewardsRes.data || [];
  if (rewards.length === 0) {
    const seed = DEFAULT_REWARDS.map(r => ({ user_id: userId, name: r.name, note: r.note, cost: r.cost, area: r.area }));
    const { data } = await supabase.from('custom_rewards').insert(seed).select();
    rewards = data || [];
  }

  const p = profRes.data || {};
```
to:
```js
async function loadData(userId) {
  const today = todayKey();
  const [profRes, dailyRes, learnRes, exRes, redRes, habitsRes, rewardsRes, exercisesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('learned_entries').select('*').eq('user_id', userId).eq('date', today).order('created_at', { ascending: false }),
    supabase.from('exercise_logs').select('*').eq('user_id', userId).eq('date', today),
    supabase.from('redeemed_rewards').select('*').eq('user_id', userId).order('redeemed_at', { ascending: false }).limit(20),
    supabase.from('custom_habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('custom_rewards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('custom_exercises').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ]);

  let habits = habitsRes.data || [];
  if (habits.length === 0) {
    const seed = DEFAULT_HABITS.map(h => ({ user_id: userId, name: h.name, area: h.area, coins: h.coins }));
    const { data } = await supabase.from('custom_habits').insert(seed).select();
    habits = data || [];
  }

  let rewards = rewardsRes.data || [];
  if (rewards.length === 0) {
    const seed = DEFAULT_REWARDS.map(r => ({ user_id: userId, name: r.name, note: r.note, cost: r.cost, area: r.area }));
    const { data } = await supabase.from('custom_rewards').insert(seed).select();
    rewards = data || [];
  }

  let exercises = exercisesRes.data || [];
  if (exercises.length === 0) {
    const exTargetSeed = profRes.data?.ex_targets || DEFAULT_EX_TARGETS;
    const seed = DEFAULT_EXERCISES.map(ex => ({ user_id: userId, name: ex.name, unit: ex.unit, target: exTargetSeed[ex.id] ?? 10 }));
    const { data } = await supabase.from('custom_exercises').insert(seed).select();
    exercises = data || [];
  }

  const p = profRes.data || {};
```

(`exTargetSeed[ex.id]` uses the *old* hardcoded ids — `'pushups'`, `'squats'`, `'plank'`, `'lunges'` — to look up each one's current value in the existing `ex_targets` jsonb, since `DEFAULT_EXERCISES` (formerly `EXERCISES`) still has those same string ids on its 4 entries even after this rename. This is exactly why the seed reads `ex_targets[ex.id]` per default exercise rather than assuming a fixed order.)

Then remove the `exTargets` line from the returned object and add `exercises` — change:

```js
    exTargets:      p.ex_targets     ?? DEFAULT_EX_TARGETS,
    milestonesPaid: p.milestones_paid ?? [],
```
to:
```js
    milestonesPaid: p.milestones_paid ?? [],
```

And change:
```js
    habits,
    rewards,
  };
}
```
to:
```js
    habits,
    rewards,
    exercises,
  };
}
```

`profiles.ex_targets` is not dropped from the database — it simply stops being read or written by the app after this task. No destructive migration.

- [ ] **Step 6: Update Exercise.jsx to read from the store and add the manual target editor**

Replace the entire contents of `src/screens/Exercise.jsx` with:

```jsx
import { useState } from 'react';
import { Icon, Card, Bar, Stepper, SectionHead } from '../components/ui';

function ExRow({ ex, done, logExercise, updateExercise }) {
  const [reps, setReps] = useState(done ?? ex.target);
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(ex.target);
  const hit = done != null && done >= ex.target;
  const pct = Math.min(100, Math.round((reps / ex.target) * 100));
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div className="card-title">{ex.name}</div>
          {editingTarget ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              <Stepper value={newTarget} set={setNewTarget} step={ex.unit === 'sec' ? 5 : 1} min={1} max={999} suffix={ex.unit === 'sec' ? 's' : ''} />
              <button className="btn btn-primary" style={{ padding: '6px 10px' }}
                onClick={() => { updateExercise(ex.id, { name: ex.name, unit: ex.unit, target: newTarget }); setEditingTarget(false); }}>Save</button>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
                onClick={() => { setNewTarget(ex.target); setEditingTarget(false); }}>Cancel</button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              Target · <b className="num">{ex.target} {ex.unit}</b>
              <button className="btn btn-ghost" style={{ padding: 4 }} aria-label="Edit target"
                onClick={() => { setNewTarget(ex.target); setEditingTarget(true); }}><Icon.pencil /></button>
            </div>
          )}
        </div>
        {hit ? <span className="tag">Done ✓</span> : <span className="card-eyebrow num">{pct}%</span>}
      </div>
      <Bar pct={pct} color={hit ? 'var(--primary)' : 'var(--gold)'} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
        <Stepper value={reps} set={setReps} step={ex.unit === 'sec' ? 5 : 1} suffix={ex.unit === 'sec' ? 's' : ''} />
        <button className="btn btn-primary" onClick={() => logExercise(ex, reps)}>{hit ? 'Update' : 'Log set'}</button>
      </div>
      {hit && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--primary-deep)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon.spark /> Progressive overload on — next session aims a little higher.
        </div>
      )}
    </Card>
  );
}

export default function Exercise({ store }) {
  const { s, logExercise, updateExercise } = store;
  return (
    <div>
      <SectionHead kicker="Body" title="Movement"
        sub="Log what you actually did. Each time you hit a target, the system nudges it up — so you're always growing." />
      <Card style={{ marginBottom: 'var(--gap)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--primary-soft)', border: 'none' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--card)', display: 'grid', placeItems: 'center', color: 'var(--primary-deep)', flex: '0 0 auto' }}><Icon.body /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Adaptive progression</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>Targets rise ~8% each time you meet them, or set your own any time with the pencil icon.</div>
        </div>
      </Card>
      {s.exercises.length === 0 && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px' }}>No exercises yet — add some in Manage.</div>
      )}
      <div className="grid two">
        {s.exercises.map(ex => (
          <ExRow key={ex.id} ex={ex} done={s.exDone[ex.id]} logExercise={logExercise} updateExercise={updateExercise} />
        ))}
      </div>
    </div>
  );
}
```

(Note: `EXERCISES` is no longer imported here at all — the file now gets the list entirely from `s.exercises`. The reps-`Stepper`'s `step` and `suffix` switched from checking `ex.id === 'plank'` to checking `ex.unit === 'sec'`, same reasoning as Step 3.)

- [ ] **Step 7: Verify manually**

Run:
```bash
npm run dev
```
Open the local URL, log in. Expected:
- The Movement screen still shows Push-ups/Squats/Plank/Lunges, each with whatever target you'd already grown them to (not reset back to 24/30/55/20) — confirms the seed correctly used your existing `ex_targets`, not the original defaults.
- Click the pencil icon next to a target, change the number, click Save — the displayed target updates immediately.
- Reload the page — the manually-set target persists (confirms it was actually written to Supabase, not just local state).
- Log a set that meets or exceeds the target — confirms auto-growth still works and coins are still awarded.

In the Supabase dashboard **Table Editor**, check `custom_exercises` — it should have 4 rows for your user, with `target` values matching what you saw before this change (or your manual edit, if you made one).

- [ ] **Step 8: Commit**

```bash
git add src/constants.js src/hooks/useStore.js src/screens/Exercise.jsx
git commit -m "Load exercises from per-user Supabase table with manual target editing"
```

---

### Task 3: Add exercise editing to the Manage screen

**Files:**
- Modify: `src/screens/Manage.jsx`

- [ ] **Step 1: Add ExerciseForm, ExerciseRow, and ExercisesSection**

In `src/screens/Manage.jsx`, immediately after the existing `RewardsSection` function (right before the `export default function Manage` line), add:

```jsx
function ExerciseForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [unit, setUnit] = useState(initial?.unit || 'reps');
  const [target, setTarget] = useState(initial?.target ?? 10);
  const valid = name.trim().length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <input className="field" placeholder="Exercise name" value={name} onChange={e => setName(e.target.value)} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select className="field" style={{ flex: 1 }} value={unit} onChange={e => setUnit(e.target.value)}>
          <option value="reps">reps</option>
          <option value="sec">sec</option>
        </select>
        <Stepper value={target} set={setTarget} step={unit === 'sec' ? 5 : 1} min={1} max={999} suffix={unit === 'sec' ? 's' : ''} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!valid}
          onClick={() => onSave({ name: name.trim(), unit, target })}>Save</button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ExerciseRow({ ex, onEdit, onDelete }) {
  return (
    <div className="habit">
      <div style={{ flex: 1 }}>
        <div className="habit-name">{ex.name}</div>
        <div className="habit-area">Target · {ex.target} {ex.unit}</div>
      </div>
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onEdit} aria-label="Edit exercise"><Icon.pencil /></button>
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onDelete} aria-label="Delete exercise"><Icon.trash /></button>
    </div>
  );
}

function ExercisesSection({ exercises, addExercise, updateExercise, deleteExercise }) {
  const [editing, setEditing] = useState(null);
  return (
    <Card>
      <div className="card-h">
        <div className="card-title">Your exercises</div>
        <span className="card-eyebrow num">{exercises.length}</span>
      </div>
      {exercises.length === 0 && editing !== 'new' && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px 4px' }}>No exercises yet — add one below.</div>
      )}
      {exercises.map(ex => editing === ex.id ? (
        <ExerciseForm key={ex.id} initial={ex}
          onSave={(vals) => { updateExercise(ex.id, vals); setEditing(null); }}
          onCancel={() => setEditing(null)} />
      ) : (
        <ExerciseRow key={ex.id} ex={ex} onEdit={() => setEditing(ex.id)}
          onDelete={() => { if (confirm(`Delete "${ex.name}"?`)) deleteExercise(ex.id); }} />
      ))}
      {editing === 'new' ? (
        <ExerciseForm onSave={(vals) => { addExercise(vals); setEditing(null); }} onCancel={() => setEditing(null)} />
      ) : (
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => setEditing('new')}>
          <Icon.plus /> Add exercise
        </button>
      )}
    </Card>
  );
}

```

- [ ] **Step 2: Wire it into the Manage component**

Change:

```jsx
export default function Manage({ store }) {
  const { s, addHabit, updateHabit, deleteHabit, addReward, updateReward, deleteReward } = store;
  return (
    <div>
      <SectionHead kicker="Customize" title="Manage your habits & rewards"
        sub="Edit, remove, or add your own daily check-ins and shop items." />
      <HabitsSection habits={s.habits} addHabit={addHabit} updateHabit={updateHabit} deleteHabit={deleteHabit} />
      <div style={{ height: 'var(--gap)' }} />
      <RewardsSection rewards={s.rewards} addReward={addReward} updateReward={updateReward} deleteReward={deleteReward} />
    </div>
  );
}
```
to:
```jsx
export default function Manage({ store }) {
  const { s, addHabit, updateHabit, deleteHabit, addReward, updateReward, deleteReward, addExercise, updateExercise, deleteExercise } = store;
  return (
    <div>
      <SectionHead kicker="Customize" title="Manage your habits & rewards"
        sub="Edit, remove, or add your own daily check-ins and shop items." />
      <HabitsSection habits={s.habits} addHabit={addHabit} updateHabit={updateHabit} deleteHabit={deleteHabit} />
      <div style={{ height: 'var(--gap)' }} />
      <RewardsSection rewards={s.rewards} addReward={addReward} updateReward={updateReward} deleteReward={deleteReward} />
      <div style={{ height: 'var(--gap)' }} />
      <ExercisesSection exercises={s.exercises} addExercise={addExercise} updateExercise={updateExercise} deleteExercise={deleteExercise} />
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

Run:
```bash
npm run dev
```
Open the Manage screen (gear icon). Expected: a third "Your exercises" section appears below "Your rewards," listing the same 4 exercises with their current targets. Click the pencil on one, change its name, click Save — confirm it updates in the list. Go to the Movement screen and confirm the renamed exercise shows the new name there too. Add a new exercise (e.g. name "Burpees", unit "reps", target 10) — confirm it appears on both the Manage screen and the Movement screen, with a working "Log set" button.

- [ ] **Step 4: Commit**

```bash
git add src/screens/Manage.jsx
git commit -m "Add exercise editing to the Manage screen"
```

---

### Task 4: Final verification and deploy

**Files:** none (verification and push only)

- [ ] **Step 1: Full local smoke test**

With `npm run dev` still running: log a set that hits an exercise's target (confirms auto-growth + coins still work end to end with the new data model), manually override another exercise's target via the pencil icon, add a brand new exercise in Manage and log a set against it, delete an exercise you don't want and confirm it disappears from both Manage and Movement.

- [ ] **Step 2: Push to GitHub**

This triggers Vercel's auto-redeploy on `main`.

```bash
git push origin main
```

Expected: push succeeds, no errors.

- [ ] **Step 3: Verify on the live site**

Wait about 30 seconds for Vercel to redeploy, then hard-refresh `https://better-myself.vercel.app`. Confirm: the Movement screen loads without errors (this is the exact failure mode hit last time — a blank page from a render-time crash — so don't skip this check), targets show your existing values, the pencil-icon editor works, and the Manage screen's new "Your exercises" section works the same as it did locally.
