import { content } from '@/content';
import { STAGES } from '@/content/site';

/** Five white pills under the How we work heading, each linking to its stage. */
export function StageRibbon() {
  return (
    <div className="rib">
      {content.how.map((stage, i) => {
        const m = STAGES[i]!;
        return (
          <a
            key={stage.name}
            className="rb"
            href={`#s${i + 1}`}
            style={{ '--c': m.accent, '--ci': m.ink } as React.CSSProperties}
          >
            <i aria-hidden="true">{String(i + 1).padStart(2, '0')}</i>
            <span>
              {stage.name}
              <small>{m.pill}</small>
            </span>
          </a>
        );
      })}
    </div>
  );
}
