/**
 * Cloudflare Worker — Ask Guide production chat API (preferred early-live path).
 *
 * Routes:
 *   GET  /api/tour/chat/status
 *   POST /api/tour/chat
 *
 * Secrets / vars (wrangler, never VITE_*):
 *   OPENAI_API_KEY (secret)
 *   OPENAI_ASK_GUIDE_MODEL (optional var)
 *   ASK_GUIDE_CORS_ORIGINS (optional var)
 *   ASK_GUIDE_RATE_LIMIT_PER_MIN (optional var)
 */

import {
  ASK_GUIDE_DEFAULT_MODEL,
  askGuideChatCore,
} from '../../api/shared/askGuideCore.mjs';
import { corsHeaders, resolveCorsOrigin } from '../../api/shared/cors.mjs';
import { consumeAskGuideRateLimit } from '../../api/shared/rateLimit.mjs';

function requestOrigin(request) {
  return request.headers.get('origin') || '';
}

function clientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function jsonResponse(status, body, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin, env),
    },
  });
}

function optionsResponse(origin, env) {
  const allowed = resolveCorsOrigin(origin, env);
  return new Response(null, {
    status: allowed || !origin ? 204 : 403,
    headers: corsHeaders(origin, env),
  });
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const origin = requestOrigin(request);

    if (request.method === 'OPTIONS') {
      return optionsResponse(origin, env);
    }

    if (path === '/api/tour/chat/status' && request.method === 'GET') {
      const apiKey = (env.OPENAI_API_KEY || '').trim();
      const model = (
        env.OPENAI_ASK_GUIDE_MODEL || ASK_GUIDE_DEFAULT_MODEL
      ).trim();
      const enabled = Boolean(apiKey);
      return jsonResponse(
        200,
        { ok: true, enabled, model: enabled ? model : null },
        origin,
        env,
      );
    }

    if (path === '/api/tour/chat' && request.method === 'POST') {
      if (origin && !resolveCorsOrigin(origin, env)) {
        return jsonResponse(403, { error: 'Origin not allowed' }, origin, env);
      }

      const rate = consumeAskGuideRateLimit(clientIp(request), env);
      if (!rate.ok) {
        return new Response(
          JSON.stringify({
            error: 'Too many Ask Guide requests. Try again shortly.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Retry-After': String(rate.retryAfterSec),
              ...corsHeaders(origin, env),
            },
          },
        );
      }

      const apiKey = (env.OPENAI_API_KEY || '').trim();
      if (!apiKey) {
        return jsonResponse(
          503,
          {
            error:
              'Ask Guide live is not configured. Set OPENAI_API_KEY on the Worker.',
          },
          origin,
          env,
        );
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse(400, { error: 'Invalid JSON body' }, origin, env);
      }

      try {
        const result = await askGuideChatCore({
          context: body?.context,
          messages: body?.messages,
          apiKey,
          model: (env.OPENAI_ASK_GUIDE_MODEL || ASK_GUIDE_DEFAULT_MODEL).trim(),
        });
        return jsonResponse(200, { ok: true, ...result }, origin, env);
      } catch (error) {
        const statusCode =
          typeof error?.statusCode === 'number' ? error.statusCode : 500;
        return jsonResponse(
          statusCode,
          {
            error: error instanceof Error ? error.message : 'Ask Guide failed',
          },
          origin,
          env,
        );
      }
    }

    return jsonResponse(404, { error: 'Not found' }, origin, env);
  },
};
