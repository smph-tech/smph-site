'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { BookButton } from './BookButton';
import { SERVICES, IMAGE_SIZE, serviceHref } from '@/content/services';
import { NAV } from '@/content/pages';
import { SITE } from '@/content/site';

function Logo() {
  return (
    <Link className="brand" href="/">
      <Image src="/logo/logo-tile-720.png" alt="" width={44} height={44} priority />
      <span>{SITE.name}</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Escape moves focus back to the trigger; that focus must not re-open the menu.
  const skipFocusOpen = useRef(false);

  // Close menus after navigation.
  useEffect(() => {
    setOpen(false);
    dialogRef.current?.close();
  }, [pathname]);

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      skipFocusOpen.current = true;
      triggerRef.current?.focus();
      skipFocusOpen.current = false;
    }
  };

  const onServices = pathname.startsWith('/services');
  const current = (href: string) => (pathname === href ? ('page' as const) : undefined);

  return (
    <header className="hd" role="banner">
      <div className="wrap hdin">
        <Logo />
        <nav className="nav" aria-label="Main">
          <div
            className="dd"
            data-open={open}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => {
              if (!skipFocusOpen.current) setOpen(true);
            }}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          >
            <Link
              ref={triggerRef}
              href="/services"
              className={onServices ? 'on' : undefined}
              aria-expanded={open}
              aria-controls="services-menu"
              aria-current={current('/services')}
            >
              {NAV.services}{' '}
              <span className="caret" aria-hidden="true">
                &#9662;
              </span>
            </Link>
            <div className="menu" id="services-menu">
              <div className="mi">
                {SERVICES.map((s) => (
                  <Link
                    key={s.slug}
                    href={serviceHref(s.slug)}
                    aria-current={current(serviceHref(s.slug))}
                  >
                    <Image
                      src={s.image}
                      alt=""
                      width={IMAGE_SIZE[s.image]?.w ?? 900}
                      height={IMAGE_SIZE[s.image]?.h ?? 700}
                      sizes="44px"
                    />
                    <span style={{ color: 'inherit' }}>
                      <b>{s.name}</b>
                      <span>{s.short}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/how-we-work"
            className={pathname === '/how-we-work' ? 'on' : undefined}
            aria-current={current('/how-we-work')}
          >
            {NAV.how}
          </Link>
          <Link
            href="/about"
            className={pathname === '/about' ? 'on' : undefined}
            aria-current={current('/about')}
          >
            {NAV.about}
          </Link>
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
              stroke="#EAF0FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="mm"
        aria-label="Menu"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="mm-in">
          <div className="mm-top">
            <Logo />
            <button
              type="button"
              className="mm-x"
              aria-label="Close menu"
              onClick={() => dialogRef.current?.close()}
            >
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
          <Link className="mm-l" href="/services" aria-current={current('/services')}>
            {NAV.services}
          </Link>
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              className="mm-s"
              href={serviceHref(s.slug)}
              aria-current={current(serviceHref(s.slug))}
            >
              <Image
                src={s.image}
                alt=""
                width={IMAGE_SIZE[s.image]?.w ?? 900}
                height={IMAGE_SIZE[s.image]?.h ?? 700}
                sizes="44px"
              />
              <span>
                <b>{s.name}</b>
                <span>{s.short}</span>
              </span>
            </Link>
          ))}
          <Link className="mm-l" href="/how-we-work" aria-current={current('/how-we-work')}>
            {NAV.how}
          </Link>
          <Link className="mm-l" href="/about" aria-current={current('/about')}>
            {NAV.about}
          </Link>
          <BookButton>{NAV.book}</BookButton>
        </div>
      </dialog>
    </header>
  );
}
