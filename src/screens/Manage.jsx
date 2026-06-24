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
