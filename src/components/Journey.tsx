'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowIcon } from './icons';
import { Eyebrow } from './Eyebrow';
import { Reveal } from './Reveal';
import { Rich } from './Rich';
import { useVisited } from './VisitedProvider';
import { content } from '@/content';
import type { PageKey } from '@/content/site';
import {
  HREF,
  STEPS,
  cardsFor,
  lineDone,
  nextOf,
  nodeDone,
  stepNumber,
  talkHref,
} from '@/lib/journey';
import { cx } from '@/lib/cx';

const J = content.journey;
type CardKey = keyof typeof J.cards;

/**
 * "Your path": a five-step progress line and cards for the pages still ahead.
 * Steps up to this page, and pages the visitor has already seen, are filled.
 * Sits above the closing band on every page.
 */
export function Journey({ current }: { current: PageKey }) {
  const pathname = usePathname();
  const { visited } = useVisited();
  const n = stepNumber(current);
  const next = nextOf(current);

  return (
    <section className="sec cream">
      <div className="wrap" style={{ paddingTop: 104, paddingBottom: 110 }}>
        <Reveal>
          <Eyebrow>{J.eyebrow}</Eyebrow>
          <h2 className="h2" style={{ marginTop: 24, maxWidth: 760 }}>
            <Rich text={J.h2} />
          </h2>
          <p className="lead" style={{ marginTop: 18 }}>
            {J.lead.replace('{n}', String(n))}
          </p>

          <ol className="pth" aria-label="Your path through the site">
            {STEPS.map((key, i) => {
              const done = nodeDone(key, current, visited);
              return (
                <li key={key} style={{ display: 'contents' }}>
                  <div
                    className={cx('pn', done && 'dn', key === current && 'cur')}
                    aria-current={key === current ? 'step' : undefined}
                  >
                    <i aria-hidden="true">{i + 1}</i>
                    {J.nodes[i]}
                    <span className="sr-only">{done ? ' (seen)' : ''}</span>
                  </div>
                  {i < STEPS.length - 1 ? (
                    <div
                      className={cx('pl', lineDone(i, current, visited) && 'dn')}
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div className="jc">
            {cardsFor(current).map((key) => {
              const card = J.cards[key as CardKey];
              const isNext = key === next;
              const href = key === 'talk' ? talkHref(pathname) : HREF[key];
              return (
                <Link key={key} href={href} className={cx('jcard', isNext && 'nx')}>
                  <div className="tg">
                    {isNext ? J.upNext : J.step.replace('{n}', String(stepNumber(key)))}
                  </div>
                  <h3>{card.hook}</h3>
                  <div className="go">
                    <i>
                      <ArrowIcon />
                    </i>
                    {card.go}
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
