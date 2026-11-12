/**
 * Site-wide facts: contact details, per-service visuals and tools, per-stage colours.
 * Contact links live here and nowhere else. Change a value once and it changes everywhere.
 */
/** The brand name, always lowercase. Use this constant, never type it by hand. */
export const BRAND = 'smph.tech';

export const SITE = {
  name: BRAND,
  phone: '+91 95668 31192',
  phoneTel: 'tel:+919566831192',
  email: 'smph.tech@gmail.com',
  instagramHandle: '@smph.tech',
  instagramUrl: 'https://www.instagram.com/smph.tech/',
  /** Digits only, with country code. CONFIRM: this number must be on WhatsApp (see CONFIRM.md). */
  whatsappNumber: '919566831192',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb9H9qI7oQheRpgygP00',
  /** Still a placeholder until the real reply time is confirmed (see CONFIRM.md). */
  replyTime: '[24 hours]',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;

/** True while a value is still a bracketed placeholder. */
export const isPlaceholder = (value: string | null | undefined): boolean =>
  !value || /^\s*\[.*\]\s*$/.test(value);

/** The tokens in content.json that SITE overrides. */
export const TOKEN_MAP: Record<string, string> = {
  '[24 hours]': SITE.replyTime,
};

/** Key used to track which main pages a visitor has seen. */
export type PageKey = 'home' | 'services' | 'how' | 'about';

/**
 * Colour, scene image and tools for each service, keyed by slug.
 * `tools` are names from TECH below, in display order. The Services rows show the first 4;
 * the "How it feels" section and the service page show all of them.
 *
 * CONFIRM: only keep logos for tools we really use
 */
export const SERVICE_VISUALS: Record<
  string,
  {
    /** Anchor id on the Services page and pill link. */
    anchor: string;
    accent: string;
    /** Darker shade of the accent for text and for fills that carry white text (AA contrast). */
    text: string;
    /** Card background: soft highlight on top right over a 160deg gradient. */
    gradient: string;
    scene: string;
    tools: string[];
  }
> = {
  'web-applications': {
    anchor: 'web',
    accent: '#3B66F0',
    text: '#3962e6',
    gradient:
      'radial-gradient(120% 90% at 90% 0%,rgba(130,170,255,.5),transparent 55%),linear-gradient(160deg,#2F55E6,#141B6E)',
    scene: '/images/scenes/web.png',
    tools: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Stripe'],
  },
  'mobile-apps': {
    anchor: 'mobile',
    accent: '#10B981',
    text: '#0b7c56',
    gradient:
      'radial-gradient(120% 90% at 90% 0%,rgba(110,240,200,.45),transparent 55%),linear-gradient(160deg,#10B58A,#064A46)',
    scene: '/images/scenes/mobile.png',
    tools: ['Flutter', 'React', 'Android', 'Apple', 'Firebase'],
  },
  'management-systems': {
    anchor: 'systems',
    accent: '#F73F09',
    text: '#cd3407',
    gradient:
      'radial-gradient(120% 90% at 90% 0%,rgba(255,200,120,.55),transparent 55%),linear-gradient(160deg,#FF8A3D,#B5300B)',
    scene: '/images/scenes/systems.png',
    tools: ['PostgreSQL', 'Python', 'Node.js', 'Google Sheets'],
  },
  'digital-marketing': {
    anchor: 'marketing',
    accent: '#E8338B',
    text: '#c82c78',
    gradient:
      'radial-gradient(120% 90% at 90% 0%,rgba(255,150,200,.5),transparent 55%),linear-gradient(160deg,#E8338B,#5E1470)',
    scene: '/images/scenes/marketing.png',
    tools: ['Google', 'Google Ads', 'Google Analytics', 'Instagram', 'Meta'],
  },
  'tech-consulting-automation': {
    anchor: 'consulting',
    accent: '#7C4DFF',
    text: '#774af5',
    gradient:
      'radial-gradient(120% 90% at 90% 0%,rgba(190,160,255,.55),transparent 55%),linear-gradient(160deg,#8A5CFF,#2A1A86)',
    scene: '/images/scenes/consulting.png',
    tools: ['Zapier', 'n8n', 'Make', 'Python'],
  },
};

/** Tool name -> brand logo file in /public/images/tech (Simple Icons, in each brand's colour). */
export const TECH: Record<string, { file: string }> = {
  React: { file: 'react.svg' },
  'Next.js': { file: 'nextdotjs.svg' },
  'Node.js': { file: 'nodedotjs.svg' },
  PostgreSQL: { file: 'postgresql.svg' },
  Stripe: { file: 'stripe.svg' },
  Flutter: { file: 'flutter.svg' },
  Android: { file: 'android.svg' },
  Apple: { file: 'apple.svg' },
  Firebase: { file: 'firebase.svg' },
  Python: { file: 'python.svg' },
  'Google Sheets': { file: 'googlesheets.svg' },
  Google: { file: 'google.svg' },
  'Google Ads': { file: 'googleads.svg' },
  'Google Analytics': { file: 'googleanalytics.svg' },
  Instagram: { file: 'instagram.svg' },
  WhatsApp: { file: 'whatsapp.svg' },
  Meta: { file: 'meta.svg' },
  Zapier: { file: 'zapier.svg' },
  n8n: { file: 'n8n.svg' },
  Make: { file: 'make.svg' },
  TypeScript: { file: 'typescript.svg' },
  Figma: { file: 'figma.svg' },
  'Tailwind CSS': { file: 'tailwindcss.svg' },
};

/** About page "Tools we use most": each shown as a white pill with its logo. */
export const ABOUT_TOOLS: { name: string; label?: string }[] = [
  { name: 'React' },
  { name: 'Next.js' },
  { name: 'Node.js' },
  { name: 'PostgreSQL' },
  { name: 'React', label: 'React Native' },
  { name: 'TypeScript' },
  { name: 'Figma' },
  { name: 'Tailwind CSS' },
];

/** The five stages on /how-we-work, in order (same order as `how` in content.json). */
export const STAGES = [
  {
    feeling: 'Heard',
    pill: 'You feel heard',
    promise: 'We listen first. No pitch, no jargon.',
    accent: '#FF5A1F',
    /** Darker shade for text and for fills that carry white text (AA contrast). */
    ink: '#bf4317',
    tint: '#FFF1E8',
  },
  {
    feeling: 'Clear',
    pill: 'You feel clear',
    promise: 'You know what you get, what it costs and when.',
    accent: '#3B66F0',
    /** Darker shade for text and for fills that carry white text (AA contrast). */
    ink: '#3962e6',
    tint: '#EEF2FF',
  },
  {
    feeling: 'In control',
    pill: 'You feel in control',
    promise: 'You see it working while we build it.',
    accent: '#7C4DFF',
    /** Darker shade for text and for fills that carry white text (AA contrast). */
    ink: '#774af5',
    tint: '#F3EFFF',
  },
  {
    feeling: 'Relieved',
    pill: 'You feel relieved',
    promise: 'It goes live tested, with you at the controls.',
    accent: '#10B981',
    /** Darker shade for text and for fills that carry white text (AA contrast). */
    ink: '#0b7c56',
    tint: '#E9FAF3',
  },
  {
    feeling: 'Backed up',
    pill: 'You feel backed up',
    promise: 'We stay close after launch.',
    accent: '#E8338B',
    /** Darker shade for text and for fills that carry white text (AA contrast). */
    ink: '#c82c78',
    tint: '#FFEEF6',
  },
] as const;
