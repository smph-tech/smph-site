/**
 * Site-wide facts the owner still has to confirm.
 * Every value in square brackets is a placeholder: the site shows it as-is
 * (brackets included) until you replace it with the real value.
 * Replace a value here once and it changes everywhere, including inside
 * the copy in content.json (the literal tokens are swapped at load time).
 */
export const SITE = {
  name: 'SMPH.Tech',
  email: '[EMAIL]',
  instagram: '[HANDLE]',
  youtube: '[CHANNEL]',
  replyTime: '[24 hours]',
  /** Full URLs. Leave null until the real accounts exist. */
  instagramUrl: null as string | null,
  youtubeUrl: null as string | null,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;

/** True while a value is still a bracketed placeholder. */
export const isPlaceholder = (value: string | null | undefined): boolean =>
  !value || /^\s*\[.*\]\s*$/.test(value);

/** The tokens in content.json that SITE overrides. */
export const TOKEN_MAP: Record<string, string> = {
  '[24 hours]': SITE.replyTime,
  '[EMAIL]': SITE.email,
  '[INSTAGRAM HANDLE]': SITE.instagram,
  '[YOUTUBE CHANNEL]': SITE.youtube,
};
