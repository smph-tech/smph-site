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
    mobile: '+919876543210',
    email: 'eve@example.com',
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
    mobile: '+919876543210',
    email: 'asha@example.com',
    message: 'Our bookings are all on WhatsApp.',
    startedAt: 1,
  };
  const withScript = () => {
    vi.stubEnv('APPS_SCRIPT_URL', 'https://script.google.com/macros/s/AKfy123/exec');
    vi.stubEnv('APPS_SCRIPT_SECRET', 's3cret');
  };
  const withEmail = () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CONTACT_TO_EMAIL', 'owner@example.com');
  };
  const ok = () => vi.fn().mockResolvedValue(undefined);
  const importIt = async () => (await import('@/lib/enquiry')).processEnquiry;

  beforeEach(() => {
    vi.unstubAllEnvs();
    // Make sure the machine running the tests does not leak real settings in.
    for (const k of [
      'APPS_SCRIPT_URL',
      'APPS_SCRIPT_SECRET',
      'RESEND_API_KEY',
      'CONTACT_TO_EMAIL',
      'EMAIL_TRANSPORT',
      'SEND_AUTOREPLY',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'SHEET_URL',
    ]) {
      vi.stubEnv(k, '');
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('succeeds with only the Apps Script configured: email is skipped silently', async () => {
    withScript();
    const processEnquiry = await importIt();
    const saveRow = ok();
    const send = ok();
    const r = await processEnquiry(data, { saveRow, send });
    expect(r).toMatchObject({ sheet: 'ok', email: 'skipped', success: true });
    expect(send).not.toHaveBeenCalled();
    expect(saveRow.mock.calls[0]?.[0]).toEqual({
      url: 'https://script.google.com/macros/s/AKfy123/exec',
      secret: 's3cret',
    });
    expect(saveRow.mock.calls[0]?.[1]).toMatchObject({
      name: 'Asha Rao',
      mobile: '+919876543210',
      email: 'asha@example.com',
      source: '',
    });
    // No error and no warning anywhere when email is simply off.
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('email stays off in production too, without errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    withScript();
    const processEnquiry = await importIt();
    const send = ok();
    const r = await processEnquiry(data, { saveRow: ok(), send });
    expect(r).toMatchObject({ sheet: 'ok', email: 'skipped', success: true });
    expect(send).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not need any email variable other than RESEND_API_KEY to be off', async () => {
    withScript();
    vi.stubEnv('CONTACT_TO_EMAIL', 'owner@example.com'); // inbox set, but no key
    const processEnquiry = await importIt();
    const send = ok();
    const r = await processEnquiry(data, { saveRow: ok(), send });
    expect(r.email).toBe('skipped');
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the owner email too when Resend is configured, with reply-to set to the visitor', async () => {
    withScript();
    withEmail();
    const processEnquiry = await importIt();
    const send = ok();
    const r = await processEnquiry(data, { saveRow: ok(), send });
    expect(r).toMatchObject({ sheet: 'ok', email: 'ok', success: true });
    expect(send.mock.calls[0]?.[1]).toMatchObject({
      to: 'owner@example.com',
      replyTo: 'asha@example.com',
    });
    expect(send.mock.calls[0]?.[1].text).toContain('Mobile: +919876543210');
  });

  it('still succeeds when the Apps Script call fails but the email goes out', async () => {
    withScript();
    withEmail();
    const processEnquiry = await importIt();
    const r = await processEnquiry(data, {
      saveRow: vi.fn().mockRejectedValue(new Error('Apps Script did not confirm')),
      send: ok(),
    });
    expect(r).toMatchObject({ sheet: 'failed', email: 'ok', success: true });
  });

  it('fails when the Apps Script call fails and email is off', async () => {
    withScript();
    const processEnquiry = await importIt();
    const r = await processEnquiry(data, {
      saveRow: vi.fn().mockRejectedValue(new Error('boom')),
      send: ok(),
    });
    expect(r).toMatchObject({ sheet: 'failed', email: 'skipped', success: false });
  });

  it('fails when both fail', async () => {
    withScript();
    withEmail();
    const processEnquiry = await importIt();
    const r = await processEnquiry(data, {
      saveRow: vi.fn().mockRejectedValue(new Error('boom')),
      send: vi.fn().mockRejectedValue(new Error('boom')),
    });
    expect(r.success).toBe(false);
  });

  it('dev mode with nothing configured logs and reports success without sending', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const processEnquiry = await importIt();
    const saveRow = vi.fn();
    const send = vi.fn();
    const r = await processEnquiry(data, { saveRow, send });
    expect(r).toMatchObject({ sheet: 'skipped', email: 'skipped', success: true });
    expect(saveRow).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(vi.mocked(console.log).mock.calls.flat().join(' ')).toContain('[dev] not sent');
  });

  it('production with nothing configured fails loudly', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const processEnquiry = await importIt();
    const r = await processEnquiry(data, { saveRow: vi.fn(), send: vi.fn() });
    expect(r.success).toBe(false);
    expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain('Missing');
  });

  it('sends an auto-reply only when email is on and SEND_AUTOREPLY=true', async () => {
    withScript();
    withEmail();
    vi.stubEnv('SEND_AUTOREPLY', 'true');
    const processEnquiry = await importIt();
    const send = ok();
    await processEnquiry(data, { saveRow: ok(), send });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1]?.[1].to).toBe('asha@example.com');

    vi.stubEnv('SEND_AUTOREPLY', 'false');
    const send2 = ok();
    await processEnquiry(data, { saveRow: ok(), send: send2 });
    expect(send2).toHaveBeenCalledTimes(1);
  });

  it('smtp fallback is used only when explicitly chosen and fully configured', async () => {
    withScript();
    vi.stubEnv('EMAIL_TRANSPORT', 'smtp');
    const processEnquiry = await importIt();
    const send = ok();
    expect((await processEnquiry(data, { saveRow: ok(), send })).email).toBe('skipped');

    vi.stubEnv('SMTP_HOST', 'smtp.gmail.com');
    vi.stubEnv('SMTP_USER', 'me@gmail.com');
    vi.stubEnv('SMTP_PASS', 'app-password');
    vi.stubEnv('CONTACT_TO_EMAIL', 'owner@example.com');
    expect((await processEnquiry(data, { saveRow: ok(), send })).email).toBe('ok');
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      transport: 'smtp',
      from: 'SMPH.Tech <me@gmail.com>',
    });
  });
});
