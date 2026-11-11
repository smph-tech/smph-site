import { content } from '@/content';

/** Scrolling strip of service names. The second copy is hidden from screen readers. */
export function Marquee() {
  const items = content.marquee;
  return (
    <div className="mq">
      <div className="mqt">
        {items.map((t) => (
          <span key={t}>{t}</span>
        ))}
        {items.map((t) => (
          <span key={`${t}-2`} aria-hidden="true">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
