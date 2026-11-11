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

/** Cyan circled tick, used in the dark trust rows. */
export function TickCyan() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#22D3EE" opacity=".2" />
      <path
        d="M5.5 10.5l3 3 6-7"
        fill="none"
        stroke="#22D3EE"
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
    <svg width={size} height={size} viewBox={size === 24 ? '0 0 24 24' : '0 0 14 14'} aria-hidden="true">
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
