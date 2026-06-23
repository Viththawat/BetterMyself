import { useState } from 'react';
import { EXERCISES } from '../constants';
import { Icon, Card, Bar, Stepper, SectionHead } from '../components/ui';

function ExRow({ ex, target, done, logExercise }) {
  const [reps, setReps] = useState(done ?? target);
  const hit = done != null && done >= target;
  const pct = Math.min(100, Math.round((reps / target) * 100));
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div className="card-title">{ex.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>
            Target · <b className="num">{target} {ex.unit}</b>
          </div>
        </div>
        {hit ? <span className="tag">Done ✓</span> : <span className="card-eyebrow num">{pct}%</span>}
      </div>
      <Bar pct={pct} color={hit ? 'var(--primary)' : 'var(--gold)'} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
        <Stepper value={reps} set={setReps} step={ex.id === 'plank' ? 5 : 1} suffix={ex.unit === 'sec' ? 's' : ''} />
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
  const { s, logExercise } = store;
  return (
    <div>
      <SectionHead kicker="Body" title="Movement"
        sub="Log what you actually did. Each time you hit a target, the system nudges it up — so you're always growing." />
      <Card style={{ marginBottom: 'var(--gap)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--primary-soft)', border: 'none' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--card)', display: 'grid', placeItems: 'center', color: 'var(--primary-deep)', flex: '0 0 auto' }}><Icon.body /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Adaptive progression</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>Targets rise ~8% each time you meet them. Plank climbs in 5-second steps.</div>
        </div>
      </Card>
      <div className="grid two">
        {EXERCISES.map(ex => (
          <ExRow key={ex.id} ex={ex} target={s.exTargets[ex.id]} done={s.exDone[ex.id]} logExercise={logExercise} />
        ))}
      </div>
    </div>
  );
}
