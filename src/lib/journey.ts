import type { PageKey } from '@/content/site';

/** The visitor's path through the site, in order. "talk" is the contact page. */
export const STEPS = ['home', 'services', 'how', 'about', 'talk'] as const;
export type StepKey = (typeof STEPS)[number];

/** The pages that count as "seen" for the path and the "you have seen it all" line. */
export const TRACKED: readonly PageKey[] = ['home', 'services', 'how', 'about'];

export const HREF: Record<StepKey, string> = {
  home: '/',
  services: '/services',
  how: '/how-we-work',
  about: '/about',
  talk: '/contact',
};

/** 1-based step number, e.g. services -> 2. */
export const stepNumber = (key: StepKey): number => STEPS.indexOf(key) + 1;

/** The page to send the visitor to next. Contact is the end of the path. */
export function nextOf(key: StepKey): StepKey | null {
  return STEPS[STEPS.indexOf(key) + 1] ?? null;
}

/**
 * Cards on the "Your path" section: the other content pages, then "Talk to us".
 * Home is never offered as a card; you are already past it.
 */
export function cardsFor(current: PageKey): StepKey[] {
  return [...(['services', 'how', 'about'] as const).filter((k) => k !== current), 'talk'];
}

/** Which tracked page a pathname belongs to. Service pages count as "services". */
export function pageKeyFor(pathname: string): PageKey | null {
  if (pathname === '/') return 'home';
  if (pathname === '/services' || pathname.startsWith('/services/')) return 'services';
  if (pathname === '/how-we-work') return 'how';
  if (pathname === '/about') return 'about';
  return null;
}

/** A progress node is filled if it is the current step, earlier than it, or already visited. */
export function nodeDone(key: StepKey, current: PageKey, visited: ReadonlySet<PageKey>): boolean {
  if (stepNumber(key) <= stepNumber(current)) return true;
  return key !== 'talk' && visited.has(key);
}

/** The line between two neighbouring nodes is filled when both of them are. */
export function lineDone(
  leftIndex: number,
  current: PageKey,
  visited: ReadonlySet<PageKey>,
): boolean {
  const a = STEPS[leftIndex];
  const b = STEPS[leftIndex + 1];
  return !!a && !!b && nodeDone(a, current, visited) && nodeDone(b, current, visited);
}

export const allVisited = (visited: ReadonlySet<PageKey>): boolean =>
  TRACKED.every((k) => visited.has(k));

/** Where a path-step goes when it is the "Talk to us" step: scroll on home, otherwise /contact. */
export const talkHref = (pathname: string): string => (pathname === '/' ? '#contact' : '/contact');
