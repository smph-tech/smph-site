import { randomUUID } from 'node:crypto';
import type { ContactData } from './contact-schema';
import { postToAppsScript, type SheetPayload } from './apps-script';
import { autoReplyEmail, ownerEmail } from './email-template';
import {
  appsScriptConfig,
  isProd,
  mailConfig,
  sheetUrl,
  type AppsScriptConfig,
  type MailConfig,
} from './env';
import { sendMail, type Mail } from './mailer';
import { buildSheetPayload } from './sheet-row';
import { SITE, isPlaceholder } from '@/content/site';

export type Outcome = 'ok' | 'failed' | 'skipped';
export type EnquiryResult = { id: string; sheet: Outcome; email: Outcome; success: boolean };

export type Deps = {
  saveRow: (cfg: AppsScriptConfig, payload: SheetPayload) => Promise<void>;
  send: (cfg: MailConfig, mail: Mail) => Promise<void>;
};
const realDeps: Deps = {
  saveRow: (cfg, payload) => postToAppsScript(cfg, payload),
  send: sendMail,
};

/**
 * Saves the enquiry through the Apps Script and, only if email is configured, emails the owner.
 * Both run in parallel. Success means at least one of them worked, so an enquiry is never
 * reported as failed while it actually reached the owner.
 * In development with nothing configured, it logs the payload and reports success.
 */
export async function processEnquiry(
  data: ContactData,
  deps: Deps = realDeps,
  now = new Date(),
): Promise<EnquiryResult> {
  const id = `SMPH-${randomUUID().slice(0, 8).toUpperCase()}`;
  const script = appsScriptConfig();
  const mail = mailConfig();

  if (!isProd() && !script.ok && !mail.enabled) {
    console.log(
      `[dev] not sent: no Apps Script settings found. Missing: ${script.missing.join(', ')}`,
    );
    console.log('[dev] enquiry payload:', {
      id,
      ...data,
      startedAt: undefined,
      company: undefined,
    });
    return { id, sheet: 'skipped', email: 'skipped', success: true };
  }

  const service = data.service || undefined;
  const record = {
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    message: data.message,
    service,
    page: data.page,
    id,
  };

  const sheetTask = async (): Promise<Outcome> => {
    if (!script.ok)
      throw new Error(`Apps Script not configured. Missing: ${script.missing.join(', ')}`);
    await deps.saveRow(script.value, buildSheetPayload(record));
    return 'ok';
  };

  // Email off means skipped: no error, no log, nothing for the visitor to see.
  const emailTask = async (): Promise<Outcome> => {
    if (!mail.enabled) return 'skipped';
    const msg = ownerEmail({ ...record, receivedAt: now, sheetUrl: sheetUrl() });
    await deps.send(mail.value, { to: mail.value.to, ...msg, replyTo: data.email });
    return 'ok';
  };

  const [s, e] = await Promise.allSettled([sheetTask(), emailTask()]);
  const sheetOutcome: Outcome = s.status === 'fulfilled' ? s.value : 'failed';
  const emailOutcome: Outcome = e.status === 'fulfilled' ? e.value : 'failed';

  // Server-side detail only. Never sent to the browser.
  if (s.status === 'rejected') console.error('[contact] save failed:', id, errorSummary(s.reason));
  if (e.status === 'rejected') console.error('[contact] email failed:', id, errorSummary(e.reason));

  // Optional receipt to the visitor. Never affects the result.
  if (emailOutcome === 'ok' && mail.enabled && mail.value.autoReply) {
    const reply = autoReplyEmail(data.name, isPlaceholder(SITE.replyTime) ? null : SITE.replyTime);
    deps
      .send(mail.value, { to: data.email, ...reply })
      .catch((err) => console.error('[contact] auto-reply failed:', id, errorSummary(err)));
  }

  return {
    id,
    sheet: sheetOutcome,
    email: emailOutcome,
    success: sheetOutcome === 'ok' || emailOutcome === 'ok',
  };
}

const errorSummary = (err: unknown) =>
  err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error';
