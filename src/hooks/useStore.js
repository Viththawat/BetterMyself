import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { todayKey, weekNum, comboPct, comboMult, MILESTONES, currentQuest, pickQuestId } from '../economy';
import { DEFAULT_HABITS, DEFAULT_REWARDS, AREAS, ACTIVITIES } from '../constants';

const DEFAULT_EX_TARGETS = { pushups: 24, squats: 30, plank: 55, lunges: 20 };
const DEFAULT_TIME = { sleep: 7, work: 5, exercise: 1, reading: 1, scroll: 3, gaming: 1, tv: 1, chores: 5 };

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

export function areaProgress(s) {
  const out = {};
  AREAS.forEach(a => {
    const hs = s.habits.filter(h => h.area === a.id);
    let pct = hs.filter(h => s.checks[h.id]).length / Math.max(1, hs.length);
    if (a.id === 'mind') pct = Math.min(1, pct + Math.min(0.5, s.learned.length * 0.18));
    if (a.id === 'body') pct = Math.min(1, pct + Math.min(0.5, Object.keys(s.exDone).length * 0.14));
    if (a.id === 'calm' && s.mood) pct = Math.min(1, pct + 0.12);
    out[a.id] = Math.round(pct * 100);
  });
  return out;
}

export function useStore(user) {
  const [s, setS] = useState(seedState);
  const [loading, setLoading] = useState(true);
  const toastFn = useRef(null);
  const syncTimer = useRef(null);

  const toast = (msg, sub) => toastFn.current?.(msg, sub);
  const bindToast = (fn) => { toastFn.current = fn; };

  // Load all user data from Supabase on login
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadData(user.id).then(data => { setS(data); setLoading(false); });
  }, [user?.id]);

  // Debounced sync: profile + daily log written ~800ms after last mutation
  const scheduleSync = useCallback((next) => {
    if (!user) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => syncData(user.id, next), 800);
  }, [user?.id]);

  const maybeBumpStreak = (next) => {
    const acts = Object.values(next.checks).filter(Boolean).length
      + (next.mood ? 1 : 0) + next.learned.length + Object.keys(next.exDone).length;
    if (acts >= 4 && !next.streakBumped) {
      next.streak += 1;
      next.bestStreak = Math.max(next.bestStreak, next.streak);
      next.streakBumped = true;
      next.history = [...next.history.slice(-6), acts];
      setTimeout(() => toast('Day complete — streak +1!', `🔥 ${next.streak} day streak · combo +${comboPct(next.streak)}%`), 60);
      const ms = MILESTONES.find(m => m.day === next.streak);
      if (ms && !next.milestonesPaid.includes(ms.day)) {
        next.milestonesPaid = [...next.milestonesPaid, ms.day];
        next.coins += ms.bonus;
        setTimeout(() => toast(`🏆 ${ms.day}-day milestone!`, `+${ms.bonus} bonus coins`), 240);
      }
    }
    return next;
  };

  const trackQuest = (next, eventKey) => {
    const q = currentQuest(next);
    if (!q || next.questClaimed || q.track !== eventKey) return next;
    next.questProgress += 1;
    if (next.questProgress >= q.target) {
      next.questClaimed = true;
      next.coins += q.reward;
      setTimeout(() => toast('Weekly quest complete!', `${q.label} · +${q.reward} coins`), 120);
    }
    return next;
  };

  const toggleHabit = useCallback((h) => setS(p => {
    const on = !p.checks[h.id];
    const gain = Math.round(h.coins * comboMult(p.streak));
    const pct = comboPct(p.streak);
    let next = { ...p, checks: { ...p.checks, [h.id]: on }, coins: p.coins + (on ? gain : -gain) };
    if (on) {
      next = trackQuest(next, h.id);
      setTimeout(() => toast(`Nice — ${h.name}`, pct > 0 ? `+${gain} coins (+${pct}% combo)` : `+${gain} coins`), 0);
    }
    next = maybeBumpStreak(next);
    scheduleSync(next);
    return next;
  }), [scheduleSync]);

  const setMood = useCallback((m) => setS(p => {
    const first = p.mood == null;
    const gain = first ? Math.round(5 * comboMult(p.streak)) : 0;
    let next = { ...p, mood: m, coins: p.coins + gain };
    next = maybeBumpStreak(next);
    scheduleSync(next);
    return next;
  }), [scheduleSync]);

  const addLearning = useCallback((text) => setS(p => {
    if (!text.trim()) return p;
    const gain = Math.round(15 * comboMult(p.streak));
    const pct = comboPct(p.streak);
    const entry = { text: text.trim(), ts: Date.now() };
    let next = { ...p, learned: [entry, ...p.learned], coins: p.coins + gain };
    next = trackQuest(next, 'learn');
    setTimeout(() => toast('Logged a lesson', pct > 0 ? `+${gain} coins (+${pct}% combo)` : `+${gain} coins`), 0);
    if (user) supabase.from('learned_entries').insert({ user_id: user.id, date: todayKey(), text: text.trim() });
    next = maybeBumpStreak(next);
    scheduleSync(next);
    return next;
  }), [user?.id, scheduleSync]);

  const removeLearning = useCallback((ts) => setS(p => {
    const entry = p.learned.find(l => l.ts === ts);
    if (user && entry) supabase.from('learned_entries').delete().eq('user_id', user.id).eq('date', todayKey()).eq('text', entry.text);
    return { ...p, learned: p.learned.filter(l => l.ts !== ts) };
  }), [user?.id]);

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

  const addActivity = useCallback((actId, mins) => setS(p => {
    const a = ACTIVITIES.find(x => x.id === actId);
    const kcal = Math.round(a.rate * mins);
    const next = { ...p, energyPlan: [...p.energyPlan, { actId, mins, kcal, key: Date.now() }] };
    scheduleSync(next);
    return next;
  }), [scheduleSync]);

  const removeActivity = useCallback((key) => setS(p => {
    const next = { ...p, energyPlan: p.energyPlan.filter(a => a.key !== key) };
    scheduleSync(next);
    return next;
  }), [scheduleSync]);

  const setTime = useCallback((catId, hours) => setS(p => {
    const next = { ...p, time: { ...p.time, [catId]: Math.max(0, hours) } };
    scheduleSync(next);
    return next;
  }), [scheduleSync]);

  const redeem = useCallback((r) => setS(p => {
    if (p.coins < r.cost) { setTimeout(() => toast('Not enough coins yet', 'Keep your streak going'), 0); return p; }
    if (user) supabase.from('redeemed_rewards').insert({ user_id: user.id, reward_id: r.id, reward_name: r.name, cost: r.cost });
    setTimeout(() => toast(`Redeemed: ${r.name}`, `−${r.cost} coins · enjoy it`), 0);
    const next = { ...p, coins: p.coins - r.cost, redeemed: [{ id: r.id, name: r.name, cost: r.cost, ts: Date.now() }, ...p.redeemed] };
    scheduleSync(next);
    return next;
  }), [user?.id, scheduleSync]);

  const resetDay = useCallback(() => setS(p => {
    const next = {
      ...seedState(),
      coins: p.coins, streak: p.streak, bestStreak: p.bestStreak,
      exTargets: p.exTargets, history: p.history, redeemed: p.redeemed,
      milestonesPaid: p.milestonesPaid, week: p.week,
      questId: p.questId, questProgress: p.questProgress, questClaimed: p.questClaimed,
    };
    scheduleSync(next);
    return next;
  }), [scheduleSync]);

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

  return { s, loading, bindToast, toast, toggleHabit, setMood, addLearning, removeLearning, logExercise, addActivity, removeActivity, setTime, redeem, resetDay, addHabit, updateHabit, deleteHabit, addReward, updateReward, deleteReward };
}

