import { describe, expect, it } from 'vitest';
import {
  STEPS,
  allVisited,
  cardsFor,
  lineDone,
  nextOf,
  nodeDone,
  pageKeyFor,
  stepNumber,
  talkHref,
} from '@/lib/journey';
import { VISITED_KEY, addVisited, readVisited } from '@/lib/visited-store';
import type { PageKey } from '@/content/site';

const set = (...k: PageKey[]) => new Set<PageKey>(k);

/** A minimal in-memory Storage. */
function memory(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[VISITED_KEY, initial]]);
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe('journey order', () => {
  it('is Home, Services, How we work, About, Talk', () => {
    expect([...STEPS]).toEqual(['home', 'services', 'how', 'about', 'talk']);
    expect(stepNumber('home')).toBe(1);
    expect(stepNumber('talk')).toBe(5);
  });
  it.each([
    ['home', 'services'],
    ['services', 'how'],
    ['how', 'about'],
    ['about', 'talk'],
  ] as const)('after %s comes %s', (from, to) => expect(nextOf(from)).toBe(to));
  it('has nothing after Talk to us', () => expect(nextOf('talk')).toBeNull());
});

describe('cardsFor (matches the reference pages)', () => {
  it('home: Services, How we work, About, Talk', () =>
    expect(cardsFor('home')).toEqual(['services', 'how', 'about', 'talk']));
  it('services: How we work, About, Talk', () =>
    expect(cardsFor('services')).toEqual(['how', 'about', 'talk']));
  it('how: Services, About, Talk', () =>
    expect(cardsFor('how')).toEqual(['services', 'about', 'talk']));
  it('about: Services, How we work, Talk', () =>
    expect(cardsFor('about')).toEqual(['services', 'how', 'talk']));
  it('the up-next card is always among the cards', () => {
    for (const p of ['home', 'services', 'how', 'about'] as const) {
      expect(cardsFor(p)).toContain(nextOf(p));
    }
  });
});

describe('pageKeyFor', () => {
  it.each([
    ['/', 'home'],
    ['/services', 'services'],
    ['/services/web-applications', 'services'],
    ['/services/mobile-apps', 'services'],
    ['/how-we-work', 'how'],
    ['/about', 'about'],
  ] as const)('%s -> %s', (path, key) => expect(pageKeyFor(path)).toBe(key));
  it.each(['/contact', '/thank-you', '/nope'])('%s is not tracked', (p) =>
    expect(pageKeyFor(p)).toBeNull(),
  );
});

describe('progress nodes', () => {
  it('fills the current step and everything before it', () => {
    const v = set();
    expect(STEPS.map((k) => nodeDone(k, 'home', v))).toEqual([true, false, false, false, false]);
    expect(STEPS.map((k) => nodeDone(k, 'services', v))).toEqual([true, true, false, false, false]);
    expect(STEPS.map((k) => nodeDone(k, 'how', v))).toEqual([true, true, true, false, false]);
    expect(STEPS.map((k) => nodeDone(k, 'about', v))).toEqual([true, true, true, true, false]);
  });
  it('also fills pages that were visited earlier', () => {
    expect(nodeDone('about', 'home', set('about'))).toBe(true);
    expect(nodeDone('how', 'home', set('about'))).toBe(false);
  });
  it('never fills "Talk to us" from visits', () => {
    expect(nodeDone('talk', 'home', set('home', 'services', 'how', 'about'))).toBe(false);
  });
  it('fills a line only when both of its nodes are filled', () => {
    expect([0, 1, 2, 3].map((i) => lineDone(i, 'services', set()))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect([0, 1, 2, 3].map((i) => lineDone(i, 'home', set('about')))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect([0, 1, 2, 3].map((i) => lineDone(i, 'home', set('services', 'how')))).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});

describe('allVisited', () => {
  it('needs home, services, how and about', () => {
    expect(allVisited(set('home', 'services', 'how'))).toBe(false);
    expect(allVisited(set('home', 'services', 'how', 'about'))).toBe(true);
  });
});

describe('talkHref', () => {
  it('scrolls on the home page and opens /contact elsewhere', () => {
    expect(talkHref('/')).toBe('#contact');
    expect(talkHref('/services')).toBe('/contact');
    expect(talkHref('/about')).toBe('/contact');
  });
});

describe('visited store (useVisited)', () => {
  it('starts empty', () => expect(readVisited(memory())).toEqual([]));
  it('adds pages once and keeps order', () => {
    const m = memory();
    expect(addVisited('home', m)).toEqual(['home']);
    expect(addVisited('services', m)).toEqual(['home', 'services']);
    expect(addVisited('home', m)).toEqual(['home', 'services']);
    expect(JSON.parse(m.data.get(VISITED_KEY)!)).toEqual(['home', 'services']);
  });
  it('ignores junk in storage', () => {
    expect(readVisited(memory('not json'))).toEqual([]);
    expect(readVisited(memory('{"a":1}'))).toEqual([]);
    expect(readVisited(memory('["home","evil","about",3]'))).toEqual(['home', 'about']);
  });
  it('never throws when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(readVisited(blocked)).toEqual([]);
    expect(addVisited('about', blocked)).toEqual(['about']);
  });
});
