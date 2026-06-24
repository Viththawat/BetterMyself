import { MILESTONES, QUESTS, comboPct, currentQuest } from '../economy';
import { Icon, Card, Bar, Coins, SectionHead } from '../components/ui';

function BoostStrip({ s }) {
  const pct = comboPct(s.streak);
  const nextMs = MILESTONES.find(m => !s.milestonesPaid.includes(m.day));
  const quest = currentQuest(s);
  const qFill = Math.min(100, s.questProgress / quest.target * 100);
  return (
    <div style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-eyebrow" style={{ marginBottom: 13 }}>Coin boosters · stack on top of base earnings</div>
      <div className="grid three">
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--flame)' }}><Icon.flame /></span>
            <span className="card-title" style={{ fontSize: 17 }}>Combo</span>
            <span className="num" style={{ marginLeft: 'auto', fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--flame)' }}>+{pct}%</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>Every day in a row adds <b>+10%</b> to coins you earn — up to <b>+50%</b>.</div>
          <Bar pct={Math.min(100, s.streak / 5 * 100)} color="var(--flame)" />
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{s.streak}-day streak · {pct >= 50 ? 'maxed out' : `${5 - Math.min(5, s.streak)} day${5 - Math.min(5, s.streak) === 1 ? '' : 's'} to +50%`}</div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--gold)' }}><Icon.trophy /></span>
            <span className="card-title" style={{ fontSize: 17 }}>Streak milestones</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MILESTONES.map(m => {
              const paid = s.milestonesPaid.includes(m.day);
              const isNext = nextMs?.day === m.day;
              return (
                <div key={m.day} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: paid ? .55 : 1 }}>
                  <span style={{ width: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isNext ? 'var(--primary)' : 'var(--ink-2)' }}>{m.day}d</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--card-2)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.min(100, s.streak / m.day * 100)}%`, background: paid ? 'var(--gold)' : isNext ? 'var(--primary)' : 'var(--line-2)' }} />
                  </div>
                  <span className="num" style={{ fontWeight: 700, color: paid ? 'var(--gold)' : 'var(--ink-3)', fontSize: 13.5 }}>{paid ? '✓ ' : '+'}{m.bonus}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{nextMs ? `${nextMs.day - s.streak} days to +${nextMs.bonus} coins` : 'All milestones earned'}</div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--primary)' }}><Icon.spark /></span>
            <span className="card-title" style={{ fontSize: 17 }}>Weekly quest</span>
            {s.questClaimed && <span className="tag" style={{ marginLeft: 'auto' }}>Done ✓</span>}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.4 }}>"{quest.label}"</div>
          <Bar pct={qFill} color={s.questClaimed ? 'var(--gold)' : 'var(--primary)'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }} className="num">{Math.min(s.questProgress, quest.target)} / {quest.target} done</span>
            <span className="num" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Icon.coin /> +{quest.reward}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Rewards({ store }) {
  const { s, redeem } = store;
  const rewards = s.rewards;
  const nextGoal = rewards.filter(r => r.cost > s.coins).sort((a, b) => a.cost - b.cost)[0];
  return (
    <div>
      <SectionHead kicker="Learn-2-Earn" title="Reward shop"
        sub="Every check-in, lesson, and workout earns coins. Spend them on things that make the effort feel worth it."
        right={
          <div style={{ textAlign: 'right' }}>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Your wallet</div>
            <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 34, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 9 }}><Icon.coin /> {s.coins.toLocaleString()}</div>
          </div>
        } />

      <BoostStrip s={s} />

      <Card style={{ marginBottom: 'var(--gap)', display: 'flex', gap: 16, alignItems: 'center', background: 'linear-gradient(120deg, var(--gold-soft), var(--card))' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--card)', display: 'grid', placeItems: 'center', color: 'var(--gold)', flex: '0 0 auto', boxShadow: 'var(--shadow)' }}><Icon.trophy /></div>
        <div style={{ flex: 1 }}>
          {nextGoal ? (
            <>
              <div style={{ fontWeight: 700 }}>{nextGoal.cost - s.coins} coins until "{nextGoal.name}"</div>
              <div style={{ marginTop: 8 }}><Bar pct={s.coins / nextGoal.cost * 100} color="var(--gold)" /></div>
            </>
          ) : <div style={{ fontWeight: 700 }}>You can afford everything in the shop. Treat yourself.</div>}
        </div>
      </Card>

      <div className="grid three">
        {rewards.length === 0 && (
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 4px' }}>No rewards yet — add some in Manage.</div>
        )}
        {rewards.map(r => {
          const afford = s.coins >= r.cost;
          return (
            <Card key={r.id} className="reward" style={{ opacity: afford ? 1 : .78 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="reward-ico"><Icon.reward /></div>
                <span className="tag">{r.area}</span>
              </div>
              <div>
                <div className="card-title" style={{ fontSize: 18 }}>{r.name}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4 }}>{r.note}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span className="num" style={{ fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 7 }}><Icon.coin /> {r.cost}</span>
                <button className={`btn ${afford ? 'btn-primary' : 'btn-ghost'}`} disabled={!afford} onClick={() => redeem(r)}>
                  {afford ? 'Redeem' : 'Keep going'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {s.redeemed.length > 0 && (
        <Card style={{ marginTop: 'var(--gap)' }}>
          <div className="card-h"><div className="card-title">Redeemed</div><span className="card-eyebrow num">{s.redeemed.length}</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {s.redeemed.map((r, i) => (
              <span key={i} className="chip" style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)', borderColor: 'transparent' }}>
                <Icon.trophy /> {r.name} · {r.cost}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--card-2)' }}>
        <div className="card-eyebrow" style={{ marginBottom: 14 }}>How you earn</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
          {[['Daily check-in', '+8–12'], ['Log a lesson', '+15'], ['Hit exercise target', '+20'], ['Set your mood', '+5'], ['Complete a day', 'streak +1']].map(([k, v]) => (
            <div key={k} style={{ padding: '13px 15px', borderRadius: 13, background: 'var(--card)', border: '1px solid var(--line)' }}>
              <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--gold)' }}>{v}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>{k}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
