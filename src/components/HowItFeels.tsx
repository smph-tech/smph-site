import Link from 'next/link';
import { Blob } from './Backdrop';
import { ArrowIcon } from './icons';
import { Eyebrow } from './Eyebrow';
import { Reveal } from './Reveal';
import { Rich } from './Rich';
import { ToolTiles } from './Tools';
import { content } from '@/content';
import { SERVICES, serviceHref } from '@/content/services';
import { padVars } from '@/lib/pad';

const F = content.servicesPage.feel;
type RowKey = keyof typeof F.rows;

/**
 * "Which of these sounds like your week?": the sentence the visitor says today, and what changes
 * after the fix. One row per service, in the service's own colour. Self-selection: pick your sentence.
 */
export function HowItFeels() {
  return (
    <section className="sec" style={{ background: '#0A1030' }}>
      <Blob size={520} color="#3B5BFF" opacity={0.22} pos={{ left: -160, top: 40 }} />
      <Blob size={460} color="#FF5A1F" opacity={0.16} pos={{ right: -140, bottom: 0 }} />
      <div className="wrap" style={{ ...padVars(120, 110) }}>
        <Reveal>
          <Eyebrow>{F.eyebrow}</Eyebrow>
          <h2 className="h2" style={{ margin: '24px 0 18px', maxWidth: 820 }}>
            <Rich text={F.h2} />
          </h2>
          <p className="lead" style={{ maxWidth: 600, marginBottom: 56 }}>
            {F.lead}
          </p>
          {SERVICES.map((s) => {
            const row = F.rows[s.slug as RowKey];
            return (
              <div
                className="fr"
                style={{ '--c': s.accent, '--ci': s.text } as React.CSSProperties}
                key={s.slug}
              >
                <div className="fl">
                  <div className="t">{F.today}</div>
                  <q>{row.today}</q>
                </div>
                <div className="fm" aria-hidden="true">
                  <ArrowIcon size={20} />
                </div>
                <div className="fa">
                  <div className="t">{F.after}</div>
                  <h3>{row.after}</h3>
                  <div className="row">
                    <ToolTiles names={s.tools} />
                    <Link className="lk" href={serviceHref(s.slug)}>
                      {s.name} <ArrowIcon />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
