import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';

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
    <Tag className={cx('glass', className)} style={style}>
      {children}
    </Tag>
  );
}
