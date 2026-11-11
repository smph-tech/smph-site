import { describe, expect, it } from 'vitest';
import { SHEET_HEADERS, buildSheetPayload, formatIST, sanitizeCell } from '@/lib/sheet-row';

describe('sanitizeCell (formula injection)', () => {
  it.each([
    ['=SUM(A1:A9)', "'=SUM(A1:A9)"],
    ['=HYPERLINK("http://evil","click")', `'=HYPERLINK("http://evil","click")`],
    ['+1+1', "'+1+1"],
    ['-2+3', "'-2+3"],
    ['@SUM(1)', "'@SUM(1)"],
    ['\t=1+1', "'\t=1+1"],
    ['\r=1+1', "'\r=1+1"],
  ])('prefixes %j', (input, expected) => expect(sanitizeCell(input)).toBe(expected));

  it.each(['Hello', 'a=b', 'email@x.com', '', 'a+b', '1+1', ' =1'])('leaves %j alone', (v) =>
    expect(sanitizeCell(v)).toBe(v),
  );
  it('handles non-strings', () => {
    expect(sanitizeCell(undefined)).toBe('');
    expect(sanitizeCell(null)).toBe('');
    expect(sanitizeCell(42)).toBe('42');
  });
});

describe('formatIST', () => {
  it('formats in Asia/Kolkata as YYYY-MM-DD HH:mm', () => {
    expect(formatIST(new Date('2026-03-05T20:45:00Z'))).toBe('2026-03-06 02:15');
    expect(formatIST(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01 05:30');
  });
});

describe('sheet columns', () => {
  it('are in the agreed order', () => {
    expect(SHEET_HEADERS).toEqual([
      'Received (IST)',
      'Name',
      'Mobile',
      'Email',
      'Service',
      'Message',
      'Source page',
      'Status',
      'ID',
    ]);
  });
});

describe('buildSheetPayload', () => {
  const payload = buildSheetPayload({
    id: 'SMPH-ABCD1234',
    name: '=cmd|calc',
    mobile: '+919876543210',
    email: 'a@b.co',
    service: undefined,
    message: '@evil',
    page: '/services/web-applications',
  });
  it('has exactly the fields the Apps Script expects (secret is added when sending)', () => {
    expect(Object.keys(payload)).toEqual([
      'name',
      'mobile',
      'email',
      'service',
      'message',
      'source',
      'id',
    ]);
  });
  it('sanitises free-text fields and leaves the validated mobile number clean', () => {
    expect(payload.name).toBe("'=cmd|calc");
    expect(payload.message).toBe("'@evil");
    expect(payload.mobile).toBe('+919876543210');
    expect(payload.source).toBe('/services/web-applications');
    expect(payload.service).toBe('');
    expect(payload.id).toBe('SMPH-ABCD1234');
  });
});
