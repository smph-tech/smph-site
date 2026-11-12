'use client';

import { Blob } from './Backdrop';
import { BookButton } from './BookButton';
import { Button } from './Button';
import { Rich } from './Rich';
import { useVisited } from './VisitedProvider';
import { CTA } from '@/content/pages';
import { padVars } from '@/lib/pad';

/**
 * Closing gradient band: heading, lead, "Book a free call" and an optional ghost link.
 * Once all four main pages have been seen, the heading becomes "You have seen it all. Let us talk."
 */
export function CtaBand({
  title,
  lead,
  secondary,
}: {
  title: string;
  lead: string;
  secondary?: { href: string; label: string };
}) {
  const { seenAll } = useVisited();
  return (
    <section className="sec" style={{ background: 'var(--grad-cta)' }}>
      <div className="gridbg" style={{ opacity: 0.8 }} aria-hidden="true" />
      <Blob size={420} color="#22D3EE" opacity={0.35} pos={{ left: -120, bottom: -200 }} />
      <Blob size={360} color="#fff" opacity={0.18} pos={{ right: -80, top: -140 }} />
      <div className="wrap" style={{ ...padVars(100, 100), textAlign: 'center' }}>
        <h2 className="h2" style={{ maxWidth: 800, margin: '0 auto', color: '#fff' }}>
          {seenAll ? CTA.seenAll : title}
        </h2>
        <p
          className="lead"
          style={{ margin: '22px auto 0', maxWidth: 520, color: 'rgba(255,255,255,.85)' }}
        >
          <Rich text={lead} />
        </p>
        <div
          className="btnrow"
          style={{
            marginTop: 36,
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <BookButton variant="white" arrow>
            {CTA.book}
          </BookButton>
          {secondary ? (
            <Button href={secondary.href} variant="ghost">
              {secondary.label}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
