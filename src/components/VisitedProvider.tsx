'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { allVisited, pageKeyFor } from '@/lib/journey';
import { addVisited, readVisited } from '@/lib/visited-store';
import type { PageKey } from '@/content/site';

type VisitedState = {
  /** Pages seen so far, including this one. Empty on the server and on first paint. */
  visited: ReadonlySet<PageKey>;
  /** True when all four main pages had already been seen before this page view. */
  seenAll: boolean;
};

const EMPTY: VisitedState = { visited: new Set(), seenAll: false };
const Ctx = createContext<VisitedState>(EMPTY);

/**
 * Remembers which main pages a visitor has seen (localStorage, `smph-visited`).
 * Only used to fill the "Your path" nodes, show a small dot in the nav, and change one
 * line of the closing band. Nothing blocks or pops up.
 */
export function VisitedProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<VisitedState>(EMPTY);

  useEffect(() => {
    const before = new Set(readVisited());
    const key = pageKeyFor(pathname);
    const after = new Set(key ? addVisited(key) : before);
    setState({ visited: after, seenAll: allVisited(before) });
  }, [pathname]);

  const value = useMemo(() => state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useVisited = (): VisitedState => useContext(Ctx);
