import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowIcon } from './icons';

export type ButtonVariant = 'primary' | 'ghost' | 'white' | 'dark';

const VARIANT: Record<ButtonVariant, string> = {
  primary: '',
  ghost: ' ghost',
  white: ' white',
  dark: ' dk',
};

type Props = {
  href: string;
  variant?: ButtonVariant;
  small?: boolean;
  arrow?: boolean;
  style?: CSSProperties;
  children: ReactNode;
};

export function Button({ href, variant = 'primary', small, arrow, style, children }: Props) {
  return (
    <Link className={`btn${VARIANT[variant]}${small ? 'sm' : ''}`} href={href} style={style}>
      {children}
      {arrow ? <ArrowIcon /> : null}
    </Link>
  );
}
