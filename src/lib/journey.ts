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

/** A node shows the "visited" state if the visitor has seen that page. The current page and "Talk to us" never do. */
export function isVisitedNode(
  key: StepKey,
  current: PageKey,
  visited: ReadonlySet<PageKey>,
): boolean {
  return key !== current && key !== 'talk' && visited.has(key);
}

/** Centre of node `i` as a percentage of the track: five equal columns, so 10, 30, 50, 70, 90. */
export const nodeCentre = (i: number): number => 10 + 20 * i;

/** The orange line between the current node and the active one: where it starts and how long it is (percent). */
export function fillSpan(current: number, active: number): { from: number; len: number } {
  return { from: nodeCentre(Math.min(current, active)), len: 20 * Math.abs(active - current) };
}

export const allVisited = (visited: ReadonlySet<PageKey>): boolean =>
  TRACKED.every((k) => visited.has(k));

/** Where a path-step goes when it is the "Talk to us" step: scroll on home, otherwise /contact. */
export const talkHref = (pathname: string): string => (pathname === '/' ? '#contact' : '/contact');
