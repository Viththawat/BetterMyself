// Sidebar (desktop) + BottomNav (mobile)
import { Icon, Coins } from './ui';

const NAV = [
  { id: 'today',  label: 'Today',   icon: 'today'  },
  { id: 'learn',  label: 'Learn',   icon: 'learn'  },
  { id: 'move',   label: 'Move',    icon: 'body'   },
  { id: 'energy', label: 'Energy',  icon: 'energy' },
  { id: 'time',   label: 'Time',    icon: 'time'   },
  { id: 'reward', label: 'Rewards', icon: 'reward' },
];

export function Sidebar({ route, go, s, signOut }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Icon.spark /></div>
        <div>
          <div className="brand-name">Compound</div>
          <div className="brand-sub">Daily self-improvement</div>
        </div>
      </div>

      {NAV.map(n => {
        const I = Icon[n.icon];
        return (
          <a key={n.id} className={`navlink ${route === n.id ? 'active' : ''}`}
            href={`#${n.id}`}
            onClick={e => { e.preventDefault(); go(n.id); }}>
            <I /> {n.label}
          </a>
        );
      })}

      <div className="nav-wallet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <span className="card-eyebrow">Wallet</span>
          <span style={{ color: 'var(--flame)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 13 }}>
            <Icon.flame /> {s.streak}d
          </span>
        </div>
        <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon.coin /> {s.coins.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => go('manage')} aria-label="Manage habits and rewards"
          style={{ flex: '0 0 auto', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', color: route === 'manage' ? 'var(--primary)' : 'var(--ink-3)', background: route === 'manage' ? 'var(--primary-soft)' : 'var(--card-2)' }}>
          <Icon.gear />
        </button>
        <button onClick={signOut}
          style={{ flex: 1, fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, padding: '9px 13px', borderRadius: 10, textAlign: 'left' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function BottomNav({ route, go }) {
  return (
    <nav className="botnav">
      {NAV.map(n => {
        const I = Icon[n.icon];
        return (
          <a key={n.id} className={route === n.id ? 'active' : ''}
            href={`#${n.id}`}
            onClick={e => { e.preventDefault(); go(n.id); }}>
            <I /> <span>{n.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
