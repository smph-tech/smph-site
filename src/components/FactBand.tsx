import { GlassCard } from './GlassCard';
import { Rich } from './Rich';
import { content } from '@/content';
import type { Service } from '@/content/services';

export function FactBand({ service }: { service: Service }) {
  const f = content.service.facts;
  return (
    <div className="facts3">
      <GlassCard>
        <div className="k">{f.timeline}</div>
        <div className="v">
          <Rich text={service.timeline} />
        </div>
      </GlassCard>
      <GlassCard>
        <div className="k">{f.price}</div>
        <div className="v">{f.priceValue}</div>
      </GlassCard>
      <GlassCard>
        <div className="k">{f.examples}</div>
        <div className="tags">
          {service.examples.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
