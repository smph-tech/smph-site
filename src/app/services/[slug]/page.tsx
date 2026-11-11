import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroBackdrop, Blob } from '@/components/Backdrop';
import { BookButton } from '@/components/BookButton';
import { Button } from '@/components/Button';
import { CtaBand } from '@/components/CtaBand';
import { FactBand } from '@/components/FactBand';
import { FaqAccordion } from '@/components/FaqAccordion';
import { FeatureGrid } from '@/components/FeatureGrid';
import { OtherServices } from '@/components/OtherServices';
import { ProblemList } from '@/components/ProblemList';
import { Reveal } from '@/components/Reveal';
import { Rich, plain } from '@/components/Rich';
import { SectionHeading } from '@/components/SectionHeading';
import { StepRow } from '@/components/StepRow';
import { content } from '@/content';
import { CTA } from '@/content/pages';
import { IMAGE_SIZE, SERVICES, getService, serviceHref } from '@/content/services';
import { SITE } from '@/content/site';
import { pageMetadata } from '@/lib/seo';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: service.name,
    description: `${plain(service.lead)} ${service.short}`,
    path: serviceHref(service.slug),
  });
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const S = content.service;
  const size = IMAGE_SIZE[service.image]!;
  const [chipA, chipB] = service.heroChips;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: `${plain(service.lead)} ${service.short}`,
    url: `${SITE.url}${serviceHref(service.slug)}`,
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };

  return (
    <>
      <section className="sec">
        <HeroBackdrop />
        <div
          className="wrap hero-pad"
          style={{ paddingTop: 'calc(var(--hd) + 28px)', paddingBottom: 110 }}
        >
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/services">{S.breadcrumbRoot}</Link> &nbsp;/&nbsp; {service.name}
          </nav>
          <div className="sh" style={{ marginTop: 36 }}>
            <div>
              <h1 className="h1" style={{ fontSize: 'clamp(36px,4.8cqw,66px)' }}>
                <Rich text={service.h1Html} />
              </h1>
              <p className="lead" style={{ marginTop: 26, maxWidth: 520 }}>
                {service.lead}
              </p>
              <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <BookButton service={service.slug} arrow>
                  {CTA.talk}
                </BookButton>
                <Button href="#build" variant="ghost">
                  {S.secondary}
                </Button>
              </div>
            </div>
            <div className="h3d sv" style={{ padding: '10px 30px' }}>
              <Image
                className="main"
                src={service.image}
                alt=""
                width={size.w}
                height={size.h}
                priority
                sizes="(max-width: 900px) 90vw, 520px"
              />
              <div className="chip" style={{ left: 0, top: '10%' }} aria-hidden="true">
                <b>&#10003;</b>
                {chipA}
              </div>
              <div
                className="chip"
                style={{ right: 0, bottom: '12%', animationDelay: '-3s' }}
                aria-hidden="true"
              >
                <b>&#8599;</b>
                {chipB}
              </div>
            </div>
          </div>
          <FactBand service={service} />
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <SectionHeading
              eyebrow={S.needs.eyebrow}
              title={S.needs.h2}
              style={{ marginBottom: 56 }}
              titleStyle={{ maxWidth: 760 }}
            />
            <ProblemList items={service.needs} />
          </Reveal>
        </div>
      </section>

      <section id="build" className="sec">
        <Blob size={520} color="#3B5BFF" opacity={0.28} pos={{ left: -160, top: 100 }} />
        <Blob size={420} color="#7C4DFF" opacity={0.28} pos={{ right: -120, bottom: -60 }} />
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <SectionHeading
              eyebrow={S.builds.eyebrow}
              title={S.builds.h2}
              style={{ marginBottom: 56 }}
              titleStyle={{ maxWidth: 760 }}
            />
            <FeatureGrid items={service.builds} />
          </Reveal>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <SectionHeading
              eyebrow={S.steps.eyebrow}
              title={S.steps.h2}
              style={{ marginBottom: 64 }}
              titleStyle={{ maxWidth: 760 }}
            />
            <StepRow items={service.steps} />
            <Button href="/how-we-work" variant="dark" arrow style={{ marginTop: 60 }}>
              {S.steps.button}
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120, maxWidth: 980 }}>
          <Reveal>
            <SectionHeading eyebrow={S.faq.eyebrow} title={S.faq.h2} style={{ marginBottom: 48 }} />
            <FaqAccordion items={service.faq} />
          </Reveal>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 110, paddingBottom: 110 }}>
          <Reveal>
            <SectionHeading
              eyebrow={S.others.eyebrow}
              title={S.others.h2}
              style={{ marginBottom: 48 }}
            />
            <OtherServices currentSlug={service.slug} />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title={S.cta.h2}
        lead={S.cta.lead}
        secondary={{ href: '/services', label: S.cta.secondary }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
