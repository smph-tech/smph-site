import { Eyebrow } from './Eyebrow';
import { JourneyTracker } from './JourneyTracker';
import { Reveal } from './Reveal';
import { Rich } from './Rich';
import { content } from '@/content';
import type { PageKey } from '@/content/site';
import { nextOf, stepNumber } from '@/lib/journey';
import { padVars } from '@/lib/pad';

const J = content.journey;

/**
 * "Your path": five nodes (one per page) and a card for each page still ahead. Pointing at, focusing
 * or swiping to a card lights its node and runs an orange line to it (see JourneyTracker).
 * Sits above the closing band on every page.
 */
export function Journey({ current }: { current: PageKey }) {
  const n = String(stepNumber(current));
  return (
    <section className="sec cream">
      <div className="wrap" style={{ ...padVars(104, 110) }}>
        <Reveal>
          <Eyebrow>{J.eyebrow}</Eyebrow>
          <h2 className="h2" style={{ marginTop: 24, maxWidth: 760 }}>
            <Rich text={J.h2} />
          </h2>
          <p className="lead" style={{ marginTop: 18 }}>
            <span className="lead-d">{J.lead.replace('{n}', n)}</span>
            <span className="lead-p">{J.leadPhone.replace('{n}', n)}</span>
          </p>

          <JourneyTracker current={current} next={nextOf(current)} />
        </Reveal>
      </div>
    </section>
  );
}
