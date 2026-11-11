import type { AppsScriptConfig } from './env';

/** What the Apps Script web app receives (plus `secret`). */
export type SheetPayload = {
  name: string;
  mobile: string;
  email: string;
  service: string;
  message: string;
  source: string;
  id: string;
};

const TIMEOUT_MS = 20_000;

/**
 * Sends one enquiry to the Google Apps Script web app, which appends the sheet row.
 * Resolves only when the script answers with JSON `{ ok: true }`; throws otherwise.
 *
 * Apps Script answers a POST with a redirect to the real response, so redirects are followed.
 * `text/plain` keeps the request "simple" for Apps Script (it does not parse JSON bodies itself;
 * the script reads `e.postData.contents`).
 */
export async function postToAppsScript(
  cfg: AppsScriptConfig,
  payload: SheetPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(cfg.url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: cfg.secret, ...payload }),
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await res.text();
  let body: { ok?: unknown; error?: unknown } | null = null;
  try {
    body = JSON.parse(text) as { ok?: unknown; error?: unknown };
  } catch {
    // Apps Script returns an HTML page for crashes, bad deployments and login walls.
    throw new Error(`Apps Script did not return JSON (HTTP ${res.status})`);
  }
  if (body?.ok !== true) {
    const why = typeof body?.error === 'string' ? `: ${body.error.slice(0, 120)}` : '';
    throw new Error(`Apps Script did not confirm the save (HTTP ${res.status})${why}`);
  }
}
