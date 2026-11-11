import { Blob, HeroBackdrop } from '@/components/Backdrop';
import { CtaBand } from '@/components/CtaBand';
import { Eyebrow } from '@/components/Eyebrow';
import { HowTimeline } from '@/components/HowTimeline';
import { TickPlain } from '@/components/icons';
import { Reveal } from '@/components/Reveal';
import { Rich } from '@/components/Rich';
import { content } from '@/content';
import { pageMetadata } from '@/lib/seo';

const H = content.howPage;

export const metadata = pageMetadata({
  title: H.meta.title,
  description: H.meta.description,
  path: '/how-we-work',
});

export default function HowWeWorkPage() {
  return (
    <>
      <section className="sec">
        <HeroBackdrop />
        <div
          className="wrap hero-pad"
          style={{ paddingTop: 'calc(var(--hd) + 56px)', paddingBottom: 90, textAlign: 'center' }}
        >
          <Eyebrow>{H.hero.eyebrow}</Eyebrow>
          <h1 className="h1" style={{ margin: '28px auto 0', maxWidth: 900 }}>
            <Rich text={H.hero.h1} />
          </h1>
          <p className="lead" style={{ margin: '26px auto 0', maxWidth: 620 }}>
            {H.hero.lead}
          </p>
        </div>
      </section>

      <section className="sec">
        <Blob size={520} color="#3B5BFF" opacity={0.25} pos={{ right: -160, top: 200 }} />
        <Blob size={460} color="#7C4DFF" opacity={0.25} pos={{ left: -180, bottom: 100 }} />
        <div className="wrap" style={{ paddingTop: 30, paddingBottom: 120 }}>
          <Reveal>
            <HowTimeline />
          </Reveal>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 110, paddingBottom: 110 }}>
          <Reveal>
            <Eyebrow>{H.terms.eyebrow}</Eyebrow>
            <h2 className="h2" style={{ margin: '24px 0 56px', maxWidth: 760 }}>
              <Rich text={H.terms.h2} />
            </h2>
            <div
              className="cards3"
              style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(250px,100%),1fr))' }}
            >
              {content.workingTerms.map((t) => (
                <div className="wc" key={t.title}>
                  <div className="ico">
                    <TickPlain size={24} />
                  </div>
                  <h3>{t.title}</h3>
                  <p>
                    <Rich text={t.text} />
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title={H.cta.h2}
        lead={H.cta.lead}
        secondary={{ href: '/services', label: H.cta.secondary }}
      />
    </>
  );
}
