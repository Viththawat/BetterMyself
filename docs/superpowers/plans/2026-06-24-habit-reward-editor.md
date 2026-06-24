# Habit & Reward Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user add, edit, and delete their own daily habits and shop rewards from a new in-app screen, backed by per-user Supabase tables, instead of the current hardcoded lists shared by everyone.

**Architecture:** Two new Supabase tables (`custom_habits`, `custom_rewards`) with the same per-user RLS pattern as the existing five tables. `useStore.js` seeds them from the current hardcoded defaults on first load, then exposes `s.habits`/`s.rewards` plus CRUD methods. A new `Manage.jsx` screen (reached via a gear icon, not a full nav item) lets the user edit both lists with inline forms reusing existing UI primitives (`Card`, `Stepper`, `.field`/`.btn` CSS classes already in `styles.css`).

**Tech Stack:** React 18, Vite, Supabase JS v2, plain CSS (no CSS framework). No test runner is configured in this project (`package.json` has no test script and no testing library) — this is a small solo project and adding one is out of scope for this feature. Verification in this plan is manual: run the Vite dev server, exercise the feature in the browser, and confirm state in the Supabase dashboard's Table Editor.

---

### Task 1: Supabase migration for `custom_habits` / `custom_rewards`

**Files:**
- Create: `supabase/002_custom_habits_rewards.sql`

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Run it in Supabase**

In the Supabase dashboard: **SQL Editor → New query**, paste the contents of `supabase/002_custom_habits_rewards.sql`, click **Run**.

Expected: "Success. No rows returned." (the `create table` warning dialog about RLS should NOT appear this time, since RLS is enabled in the same script).

- [ ] **Step 3: Verify the tables exist**

