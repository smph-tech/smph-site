'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CloseIcon } from './icons';
import { content } from '@/content';
import { HREF, nextOf, pageKeyFor, talkHref } from '@/lib/journey';

const DISMISSED = 'smph-upnext-dismissed';
const SHOW_AT = 0.7;

const readDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISSED) === '1';
  } catch {
    return false;
  }
};

/**
 * After the visitor has scrolled about 70% of a page, a small pill slides in at the bottom left:
 * "Up next: How we work". The x dismisses it for the rest of the session. It is not shown on
 * /contact or /thank-you, and it does not animate for reduced motion.
 */
export function UpNextPill() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Desktop only (901px and up). On phones and tablets nothing is rendered: the "Your path"
  // section does that job there, and the pill collided with content and the WhatsApp button.
  const [desktop, setDesktop] = useState(false);

  const key = pageKeyFor(pathname);
  const next = key ? nextOf(key) : null;

  useEffect(() => {
    setDismissed(readDismissed());
    const mq = window.matchMedia('(min-width: 901px)');
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setShown(false);
    if (!next || !desktop) return;
    const check = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable < 200) return; // a very short page: do not nag
      if ((window.scrollY + window.innerHeight) / doc.scrollHeight >= SHOW_AT) setShown(true);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, [pathname, next, desktop]);

  if (!next || dismissed || !desktop) return null;
  const labels = content.journey.pill.labels;
  const label = labels[next as keyof typeof labels];
  const href = next === 'talk' ? talkHref(pathname) : HREF[next];

  return (
    <div className="upnext" data-shown={shown} aria-hidden={!shown}>
      <Link href={href} tabIndex={shown ? 0 : -1}>
        <span>{content.journey.pill.upNext}</span> <b>{label}</b>{' '}
        <span aria-hidden="true">&rarr;</span>
      </Link>
      <button
        type="button"
        aria-label={content.journey.pill.dismiss}
        tabIndex={shown ? 0 : -1}
        onClick={() => {
          setDismissed(true);
          try {
            window.sessionStorage.setItem(DISMISSED, '1');
          } catch {
            // Not remembered; it simply comes back on the next page.
          }
        }}
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
