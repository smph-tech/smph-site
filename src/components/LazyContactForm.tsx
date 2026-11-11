'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

/**
 * Loads the form code (react-hook-form + zod) only when the form is about to be
 * scrolled into view, so the home page does not pay for it on first load.
 * The placeholder keeps the card's size, so nothing shifts when the form arrives.
 */
export function LazyContactForm() {
  const ref = useRef<HTMLDivElement>(null);
  const [Form, setForm] = useState<ComponentType | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      import('./ContactForm').then((m) => setForm(() => m.ContactForm));
    };
    if (!('IntersectionObserver' in window)) return load();
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    // Anchor links (#contact) can jump straight here.
    if (location.hash === '#contact') load();
    return () => io.disconnect();
  }, []);

  if (Form) return <Form />;
  return <div ref={ref} className="fcard fcard-ph" aria-hidden="true" />;
}
