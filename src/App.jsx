import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useStore } from './hooks/useStore';
import { useTweaks, TweaksPanel } from './components/TweaksPanel';
import { Sidebar, BottomNav } from './components/Nav';
import { Icon, Coins } from './components/ui';
import Auth from './components/Auth';
import Today from './screens/Today';
import Learn from './screens/Learn';
import Exercise from './screens/Exercise';
import Energy from './screens/Energy';
import Time from './screens/Time';
import Rewards from './screens/Rewards';

function Toast({ items }) {
  return (
    <div className="toast-wrap">
      {items.map(t => (
        <div key={t.id} className="toast">
          <span style={{ color: 'var(--gold)' }}><Icon.spark /></span>
          <div>
            <div>{t.msg}</div>
            {t.sub && <div style={{ fontSize: 12.5, opacity: .75, fontWeight: 500 }}>{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--ink-3)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 8 }}>Loading your day…</div>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signInWithEmail, signOut } = useAuth();
  const [t, setTweak] = useTweaks();
  const [route, setRoute] = useState(() => (location.hash || '#today').slice(1));
  const [toasts, setToasts] = useState([]);
  const store = useStore(user);

  // Wire toast
  useEffect(() => {
    store.bindToast((msg, sub) => {
      const id = Date.now() + Math.random();
      setToasts(p => [...p, { id, msg, sub }]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 2600);
    });
  }, []);

  // Hash routing
  useEffect(() => {
    const fn = () => setRoute((location.hash || '#today').slice(1));
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  const go = (id) => { location.hash = id; setRoute(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (authLoading) return <Spinner />;
  if (!user) return <Auth signInWithEmail={signInWithEmail} />;
  if (store.loading) return <Spinner />;

  const screen = (() => {
    switch (route) {
      case 'learn':  return <Learn store={store} />;
      case 'move':   return <Exercise store={store} />;
      case 'energy': return <Energy store={store} />;
      case 'time':   return <Time store={store} />;
      case 'reward': return <Rewards store={store} />;
      default:       return <Today store={store} layout={t.homeLayout} />;
    }
  })();

  const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();

  return (
    <div className="app">
      <Sidebar route={route} go={go} s={store.s} signOut={signOut} />

      <div className="main">
        <header className="topbar">
          <div className="brand" style={{ padding: 0, gap: 9 }}>
            <div className="brand-mark" style={{ width: 30, height: 30 }}><Icon.spark /></div>
            <div className="brand-name" style={{ fontSize: 17 }}>Compound</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: 'var(--flame)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 14 }}>
              <Icon.flame /> {store.s.streak}
            </span>
            <Coins value={store.s.coins} />
          </div>
        </header>

        <main className="canvas" key={route}>{screen}</main>
      </div>

      <BottomNav route={route} go={go} />
      <Toast items={toasts} />

      <TweaksPanel t={t} set={setTweak} onResetDay={store.resetDay} />
    </div>
  );
}