// ── Supabase data loader ──────────────────────────────────────
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
  const d = dailyRes.data || {};
  const isNewDay = p.last_active_date && p.last_active_date !== today;
  const sameWeek = (p.week_num ?? -1) === weekNum();

  if (p.last_active_date && isNewDay) {
    await supabase.from('profiles').update({ last_active_date: today }).eq('id', userId);
  }

  return {
    coins:          p.coins          ?? 480,
    streak:         p.streak         ?? 0,
    bestStreak:     p.best_streak    ?? 0,
    exTargets:      p.ex_targets     ?? DEFAULT_EX_TARGETS,
    milestonesPaid: p.milestones_paid ?? [],
    history:        p.history        ?? [3, 4, 2, 5, 4, 5, 6],
    week:           weekNum(),
    questId:        sameWeek ? (p.quest_id ?? pickQuestId()) : pickQuestId(),
    questProgress:  sameWeek ? (p.quest_progress ?? 0) : 0,
    questClaimed:   sameWeek ? (p.quest_claimed  ?? false) : false,
    day:            today,
    // daily — reset if new day
    checks:         isNewDay ? {} : (d.checks        ?? {}),
    mood:           isNewDay ? null : (d.mood         ?? null),
    energyGoal:     d.energy_goal ?? 480,
    energyPlan:     isNewDay ? [] : (d.energy_plan   ?? []),
    time:           isNewDay ? { ...DEFAULT_TIME } : (d.time_allocation ?? { ...DEFAULT_TIME }),
    streakBumped:   isNewDay ? false : (d.streak_bumped ?? false),
    learned:        isNewDay ? [] : (learnRes.data || []).map(l => ({ text: l.text, ts: new Date(l.created_at).getTime() })),
    exDone:         isNewDay ? {} : Object.fromEntries((exRes.data || []).map(e => [e.exercise_id, e.reps_done])),
    redeemed:       (redRes.data || []).map(r => ({ id: r.reward_id, name: r.reward_name, cost: r.cost, ts: new Date(r.redeemed_at).getTime() })),
    habits,
    rewards,
  };
}

// ── Supabase writer ───────────────────────────────────────────
async function syncData(userId, s) {
  const today = todayKey();
  await Promise.all([
    supabase.from('profiles').upsert({
      id: userId, coins: s.coins, streak: s.streak, best_streak: s.bestStreak,
      ex_targets: s.exTargets, milestones_paid: s.milestonesPaid, history: s.history,
      week_num: s.week, quest_id: s.questId, quest_progress: s.questProgress,
      quest_claimed: s.questClaimed, last_active_date: today, updated_at: new Date().toISOString(),
    }),
    supabase.from('daily_logs').upsert({
      user_id: userId, date: today, checks: s.checks, mood: s.mood,
      energy_goal: s.energyGoal, energy_plan: s.energyPlan,
      time_allocation: s.time, streak_bumped: s.streakBumped,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' }),
  ]);
}
