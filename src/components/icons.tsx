import type { ReactElement } from 'react';

export function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 10h12M11 5l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Orange circled tick, used in the dark trust rows (logo colours). */
export function TickOrange() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#FF5A1F" opacity=".22" />
      <path
        d="M5.5 10.5l3 3 6-7"
        fill="none"
        stroke="#FF8A4C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Blue circled tick, used in light bullet lists. */
export function TickBlue() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#4F7BFF" opacity=".16" />
      <path
        d="M5.5 10.5l3 3 6-7"
        fill="none"
        stroke="#3552DC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Bare tick path. Size and stroke match the reference usage. */
export function TickPlain({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={size === 24 ? '0 0 24 24' : '0 0 14 14'}
      aria-hidden="true"
    >
      <path
        d="M2.5 7.5l3 3 6-7"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const WHY_ICONS: Record<string, ReactElement> = {
  target: (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="11" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="15" cy="15" r="6" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="15" cy="15" r="1.8" fill="#fff" />
    </svg>
  ),
  chart: (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <rect x="5" y="16" width="5" height="9" rx="2" fill="#fff" />
      <rect x="12.5" y="10" width="5" height="15" rx="2" fill="#fff" />
      <rect x="20" y="4" width="5" height="21" rx="2" fill="#fff" />
    </svg>
  ),
  team: (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="11" cy="11" r="4.5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="21" cy="12" r="3.5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <path
        d="M3.5 25c.5-5 3.5-7.5 7.5-7.5s7 2.5 7.5 7.5M19 18c4 0 6.5 2 7.5 6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function PhoneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...STROKE}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

export function MailIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...STROKE}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 8 6 8-6" />
    </svg>
  );
}

export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...STROKE}>
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}
