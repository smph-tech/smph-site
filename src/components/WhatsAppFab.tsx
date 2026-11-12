'use client';

import { usePathname } from 'next/navigation';
import { TechLogo } from './Tools';
import { content } from '@/content';
import { BRAND, SITE } from '@/content/site';

const W = content.whatsapp;

/**
 * Floating WhatsApp button, bottom right on every page except /thank-you.
 * It is rendered outside .pg (see layout.tsx): .pg is a size container, which would make it the
 * containing block for position: fixed and the button would scroll with the page.
 * On desktop a label slides out on hover or keyboard focus; on phones there is no label.
 */
export function WhatsAppFab() {
  const pathname = usePathname();
  if (pathname === '/thank-you') return null;

  const text = W.message.replace('{brand}', BRAND);
  const href = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
  return (
    <a
      className="wafab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={W.aria.replace('{brand}', BRAND)}
    >
      <span className="wl" aria-hidden="true">
        {W.label}
      </span>
      <span className="wi">
        <TechLogo name="WhatsApp" size={32} decorative white />
      </span>
    </a>
  );
}
