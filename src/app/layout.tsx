import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { UpNextPill } from '@/components/UpNextPill';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { VisitedProvider } from '@/components/VisitedProvider';
import { SITE } from '@/content/site';
import { content } from '@/content';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${content.home.meta.title}`, template: `%s | ${SITE.name}` },
  description: content.home.meta.description,
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#060A22',
  colorScheme: 'dark',
};

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon-512.png`,
    description: content.brand.tagline,
    telephone: SITE.phone.replace(/\s/g, ''),
    email: SITE.email,
    sameAs: [SITE.instagramUrl, SITE.whatsappChannelUrl],
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <head>
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <VisitedProvider>
          <div className="pg">
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </div>
          {/* Outside .pg so position: fixed is relative to the screen, not the page container */}
          <aside aria-label="Quick actions">
            <WhatsAppFab />
            <UpNextPill />
          </aside>
        </VisitedProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </body>
    </html>
  );
}
