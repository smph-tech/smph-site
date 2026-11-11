import type { MetadataRoute } from 'next';
import { SERVICES, serviceHref } from '@/content/services';
import { SITE } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/services',
    ...SERVICES.map((s) => serviceHref(s.slug)),
    '/how-we-work',
    '/about',
    '/contact',
  ];
  return paths.map((p) => ({
    url: `${SITE.url}${p === '/' ? '' : p}`,
    changeFrequency: 'monthly',
    priority: p === '/' ? 1 : 0.7,
  }));
}
