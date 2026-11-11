import { content } from './index';

export type Service = ContentService;
type ContentService = (typeof content.services)[number];

export const SERVICES: readonly Service[] = content.services;

export const getService = (slug: string): Service | undefined =>
  SERVICES.find((s) => s.slug === slug);

export const serviceHref = (slug: string) => `/services/${slug}`;

/** Natural size of each 3D render, so next/image can reserve space. */
export const IMAGE_SIZE: Record<string, { w: number; h: number }> = {
  '/3d/hero.png': { w: 1600, h: 1158 },
  '/3d/web.png': { w: 900, h: 732 },
  '/3d/mobile.png': { w: 700, h: 856 },
  '/3d/systems.png': { w: 900, h: 493 },
  '/3d/marketing.png': { w: 900, h: 797 },
  '/3d/consulting.png': { w: 900, h: 737 },
};
