import { BRAND } from '@/content/site';

/** Server-side configuration, read from the environment on every call. */

export type AppsScriptConfig = { url: string; secret: string };

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

/** Where enquiries are saved: the Google Apps Script web app that writes to the sheet. */
export function appsScriptConfig():
  { ok: true; value: AppsScriptConfig } | { ok: false; missing: string[] } {
  const url = env('APPS_SCRIPT_URL');
  const secret = env('APPS_SCRIPT_SECRET');
  const missing = [!url && 'APPS_SCRIPT_URL', !secret && 'APPS_SCRIPT_SECRET'].filter(
    Boolean,
  ) as string[];
  if (missing.length || !url || !secret) return { ok: false, missing };
  return { ok: true, value: { url, secret } };
}

/**
 * Email is optional. With no RESEND_API_KEY it is simply off: no error, no log, no warning.
 * (EMAIL_TRANSPORT=smtp is an explicit opt-in to the Nodemailer fallback and needs the SMTP_* values.)
 */
export function mailConfig(): { enabled: false } | { enabled: true; value: MailConfig } {
  const smtpMode = env('EMAIL_TRANSPORT') === 'smtp';
  const to = env('CONTACT_TO_EMAIL');
  const autoReply = env('SEND_AUTOREPLY') === 'true';

  if (!smtpMode) {
    const resendKey = env('RESEND_API_KEY');
    if (!resendKey) return { enabled: false };
    if (!to) {
      // Server log only. A key without an inbox is a setup slip worth knowing about.
      console.warn('[contact] RESEND_API_KEY is set but CONTACT_TO_EMAIL is not; email is off.');
      return { enabled: false };
    }
    const from = env('CONTACT_FROM_EMAIL') ?? `${BRAND} <onboarding@resend.dev>`;
    return { enabled: true, value: { transport: 'resend', to, from, resendKey, autoReply } };
  }

  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!to || !host || !user || !pass) return { enabled: false };
  // Gmail and most SMTP servers only send as the account that logs in.
  const from = env('CONTACT_FROM_EMAIL') ?? `${BRAND} <${user}>`;
  const port = Number(env('SMTP_PORT') ?? 587);
  return {
    enabled: true,
    value: { transport: 'smtp', to, from, smtp: { host, port, user, pass }, autoReply },
  };
}

/** Optional link shown in the owner email, e.g. https://docs.google.com/spreadsheets/d/<id>/edit */
export const sheetUrl = () => env('SHEET_URL');
