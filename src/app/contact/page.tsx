import { ContactSection } from '@/components/ContactSection';
import { content } from '@/content';
import { HOME } from '@/content/pages';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: content.contactPage.meta.title,
  description: content.contactPage.meta.description,
  path: '/contact',
});

export default function ContactPage() {
  return <ContactSection asPage copy={HOME.contact} />;
}
