import Image from 'next/image';
import { HeroBackdrop, Blob } from '@/components/Backdrop';
import { BookButton } from '@/components/BookButton';
import { Button } from '@/components/Button';
import { ContactSection } from '@/components/ContactSection';
import { Eyebrow } from '@/components/Eyebrow';
import { TickCyan } from '@/components/icons';
import { Marquee } from '@/components/Marquee';
import { ProcessSteps } from '@/components/ProcessSteps';
import { Reveal } from '@/components/Reveal';
import { Rich } from '@/components/Rich';
import { SectionHeading } from '@/components/SectionHeading';
import { ServiceBentoCard } from '@/components/ServiceBentoCard';
import { TeamGrid } from '@/components/TeamGrid';
import { WhyCards } from '@/components/WhyCards';
import { HOME, CTA } from '@/content/pages';
import { SERVICES } from '@/content/services';
import { SITE } from '@/content/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: `${SITE.name} | ${HOME.meta.title}`,
  absoluteTitle: true,
  description: HOME.meta.description,
  path: '/',
});

const CHIP_POS = [
  { left: 0, top: '8%' },
  { right: 0, top: '30%', animationDelay: '-2s' },
  { left: '6%', bottom: '6%', animationDelay: '-4s' },
] as const;

export default function HomePage() {
  const h = HOME.hero;
  return (
    <>
      <section className="sec" style={{ background: 'var(--bg)' }}>
        <HeroBackdrop />
        <div
          className="wrap hero-pad"
          style={{ paddingTop: 'calc(var(--hd) + 40px)', paddingBottom: 110 }}
        >
          <div className="herogrid">
            <div>
              <Eyebrow>{h.eyebrow}</Eyebrow>
              <h1 className="h1" style={{ marginTop: 28 }}>
                <Rich text={h.h1} />
              </h1>
              <p className="lead" style={{ marginTop: 26, maxWidth: 540 }}>
                {h.lead}
              </p>
              <div style={{ marginTop: 38, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <BookButton arrow>{CTA.book}</BookButton>
                <Button href="#services" variant="ghost">
                  {h.secondary}
                </Button>
              </div>
              <ul
                className="trust"
                style={{ marginTop: 38, listStyle: 'none', padding: 0, marginBottom: 0 }}
              >
                {h.trust.map((t) => (
                  <li key={t}>
                    <TickCyan />
                    <span>
                      <Rich text={t} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="h3d">
              <Image
                className="main"
                src="/3d/hero.png"
                alt={h.imageAlt}
                width={1600}
                height={1158}
                priority
                sizes="(max-width: 900px) 112vw, 660px"
              />
              {h.chips.map((c, i) => (
                <div className="chip" key={c.text} style={CHIP_POS[i]} aria-hidden="true">
                  <b>{c.icon}</b>
                  {c.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      <section id="services" className="sec light">
        <div className="wrap" style={{ paddingTop: 128, paddingBottom: 128 }}>
          <Reveal>
            <SectionHeading
              style={{ maxWidth: 760 }}
              eyebrow={HOME.services.eyebrow}
              title={HOME.services.h2}
              lead={HOME.services.lead}
            />
            <div className="bento" style={{ marginTop: 64 }}>
              {SERVICES.map((s, i) => (
                <ServiceBentoCard key={s.slug} service={s} index={i} wide={i < 2} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <Blob size={500} color="#3B5BFF" opacity={0.28} pos={{ left: '20%', top: -200 }} />
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <Eyebrow>{HOME.process.eyebrow}</Eyebrow>
            <h2 className="h2" style={{ marginTop: 24, maxWidth: 760 }}>
              <Rich text={HOME.process.h2} />
            </h2>
            <ProcessSteps />
            <Button href="/how-we-work" variant="ghost" arrow style={{ marginTop: 64 }}>
              {HOME.process.button}
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <Eyebrow>{HOME.think.eyebrow}</Eyebrow>
            <h2 className="h2" style={{ margin: '24px 0 60px', maxWidth: 780 }}>
              <Rich text={HOME.think.h2} />
            </h2>
            <WhyCards />
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <Blob size={480} color="#7C4DFF" opacity={0.3} pos={{ right: -100, top: 60 }} />
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                gap: 24,
                flexWrap: 'wrap',
                marginBottom: 56,
              }}
            >
              <div>
                <Eyebrow>{HOME.team.eyebrow}</Eyebrow>
                <h2 className="h2" style={{ marginTop: 24 }}>
                  <Rich text={HOME.team.h2} />
                </h2>
              </div>
              <Button href="/about" variant="ghost" arrow>
                {HOME.team.button}
              </Button>
            </div>
            <TeamGrid />
          </Reveal>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
