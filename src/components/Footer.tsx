import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FOOTER } from '@/content/pages';
import { SERVICES, serviceHref } from '@/content/services';
import { SITE, isPlaceholder } from '@/content/site';

/** A link once the real value exists, plain marked text until then. */
function Maybe({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) {
    return (
      <span className="fl" data-placeholder="">
        {children}
      </span>
    );
  }
  return (
    <a href={href} rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Footer() {
  const mail = isPlaceholder(SITE.email) ? null : `mailto:${SITE.email}`;
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ftg">
          <div>
            <Link className="brand" href="/">
              <Image src="/logo/logo-tile-720.png" alt="" width={44} height={44} />
              <span>{SITE.name}</span>
            </Link>
            <p style={{ margin: '18px 0 0', maxWidth: 330 }}>{FOOTER.about}</p>
          </div>
          <div>
            <h4>{FOOTER.services}</h4>
            {SERVICES.map((s) => (
              <Link key={s.slug} href={serviceHref(s.slug)}>
                {s.name}
              </Link>
            ))}
          </div>
          <div>
            <h4>{FOOTER.company}</h4>
            <Link href="/how-we-work">How we work</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">{FOOTER.contact}</Link>
          </div>
          <div>
            <h4>{FOOTER.follow}</h4>
            <Maybe href={SITE.instagramUrl}>Instagram {SITE.instagram}</Maybe>
            <Maybe href={SITE.youtubeUrl}>YouTube {SITE.youtube}</Maybe>
            <Maybe href={mail}>{SITE.email}</Maybe>
          </div>
        </div>
        <div className="ftb">
          <span>&copy; {new Date().getFullYear()} {SITE.name}</span>
          <span>{FOOTER.replies}</span>
        </div>
      </div>
    </footer>
  );
}
