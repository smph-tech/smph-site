'use client';

import { LazyMotion, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import type { CSSProperties, ReactNode } from 'react';

// Loaded after hydration so the animation code never blocks first render.
const loadFeatures = () => import('./motion-features').then((m) => m.default);

/** Subtle scroll reveal: fade and rise 12px, once. Off for reduced motion. */
export function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.div
        data-reveal=""
        className={className}
        style={style}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -8% 0px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
