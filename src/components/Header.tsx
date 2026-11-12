'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BookButton } from './BookButton';
import { HeroBackdrop } from './Backdrop';
import { ArrowIcon, PhoneIcon } from './icons';
import { TechLogo } from './Tools';
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

      {/* Full-screen menu: a native modal <dialog>, so focus is trapped, Esc closes it, and focus
          returns to the burger. Page scroll is locked by CSS (html:has(dialog.mm[open])). */}
      <dialog ref={dialogRef} className="mm" aria-label="Menu">
        <div className="mm-in">
          <HeroBackdrop />
          <div className="mm-top">
            <div className="wrap hdin">
              <Logo />
              <button type="button" className="burger" aria-label="Close menu" onClick={close}>
                <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
                  <path
                    d="M7 7l16 16M23 7L7 23"
                    stroke="#EAF0FF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="wrap mm-body">
            <nav className="mnav" aria-label="Menu">
              {ITEMS.map((i) => (
                <Link
                  key={i.key}
                  href={i.href}
                  className={current === i.key ? 'on' : undefined}
                  aria-current={current === i.key ? 'page' : undefined}
                  onClick={close}
                >
                  <span>{i.label}</span>
                  <ArrowIcon />
                </Link>
              ))}
            </nav>
            <BookButton arrow style={{ width: '100%', marginTop: 30 }}>
              {NAV.book}
            </BookButton>
            <a className="btn ghost" href={SITE.phoneTel} style={{ width: '100%', marginTop: 12 }}>
              <PhoneIcon /> {NAV.call} {SITE.phone}
            </a>
            <div className="mm-contact">
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a
                className="sb"
                href={SITE.instagramUrl}
                aria-label="Instagram"
                style={{
                  background:
                    'linear-gradient(45deg,#FEDA75,#FA7E1E 30%,#D62976 60%,#962FBF 80%,#4F5BD5)',
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TechLogo name="Instagram" size={24} decorative white />
              </a>
              <a
                className="sb"
                href={SITE.whatsappChannelUrl}
                aria-label="WhatsApp channel"
                style={{ background: '#25D366' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TechLogo name="WhatsApp" size={26} decorative white />
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
