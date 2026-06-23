import { TIME_CATS } from '../constants';
import { Icon, Card, Bar, Ring, Stepper, SectionHead } from '../components/ui';

export default function Time({ store }) {
  const { s, setTime } = store;
  const total = TIME_CATS.reduce((a, c) => a + (s.time[c.id] || 0), 0);
  const sum = (type) => TIME_CATS.filter(c => c.type === type).reduce((a, c) => a + (s.time[c.id] || 0), 0);
  const fleeting = sum('fleeting'), longterm = sum('longterm'), rest = sum('rest'), neutral = sum('neutral');
  const ratio = longterm + fleeting > 0 ? Math.round(longterm / (longterm + fleeting) * 100) : 50;
  const over = total > 24;
  const msg = ratio >= 65
    ? 'You\'re investing in future-you. This is how compounding feels.'
    : ratio >= 45 ? 'A fair balance. A little more toward long-term joys tips the scale.'
    : 'Lots of quick hits today. No judgment — maybe trade one scroll for one chapter tomorrow.';

  return (
    <div>
      <SectionHead kicker="Reflection" title="Where did 24 hours go?"
        sub="Adjust the hours to match your real day. Then see how fleeting pleasures stack up against the long-term kind." />
      <Card style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-h">
          <div className="card-title">Fleeting vs long-term</div>
          <span className="card-eyebrow num" style={{ color: over ? 'var(--fleeting)' : 'var(--ink-3)' }}>{total} / 24 h{over ? ' · over' : ''}</span>
        </div>
        <div className="tline">
          <span style={{ width: `${longterm / 24 * 100}%`, background: 'var(--longterm)' }} />
          <span style={{ width: `${fleeting / 24 * 100}%`, background: 'var(--fleeting)' }} />
          <span style={{ width: `${rest / 24 * 100}%`, background: '#8c84d6' }} />
          <span style={{ width: `${neutral / 24 * 100}%`, background: '#a89d86' }} />
        </div>
        <div className="legend">
          {[['var(--longterm)', `Long-term ${longterm}h`], ['var(--fleeting)', `Fleeting ${fleeting}h`], ['#8c84d6', `Rest ${rest}h`], ['#a89d86', `Other ${neutral}h`]].map(([c, l]) => (
            <span key={l} className="legend-item"><span className="swatch" style={{ background: c }} />{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, flexWrap: 'wrap' }}>
          <Ring pct={ratio} size={92} stroke={9} value={`${ratio}%`} label="Long-term share" />
          <p style={{ flex: 1, minWidth: 220, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>{msg}</p>
        </div>
      </Card>
      <div className="grid two">
        {['longterm', 'fleeting', 'rest', 'neutral'].map(type => {
          const cats = TIME_CATS.filter(c => c.type === type);
          const label = { longterm: 'Long-term pleasures', fleeting: 'Fleeting pleasures', rest: 'Rest', neutral: 'Life & upkeep' }[type];
          return (
            <Card key={type}>
              <div className="card-eyebrow" style={{ marginBottom: 14 }}>{label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {cats.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <span className="swatch" style={{ background: c.color, width: 11, height: 11 }} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>{c.name}</span>
                    <Stepper value={s.time[c.id] || 0} set={v => setTime(c.id, v)} step={1} min={0} max={24} suffix="h" />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
