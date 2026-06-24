import { areaProgress } from '../hooks/useStore';
import { AREAS, MOODS } from '../constants';
import { comboPct } from '../economy';
import { Icon, Card, Bar, Ring, Coins, Sparkline, SectionHead } from '../components/ui';

function HeroStreak({ s }) {
  return (
    <div className="hero">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="flame-badge"><Icon.flame /></div>
        <div>
          <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .82, fontWeight: 600 }}>Current streak</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span className="streak-num num">{s.streak}</span>
            <span style={{ fontSize: 17, opacity: .9 }}>days</span>
            {comboPct(s.streak) > 0 && (
              <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.18)' }}>
                +{comboPct(s.streak)}% combo
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 26, marginTop: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, opacity: .78, fontWeight: 600 }}>Best streak</div>
          <div className="num" style={{ fontSize: 22, fontFamily: 'var(--serif)' }}>{s.bestStreak} days</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,.25)' }} />
        <div>
          <div style={{ fontSize: 12, opacity: .78, fontWeight: 600 }}>Wallet</div>
          <div className="num" style={{ fontSize: 22, fontFamily: 'var(--serif)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.coin /> {s.coins.toLocaleString()}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', textAlign: 'right', minWidth: 130 }}>
          <div style={{ fontSize: 12, opacity: .78, fontWeight: 600, marginBottom: 6 }}>Last 7 days</div>
          <Sparkline data={s.history} color="rgba(255,255,255,.92)" w={130} h={34} />
        </div>
      </div>
    </div>
  );
}

function MomentumNote({ s }) {
  const acts = Object.values(s.checks).filter(Boolean).length + (s.mood ? 1 : 0) + s.learned.length + Object.keys(s.exDone).length;
  const left = Math.max(0, 4 - acts);
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary-deep)', flex: '0 0 auto' }}><Icon.spark /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {left > 0 ? `${left} more action${left > 1 ? 's' : ''} to lock in today` : 'Today is locked in — beautifully done.'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>
            {left > 0 ? 'Small steps keep the streak alive. No pressure.' : 'Every bit of effort compounds. Rest easy.'}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MoodPicker({ s, setMood }) {
  return (
    <Card>
      <div className="card-h">
        <div className="card-title">How are you feeling?</div>
        {s.mood && <span className="card-eyebrow">{MOODS.find(m => m.id === s.mood)?.label}</span>}
      </div>
      <div className="mood-row">
        {MOODS.map(m => (
          <button key={m.id} className={`mood ${s.mood === m.id ? 'sel' : ''}`} onClick={() => setMood(m.id)}>
            <span className="mood-dot" style={{ background: m.color }} />
            <span className="mood-label">{m.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

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
        const on = !!s.checks[h.id];
        const area = AREAS.find(a => a.id === h.area);
        return (
          <div key={h.id} className={`habit ${on ? 'done' : ''}`}>
            <button className={`check ${on ? 'on' : ''}`} onClick={() => toggleHabit(h)}><Icon.check /></button>
            <div style={{ flex: 1 }}>
              <div className="habit-name">{h.name}</div>
              <div className="habit-area">{area?.name} · {area?.tag}</div>
            </div>
            <span className="pill num" style={{ fontSize: 13, color: on ? 'var(--gold)' : 'var(--ink-3)' }}><Icon.coin /> {h.coins}</span>
          </div>
        );
      })}
    </Card>
  );
}

function AreaRings({ s, columns = 5 }) {
  const prog = areaProgress(s);
  return (
    <Card>
      <div className="card-h"><div className="card-title">Life areas</div><span className="card-eyebrow">Today's balance</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 14 }}>
        {AREAS.map(a => <Ring key={a.id} pct={prog[a.id]} size={74} stroke={7} label={a.name} value={`${prog[a.id]}%`} />)}
      </div>
    </Card>
  );
}

function MiniStat({ label, value, sub, icon, accent }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-eyebrow">{label}</span>
        <span style={{ color: accent || 'var(--primary)' }}>{icon}</span>
      </div>
      <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{sub}</div>}
    </Card>
  );
}

function FocusLayout({ store }) {
  const { s, toggleHabit, setMood } = store;
  return (
    <>
      <HeroStreak s={s} />
      <div style={{ height: 'var(--gap)' }} />
      <MomentumNote s={s} />
      <div style={{ height: 'var(--gap)' }} />
      <div className="grid two">
        <HabitList s={s} toggleHabit={toggleHabit} />
        <div className="grid" style={{ alignContent: 'start' }}>
          <MoodPicker s={s} setMood={setMood} />
          <AreaRings s={s} columns={3} />
        </div>
      </div>
    </>
  );
}

function DashboardLayout({ store }) {
  const { s, toggleHabit, setMood } = store;
  const prog = areaProgress(s);
  const avg = Math.round(AREAS.reduce((a, b) => a + prog[b.id], 0) / AREAS.length);
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <MiniStat label="Streak" value={`${s.streak}d`} sub={`Best ${s.bestStreak}`} icon={<Icon.flame />} accent="var(--flame)" />
        <MiniStat label="Wallet" value={s.coins.toLocaleString()} sub="coins" icon={<Icon.coin />} accent="var(--gold)" />
        <MiniStat label="Day balance" value={`${avg}%`} sub="5 areas" icon={<Icon.spark />} />
        <MiniStat label="Lessons" value={s.learned.length} sub="today" icon={<Icon.learn />} />
      </div>
      <div style={{ height: 'var(--gap)' }} />
      <div className="grid two">
        <HabitList s={s} toggleHabit={toggleHabit} />
        <AreaRings s={s} columns={3} />
      </div>
      <div style={{ height: 'var(--gap)' }} />
      <MoodPicker s={s} setMood={setMood} />
    </>
  );
}

function TimelineLayout({ store }) {
  const { s, toggleHabit, setMood } = store;
  const steps = [
    { k: 'Wake', node: <MoodPicker s={s} setMood={setMood} /> },
    { k: 'Through the day', node: <HabitList s={s} toggleHabit={toggleHabit} /> },
    { k: 'Reflect', node: <AreaRings s={s} columns={5} /> },
  ];
  return (
    <>
      <HeroStreak s={s} />
      <div style={{ height: 'var(--gap)' }} />
      <div style={{ position: 'relative', paddingLeft: 30 }}>
        <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: 'var(--line-2)' }} />
        {steps.map((st, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 'var(--gap)' }}>
            <div style={{ position: 'absolute', left: -30, top: 4, width: 20, height: 20, borderRadius: 999, background: 'var(--card)', border: '2px solid var(--primary)', display: 'grid', placeItems: 'center' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--primary)' }} />
            </div>
            <div className="page-kicker" style={{ marginBottom: 8 }}>{st.k}</div>
            {st.node}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Today({ store, layout }) {
  const map = { focus: FocusLayout, dashboard: DashboardLayout, timeline: TimelineLayout };
  const Comp = map[layout] || FocusLayout;
  const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();
  return (
    <div>
      <SectionHead kicker={greet} title="Today" sub="A calm record of who you're becoming — one small action at a time." />
      <Comp store={store} />
    </div>
  );
}
