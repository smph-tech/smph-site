import { NextResponse, type NextRequest } from 'next/server';
import { MIN_FILL_MS, contactSchema } from '@/lib/contact-schema';
import { processEnquiry } from '@/lib/enquiry';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Apps Script can take a few seconds to answer.
export const maxDuration = 30;

const MAX_BODY_BYTES = 20_000;

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  const started = Date.now();

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Message too large.' }, 413);
  }

  const limit = rateLimit(clientIp(req));
  if (!limit.ok) {
    console.log(JSON.stringify({ evt: 'contact', outcome: 'rate_limited' }));
    return NextResponse.json(
      { ok: false, error: 'Too many messages from this connection. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSec), 'Cache-Control': 'no-store' },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  // Bots: honeypot filled or form posted in under 3 seconds.
  // Answer like a success so they learn nothing, and do nothing.
  const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const honeypot = typeof raw.company === 'string' && raw.company.trim() !== '';
  const startedAt = typeof raw.startedAt === 'number' ? raw.startedAt : NaN;
  const tooFast = !Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS;
  if (honeypot || tooFast) {
    console.log(JSON.stringify({ evt: 'contact', outcome: honeypot ? 'honeypot' : 'too_fast' }));
    return json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fields[key] ??= issue.message;
    }
    return json({ ok: false, error: 'Please check the form.', fields }, 400);
  }

  try {
    const result = await processEnquiry(parsed.data);
    console.log(
      JSON.stringify({
        evt: 'contact',
        id: result.id,
        sheet: result.sheet,
        email: result.email,
        ok: result.success,
        ms: Date.now() - started,
      }),
    );
    if (!result.success) {
      return json(
        { ok: false, error: 'Something went wrong on our side. Please email us instead.' },
        500,
      );
    }
    return json({ ok: true, id: result.id });
  } catch (err) {
    console.error('[contact] unexpected failure:', err instanceof Error ? err.name : 'unknown');
    return json(
      { ok: false, error: 'Something went wrong on our side. Please email us instead.' },
      500,
    );
  }
}

export function GET() {
  return json({ ok: false, error: 'Method not allowed.' }, 405);
}
