import Image from 'next/image';
import { TECH } from '@/content/site';

/** A brand logo from /public/images/tech. Decorative (alt="") when its name is shown beside it. */
export function TechLogo({
  name,
  size,
  decorative = false,
  white = false,
}: {
  name: string;
  size: number;
  decorative?: boolean;
  /** Render the glyph in white (for use on coloured tiles). */
  white?: boolean;
}) {
  const tech = TECH[name];
  if (!tech) return null;
  return (
    <Image
      src={`/images/tech/${tech.file}`}
      alt={decorative ? '' : name}
      width={size}
      height={size}
      className={white ? 'tl-w' : undefined}
      unoptimized
    />
  );
}

/** White pills: logo + name. Used on Services rows and the service page. */
export function ToolPills({
  names,
  label,
  className = 'tools',
  style,
}: {
  names: readonly string[];
  /** Optional leading text, e.g. "Built with tools such as". */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  // A div with list roles (not a <ul>) so the Services rows' "ul" styling does not apply to it.
  return (
    <div className={className} style={style} role="list" aria-label={label ?? 'Tools'}>
      {label ? (
        <span className="tools-label" aria-hidden="true">
          {label}
        </span>
      ) : null}
      {names.map((n) => (
        <span key={n} role="listitem">
          <TechLogo name={n} size={18} decorative />
          {n}
        </span>
      ))}
    </div>
  );
}

/** Small rounded logo tiles (no text), so each logo carries the tool name as its alt text. */
export function ToolTiles({ names }: { names: readonly string[] }) {
  return (
    <ul className="lg">
      {names.map((n) => (
        <li key={n} title={n}>
          <span>
            <TechLogo name={n} size={20} />
          </span>
        </li>
      ))}
    </ul>
  );
}
