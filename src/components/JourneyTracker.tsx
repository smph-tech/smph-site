'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowIcon } from './icons';
import { useVisited } from './VisitedProvider';
import { content } from '@/content';
import type { PageKey } from '@/content/site';
import {
  HREF,
  STEPS,
  cardsFor,
  fillSpan,
  isVisitedNode,
  stepNumber,
  talkHref,
  type StepKey,
} from '@/lib/journey';
import { cx } from '@/lib/cx';

const J = content.journey;
type CardKey = keyof typeof J.cards;

/**
 * The five-node path and the cards under it. One node is "active" at a time: the one whose card
 * the visitor points at, focuses, or has scrolled into view; "Up next" when nothing is.
 * An orange line runs from the current node to the active one.
 */
export function JourneyTracker({ current, next }: { current: PageKey; next: StepKey | null }) {
  const pathname = usePathname();
  const { visited } = useVisited();
  const cur = STEPS.indexOf(current);
  const def = next ? STEPS.indexOf(next) : cur;
  const [active, setActive] = useState(def);
  const rail = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const hrefFor = (key: StepKey) => (key === 'talk' ? talkHref(pathname) : HREF[key]);

  // Phone: the card snapped to the left edge of the rail lights its number.
  const fromScroll = useCallback(() => {
    raf.current = 0;
    const el = rail.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>('.jcard')];
    if (el.scrollWidth <= el.clientWidth + 2) {
      setActive(def);
      return;
    }
    const snapLine = el.getBoundingClientRect().left + 20; // scroll-padding
    let best = cards[0];
    let bestD = Infinity;
    for (const c of cards) {
      const d = Math.abs(c.getBoundingClientRect().left - snapLine);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    // At the very end the last card may never reach the snap line.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
      // "last" means rightmost on screen: on phone the Up next card is moved to the front with CSS order
      best = cards.reduce((a, c) =>
        c.getBoundingClientRect().left > a.getBoundingClientRect().left ? c : a,
      );
    }
    if (best) setActive(Number(best.dataset.i));
  }, [def]);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(fromScroll);
    };
    const onResize = () => fromScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [fromScroll]);

  // Mouse only: touch taps must not leave a card "hovered".
  const hover = (i: number) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActive(i);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActive(def);
    },
  });

  const span = fillSpan(cur, active);
  const style = { '--from': `${span.from}%`, '--len': `${span.len}%` } as CSSProperties;

  return (
    <>
      <ol className="pth" aria-label="Your path through the site" style={style}>
        {STEPS.map((key, i) => {
          const isCur = i === cur;
          const isVisited = isVisitedNode(key, current, visited);
          return (
            <li
              key={key}
              data-i={i}
              className={cx(
                'pn',
                isVisited && 'is-visited',
                isCur && 'is-current',
                active === i && 'is-active',
              )}
              {...(isCur ? {} : hover(i))}
            >
              <Link href={hrefFor(key)} aria-current={isCur ? 'page' : undefined}>
                <span className="dot" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="nm">{J.nodes[i]}</span>
                {isCur ? <span className="here">{J.here}</span> : null}
                {isVisited ? <span className="sr-only"> (seen)</span> : null}
              </Link>
            </li>
          );
        })}
        <li className="fill" aria-hidden="true" />
      </ol>

      <div className="jc" ref={rail}>
        {cardsFor(current).map((key) => {
          const card = J.cards[key as CardKey];
          const i = STEPS.indexOf(key);
          const isNext = key === next;
          return (
            <Link
              key={key}
              href={hrefFor(key)}
              data-i={i}
              className={cx('jcard', isNext && 'nx', active === i && 'is-active')}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(def)}
              {...hover(i)}
            >
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
    </>
  );
}
