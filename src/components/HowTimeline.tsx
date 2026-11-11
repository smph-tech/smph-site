import { GlassCard } from './GlassCard';
import { Rich } from './Rich';
import { content } from '@/content';

export function HowTimeline() {
  const labels = content.howPage.labels;
  return (
    <ol className="tl" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {content.how.map((stage, i) => (
        <li className="ts" key={stage.name}>
          <div className="b" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </div>
          <GlassCard className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <h2>{stage.name}</h2>
              <span className="tm2">
                <Rich text={stage.time} />
              </span>
            </div>
            <div className="hc">
              {(
                [
                  [labels.we, stage.we],
                  [labels.get, stage.get],
                  [labels.need, stage.need],
                ] as const
              ).map(([label, items]) => (
                <div key={label}>
                  <div className="lb">{label}</div>
                  <ul>
                    {items.map((t) => (
                      <li key={t}>
                        <Rich text={t} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </GlassCard>
        </li>
      ))}
    </ol>
  );
}
