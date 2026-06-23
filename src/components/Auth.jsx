// Auth screen — magic link (passwordless) login
import { useState } from 'react';

export default function Auth({ signInWithEmail }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signInWithEmail(email);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:38 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'var(--primary)', display:'grid', placeItems:'center', color:'#fff', fontSize:20 }}>✦</div>
          <div>
            <div style={{ fontFamily:'var(--serif)', fontSize:24 }}>Compound</div>
            <div style={{ fontSize:12, letterSpacing:'.13em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:600 }}>Daily self-improvement</div>
          </div>
        </div>

        {sent ? (
          <div style={{ background:'var(--primary-soft)', borderRadius:'var(--r)', padding:28 }}>
            <div style={{ fontFamily:'var(--serif)', fontSize:22, marginBottom:10 }}>Check your email</div>
            <p style={{ color:'var(--ink-2)', lineHeight:1.55, fontSize:15 }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <div style={{ fontFamily:'var(--serif)', fontSize:28, marginBottom:8 }}>Welcome back</div>
              <p style={{ color:'var(--ink-2)', fontSize:15 }}>Enter your email and we'll send a magic link.</p>
            </div>
            <input
              className="field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <div style={{ fontSize:13.5, color:'var(--fleeting)' }}>{error}</div>}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !email}
              style={{ justifyContent:'center' }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
            <p style={{ fontSize:12.5, color:'var(--ink-3)', textAlign:'center', lineHeight:1.5 }}>
              First time here? Just enter your email — your account is created automatically.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
