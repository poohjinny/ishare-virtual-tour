/**
 * Dev-only Ask Guide chat — OpenAI behind Vite `/__dev/api/ask-guide/*`.
 *
 * Env (server-only, never VITE_*):
 *   OPENAI_API_KEY          required for live replies
 *   OPENAI_ASK_GUIDE_MODEL  optional (default gpt-4o-mini)
 *
 * Put secrets in `.env.local` (not `.env.local.example`) and restart Vite.
 * Shared OpenAI logic lives in `api/shared/askGuideCore.mjs`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASK_GUIDE_DEFAULT_MODEL,
  askGuideChatCore,
  askGuideChatCoreStream,
  askGuideSseResponseStream,
} from '../../../../api/shared/askGuideCore.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Minimal .env parser — Vite may not put non-VITE_ keys on process.env yet. */
function readEnvFile(fileName) {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function resolveAskGuideEnv() {
  const fromFiles = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
  return {
    apiKey: (
      process.env.OPENAI_API_KEY ||
      fromFiles.OPENAI_API_KEY ||
      ''
    ).trim(),
    model: (
      process.env.OPENAI_ASK_GUIDE_MODEL ||
      fromFiles.OPENAI_ASK_GUIDE_MODEL ||
      ASK_GUIDE_DEFAULT_MODEL
    ).trim(),
  };
}

function askGuideModel() {
  return resolveAskGuideEnv().model || ASK_GUIDE_DEFAULT_MODEL;
}

export function askGuideModelName() {
  return askGuideModel();
}

export function isAskGuideLiveConfigured() {
  return Boolean(resolveAskGuideEnv().apiKey);
}

export async function askGuideChat({ context, messages }) {
  const { apiKey, model } = resolveAskGuideEnv();
  try {
    return await askGuideChatCore({ context, messages, apiKey, model });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('OPENAI_API_KEY is not set')
    ) {
      const localError = new Error(
        'OPENAI_API_KEY is not set. Add it to .env.local (not .env.local.example) and restart Vite.',
      );
      localError.statusCode = 503;
      throw localError;
    }
    throw error;
  }
}

/** Async iterable of Ask Guide stream events for the Vite SSE proxy. */
export async function* askGuideChatStream({ context, messages, signal }) {
  const { apiKey, model } = resolveAskGuideEnv();
  try {
    yield* askGuideChatCoreStream({ context, messages, apiKey, model, signal });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('OPENAI_API_KEY is not set')
    ) {
      const localError = new Error(
        'OPENAI_API_KEY is not set. Add it to .env.local (not .env.local.example) and restart Vite.',
      );
      localError.statusCode = 503;
      throw localError;
    }
    throw error;
  }
}

export { askGuideSseResponseStream };
