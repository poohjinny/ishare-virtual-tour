/**
 * Azure Functions — Ask Guide production chat API.
 *
 * Routes (anonymous):
 *   GET  /api/tour/chat/status
 *   POST /api/tour/chat
 *
 * Secrets (Function App settings, never VITE_*):
 *   OPENAI_API_KEY
 *   OPENAI_ASK_GUIDE_MODEL (optional)
 *   ASK_GUIDE_CORS_ORIGINS (optional comma list)
 *   ASK_GUIDE_RATE_LIMIT_PER_MIN (optional, default 30)
 */

import { app } from '@azure/functions';
import {
  ASK_GUIDE_DEFAULT_MODEL,
  askGuideChatCore,
} from '../../shared/askGuideCore.mjs';
import { corsHeaders, resolveCorsOrigin } from '../../shared/cors.mjs';
import { consumeAskGuideRateLimit } from '../../shared/rateLimit.mjs';

function requestOrigin(request) {
  return request.headers.get('origin') || '';
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function jsonResponse(status, body, origin) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
    jsonBody: body,
  };
}

function optionsResponse(origin) {
  const allowed = resolveCorsOrigin(origin);
  return {
    status: allowed || !origin ? 204 : 403,
    headers: corsHeaders(origin),
  };
}

function resolveAskGuideEnv() {
  return {
    apiKey: (process.env.OPENAI_API_KEY || '').trim(),
    model: (
      process.env.OPENAI_ASK_GUIDE_MODEL || ASK_GUIDE_DEFAULT_MODEL
    ).trim(),
  };
}

app.http('tourChatStatus', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'tour/chat/status',
  handler: async (request) => {
    const origin = requestOrigin(request);
    if (request.method === 'OPTIONS') {
      return optionsResponse(origin);
    }

    const { apiKey, model } = resolveAskGuideEnv();
    const enabled = Boolean(apiKey);
    return jsonResponse(
      200,
      {
        ok: true,
        enabled,
        model: enabled ? model || ASK_GUIDE_DEFAULT_MODEL : null,
      },
      origin,
    );
  },
});

app.http('tourChat', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'tour/chat',
  handler: async (request) => {
    const origin = requestOrigin(request);
    if (request.method === 'OPTIONS') {
      return optionsResponse(origin);
    }

    if (origin && !resolveCorsOrigin(origin)) {
      return jsonResponse(403, { error: 'Origin not allowed' }, origin);
    }

    const rate = consumeAskGuideRateLimit(clientIp(request));
    if (!rate.ok) {
      return {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(rate.retryAfterSec),
          ...corsHeaders(origin),
        },
        jsonBody: { error: 'Too many Ask Guide requests. Try again shortly.' },
      };
    }

    const { apiKey, model } = resolveAskGuideEnv();
    if (!apiKey) {
      return jsonResponse(
        503,
        {
          error:
            'Ask Guide live is not configured. Set OPENAI_API_KEY on the Function App.',
        },
        origin,
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' }, origin);
    }

    try {
      const result = await askGuideChatCore({
        context: body?.context,
        messages: body?.messages,
        apiKey,
        model,
      });
      return jsonResponse(200, { ok: true, ...result }, origin);
    } catch (error) {
      const statusCode =
        typeof error?.statusCode === 'number' ? error.statusCode : 500;
      return jsonResponse(
        statusCode,
        { error: error instanceof Error ? error.message : 'Ask Guide failed' },
        origin,
      );
    }
  },
});
