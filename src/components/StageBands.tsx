import { Reveal } from './Reveal';
import { Rich } from './Rich';
import { content } from '@/content';
import { STAGES } from '@/content/site';

const L = content.howPage.labels;

/** Five full-width stage bands, each in its own colour and tint. */
export function StageBands() {
  return (
    <>
      {content.how.map((stage, i) => {
        const m = STAGES[i]!;
        const n = String(i + 1).padStart(2, '0');
        return (
          <section
            key={stage.name}
            id={`s${i + 1}`}
            className="stg2"
            style={{ '--c': m.accent, '--ci': m.ink, '--t': m.tint } as React.CSSProperties}
          >
            <div className="wrap">
              <div className="gr">
                <div className="lft">
                  {/* The faded numeral is drawn by CSS (data-n), so it is not text for contrast checks or screen readers */}
                  <div className="big" data-n={n} aria-hidden="true" />
                  <h2>{stage.name}</h2>
                  <span className="fe">
                    {content.howPage.feelPrefix} {m.feeling}
                  </span>
                  <p className="pr">{m.promise}</p>
                </div>
                <Reveal className="sc3">
                  {(
                    [
                      [L.we, stage.we],
                      [L.get, stage.get],
                      [L.need, stage.need],
                    ] as const
                  ).map(([label, items]) => (
                    <div className="sbox" key={label}>
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
                </Reveal>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
