import { useState } from 'react';
import { Icon, Card, Coins, SectionHead } from '../components/ui';

export default function Learn({ store }) {
  const { s, addLearning, removeLearning } = store;
  const [text, setText] = useState('');
  const submit = () => { if (text.trim()) { addLearning(text); setText(''); } };
  return (
    <div>
      <SectionHead kicker="Mind" title="What did you learn today?"
        sub="One sentence is enough. Naming what you learned makes it stick — and feeds your Mind area." />
      <div className="grid two">
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card>
            <div className="card-h"><div className="card-title">Capture a lesson</div><Coins value={15} /></div>
            <textarea className="field" rows="3" placeholder="Today I learned…"
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(); }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>⌘↵ to save · earns 15 coins</span>
              <button className="btn btn-primary" onClick={submit} disabled={!text.trim()}><Icon.plus /> Log it</button>
            </div>
          </Card>
          <Card style={{ background: 'var(--card-2)' }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>Gentle prompts</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {['A new word', 'Something at work', 'A fact about the world', 'A mistake I made', 'A skill that improved'].map(p => (
                <button key={p} className="chip" onClick={() => setText(p + ': ')}>{p}</button>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <div className="card-h">
            <div className="card-title">Today's lessons</div>
            <span className="card-eyebrow num">{s.learned.length} logged</span>
          </div>
          {s.learned.length === 0 ? (
            <div style={{ padding: '34px 10px', textAlign: 'center', color: 'var(--ink-3)' }}>
              <div style={{ marginBottom: 8, opacity: .6 }}><Icon.learn /></div>
              Nothing yet today. What's one thing you picked up?
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.learned.map(l => (
                <div key={l.ts} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 13, background: 'var(--card-2)', border: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2, flex: '0 0 auto' }}><Icon.spark /></span>
                  <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.45 }}>{l.text}</span>
                  <button className="check" style={{ width: 26, height: 26, border: 'none', background: 'transparent', color: 'var(--ink-3)' }} onClick={() => removeLearning(l.ts)}><Icon.x /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
