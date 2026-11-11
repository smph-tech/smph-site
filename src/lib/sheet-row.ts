import type { ContactData } from './contact-schema';
import type { SheetPayload } from './apps-script';

/** Column order in the sheet. The Apps Script (apps-script/Code.gs) writes the same order. */
export const SHEET_HEADERS = [
  'Received (IST)',
  'Name',
  'Mobile',
  'Email',
  'Service',
  'Message',
  'Source page',
  'Status',
  'ID',
] as const;

/**
 * Stops spreadsheet formula injection. A cell that starts with = + - @ (or a
 * tab/CR, which some apps strip before parsing) gets a leading single quote,
 * which Google Sheets and Excel treat as "this is text".
 */
export function sanitizeCell(value: unknown): string {
  const s = String(value ?? '');
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** YYYY-MM-DD HH:mm in Asia/Kolkata. */
export function formatIST(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

export type EnquiryRecord = Pick<ContactData, 'name' | 'mobile' | 'email' | 'message'> & {
  service?: string;
  page?: string;
  id: string;
};

/**
 * The body sent to the Apps Script. Free-text fields are sanitised against formula injection.
 * `mobile` is not: the schema has already reduced it to digits with an optional leading +,
 * and the script stores every cell as plain text. The script adds the IST time and Status "New".
 */
export function buildSheetPayload(r: EnquiryRecord): SheetPayload {
  return {
    name: sanitizeCell(r.name),
    mobile: r.mobile,
    email: sanitizeCell(r.email),
    service: sanitizeCell(r.service || ''),
    message: sanitizeCell(r.message),
    source: sanitizeCell(r.page || ''),
    id: r.id,
  };
}
