import type { ContactData } from './contact-schema';

export const SHEET_HEADERS = [
  'Received (IST)',
  'Name',
  'Email or phone',
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

/** A trusted value that must stay as typed (not turned into a date or number). */
const asText = (s: string) => `'${s}`;

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

export type EnquiryRecord = Pick<ContactData, 'name' | 'contact' | 'message'> & {
  service?: string;
  page?: string;
  id: string;
  receivedAt: Date;
};

/** One sheet row, in the same order as SHEET_HEADERS. */
export function buildRow(r: EnquiryRecord): string[] {
  return [
    asText(formatIST(r.receivedAt)),
    sanitizeCell(r.name),
    sanitizeCell(r.contact),
    sanitizeCell(r.service || 'Not specified'),
    sanitizeCell(r.message),
    sanitizeCell(r.page || ''),
    'New',
    asText(r.id),
  ];
}