In the Supabase dashboard: **Table Editor** → confirm `custom_habits` and `custom_rewards` both appear in the table list, each with 0 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/002_custom_habits_rewards.sql
git commit -m "Add custom_habits and custom_rewards tables"
```

---

### Task 2: Wire custom habits/rewards through the data layer

**Files:**
- Modify: `src/constants.js:9-16` (rename `HABITS`), `src/constants.js:47-54` (rename `REWARDS`)
- Modify: `src/hooks/useStore.js` (imports, `seedState`, `areaProgress`, `loadData`, new CRUD methods, return value)
- Modify: `src/screens/Today.jsx:1-2`, `src/screens/Today.jsx:84-108` (`HabitList`)
- Modify: `src/screens/Rewards.jsx:1-2`, `src/screens/Rewards.jsx:66-95` (`Rewards`)

- [ ] **Step 1: Rename the hardcoded arrays in constants.js**

In `src/constants.js`, change:

```js
export const HABITS = [
```
to:
```js
export const DEFAULT_HABITS = [
```

And change:

```js
export const REWARDS = [
```
to:
```js
export const DEFAULT_REWARDS = [
```

(Only the two `export const` lines change — the array contents stay identical. These are now seed-only data, not read directly by any screen after this task.)

- [ ] **Step 2: Update useStore.js imports and seedState**

In `src/hooks/useStore.js`, change the top imports from:

```js
import { todayKey, weekNum, comboPct, comboMult, MILESTONES, currentQuest, pickQuestId } from '../economy';
import { HABITS, AREAS, ACTIVITIES } from '../constants';
```
to:
```js
import { todayKey, weekNum, comboPct, comboMult, MILESTONES, currentQuest, pickQuestId } from '../economy';
import { DEFAULT_HABITS, DEFAULT_REWARDS, AREAS, ACTIVITIES } from '../constants';
```

- [ ] **Step 3: Update areaProgress to read from state instead of the static import**

Change:

```js
export function areaProgress(s) {
  const out = {};
  AREAS.forEach(a => {
    const hs = HABITS.filter(h => h.area === a.id);
```
to:
```js
export function areaProgress(s) {
  const out = {};
  AREAS.forEach(a => {
    const hs = s.habits.filter(h => h.area === a.id);
```

- [ ] **Step 4: Fetch and seed habits/rewards in loadData, and add them to the returned state**

Change the `loadData` function's Promise.all block from:

```js
async function loadData(userId) {
  const today = todayKey();
  const [profRes, dailyRes, learnRes, exRes, redRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('learned_entries').select('*').eq('user_id', userId).eq('date', today).order('created_at', { ascending: false }),
    supabase.from('exercise_logs').select('*').eq('user_id', userId).eq('date', today),
    supabase.from('redeemed_rewards').select('*').eq('user_id', userId).order('redeemed_at', { ascending: false }).limit(20),
  ]);
```
to:
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
```

Then add `habits` and `rewards` to the object this function returns — change the closing `return { ... }` from:

```js
    redeemed:       (redRes.data || []).map(r => ({ id: r.reward_id, name: r.reward_name, cost: r.cost, ts: new Date(r.redeemed_at).getTime() })),
  };
}
```
to:
```js
    redeemed:       (redRes.data || []).map(r => ({ id: r.reward_id, name: r.reward_name, cost: r.cost, ts: new Date(r.redeemed_at).getTime() })),
    habits,
    rewards,
  };
}
```

- [ ] **Step 5: Add CRUD methods for habits and rewards**

In `src/hooks/useStore.js`, immediately before the final `return { s, loading, ... }` line inside `useStore`, add:

```js
  const addHabit = useCallback(async (vals) => {
    if (!user) return;
    const { data, error } = await supabase.from('custom_habits')
      .insert({ user_id: user.id, name: vals.name, area: vals.area, coins: vals.coins })
      .select().single();
    if (error) { toast('Could not add habit', error.message); return; }
    setS(p => ({ ...p, habits: [...p.habits, data] }));
  }, [user?.id]);

  const updateHabit = useCallback(async (id, vals) => {
    if (!user) return;
    const { data, error } = await supabase.from('custom_habits')
      .update({ name: vals.name, area: vals.area, coins: vals.coins })
      .eq('id', id).select().single();
    if (error) { toast('Could not update habit', error.message); return; }
    setS(p => ({ ...p, habits: p.habits.map(h => h.id === id ? data : h) }));
  }, [user?.id]);

  const deleteHabit = useCallback(async (id) => {
    if (!user) return;
    const { error } = await supabase.from('custom_habits').delete().eq('id', id);
    if (error) { toast('Could not delete habit', error.message); return; }
    setS(p => ({ ...p, habits: p.habits.filter(h => h.id !== id) }));
  }, [user?.id]);

  const addReward = useCallback(async (vals) => {
    if (!user) return;
    const { data, error } = await supabase.from('custom_rewards')
      .insert({ user_id: user.id, name: vals.name, note: vals.note || null, cost: vals.cost, area: vals.area || null })
      .select().single();
    if (error) { toast('Could not add reward', error.message); return; }
    setS(p => ({ ...p, rewards: [...p.rewards, data] }));
  }, [user?.id]);

  const updateReward = useCallback(async (id, vals) => {
    if (!user) return;
    const { data, error } = await supabase.from('custom_rewards')
      .update({ name: vals.name, note: vals.note || null, cost: vals.cost, area: vals.area || null })
      .eq('id', id).select().single();
    if (error) { toast('Could not update reward', error.message); return; }
    setS(p => ({ ...p, rewards: p.rewards.map(r => r.id === id ? data : r) }));
  }, [user?.id]);

  const deleteReward = useCallback(async (id) => {
    if (!user) return;
    const { error } = await supabase.from('custom_rewards').delete().eq('id', id);
    if (error) { toast('Could not delete reward', error.message); return; }
    setS(p => ({ ...p, rewards: p.rewards.filter(r => r.id !== id) }));
  }, [user?.id]);

```

Then change the return statement from:

```js
  return { s, loading, bindToast, toast, toggleHabit, setMood, addLearning, removeLearning, logExercise, addActivity, removeActivity, setTime, redeem, resetDay };
```
to:
```js
  return { s, loading, bindToast, toast, toggleHabit, setMood, addLearning, removeLearning, logExercise, addActivity, removeActivity, setTime, redeem, resetDay, addHabit, updateHabit, deleteHabit, addReward, updateReward, deleteReward };
```

- [ ] **Step 6: Update Today.jsx to read habits from the store**

In `src/screens/Today.jsx`, change the import line:

```js
import { AREAS, HABITS, MOODS } from '../constants';
```
to:
```js
import { AREAS, MOODS } from '../constants';
```

Then change the `HabitList` function from:

```js
function HabitList({ s, toggleHabit }) {
  const done = HABITS.filter(h => s.checks[h.id]).length;
  return (
    <Card>
      <div className="card-h">
        <div className="card-title">Daily check-ins</div>
        <span className="card-eyebrow num">{done}/{HABITS.length} done</span>
      </div>
      {HABITS.map(h => {
```
to:
```js
function HabitList({ s, toggleHabit }) {
  const habits = s.habits;
  const done = habits.filter(h => s.checks[h.id]).length;
  return (
    <Card>
      <div className="card-h">
        <div className="card-title">Daily check-ins</div>
        <span className="card-eyebrow num">{done}/{habits.length} done</span>
      </div>
      {habits.length === 0 && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px' }}>No habits yet — add some in Manage.</div>
      )}
      {habits.map(h => {
```

(The rest of the `.map` body and the closing `</Card>` stay exactly as they are.)

- [ ] **Step 7: Update Rewards.jsx to read rewards from the store**

In `src/screens/Rewards.jsx`, change the import line:

```js
import { REWARDS } from '../constants';
```
to:
```js
```
(remove the line entirely — `REWARDS` is no longer imported).

Then change the start of the `Rewards` component from:

```js
export default function Rewards({ store }) {
  const { s, redeem } = store;
  const nextGoal = REWARDS.filter(r => r.cost > s.coins).sort((a, b) => a.cost - b.cost)[0];
```
to:
```js
export default function Rewards({ store }) {
  const { s, redeem } = store;
  const rewards = s.rewards;
  const nextGoal = rewards.filter(r => r.cost > s.coins).sort((a, b) => a.cost - b.cost)[0];
```

Then change the shop grid from:

```js
      <div className="grid three">
        {REWARDS.map(r => {
```
to:
```js
      <div className="grid three">
        {rewards.length === 0 && (
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px' }}>No rewards yet — add some in Manage.</div>
        )}
        {rewards.map(r => {
```

- [ ] **Step 8: Verify manually**

Run:
```bash
npm run dev
```
Open the printed local URL, log in (session should already be active from your last login). Expected:
- The Today screen still shows the same 6 daily check-ins as before, and checking one off still awards coins as usual.
- The Rewards screen still shows the same 6 shop items as before.

In the Supabase dashboard **Table Editor**, check `custom_habits` and `custom_rewards` — each should now have 6 rows belonging to your user (the one-time seed from `DEFAULT_HABITS`/`DEFAULT_REWARDS` ran on this load).

- [ ] **Step 9: Commit**

```bash
git add src/constants.js src/hooks/useStore.js src/screens/Today.jsx src/screens/Rewards.jsx
git commit -m "Load habits and rewards from per-user Supabase tables"
```

---

### Task 3: Build the Manage screen and its entry points

**Files:**
- Modify: `src/components/ui.jsx` (add `pencil`, `trash`, `gear` icons)
- Create: `src/screens/Manage.jsx`
- Modify: `src/App.jsx` (import `Manage`, route case, topbar gear button)
- Modify: `src/components/Nav.jsx` (`Sidebar`: gear button near sign out)

- [ ] **Step 1: Add the new icons**

In `src/components/ui.jsx`, inside the `Icon` object, add these three entries (anywhere among the existing entries, e.g. right after `plus`):

```js
  pencil: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  trash:  (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>,
  gear:   (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.8-1.4-2-3.4-2.1.6a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.5 2.2a7.6 7.6 0 0 0-2.6 1.5l-2.1-.6-2 3.4L4.6 10a7.6 7.6 0 0 0 0 3l-1.8 1.5 2 3.4 2.1-.6c.8.7 1.7 1.2 2.6 1.5L10 22h4l.5-2.2c.9-.3 1.8-.8 2.6-1.5l2.1.6 2-3.4z"/></svg>,
```

- [ ] **Step 2: Create the Manage screen**

Create `src/screens/Manage.jsx`:

```jsx
import { useState } from 'react';
import { AREAS } from '../constants';
import { Icon, Card, Stepper, SectionHead } from '../components/ui';

function HabitForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [area, setArea] = useState(initial?.area || AREAS[0].id);
  const [coins, setCoins] = useState(initial?.coins ?? 10);
  const valid = name.trim().length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <input className="field" placeholder="Habit name" value={name} onChange={e => setName(e.target.value)} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select className="field" style={{ flex: 1 }} value={area} onChange={e => setArea(e.target.value)}>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <Stepper value={coins} set={setCoins} step={5} min={0} max={500} suffix="¢" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!valid}
          onClick={() => onSave({ name: name.trim(), area, coins })}>Save</button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function RewardForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [note, setNote] = useState(initial?.note || '');
  const [cost, setCost] = useState(initial?.cost ?? 100);
  const [area, setArea] = useState(initial?.area || '');
  const valid = name.trim().length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <input className="field" placeholder="Reward name" value={name} onChange={e => setName(e.target.value)} />
      <input className="field" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input className="field" style={{ flex: 1 }} placeholder="Tag (optional)" value={area} onChange={e => setArea(e.target.value)} />
        <Stepper value={cost} set={setCost} step={10} min={0} max={9999} suffix="¢" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!valid}
          onClick={() => onSave({ name: name.trim(), note: note.trim(), cost, area: area.trim() })}>Save</button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function HabitRow({ h, onEdit, onDelete }) {
  const area = AREAS.find(a => a.id === h.area);
  return (
    <div className="habit">
      <div style={{ flex: 1 }}>
        <div className="habit-name">{h.name}</div>
        <div className="habit-area">{area?.name || h.area} · +{h.coins}¢</div>
      </div>
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onEdit} aria-label="Edit habit"><Icon.pencil /></button>
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onDelete} aria-label="Delete habit"><Icon.trash /></button>
    </div>
  );
}

function RewardRow({ r, onEdit, onDelete }) {
  return (
    <div className="habit">
      <div style={{ flex: 1 }}>
        <div className="habit-name">{r.name}</div>
        <div className="habit-area">{r.note ? `${r.note} · ` : ''}{r.cost}¢{r.area ? ` · ${r.area}` : ''}</div>
      </div>
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onEdit} aria-label="Edit reward"><Icon.pencil /></button>
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onDelete} aria-label="Delete reward"><Icon.trash /></button>
    </div>
  );
}

function HabitsSection({ habits, addHabit, updateHabit, deleteHabit }) {
  const [editing, setEditing] = useState(null);
  return (
    <Card>
      <div className="card-h">
        <div className="card-title">Your habits</div>
        <span className="card-eyebrow num">{habits.length}</span>
      </div>
      {habits.length === 0 && editing !== 'new' && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px 4px' }}>No habits yet — add one below.</div>
      )}
      {habits.map(h => editing === h.id ? (
        <HabitForm key={h.id} initial={h}
          onSave={(vals) => { updateHabit(h.id, vals); setEditing(null); }}
          onCancel={() => setEditing(null)} />
      ) : (
        <HabitRow key={h.id} h={h} onEdit={() => setEditing(h.id)}
          onDelete={() => { if (confirm(`Delete "${h.name}"?`)) deleteHabit(h.id); }} />
      ))}
      {editing === 'new' ? (
        <HabitForm onSave={(vals) => { addHabit(vals); setEditing(null); }} onCancel={() => setEditing(null)} />
      ) : (
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => setEditing('new')}>
          <Icon.plus /> Add habit
        </button>
      )}
    </Card>
  );
}

function RewardsSection({ rewards, addReward, updateReward, deleteReward }) {
  const [editing, setEditing] = useState(null);
  return (
    <Card>
      <div className="card-h">
        <div className="card-title">Your rewards</div>
        <span className="card-eyebrow num">{rewards.length}</span>
      </div>
      {rewards.length === 0 && editing !== 'new' && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px 4px' }}>No rewards yet — add one below.</div>
      )}
      {rewards.map(r => editing === r.id ? (
        <RewardForm key={r.id} initial={r}
          onSave={(vals) => { updateReward(r.id, vals); setEditing(null); }}
          onCancel={() => setEditing(null)} />
      ) : (
        <RewardRow key={r.id} r={r} onEdit={() => setEditing(r.id)}
          onDelete={() => { if (confirm(`Delete "${r.name}"?`)) deleteReward(r.id); }} />
      ))}
      {editing === 'new' ? (
        <RewardForm onSave={(vals) => { addReward(vals); setEditing(null); }} onCancel={() => setEditing(null)} />
      ) : (
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => setEditing('new')}>
          <Icon.plus /> Add reward
        </button>
      )}
    </Card>
  );
}

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

- [ ] **Step 3: Wire the route and topbar gear icon in App.jsx**

In `src/App.jsx`, add the import (next to the other screen imports):

```js
import Rewards from './screens/Rewards';
```
becomes:
```js
import Rewards from './screens/Rewards';
import Manage from './screens/Manage';
```

Add the route case — change:

```js
      case 'reward': return <Rewards store={store} />;
      default:       return <Today store={store} layout={t.homeLayout} />;
```
to:
```js
      case 'reward': return <Rewards store={store} />;
      case 'manage': return <Manage store={store} />;
      default:       return <Today store={store} layout={t.homeLayout} />;
```

Add the gear button to the topbar — change:

```js
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: 'var(--flame)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 14 }}>
              <Icon.flame /> {store.s.streak}
            </span>
            <Coins value={store.s.coins} />
          </div>
        </header>
```
to:
```js
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: 'var(--flame)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 14 }}>
              <Icon.flame /> {store.s.streak}
            </span>
            <Coins value={store.s.coins} />
            <button onClick={() => go('manage')} aria-label="Manage habits and rewards"
              style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', color: route === 'manage' ? 'var(--primary)' : 'var(--ink-2)', background: route === 'manage' ? 'var(--primary-soft)' : 'var(--card-2)' }}>
              <Icon.gear />
            </button>
          </div>
        </header>
```

- [ ] **Step 4: Add the gear icon to the desktop Sidebar**

In `src/components/Nav.jsx`, the `Sidebar` function takes `{ route, go, s, signOut }` already — change the import line:

```js
import { Icon, Coins } from './ui';
```
stays the same (already imports `Icon`).

Change the end of `Sidebar` from:

```js
      <button onClick={signOut}
        style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, padding: '9px 13px', borderRadius: 10, textAlign: 'left', width: '100%' }}>
        Sign out
      </button>
    </aside>
  );
}
```
to:
```js
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => go('manage')} aria-label="Manage habits and rewards"
          style={{ flex: '0 0 auto', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', color: route === 'manage' ? 'var(--primary)' : 'var(--ink-3)', background: route === 'manage' ? 'var(--primary-soft)' : 'var(--card-2)' }}>
          <Icon.gear />
        </button>
        <button onClick={signOut}
          style={{ flex: 1, fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, padding: '9px 13px', borderRadius: 10, textAlign: 'left' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Verify manually — desktop width**

Run:
```bash
npm run dev
```
Open the local URL at a desktop-width window (wider than 860px — the Sidebar is hidden below that). Expected:
- A small gear icon button appears in the Sidebar, next to "Sign out".
- Clicking it navigates to a "Manage your habits & rewards" screen showing "Your habits" (6 rows) and "Your rewards" (6 rows) sections.
- Clicking the pencil icon on a habit row reveals an inline form with name/area/coins; editing the name and clicking Save updates the row and the change is visible immediately.
- Going back to the Today screen confirms the renamed habit shows the new name in the daily check-in list.

- [ ] **Step 6: Verify manually — mobile width**

Resize the browser window (or use devtools device toolbar) to narrower than 860px. Expected:
- The Sidebar disappears, the bottom nav and a top bar appear.
- A gear icon button appears in the top bar, next to the streak/coin display.
- Tapping it navigates to the same Manage screen.

- [ ] **Step 7: Verify add/delete and the empty state**

In the Manage screen, click "Add reward", fill in a name and cost, click Save — confirm the new reward appears immediately in the list and on the Rewards screen's shop grid.

Then delete every reward one at a time (trash icon → confirm the browser's confirm dialog each time). Expected: once the last one is deleted, the Rewards screen shows "No rewards yet — add some in Manage." instead of an empty grid, and the Manage screen's rewards section shows "No rewards yet — add one below." Add at least one reward back before moving on, so the shop isn't left empty.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui.jsx src/screens/Manage.jsx src/App.jsx src/components/Nav.jsx
git commit -m "Add Manage screen for editing habits and rewards"
```

---

### Task 4: Final verification and deploy

**Files:** none (verification and push only)

- [ ] **Step 1: Full local smoke test**

With `npm run dev` still running, walk through: check off a habit on Today (coins increase), redeem a reward on Rewards (coins decrease), add a new habit in Manage and confirm it shows up on Today, edit an existing reward's cost in Manage and confirm the new cost shows on the Rewards screen.

- [ ] **Step 2: Push to GitHub**

This triggers Vercel's auto-redeploy on `main`.

```bash
git push origin main
```

Expected: push succeeds, no errors.

- [ ] **Step 3: Verify on the live site**

Wait about 30 seconds for Vercel to redeploy, then open `https://better-myself.vercel.app`. Log in if needed. Confirm:
- The gear icon is reachable (topbar on mobile width, Sidebar on desktop width).
- The Manage screen loads your habits/rewards (same ones you edited locally, since they're stored per-user in Supabase, not in the browser).
- Editing a habit or reward there persists after a page reload.
