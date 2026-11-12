'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BookButton } from './BookButton';
import { PhoneIcon } from './icons';
import { useVisited } from './VisitedProvider';
import { NAV } from '@/content/pages';
import { SITE, type PageKey } from '@/content/site';
import { pageKeyFor } from '@/lib/journey';
import { cx } from '@/lib/cx';

const ITEMS: { key: PageKey; href: string; label: string }[] = [
  { key: 'home', href: '/', label: NAV.home },
  { key: 'services', href: '/services', label: NAV.services },
  { key: 'how', href: '/how-we-work', label: NAV.how },
  { key: 'about', href: '/about', label: NAV.about },
];

function Logo() {
  return (
    <Link className="brand" href="/" aria-label={`${SITE.name} home`}>
      <Image src="/logo/logo-tile-720.png" alt="" width={44} height={44} />
      <span>{SITE.name}</span>
    </Link>
  );
}

/**
 * Site header: Home, Services, How we work, About, Book a free call. No dropdown.
 * `light` switches to ink text for pages with a light hero (/how-we-work does this automatically).
 */
export function Header({ light }: { light?: boolean }) {
  const pathname = usePathname();
  const { visited } = useVisited();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = pageKeyFor(pathname);
  const isLight = light ?? pathname === '/how-we-work';

  // Close the menu after navigation (Esc is handled by the native <dialog>).
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const close = () => dialogRef.current?.close();

  return (
    <header className={cx('hd', isLight && 'lt')} role="banner">
      <div className="wrap hdin">
        <Logo />
        <nav className="nav" aria-label="Main">
          {ITEMS.map((i) => {
            const on = current === i.key;
            return (
              <Link
                key={i.key}
                href={i.href}
                className={on ? 'on' : undefined}
                aria-current={on ? 'page' : undefined}
              >
                {i.label}
                {!on && visited.has(i.key) ? <span className="vd" aria-hidden="true" /> : null}
              </Link>
            );
          })}
          <BookButton small>{NAV.book}</BookButton>
        </nav>
        <button
          type="button"
          className="burger"
          aria-label="Open menu"
          aria-haspopup="dialog"
          onClick={() => dialogRef.current?.showModal()}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <path
              d="M5 10h20M5 15h20M5 20h20"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <dialog ref={dialogRef} className="mm" aria-label="Menu">
        <div className="mm-in">
          <div className="mm-top">
            <Logo />
            <button type="button" className="mm-x" aria-label="Close menu" onClick={close}>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M4 4l12 12M16 4L4 16"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <nav aria-label="Menu" className="mm-nav">
            {ITEMS.map((i) => (
              <Link
                key={i.key}
                className="mm-l"
                href={i.href}
                aria-current={current === i.key ? 'page' : undefined}
                onClick={close}
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <a className="mm-tel" href={SITE.phoneTel}>
            <PhoneIcon size={20} />
            <span>
              <small>Call us</small>
              {SITE.phone}
            </span>
          </a>
          <BookButton>{NAV.book}</BookButton>
        </div>
      </dialog>
    </header>
  );
}
