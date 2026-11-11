import { HeroBackdrop } from '@/components/Backdrop';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { Rich } from '@/components/Rich';
import { content } from '@/content';
import { pageMetadata } from '@/lib/seo';

const T = content.thanks;

export const metadata = pageMetadata({
  title: T.meta.title,
  description: T.meta.description,
  path: '/thank-you',
  noindex: true,
});

export default function ThankYouPage() {
  return (
    <section className="sec" style={{ minHeight: '70vh' }}>
      <HeroBackdrop />
      <div
        className="wrap hero-pad"
        style={{ paddingTop: 'calc(var(--hd) + 80px)', paddingBottom: 130, textAlign: 'center' }}
      >
        <Eyebrow>{T.eyebrow}</Eyebrow>
        <h1 className="h1" style={{ margin: '28px auto 0', maxWidth: 820 }}>
          <Rich text={T.h1} />
        </h1>
        <p className="lead" style={{ margin: '26px auto 0', maxWidth: 560 }}>
          <Rich text={T.lead} />
        </p>
        <div
          style={{ marginTop: 38, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Button href="/" arrow>
            {T.home}
          </Button>
          <Button href="/services" variant="ghost">
            {T.services}
          </Button>
        </div>
      </div>
    </section>
  );
}
