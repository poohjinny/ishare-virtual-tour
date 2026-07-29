/**
 * CORS helpers for Ask Guide (Azure Functions + Cloudflare Workers).
 *
 * Allowlist: production tour host + local Vite. Extra origins via
 * ASK_GUIDE_CORS_ORIGINS (comma-separated).
 */

const DEFAULT_ORIGINS = [
  'https://tour.ishare.ca',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function readEnv(key, envBag = {}) {
  const fromBag =
    envBag && typeof envBag[key] === 'string' ? envBag[key].trim() : '';
  if (fromBag) return fromBag;
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]).trim();
  }
  return '';
}

export function resolveAskGuideCorsOrigins(envBag = {}) {
  const extra = readEnv('ASK_GUIDE_CORS_ORIGINS', envBag)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extra])];
}

export function resolveCorsOrigin(requestOrigin, envBag = {}) {
  if (!requestOrigin) return null;
  const allowed = resolveAskGuideCorsOrigins(envBag);
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

export function corsHeaders(requestOrigin, envBag = {}) {
  const origin = resolveCorsOrigin(requestOrigin, envBag);
  if (!origin) {
    return {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
