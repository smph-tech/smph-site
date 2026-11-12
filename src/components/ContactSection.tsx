import Image from 'next/image';
import { Blob } from './Backdrop';
import { ContactForm } from './ContactForm';
import { Eyebrow } from './Eyebrow';
import { LazyContactForm } from './LazyContactForm';
import { MailIcon, PhoneIcon, TickPlain } from './icons';
import { Rich } from './Rich';
import { HOME } from '@/content/pages';
import { SITE } from '@/content/site';
import { TEAM, PHOTO_SIZE } from '@/content/team';

/**
 * The gradient "Start here" band with the form. Used on the home page (as #contact)
 * and as the body of /contact, where the heading is the page's h1.
 * Under the trust list: the four team photos ("you will talk to the people who build it"),
 * and the phone and email as small pill buttons.
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
      <Blob size={300} color="#FF5A1F" opacity={0.28} pos={{ left: '42%', top: -100 }} />
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
              style={{ marginTop: 22, maxWidth: 470, color: 'rgba(255,255,255,.85)' }}
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

            <div className="who">
              <div className="av">
                {TEAM.map((p) => {
                  const size = PHOTO_SIZE[p.photo]!;
                  return (
                    <Image
                      key={p.name}
                      src={p.photo}
                      alt={p.name}
                      width={size.w}
                      height={size.h}
                      sizes="50px"
                    />
                  );
                })}
              </div>
              <span>{copy.who}</span>
            </div>

            <div className="callrow">
              <a className="cl" href={SITE.phoneTel}>
                <PhoneIcon /> {SITE.phone}
              </a>
              <a className="cl" href={`mailto:${SITE.email}`}>
                <MailIcon /> {SITE.email}
              </a>
            </div>
          </div>
          {asPage ? <ContactForm /> : <LazyContactForm />}
        </div>
      </div>
    </section>
  );
}
