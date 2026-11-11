import { describe, expect, it, vi } from 'vitest';
import { postToAppsScript } from '@/lib/apps-script';

const cfg = { url: 'https://script.google.com/macros/s/AKfy123/exec', secret: 's3cret' };
const payload = {
  name: 'Asha Rao',
  mobile: '+919876543210',
  email: 'asha@example.com',
  service: 'Mobile apps',
  message: 'Our bookings are all on WhatsApp.',
  source: '/contact',
  id: 'SMPH-1A2B3C4D',
};
const reply = (body: string, status = 200) =>
  vi.fn().mockResolvedValue(new Response(body, { status }));

describe('postToAppsScript', () => {
  it('posts the JSON as text/plain, follows redirects, and includes the secret', async () => {
    const fetchMock = reply('{"ok":true}');
    await postToAppsScript(cfg, payload, fetchMock as unknown as typeof fetch);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(cfg.url);
    expect(init.method).toBe('POST');
    expect(init.redirect).toBe('follow');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'text/plain;charset=utf-8',
    );
    expect(JSON.parse(init.body as string)).toEqual({ secret: 's3cret', ...payload });
  });

  it('succeeds only when the response JSON has ok: true', async () => {
    await expect(
      postToAppsScript(cfg, payload, reply('{"ok":true}') as unknown as typeof fetch),
    ).resolves.toBeUndefined();
  });

  it.each([
    ['ok false', '{"ok":false,"error":"unauthorized"}', 200],
    ['ok missing', '{}', 200],
    ['ok is a string', '{"ok":"true"}', 200],
    ['ok false with an HTTP 500', '{"ok":false}', 500],
  ])('rejects when %s', async (_name, body, status) => {
    await expect(
      postToAppsScript(cfg, payload, reply(body, status) as unknown as typeof fetch),
    ).rejects.toThrow(/did not confirm/);
  });

  it('rejects when Apps Script answers with an HTML page', async () => {
    await expect(
      postToAppsScript(cfg, payload, reply('<html>Sign in</html>', 200) as unknown as typeof fetch),
    ).rejects.toThrow(/did not return JSON/);
  });

  it('rejects when the network fails', async () => {
    const down = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    await expect(postToAppsScript(cfg, payload, down as unknown as typeof fetch)).rejects.toThrow(
      'fetch failed',
    );
  });

  it('never puts the secret in an error message', async () => {
    const err = await postToAppsScript(
      cfg,
      payload,
      reply('{"ok":false,"error":"unauthorized"}') as unknown as typeof fetch,
    ).catch((e: Error) => e);
    expect(String(err)).not.toContain('s3cret');
  });
});
