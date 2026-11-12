import { content } from './index';
import { SERVICE_VISUALS } from './site';

type ContentService = (typeof content.services)[number];

/** A service: its copy (content.json) plus its colours, scene image and tools (site.ts). */
export type Service = ContentService & {
  anchor: string;
  accent: string;
  /** Darker accent for text and for fills that carry white text. */
  text: string;
  gradient: string;
  scene: string;
  tools: string[];
};

export const SERVICES: readonly Service[] = content.services.map((s) => {
  const v = SERVICE_VISUALS[s.slug];
  if (!v)
    throw new Error(`No visuals for service "${s.slug}" in SERVICE_VISUALS (src/content/site.ts)`);
  return { ...s, ...v };
});

export const getService = (slug: string): Service | undefined =>
  SERVICES.find((s) => s.slug === slug);

export const serviceHref = (slug: string) => `/services/${slug}`;

/** The scene PNGs are all 1600x1200 (4:3). */
export const SCENE_SIZE = { w: 1600, h: 1200 } as const;
export const HERO_SIZE = { w: 1600, h: 1158 } as const;
