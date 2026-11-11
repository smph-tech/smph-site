import { describe, expect, it } from 'vitest';
import { SHEET_HEADERS, buildRow, formatIST, sanitizeCell } from '@/lib/sheet-row';

describe('sanitizeCell (formula injection)', () => {
  it.each([
    ['=SUM(A1:A9)', "'=SUM(A1:A9)"],
    ['=HYPERLINK("http://evil","click")', `'=HYPERLINK("http://evil","click")`],
    ['+1+1', "'+1+1"],
    ['-2+3', "'-2+3"],
    ['@SUM(1)', "'@SUM(1)"],
    ['\t=1+1', "'\t=1+1"],
    ['\r=1+1', "'\r=1+1"],
    ['+91 98765 43210', "'+91 98765 43210"],
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

describe('buildRow', () => {
  const row = buildRow({
    id: 'SMPH-ABCD1234',
    receivedAt: new Date('2026-03-05T20:45:00Z'),
    name: '=cmd|calc',
    contact: '+91 98765 43210',
    service: undefined,
    message: '@evil',
    page: '/services/web-applications',
  });
  it('matches the column order and count', () => {
    expect(SHEET_HEADERS).toEqual([
      'Received (IST)',
      'Name',
      'Email or phone',
      'Service',
      'Message',
      'Source page',
      'Status',
      'ID',
    ]);
    expect(row).toHaveLength(SHEET_HEADERS.length);
  });
  it('sanitises user fields and sets Status to New', () => {
    expect(row[0]).toBe("'2026-03-06 02:15");
    expect(row[1]).toBe("'=cmd|calc");
    expect(row[2]).toBe("'+91 98765 43210");
    expect(row[3]).toBe('Not specified');
    expect(row[4]).toBe("'@evil");
    expect(row[5]).toBe('/services/web-applications');
    expect(row[6]).toBe('New');
    expect(row[7]).toBe("'SMPH-ABCD1234");
  });
  it('never emits a cell that starts with a formula character', () => {
    for (const c of row) expect(c).not.toMatch(/^[=+\-@]/);
  });
});
