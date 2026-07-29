/**
 * Simple in-memory IP throttle for Ask Guide chat (per isolate/instance).
 * Early-stage abuse guard — resets on cold start / new isolate.
 */

const DEFAULT_LIMIT = 30;
const WINDOW_MS = 60_000;

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

function readEnv(key, envBag = {}) {
  const fromBag =
    envBag && typeof envBag[key] === 'string' ? envBag[key].trim() : '';
  if (fromBag) return fromBag;
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]).trim();
  }
  return '';
}

function resolveLimit(envBag = {}) {
  const raw = Number.parseInt(
    readEnv('ASK_GUIDE_RATE_LIMIT_PER_MIN', envBag),
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LIMIT;
}

/**
 * @param {string} key
 * @param {Record<string, string | undefined>} [envBag]
 * @returns {{ ok: true } | { ok: false, retryAfterSec: number }}
 */
export function consumeAskGuideRateLimit(key, envBag = {}) {
  const id = (key || 'unknown').trim() || 'unknown';
  const now = Date.now();
  const limit = resolveLimit(envBag);
  let bucket = buckets.get(id);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(id, bucket);
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}
