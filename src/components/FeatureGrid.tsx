import { GlassCard } from './GlassCard';
import { TickPlain } from './icons';

/** "What we build" bento: the first two cards are wide when there are five. */
export function FeatureGrid({ items }: { items: readonly { title: string; text: string }[] }) {
  return (
    <div className="feat">
      {items.map((b, i) => (
        <GlassCard className={`fc${items.length === 5 && i < 2 ? ' w' : ''}`} key={b.title}>
          <div className="ck">
            <TickPlain />
          </div>
          <h3>{b.title}</h3>
          <p>{b.text}</p>
        </GlassCard>
      ))}
    </div>
  );
}
