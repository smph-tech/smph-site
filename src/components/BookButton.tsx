'use client';

import { usePathname } from 'next/navigation';
import { Button, type ButtonVariant } from './Button';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Where "Book a free call" goes: scroll to #contact on the home page,
 * otherwise open /contact (optionally with the service preselected).
 */
export function useBookHref(service?: string): string {
  const pathname = usePathname();
  if (pathname === '/') return '#contact';
  return service ? `/contact?service=${encodeURIComponent(service)}` : '/contact';
}

type Props = {
  variant?: ButtonVariant;
  small?: boolean;
  arrow?: boolean;
  /** Service slug to preselect in the form. */
  service?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function BookButton({ service, children, ...rest }: Props) {
  const href = useBookHref(service);
  return (
    <Button href={href} {...rest}>
      {children}
    </Button>
  );
}
