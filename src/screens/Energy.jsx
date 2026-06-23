import { useState } from 'react';
import { ACTIVITIES } from '../constants';
import { Icon, Card, Bar, Stepper, SectionHead } from '../components/ui';

export default function Energy({ store }) {
  const { s, addActivity, removeActivity } = store;
  const [actId, setActId] = useState(ACTIVITIES[0].id);
  const [mins, setMins] = useState(30);
  const planned = s.energyPlan.reduce((a, b) => a + b.kcal, 0);
  const goal = s.energyGoal;
  const pct = Math.round((planned / goal) * 100);
  const act = ACTIVITIES.find(a => a.id === actId);
  return (
    <div>
      <SectionHead kicker="Body · Fuel" title="Energy budget"
        sub="Plan your activities and we'll estimate the burn — a target to aim for, not a rule." />
      <div className="grid two">
        <Card>
          <div className="card-h"><div className="card-title">Plan an activity</div></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 16 }}>
            {ACTIVITIES.map(a => (
              <button key={a.id} className={`chip ${actId === a.id ? 'sel' : ''}`} onClick={() => setActId(a.id)}>{a.name}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div className="card-eyebrow" style={{ marginBottom: 8 }}>Duration</div>
              <Stepper value={mins} set={setMins} step={5} min={5} max={240} suffix=" min" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="card-eyebrow" style={{ marginBottom: 6 }}>Estimated burn</div>
              <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--flame)' }}>≈ {Math.round(act.rate * mins)} kcal</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={() => addActivity(actId, mins)}>
            <Icon.plus /> Add to today's plan
          </button>
        </Card>
        <Card>
          <div className="card-h">
            <div className="card-title">Today's plan</div>
            <span className="card-eyebrow num">Goal {goal} kcal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span className="num" style={{ fontFamily: 'var(--serif)', fontSize: 40, color: 'var(--primary)' }}>{planned}</span>
            <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>/ {goal} kcal</span>
          </div>
          <Bar pct={pct} color={pct >= 100 ? 'var(--primary)' : 'var(--gold)'} />
          <div style={{ fontSize: 13.5, color: pct >= 100 ? 'var(--primary-deep)' : 'var(--ink-2)', marginTop: 10 }}>
            {pct >= 100 ? "You've planned a full, active day." : `About ${goal - planned} kcal to reach your goal.`}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.energyPlan.length === 0 && <div style={{ color: 'var(--ink-3)', fontSize: 14, padding: '10px 0' }}>No activities planned yet.</div>}
            {s.energyPlan.map(p => {
              const a = ACTIVITIES.find(x => x.id === p.actId);
              return (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px', borderRadius: 12, background: 'var(--card-2)', border: '1px solid var(--line)' }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>{a.name} <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>· {p.mins} min</span></span>
                  <span className="num" style={{ color: 'var(--flame)', fontWeight: 700 }}>{p.kcal} kcal</span>
                  <button className="check" style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'var(--ink-3)' }} onClick={() => removeActivity(p.key)}><Icon.x /></button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
