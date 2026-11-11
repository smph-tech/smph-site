import type { Metadata } from 'next';
import { SITE } from '@/content/site';

const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: `${SITE.name}: we engineer growth for your business` };

/** Per-page metadata: title, description, canonical, Open Graph and Twitter. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  /** Use the title exactly as given (no site-name suffix). */
  absoluteTitle?: boolean;
  noindex?: boolean;
}): Metadata {
  const { title, description, path } = opts;
  const full = opts.absoluteTitle ? title : `${title} | ${SITE.name}`;
  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: full,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE.url] },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
