// Simple tweaks panel — no postMessage needed in a proper React app
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'compound-tweaks-v1';

const DEFAULTS = {
  theme: 'sage',
  mode: 'light',
  density: 'regular',
  homeLayout: 'focus',
  serifHeads: true,
};

export function useTweaks() {
  const [t, setT] = useState(() => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    const r = document.documentElement;
    r.dataset.theme = t.theme;
    r.dataset.mode = t.mode;
    r.dataset.density = t.density;
    r.style.setProperty('--serif', t.serifHeads ? '"Newsreader",Georgia,serif' : '"Hanken Grotesk",system-ui,sans-serif');
  }, [t]);

  const set = (key, val) => setT(p => ({ ...p, [key]: val }));
  return [t, set];
}

export function TweaksPanel({ t, set, onResetDay }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'tweaks:open')  setOpen(true);
      if (e.data?.type === 'tweaks:close') setOpen(false);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!open) return null;

  const THEMES = [{ id:'sage', color:'#3c6b4d' }, { id:'clay', color:'#b65c3a' }, { id:'indigo', color:'#4257b2' }];

  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:200, width:270, background:'var(--card)', border:'1px solid var(--line)', borderRadius:18, boxShadow:'var(--shadow-lg)', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--serif)', fontSize:18 }}>Tweaks</span>
        <button onClick={() => setOpen(false)} style={{ color:'var(--ink-3)', cursor:'pointer' }}>✕</button>
      </div>

      <Row label="Theme">
        <div style={{ display:'flex', gap:8 }}>
          {THEMES.map(th => (
            <button key={th.id} onClick={() => set('theme', th.id)}
              style={{ width:28, height:28, borderRadius:999, background:th.color, border:t.theme===th.id ? '3px solid var(--ink)' : '2px solid transparent', cursor:'pointer' }} />
          ))}
        </div>
      </Row>

      <Row label="Mode">
        <Toggle options={['light','dark']} value={t.mode} onChange={v => set('mode', v)} />
      </Row>

      <Row label="Density">
        <Toggle options={['compact','regular','roomy']} value={t.density} onChange={v => set('density', v)} />
      </Row>

      <Row label="Serif headings">
        <button onClick={() => set('serifHeads', !t.serifHeads)}
          style={{ width:42, height:24, borderRadius:999, background:t.serifHeads?'var(--primary)':'var(--line-2)', transition:'.2s', position:'relative', cursor:'pointer' }}>
          <span style={{ position:'absolute', top:2, left:t.serifHeads?18:2, width:20, height:20, borderRadius:999, background:'#fff', transition:'.2s' }} />
        </button>
      </Row>

      <Row label="Home layout">
        <Toggle options={['focus','dashboard','timeline']} value={t.homeLayout} onChange={v => set('homeLayout', v)} />
      </Row>

      <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:13 }} onClick={onResetDay}>
        Clear today's log
      </button>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
      <span style={{ fontSize:13.5, fontWeight:600, color:'var(--ink-2)' }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', border:'1px solid var(--line)', borderRadius:9, overflow:'hidden' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          style={{ padding:'5px 10px', fontSize:12, fontWeight:600, background:value===o?'var(--primary)':'transparent', color:value===o?'#fff':'var(--ink-2)', cursor:'pointer', transition:'.15s' }}>
          {o}
        </button>
      ))}
    </div>
  );
}
