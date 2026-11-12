import Image from 'next/image';
import Link from 'next/link';
import { BookLink } from './BookButton';
import { EmailLink, PhoneLink } from './ContactLinks';
import { MailIcon, PhoneIcon } from './icons';
import { TechLogo } from './Tools';
import { FOOTER } from '@/content/pages';
import { SERVICES, serviceHref } from '@/content/services';
import { SITE } from '@/content/site';

const L = FOOTER.labels;
const EXT = { target: '_blank', rel: 'noopener noreferrer' } as const;

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="fcta">
          <div>
            <h2 className="fcta-h">{FOOTER.ready.h}</h2>
            <p>{FOOTER.ready.p}</p>
          </div>
          <div className="fb">
            <PhoneLink className="fbtn or">
              <PhoneIcon /> {FOOTER.ready.call} {SITE.phone}
            </PhoneLink>
            <EmailLink className="fbtn">
              <MailIcon /> {SITE.email}
            </EmailLink>
          </div>
        </div>

        <div className="ftg2">
          <div>
            <Link className="brand" href="/">
              <Image src="/logo/logo-tile-720.png" alt="" width={44} height={44} />
              <span>{SITE.name}</span>
            </Link>
            <p style={{ margin: '18px 0 0', maxWidth: 340 }}>{FOOTER.about}</p>
            <div className="soc">
              <a
                className="sb"
                href={SITE.instagramUrl}
                aria-label={`${SITE.name} on Instagram`}
                style={{
                  background:
                    'linear-gradient(45deg,#FEDA75,#FA7E1E 30%,#D62976 60%,#962FBF 80%,#4F5BD5)',
                }}
                {...EXT}
              >
                <TechLogo name="Instagram" size={26} white />
              </a>
              <a
                className="sb"
                href={SITE.whatsappChannelUrl}
                aria-label={`${SITE.name} WhatsApp channel`}
                style={{ background: '#25D366' }}
                {...EXT}
              >
                <TechLogo name="WhatsApp" size={28} white />
              </a>
            </div>
          </div>

          <div>
            <h2>{FOOTER.services}</h2>
            {SERVICES.map((s) => (
              <Link key={s.slug} href={serviceHref(s.slug)}>
                {s.name}
              </Link>
            ))}
          </div>

          <div>
            <h2>{FOOTER.explore}</h2>
            <Link href="/">Home</Link>
            <Link href="/services">Services</Link>
            <Link href="/how-we-work">How we work</Link>
            <Link href="/about">About</Link>
            <BookLink>Book a free call</BookLink>
          </div>

          <div>
            <h2>{FOOTER.touch}</h2>
            <PhoneLink className="ci">
              <span className="ib">
                <PhoneIcon size={18} />
              </span>
              <span>
                <small>{L.call}</small>
                {SITE.phone}
              </span>
            </PhoneLink>
            <EmailLink className="ci">
              <span className="ib">
                <MailIcon size={18} />
              </span>
              <span>
                <small>{L.email}</small>
                {SITE.email}
              </span>
            </EmailLink>
            <a className="ci" href={SITE.instagramUrl} {...EXT}>
              <span className="ib">
                <TechLogo name="Instagram" size={18} decorative />
              </span>
              <span>
                <small>{L.instagram}</small>
                {SITE.instagramHandle}
              </span>
            </a>
            <a className="ci" href={SITE.whatsappChannelUrl} {...EXT}>
              <span className="ib">
                <TechLogo name="WhatsApp" size={18} decorative />
              </span>
              <span>
                <small>{L.whatsapp}</small>
                {L.whatsappLine}
              </span>
            </a>
          </div>
        </div>

        <div className="ftb">
          <span>
            &copy; {new Date().getFullYear()} {SITE.name} &nbsp;&middot;&nbsp; {FOOTER.copy}
          </span>
          <span>{FOOTER.replies}</span>
        </div>
      </div>
    </footer>
  );
}
