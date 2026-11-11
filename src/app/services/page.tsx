import { CompareTable } from '@/components/CompareTable';
import { CtaBand } from '@/components/CtaBand';
import { Eyebrow } from '@/components/Eyebrow';
import { HeroBackdrop } from '@/components/Backdrop';
import { Reveal } from '@/components/Reveal';
import { Rich } from '@/components/Rich';
import { ServiceRow } from '@/components/ServiceRow';
import { SERVICES_PAGE } from '@/content/pages';
import { SERVICES } from '@/content/services';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: SERVICES_PAGE.meta.title,
  description: SERVICES_PAGE.meta.description,
  path: '/services',
});

export default function ServicesPage() {
  const h = SERVICES_PAGE.hero;
  return (
    <>
      <section className="sec">
        <HeroBackdrop />
        <div
          className="wrap hero-pad"
          style={{ paddingTop: 'calc(var(--hd) + 56px)', paddingBottom: 110, textAlign: 'center' }}
        >
          <Eyebrow>{h.eyebrow}</Eyebrow>
          <h1 className="h1" style={{ margin: '28px auto 0', maxWidth: 900 }}>
            <Rich text={h.h1} />
          </h1>
          <p className="lead" style={{ margin: '26px auto 0', maxWidth: 600 }}>
            {h.lead}
          </p>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 72, paddingBottom: 72 }}>
          {SERVICES.map((s, i) => (
            <Reveal key={s.slug}>
              <ServiceRow service={s} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec light" style={{ borderTop: '1px solid rgba(79,123,255,.18)' }}>
        <div className="wrap" style={{ paddingTop: 20, paddingBottom: 120 }}>
          <Reveal>
            <Eyebrow>{SERVICES_PAGE.compare.eyebrow}</Eyebrow>
            <h2 className="h2" style={{ margin: '24px 0 48px' }}>
              {SERVICES_PAGE.compare.h2}
            </h2>
            <CompareTable />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title={SERVICES_PAGE.cta.h2}
        lead={SERVICES_PAGE.cta.lead}
        secondary={{ href: '/how-we-work', label: SERVICES_PAGE.cta.secondary }}
      />
    </>
  );
}
