'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PhoneIcon } from './icons';
import { NAV } from '@/content/pages';
import { SITE } from '@/content/site';
import { talkHref } from '@/lib/journey';

/**
 * Phones only (CSS hides it from 900px up): Call and Book a free call, fixed to the bottom.
 * Not shown on /contact, where the form is the page. It lives outside the page container so
 * `position: fixed` is relative to the screen. The spacer stops it covering the footer.
 */
export function StickyBar() {
  const pathname = usePathname();
  if (pathname === '/contact') return null;
  return (
    <>
      <div className="sbar" role="region" aria-label="Quick contact">
        <a className="sb-call" href={SITE.phoneTel}>
          <PhoneIcon size={18} />
          {NAV.call}
        </a>
        <Link className="sb-book" href={talkHref(pathname)}>
          {NAV.book}
        </Link>
      </div>
      <div className="sbar-sp" aria-hidden="true" />
    </>
  );
}
