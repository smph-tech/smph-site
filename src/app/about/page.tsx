import Image from 'next/image';
import { Blob, HeroBackdrop } from '@/components/Backdrop';
import { CtaBand } from '@/components/CtaBand';
import { Eyebrow } from '@/components/Eyebrow';
import { Reveal } from '@/components/Reveal';
import { Rich } from '@/components/Rich';
import { TeamGrid } from '@/components/TeamGrid';
import { content } from '@/content';
import { SITE, isPlaceholder } from '@/content/site';
import { pageMetadata } from '@/lib/seo';

const A = content.about;

export const metadata = pageMetadata({
  title: A.meta.title,
  description: A.meta.description,
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <section className="sec">
        <HeroBackdrop />
        <div
          className="wrap hero-pad"
          style={{ paddingTop: 'calc(var(--hd) + 56px)', paddingBottom: 110 }}
        >
          <div className="herogrid">
            <div>
              <Eyebrow>{A.hero.eyebrow}</Eyebrow>
              <h1 className="h1" style={{ marginTop: 28, fontSize: 'clamp(36px,4.8cqw,66px)' }}>
                <Rich text={A.hero.h1} />
              </h1>
              <p className="lead" style={{ marginTop: 26, maxWidth: 540 }}>
                {A.hero.lead}
              </p>
            </div>
            <div className="h3d">
              <Image
                className="main"
                src="/3d/hero.png"
                alt=""
                width={1600}
                height={1158}
                priority
                quality={70}
                sizes="(max-width: 900px) 112vw, 660px"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <div className="fgrid" style={{ alignItems: 'start' }}>
              <div>
                <Eyebrow>{A.what.eyebrow}</Eyebrow>
                <h2 className="h2" style={{ marginTop: 24, fontSize: 'clamp(30px,3.4cqw,46px)' }}>
                  <Rich text={A.what.h2} />
                </h2>
              </div>
              <div>
                <p className="lead">{A.what.p1}</p>
                <p className="lead" style={{ marginTop: 20 }}>
                  {A.what.p2}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <Blob size={500} color="#3B5BFF" opacity={0.28} pos={{ left: -140, top: 80 }} />
        <Blob size={440} color="#7C4DFF" opacity={0.25} pos={{ right: -120, bottom: 0 }} />
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <Eyebrow>{A.team.eyebrow}</Eyebrow>
            <h2 className="h2" style={{ margin: '24px 0 56px', maxWidth: 760 }}>
              <Rich text={A.team.h2} />
            </h2>
            <TeamGrid />
          </Reveal>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap" style={{ paddingTop: 110, paddingBottom: 110 }}>
          <Reveal>
            <div className="fgrid" style={{ alignItems: 'start' }}>
              <div>
                <Eyebrow>{A.tools.eyebrow}</Eyebrow>
                <h2
                  className="h2"
                  style={{ margin: '24px 0 30px', fontSize: 'clamp(30px,3.4cqw,46px)' }}
                >
                  <Rich text={A.tools.h2} />
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {content.tools.map((t) => (
                    <li key={t} style={{ display: 'inline' }}>
                      <span className="chip2 lc">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mono mu" style={{ fontSize: 13, marginTop: 8 }} data-placeholder="">
                  {A.tools.note}
                </p>
              </div>
              <div>
                <Eyebrow>{A.share.eyebrow}</Eyebrow>
                <h2
                  className="h2"
                  style={{ margin: '24px 0 20px', fontSize: 'clamp(30px,3.4cqw,46px)' }}
                >
                  <Rich text={A.share.h2} />
                </h2>
                <p className="lead">{A.share.lead}</p>
                <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <SocialButton href={SITE.instagramUrl} label={`Instagram ${SITE.instagram}`} />
                  <SocialButton href={SITE.youtubeUrl} label={`YouTube ${SITE.youtube}`} dark />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title={A.cta.h2}
        lead={A.cta.lead}
        secondary={{ href: '/services', label: A.cta.secondary }}
      />
    </>
  );
}

/** A real link once the account URL is set. Until then a marked, non-clickable button. */
function SocialButton({
  href,
  label,
  dark,
}: {
  href: string | null;
  label: string;
  dark?: boolean;
}) {
  if (!href || isPlaceholder(href)) {
    return (
      <span
        className={`btn${dark ? 'dk' : ''}`}
        data-placeholder=""
        aria-disabled="true"
        style={{ cursor: 'default' }}
      >
        {label}
      </span>
    );
  }
  return (
    <a className={`btn${dark ? 'dk' : ''}`} href={href} rel="noopener noreferrer">
      {label}
    </a>
  );
}
