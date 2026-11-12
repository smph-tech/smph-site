'use client';

import type { CSSProperties, ReactNode } from 'react';
import { BRAND, SITE } from '@/content/site';
import { copyText, isDesktopPointer, showToast } from '@/lib/toast';

const SUBJECT = `Enquiry from ${BRAND}`;
const MAILTO = `mailto:${SITE.email}?subject=${encodeURIComponent(SUBJECT)}`;
const GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE.email)}&su=${encodeURIComponent(SUBJECT)}`;

/**
 * The email address, everywhere it appears. The href stays a mailto: (right-click copy, screen
 * readers, touch devices). On a desktop, where a mailto: often does nothing, a click opens Gmail
 * compose instead. A small Copy button covers people who use Outlook or another mail app.
 */
export function EmailLink({
  className,
  children,
  copy = true,
}: {
  className?: string;
  children?: ReactNode;
  copy?: boolean;
}) {
  const link = (
    <a
      className={className}
      href={MAILTO}
      onClick={(e) => {
        if (!isDesktopPointer()) return;
        e.preventDefault();
        window.open(GMAIL, '_blank', 'noopener');
      }}
    >
      {children ?? SITE.email}
    </a>
  );
  if (!copy) return link;
  return (
    <span className="cpw">
      {link}
      <button
        type="button"
        className="cpb"
        aria-label="Copy email address"
        onClick={async () =>
          showToast((await copyText(SITE.email)) ? 'Email copied' : 'Could not copy')
        }
      >
        Copy
      </button>
    </span>
  );
}

/**
 * The phone number. Touch devices dial with tel:. On a desktop, where tel: has nothing to open,
 * a click copies the number and shows a toast.
 */
export function PhoneLink({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <a
      className={className}
      style={style}
      href={SITE.phoneTel}
      onClick={async (e) => {
        if (!isDesktopPointer()) return;
        e.preventDefault();
        const ok = await copyText(SITE.phoneTel.replace(/^tel:/, ''));
        showToast(ok ? 'Number copied' : 'Could not copy');
      }}
    >
      {children ?? SITE.phone}
    </a>
  );
}
