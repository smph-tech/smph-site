import { randomUUID } from 'node:crypto';
import type { ContactData } from './contact-schema';
import { isEmail } from './contact-schema';
import { autoReplyEmail, ownerEmail } from './email-template';
import { isProd, mailConfig, sheetUrl, sheetsConfig, type MailConfig, type SheetsConfig } from './env';
import { sendMail, type Mail } from './mailer';
import { buildRow } from './sheet-row';
import { appendEnquiryRow } from './sheets';
import { SITE, isPlaceholder } from '@/content/site';

export type Outcome = 'ok' | 'failed' | 'skipped';
export type EnquiryResult = { id: string; sheet: Outcome; email: Outcome; success: boolean };

export type Deps = {
  appendRow: (cfg: SheetsConfig, row: string[]) => Promise<void>;
  send: (cfg: MailConfig, mail: Mail) => Promise<void>;
};
const realDeps: Deps = { appendRow: appendEnquiryRow, send: sendMail };

/**
 * Saves the enquiry to the sheet and emails the owner, in parallel.
 * Success means at least one of the two worked.
 * In development with nothing configured, it logs the payload and reports success.
 */
export async function processEnquiry(
  data: ContactData,
  deps: Deps = realDeps,
  now = new Date(),
): Promise<EnquiryResult> {
  const id = `SMPH-${randomUUID().slice(0, 8).toUpperCase()}`;
  const sheets = sheetsConfig();
  const mail = mailConfig();

  if (!isProd() && !sheets.ok && !mail.ok) {
    console.log(
      `[dev] not sent: no Google Sheets or email settings found. Missing: ${[
        ...sheets.missing,
        ...mail.missing,
      ].join(', ')}`,
    );
    console.log('[dev] enquiry payload:', { id, ...data, startedAt: undefined, company: undefined });
    return { id, sheet: 'skipped', email: 'skipped', success: true };
  }

  const service = data.service || undefined;
  const contactIsEmail = isEmail(data.contact);
  const record = {
    name: data.name,
    contact: data.contact,
    message: data.message,
    service,
    page: data.page,
    id,
    receivedAt: now,
  };

  const sheetTask = async (): Promise<Outcome> => {
    if (!sheets.ok) throw new Error(`Google Sheets not configured. Missing: ${sheets.missing.join(', ')}`);
    await deps.appendRow(sheets.value, buildRow(record));
    return 'ok';
  };

  const emailTask = async (): Promise<Outcome> => {
    if (!mail.ok) throw new Error(`Email not configured. Missing: ${mail.missing.join(', ')}`);
    const msg = ownerEmail({ ...record, contactIsEmail, sheetUrl: sheetUrl() });
    await deps.send(mail.value, {
      to: mail.value.to,
      ...msg,
      replyTo: contactIsEmail ? data.contact.trim() : undefined,
    });
    return 'ok';
  };

  const [s, e] = await Promise.allSettled([sheetTask(), emailTask()]);
  const sheetOutcome: Outcome = s.status === 'fulfilled' ? s.value : 'failed';
  const emailOutcome: Outcome = e.status === 'fulfilled' ? e.value : 'failed';

  // Server-side detail only. Never sent to the browser.
  if (s.status === 'rejected') console.error('[contact] sheet failed:', id, errorSummary(s.reason));
  if (e.status === 'rejected') console.error('[contact] email failed:', id, errorSummary(e.reason));

  // Optional receipt to the visitor. Never affects the result.
  if (emailOutcome === 'ok' && mail.ok && mail.value.autoReply && contactIsEmail) {
    const reply = autoReplyEmail(data.name, isPlaceholder(SITE.replyTime) ? null : SITE.replyTime);
    deps
      .send(mail.value, { to: data.contact.trim(), ...reply })
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
