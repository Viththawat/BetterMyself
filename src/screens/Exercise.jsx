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
