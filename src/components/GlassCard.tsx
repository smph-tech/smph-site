import type { CSSProperties, ElementType, ReactNode } from 'react';

export function GlassCard({
  as: Tag = 'div',
  className = '',
  style,
  children,
}: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag className={`glass ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
