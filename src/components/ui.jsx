// Shared UI primitives — icons, Card, Bar, Ring, Stepper, Sparkline, SectionHead, Coins
export const Icon = {
  today:  (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check:  (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 13l4 4L19 7"/></svg>,
  learn:  (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M20 18v3H6.5A2.5 2.5 0 0 1 4 18.5"/></svg>,
  body:   (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6.5 6.5h-2v11h2M17.5 6.5h2v11h-2M6.5 12h11M6.5 9v6M17.5 9v6"/></svg>,
  energy: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z"/></svg>,
  time:   (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 12l4-2M12 12V7"/></svg>,
  reward: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S11 3 8 3a2.5 2.5 0 0 0 0 5zM12 7s1-4 4-4a2.5 2.5 0 0 1 0 5z"/></svg>,
  flame:  (p) => <svg width="26" height="26" viewBox="0 0 24 24" fill="#7a3a14" {...p}><path d="M12 2c.5 3-1.5 4.5-3 6.5C7.5 10.5 7 12 7 13.5 7 17 9.2 20 12 20s5-3 5-6.5c0-2.2-1.2-3.8-2.2-5.2-.3 1.2-1 1.9-1.8 2.2.4-2.4-.4-5.2-1-6.5z"/><path d="M12 20c1.7 0 3-1.5 3-3.4 0-1.6-1-2.7-1.6-3.6-.4.9-1 1.2-1.6 1.4.3-1.6-.4-3-1-3.9-.8 1-1.8 2.4-1.8 4.3C7 17.7 9 20 12 20z" fill="#f0b04a"/></svg>,
  coin:   () => <span className="coin-dot">¢</span>,
  plus:   (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  x:      (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
  trophy: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/></svg>,
  spark:  (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>,
};

export function Coins({ value }) {
  return <span className="pill num"><Icon.coin /> {value.toLocaleString()}</span>;
}

export function Card({ className = '', children, style, pad = true }) {
  return <div className={`card ${pad ? 'pad' : ''} ${className}`} style={style}>{children}</div>;
}

export function Bar({ pct, color }) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color || 'var(--primary)' }} />
    </div>
  );
}

export function Ring({ pct, size = 78, stroke = 8, color = 'var(--primary)', label, value }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="ring-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-2)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <span className="ring-val num">{value ?? `${pct}%`}</span>
        </div>
      </div>
      {label && <div className="ring-label">{label}</div>}
    </div>
  );
}

export function Stepper({ value, set, step = 1, min = 0, max = 999, suffix }) {
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - step))}>−</button>
      <span className="val num">{value}{suffix || ''}</span>
      <button onClick={() => set(Math.min(max, value + step))}>+</button>
    </div>
  );
}

export function Sparkline({ data, w = 120, h = 34, color = 'var(--primary)' }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - (v / max) * h * 0.86 - h * 0.07,
  ]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.slice(-1).map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />)}
    </svg>
  );
}

export function SectionHead({ kicker, title, sub, right }) {
  return (
    <div className="page-head">
      <div>
        {kicker && <div className="page-kicker">{kicker}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
