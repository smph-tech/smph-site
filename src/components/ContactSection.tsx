import { Blob } from './Backdrop';
import { ContactForm } from './ContactForm';
import { Eyebrow } from './Eyebrow';
import { Rich } from './Rich';
import { TickPlain } from './icons';
import { HOME } from '@/content/pages';

/**
 * The gradient "Start here" band with the form. Used on the home page (as #contact)
 * and as the body of /contact, where the heading is the page's h1.
 */
export function ContactSection({
  asPage = false,
  copy = HOME.contact,
}: {
  asPage?: boolean;
  copy?: typeof HOME.contact;
}) {
  const Heading = asPage ? 'h1' : 'h2';
  return (
    <section id="contact" className="sec cband">
      <div className="gridbg" style={{ opacity: 0.8 }} aria-hidden="true" />
      <Blob size={420} color="#22D3EE" opacity={0.35} pos={{ left: -120, bottom: -160 }} />
      <Blob size={380} color="#fff" opacity={0.18} pos={{ right: -100, top: -120 }} />
      <div
        className="wrap hero-pad"
        style={{
          paddingTop: asPage ? 'calc(var(--hd) + 56px)' : 120,
          paddingBottom: 120,
        }}
      >
        <div className="fgrid">
          <div>
            <Eyebrow
              style={{
                background: 'rgba(255,255,255,.14)',
                borderColor: 'rgba(255,255,255,.35)',
                color: '#fff',
              }}
            >
              {copy.eyebrow}
            </Eyebrow>
            <Heading className={asPage ? 'h1 cp' : 'h2'} style={{ marginTop: 24, color: '#fff' }}>
              {copy.h2}
            </Heading>
            <p
              className="lead"
              style={{ marginTop: 22, maxWidth: 470, color: 'rgba(255,255,255,.82)' }}
            >
              {copy.lead}
            </p>
            <ul
              className="trust"
              style={{
                marginTop: 30,
                flexDirection: 'column',
                gap: 12,
                color: '#fff',
                listStyle: 'none',
                padding: 0,
              }}
            >
              {copy.trust.map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <TickPlain />
                  <span>
                    <Rich text={t} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
