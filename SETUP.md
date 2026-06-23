# Compound — Deployment Guide
**Stack:** React 18 + Vite · Supabase (Postgres + Auth) · Vercel

---

## What you need first
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- A [GitHub](https://github.com) account
- Node.js 18+ installed on your machine

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `compound`) and a strong database password → **Create project**
3. Wait ~2 minutes for provisioning

---

## Step 2 — Run the database schema

1. In your Supabase dashboard → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this folder
3. Paste the entire contents and click **Run**

This creates 5 tables, sets up Row Level Security (each user only sees their own data), and adds a trigger that auto-creates a profile row when someone signs up.

---

## Step 3 — Get your Supabase keys

In your Supabase dashboard → **Project Settings** → **API**:

- Copy **Project URL** → this is your `VITE_SUPABASE_URL`
- Copy **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

---

## Step 4 — Configure the app locally

```bash
# In the deploy/ folder:
cp .env.example .env.local
```

Open `.env.local` and fill in your two keys:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 5 — Run locally to verify

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You should see the login screen. Enter your email → check your inbox for the magic link → click it → you're in.

---

## Step 6 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create compound-habit-tracker --public --push
# or create manually on github.com and follow the push instructions
```

---

## Step 7 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Vercel auto-detects Vite — no build settings to change
4. Before clicking **Deploy**, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy**

Your app is live. Every `git push` to `main` auto-redeploys in ~30s.

---

## Step 8 — Configure auth redirect URL

So the magic-link email redirects back to your live domain:

1. Supabase dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app
   ```
3. Also set **Site URL** to `https://your-app.vercel.app`

---

## How data flows

```
User taps on phone
      ↓
React updates instantly (optimistic UI)
      ↓
Supabase JS client writes to Postgres (~800ms debounce)
      ↓
Same data appears on any other device immediately
```

All data is per-user via Row Level Security — nobody can read anyone else's rows.

---

## Folder structure

```
deploy/
├── index.html              Entry point
├── vite.config.js          Vite config
├── package.json            Dependencies
├── .env.example            Copy this to .env.local
├── supabase/
│   └── schema.sql          Run this in Supabase SQL editor
└── src/
    ├── main.jsx            React root
    ├── App.jsx             Shell + routing + auth gate
    ├── styles.css          Design tokens + layout
    ├── constants.js        Static data (habits, rewards, etc.)
    ├── economy.js          Coin math (combo, milestones, quests)
    ├── lib/
    │   └── supabase.js     Supabase client (reads env vars)
    ├── hooks/
    │   ├── useStore.js     All app state + Supabase sync
    │   └── useAuth.js      Auth state + magic link
    ├── components/
    │   ├── ui.jsx          Icons, Card, Ring, Bar, Stepper…
    │   ├── Auth.jsx        Login screen
    │   ├── Nav.jsx         Sidebar + bottom nav
    │   └── TweaksPanel.jsx Theme / density / layout controls
    └── screens/
        ├── Today.jsx       Home (3 layouts)
        ├── Learn.jsx       Daily lessons log
        ├── Exercise.jsx    Movement + progressive overload
        ├── Energy.jsx      Activity planner + kcal estimate
        ├── Time.jsx        24-hour breakdown
        └── Rewards.jsx     Coin shop + boosters
```

---

## Common issues

| Problem | Fix |
|---|---|
| Magic link redirects to localhost on production | Add your Vercel URL to Supabase → Auth → Redirect URLs |
| `Missing VITE_SUPABASE_URL` error | Add env vars in Vercel project settings |
| Data doesn't load after login | Check Supabase SQL editor for schema errors; re-run schema.sql |
| Row Level Security blocking reads | Make sure you ran the full schema.sql including the `create policy` lines |
