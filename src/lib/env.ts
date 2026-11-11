/** Server-side configuration, read from the environment on every call. */

export type SheetsConfig = {
  clientEmail: string;
  privateKey: string;
  sheetId: string;
  tab: string;
};
export type MailConfig = {
  transport: 'resend' | 'smtp';
  to: string;
  from: string;
  resendKey?: string;
  smtp?: { host: string; port: number; user: string; pass: string };
  autoReply: boolean;
};

const env = (k: string) => process.env[k]?.trim() || undefined;

export const isProd = () => process.env.NODE_ENV === 'production';

/** Returns the config or the list of missing variable names. */
export function sheetsConfig(): { ok: true; value: SheetsConfig } | { ok: false; missing: string[] } {
  const clientEmail = env('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const rawKey = env('GOOGLE_PRIVATE_KEY');
  const sheetId = env('GOOGLE_SHEET_ID');
  const missing = [
    !clientEmail && 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    !rawKey && 'GOOGLE_PRIVATE_KEY',
    !sheetId && 'GOOGLE_SHEET_ID',
  ].filter(Boolean) as string[];
  if (missing.length || !clientEmail || !rawKey || !sheetId) return { ok: false, missing };
  return {
    ok: true,
    value: {
      clientEmail,
      // Env files and Vercel store the key with literal \n; turn them into real newlines.
      privateKey: rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
      sheetId,
      tab: env('GOOGLE_SHEET_TAB') ?? 'Enquiries',
    },
  };
}

export function mailConfig(): { ok: true; value: MailConfig } | { ok: false; missing: string[] } {
  const transport = env('EMAIL_TRANSPORT') === 'smtp' ? 'smtp' : 'resend';
  const to = env('CONTACT_TO_EMAIL');
  const from = env('CONTACT_FROM_EMAIL') ?? 'SMPH.Tech <onboarding@resend.dev>';
  const autoReply = env('SEND_AUTOREPLY') === 'true';
  const missing: string[] = [];
  if (!to) missing.push('CONTACT_TO_EMAIL');

  if (transport === 'resend') {
    const resendKey = env('RESEND_API_KEY');
    if (!resendKey) missing.push('RESEND_API_KEY');
    if (missing.length || !to || !resendKey) return { ok: false, missing };
    return { ok: true, value: { transport, to, from, resendKey, autoReply } };
  }

  const host = env('SMTP_HOST');
  const port = Number(env('SMTP_PORT') ?? 587);
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');
  if (missing.length || !to || !host || !user || !pass) return { ok: false, missing };
  // Gmail and most SMTP servers only send as the account that logs in.
  const smtpFrom = env('CONTACT_FROM_EMAIL') ?? `SMPH.Tech <${user}>`;
  return {
    ok: true,
    value: { transport, to, from: smtpFrom, smtp: { host, port, user, pass }, autoReply },
  };
}

export const sheetUrl = () => {
  const id = env('GOOGLE_SHEET_ID');
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : undefined;
};
