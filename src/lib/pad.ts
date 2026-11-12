import type { CSSProperties } from 'react';

/**
 * Vertical padding of a section's .wrap, as CSS variables (--pt, --pb).
 * Desktop uses exactly these values. Below 900px the stylesheet caps them with --sec-pad-y
 * (88px tablet, 52px phone); see src/styles/phone.css.
 */
export function padVars(top: number | string, bottom: number | string = top): CSSProperties {
  const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);
  return { '--pt': px(top), '--pb': px(bottom) } as CSSProperties;
}
