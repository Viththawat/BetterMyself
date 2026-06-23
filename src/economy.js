export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function weekNum() {
  return Math.floor(Date.now() / (7 * 864e5));
}

// Combo: every streak day adds +10%, capped at +50%
export function comboPct(streak) {
  return Math.min(50, Math.max(0, streak) * 10);
}
export function comboMult(streak) {
  return 1 + comboPct(streak) / 100;
}

// One-time milestone bonuses
export const MILESTONES = [
  { day: 3,  bonus: 60  },
  { day: 7,  bonus: 150 },
  { day: 14, bonus: 350 },
  { day: 30, bonus: 800 },
];

// Weekly quests (rotate by week number)
export const QUESTS = [
  { id: 'cardio', label: '3 cardio sessions this week', track: 'exercise', target: 3, reward: 120 },
  { id: 'read',   label: 'Read on 5 days this week',    track: 'read',     target: 5, reward: 120 },
  { id: 'learn',  label: 'Log 5 lessons this week',     track: 'learn',    target: 5, reward: 120 },
  { id: 'calm',   label: 'Meditate on 4 days this week',track: 'medit',    target: 4, reward: 120 },
];

export function pickQuestId() {
  return QUESTS[weekNum() % QUESTS.length].id;
}

export function currentQuest(s) {
  return QUESTS.find(q => q.id === s.questId) || QUESTS[0];
}
