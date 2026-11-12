import { Blob } from '@/components/Backdrop';
import { CtaBand } from '@/components/CtaBand';
import { Eyebrow } from '@/components/Eyebrow';
import { TickPlain } from '@/components/icons';
import { Journey } from '@/components/Journey';
import { Reveal } from '@/components/Reveal';
import { Rich } from '@/components/Rich';
import { StageBands } from '@/components/StageBands';
import { StageRibbon } from '@/components/StageRibbon';
import { content } from '@/content';
import { pageMetadata } from '@/lib/seo';
import { padVars } from '@/lib/pad';

const H = content.howPage;
/** Number-badge colours for the first-call steps and the working terms. */
// Darker shades of the stage colours so the white numbers pass AA contrast.
const FIRST_CALL = ['#bf4317', '#3962e6', '#0b7c56'];
const TERMS = ['#3962e6', '#0b7c56', '#774af5', '#bf4317'];

export const metadata = pageMetadata({
  title: H.meta.title,
  description: H.meta.description,
  path: '/how-we-work',
});

export default function HowWeWorkPage() {
  return (
    <>
      <section className="sec hl">
        <Blob size={520} color="#FF5A1F" opacity={0.18} pos={{ right: -140, top: -120 }} />
        <Blob size={480} color="#4F7BFF" opacity={0.18} pos={{ left: -160, top: 160 }} />
        <div
          className="wrap hero-pad hw"
          style={{ ...padVars('calc(var(--hd) + 56px)', 100), textAlign: 'center' }}
        >
          <Eyebrow>{H.hero.eyebrow}</Eyebrow>
          <h1 className="h1" style={{ margin: '28px auto 0', maxWidth: 900 }}>
            <Rich text={H.hero.h1} />
          </h1>
          <p className="lead" style={{ margin: '26px auto 0', maxWidth: 620 }}>
            {H.hero.lead}
          </p>
          <StageRibbon />
        </div>
      </section>

      <StageBands />

      <section className="sec" style={{ background: '#fff' }}>
        <div className="wrap" style={{ ...padVars(112, 112) }}>
          <Reveal>
            {/* white section: light-style eyebrow (the dark-style pill is unreadable on white) */}
            <Eyebrow
              style={{
                color: '#3552DC',
                background: 'rgba(79,123,255,.1)',
                borderColor: 'rgba(79,123,255,.3)',
              }}
            >
              {H.firstCall.eyebrow}
            </Eyebrow>
            <h2 className="h2" style={{ margin: '24px 0 20px', maxWidth: 760, color: '#0B1230' }}>
              <Rich text={H.firstCall.h2} />
            </h2>
            <p className="lead" style={{ maxWidth: 600, marginBottom: 52, color: '#56628C' }}>
              {H.firstCall.lead}
            </p>
            <ol className="fc1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {H.firstCall.cards.map((c, i) => (
                <li className="it" key={c.title}>
                  <div className="n" style={{ background: FIRST_CALL[i] }} aria-hidden="true">
                    {i + 1}
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ ...padVars(110, 110) }}>
          <Reveal>
            <Eyebrow>{H.terms.eyebrow}</Eyebrow>
            <h2 className="h2" style={{ margin: '24px 0 56px', maxWidth: 760 }}>
              <Rich text={H.terms.h2} />
            </h2>
            <ul
              className="fc1"
              style={{
                gridTemplateColumns: 'repeat(auto-fit,minmax(min(250px,100%),1fr))',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {content.workingTerms.map((t, i) => (
                <li className="it" key={t.title}>
                  <div className="n" style={{ background: TERMS[i] }} aria-hidden="true">
                    <TickPlain size={24} />
                  </div>
                  <h3>{t.title}</h3>
                  <p>
                    <Rich text={t.text} />
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <Journey current="how" />

      <CtaBand
        title={H.cta.h2}
        lead={H.cta.lead}
        secondary={{ href: '/services', label: H.cta.secondary }}
      />
    </>
  );
}
