import { HeroBackdrop } from '@/components/Backdrop';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { padVars } from '@/lib/pad';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <section className="sec" style={{ minHeight: '70vh' }}>
      <HeroBackdrop />
      <div
        className="wrap hero-pad hw"
        style={{ ...padVars('calc(var(--hd) + 80px)', 130), textAlign: 'center' }}
      >
        <Eyebrow>404</Eyebrow>
        <h1 className="h1" style={{ margin: '28px auto 0', maxWidth: 820 }}>
          We could not find that <span className="grad">page</span>.
        </h1>
        <p className="lead" style={{ margin: '26px auto 0', maxWidth: 560 }}>
          The link may be old or mistyped. Try the home page or our services.
        </p>
        <div
          className="btnrow"
          style={{
            marginTop: 38,
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button href="/" arrow>
            Back to home
          </Button>
          <Button href="/services" variant="ghost">
            See services
          </Button>
        </div>
      </div>
    </section>
  );
}
