import type { CSSProperties, ReactNode } from 'react';

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span className="eyebrow" style={style}>
      <i aria-hidden="true"></i>
      {children}
    </span>
  );
}
