import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetRateLimit, rateLimit } from '@/lib/rate-limit';
import { escapeHtml, oneLine, ownerEmail } from '@/lib/email-template';

describe('rateLimit', () => {
  beforeEach(() => __resetRateLimit());
  it('allows 5 per 10 minutes per key, then blocks', () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit('ip1', t + i).ok).toBe(true);
    const blocked = rateLimit('ip1', t + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rateLimit('ip2', t).ok).toBe(true);
  });
  it('lets the key back in after the window', () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) rateLimit('ip1', t);
    expect(rateLimit('ip1', t + 10 * 60 * 1000 + 1).ok).toBe(true);
  });
});

describe('email template', () => {
  const input = {
    id: 'SMPH-1',
    name: 'Eve <script>alert(1)</script>\nBcc: x@y.z',
    contact: 'eve@example.com',
    contactIsEmail: true,
    service: 'Mobile apps',
    message: '<img src=x onerror=alert(1)> & "quotes"',
    page: '/contact',
    receivedAt: new Date('2026-03-05T20:45:00Z'),
    sheetUrl: 'https://docs.google.com/spreadsheets/d/abc/edit',
  };
  const mail = ownerEmail(input);
  it('escapes HTML in the body', () => {
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;');
  });
  it('keeps the subject on one line', () => {
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.subject.startsWith('New enquiry: Eve')).toBe(true);
    expect(mail.subject.endsWith('(Mobile apps)')).toBe(true);
  });
  it('uses General when no service is chosen', () => {
    expect(ownerEmail({ ...input, service: undefined }).subject).toMatch(/\(General\)$/);
  });
  it('includes IST time, sheet link and plain text', () => {
    expect(mail.text).toContain('2026-03-06 02:15 IST');
    expect(mail.text).toContain(input.sheetUrl);
    expect(mail.html).toContain(input.sheetUrl);
  });
  it('helpers', () => {
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
    expect(oneLine('a\r\nb')).toBe('a b');
  });
});

describe('processEnquiry', () => {
  const data = {
    name: 'Asha Rao',
    contact: 'asha@example.com',
    message: 'Our bookings are all on WhatsApp.',
    startedAt: 1,
  };
  const configure = () => {
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL', 'svc@proj.iam.gserviceaccount.com');
    vi.stubEnv(
      'GOOGLE_PRIVATE_KEY',
      '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"',
    );
    vi.stubEnv('GOOGLE_SHEET_ID', 'sheet123');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CONTACT_TO_EMAIL', 'owner@example.com');
  };
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('succeeds when both work', async () => {
    configure();
    const { processEnquiry } = await import('@/lib/enquiry');
    const appendRow = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue(undefined);
    const r = await processEnquiry(data, { appendRow, send });
    expect(r).toMatchObject({ sheet: 'ok', email: 'ok', success: true });
    expect(send.mock.calls[0]?.[1]).toMatchObject({
      to: 'owner@example.com',
      replyTo: 'asha@example.com',
    });
    expect(appendRow.mock.calls[0]?.[0].privateKey).toContain('\n');
    expect(appendRow.mock.calls[0]?.[0].tab).toBe('Enquiries');
  });
  it('still succeeds when only the email fails', async () => {
    configure();
    const { processEnquiry } = await import('@/lib/enquiry');
    const r = await processEnquiry(data, {
      appendRow: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockRejectedValue(new Error('boom')),
    });
    expect(r).toMatchObject({ sheet: 'ok', email: 'failed', success: true });
  });
  it('still succeeds when only the sheet fails', async () => {
    configure();
    const { processEnquiry } = await import('@/lib/enquiry');
    const r = await processEnquiry(data, {
      appendRow: vi.fn().mockRejectedValue(new Error('403')),
      send: vi.fn().mockResolvedValue(undefined),
    });
    expect(r).toMatchObject({ sheet: 'failed', email: 'ok', success: true });
  });
  it('fails when both fail', async () => {
    configure();
    const { processEnquiry } = await import('@/lib/enquiry');
    const r = await processEnquiry(data, {
      appendRow: vi.fn().mockRejectedValue(new Error('403')),
      send: vi.fn().mockRejectedValue(new Error('boom')),
    });
    expect(r.success).toBe(false);
  });
  it('does not set reply-to for a phone number', async () => {
    configure();
    const { processEnquiry } = await import('@/lib/enquiry');
    const send = vi.fn().mockResolvedValue(undefined);
    await processEnquiry(
      { ...data, contact: '+91 98765 43210' },
      { appendRow: vi.fn().mockResolvedValue(undefined), send },
    );
    expect(send.mock.calls[0]?.[1].replyTo).toBeUndefined();
  });
  it('dev mode with no settings logs and reports success without sending', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { processEnquiry } = await import('@/lib/enquiry');
    const appendRow = vi.fn();
    const send = vi.fn();
    const r = await processEnquiry(data, { appendRow, send });
    expect(r).toMatchObject({ sheet: 'skipped', email: 'skipped', success: true });
    expect(appendRow).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(vi.mocked(console.log).mock.calls.flat().join(' ')).toContain('[dev] not sent');
  });
  it('production with no settings fails loudly', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { processEnquiry } = await import('@/lib/enquiry');
    const r = await processEnquiry(data, { appendRow: vi.fn(), send: vi.fn() });
    expect(r.success).toBe(false);
    expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain('Missing');
  });
  it('sends an auto-reply only when enabled and the visitor gave an email', async () => {
    configure();
    vi.stubEnv('SEND_AUTOREPLY', 'true');
    const { processEnquiry } = await import('@/lib/enquiry');
    const send = vi.fn().mockResolvedValue(undefined);
    await processEnquiry(data, { appendRow: vi.fn().mockResolvedValue(undefined), send });
    expect(send).toHaveBeenCalledTimes(2);
    send.mockClear();
    await processEnquiry(
      { ...data, contact: '+919876543210' },
      { appendRow: vi.fn().mockResolvedValue(undefined), send },
    );
    expect(send).toHaveBeenCalledTimes(1);
  });
});
