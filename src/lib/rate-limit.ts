/**
 * In-memory sliding-window rate limit: 5 submissions per IP per 10 minutes.
 * This only works inside one server instance. On Vercel (many instances) swap
 * it for Upstash Redis or Vercel KV; see the README.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

export function rateLimit(key: string, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterSec: Math.ceil((oldest + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing forever.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

export const __resetRateLimit = () => hits.clear();
