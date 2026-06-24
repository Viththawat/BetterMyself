export const AREAS = [
  { id: 'mind',  name: 'Mind',  tag: 'Learning' },
  { id: 'body',  name: 'Body',  tag: 'Fitness' },
  { id: 'calm',  name: 'Calm',  tag: 'Mindfulness' },
  { id: 'rest',  name: 'Rest',  tag: 'Sleep' },
  { id: 'fuel',  name: 'Fuel',  tag: 'Nutrition' },
];

export const DEFAULT_HABITS = [
  { id: 'read',    name: 'Read 20 minutes',      area: 'mind', coins: 10 },
  { id: 'move',    name: 'Move your body',        area: 'body', coins: 10 },
  { id: 'medit',   name: 'Meditate 10 minutes',   area: 'calm', coins: 10 },
  { id: 'water',   name: 'Drink 2L of water',     area: 'fuel', coins: 8  },
  { id: 'sleep',   name: 'Lights out by 11pm',    area: 'rest', coins: 12 },
  { id: 'journal', name: 'Journal one line',      area: 'calm', coins: 8  },
];

export const MOODS = [
  { id: 1, label: 'Rough', color: '#b15c4d' },
  { id: 2, label: 'Low',   color: '#c98a4b' },
  { id: 3, label: 'Okay',  color: '#c7b24a' },
  { id: 4, label: 'Good',  color: '#74a25a' },
  { id: 5, label: 'Great', color: '#3c8a5e' },
];

// kcal-per-minute estimates (rough MET-style)
export const ACTIVITIES = [
  { id: 'run',   name: 'Running',  rate: 11 },
  { id: 'walk',  name: 'Walking',  rate: 4  },
  { id: 'cycle', name: 'Cycling',  rate: 8  },
  { id: 'lift',  name: 'Strength', rate: 6  },
  { id: 'yoga',  name: 'Yoga',     rate: 3  },
  { id: 'swim',  name: 'Swimming', rate: 9  },
];

export const TIME_CATS = [
  { id: 'sleep',    name: 'Sleep',          type: 'rest',     color: '#8c84d6' },
  { id: 'work',     name: 'Work / Study',   type: 'longterm', color: 'var(--longterm)' },
  { id: 'exercise', name: 'Exercise',       type: 'longterm', color: '#5aa172' },
  { id: 'reading',  name: 'Reading',        type: 'longterm', color: '#7cb78f' },
  { id: 'scroll',   name: 'Scrolling',      type: 'fleeting', color: 'var(--fleeting)' },
  { id: 'gaming',   name: 'Gaming',         type: 'fleeting', color: '#d08a6f' },
  { id: 'tv',       name: 'TV / streaming', type: 'fleeting', color: '#e0a98f' },
  { id: 'chores',   name: 'Life & chores',  type: 'neutral',  color: '#a89d86' },
];

export const DEFAULT_REWARDS = [
  { id: 'coffee',  name: 'Specialty coffee',    note: 'A small daily ritual',       cost: 180,  area: 'Treat'   },
  { id: 'movie',   name: 'Movie night',         note: 'Popcorn included',           cost: 420,  area: 'Leisure' },
  { id: 'book',    name: 'A new book',          note: 'Feed the Mind area',         cost: 650,  area: 'Mind'    },
  { id: 'restday', name: 'Guilt-free rest day', note: 'Permission to do nothing',   cost: 540,  area: 'Rest'    },
  { id: 'gear',    name: 'New workout gear',    note: 'Earned through sweat',       cost: 950,  area: 'Body'    },
  { id: 'splurge', name: 'Big splurge fund',    note: 'Save up for something real', cost: 1800, area: 'Goal'    },
];

export const EXERCISES = [
  { id: 'pushups', name: 'Push-ups', unit: 'reps' },
  { id: 'squats',  name: 'Squats',   unit: 'reps' },
  { id: 'plank',   name: 'Plank',    unit: 'sec'  },
  { id: 'lunges',  name: 'Lunges',   unit: 'reps' },
];

export const AREA_ICON = { mind: 'learn', body: 'body', calm: 'time', rest: 'today', fuel: 'energy' };
