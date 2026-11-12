import { TRACKED } from './journey';
import type { PageKey } from '@/content/site';

export const VISITED_KEY = 'smph-visited';

type Reader = Pick<Storage, 'getItem'>;
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const isKey = (v: unknown): v is PageKey =>
  typeof v === 'string' && (TRACKED as readonly string[]).includes(v);

/** Visited pages from localStorage. Never throws: private windows and blocked storage give []. */
export function readVisited(storage?: Reader): PageKey[] {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    const raw = s?.getItem(VISITED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? [...new Set(parsed.filter(isKey))] : [];
  } catch {
    return [];
  }
}

/** Remembers a page as visited and returns the full list. Never throws. */
export function addVisited(key: PageKey, storage?: Store): PageKey[] {
  const current = readVisited(storage);
  if (current.includes(key)) return current;
  const next = [...current, key];
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    s?.setItem(VISITED_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: the path still works for this page view, it just is not remembered.
  }
  return next;
}
