import type { CSSProperties } from 'react';
import { Eyebrow } from './Eyebrow';
import { Rich } from './Rich';

/** Eyebrow pill + h2 (and optional lead), as used at the top of most sections. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Tag = 'h2',
  style,
  titleStyle,
  leadStyle,
  eyebrowStyle,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  as?: 'h1' | 'h2';
  style?: CSSProperties;
  titleStyle?: CSSProperties;
  leadStyle?: CSSProperties;
  eyebrowStyle?: CSSProperties;
}) {
  return (
    <div style={style}>
      <Eyebrow style={eyebrowStyle}>{eyebrow}</Eyebrow>
      <Tag className={Tag === 'h1' ? 'h1' : 'h2'} style={{ marginTop: 24, ...titleStyle }}>
        <Rich text={title} />
      </Tag>
      {lead ? (
        <p className="lead" style={{ marginTop: 22, ...leadStyle }}>
          <Rich text={lead} />
        </p>
      ) : null}
    </div>
  );
}
