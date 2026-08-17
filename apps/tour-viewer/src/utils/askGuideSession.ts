import type { ChatMessage } from '../types/tour';
import { getTourClientId } from './tourClientId';

const STORAGE_PREFIX = 'ishare:askGuide:v1';
/** Keep the thread light — enough for a tour visit, not a novel. */
const MAX_STORED_MESSAGES = 40;

export type AskGuideSessionSnapshot = {
  messages: ChatMessage[];
  isOpen: boolean;
};

export function askGuideSessionKey(
  tour: Parameters<typeof getTourClientId>[0] & { id: string },
): string {
  return `${STORAGE_PREFIX}:${getTourClientId(tour)}:${tour.id}`;
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const entry = value as ChatMessage;
  return (
    typeof entry.id === 'string' &&
    (entry.role === 'user' || entry.role === 'assistant') &&
    typeof entry.content === 'string'
  );
}

export function readAskGuideSession(
  storageKey: string,
): AskGuideSessionSnapshot {
  if (!canUseSessionStorage() || !storageKey) {
    return { messages: [], isOpen: false };
  }
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return { messages: [], isOpen: false };
    const parsed = JSON.parse(raw) as { messages?: unknown; isOpen?: unknown };
    const messages =
      Array.isArray(parsed.messages) ?
        parsed.messages.filter(isChatMessage).slice(-MAX_STORED_MESSAGES)
      : [];
    return { messages, isOpen: parsed.isOpen === true };
  } catch {
    return { messages: [], isOpen: false };
  }
}

export function writeAskGuideSession(
  storageKey: string,
  snapshot: AskGuideSessionSnapshot,
): void {
  if (!canUseSessionStorage() || !storageKey) return;
  try {
    if (snapshot.messages.length === 0 && !snapshot.isOpen) {
      sessionStorage.removeItem(storageKey);
      return;
    }
    const payload: AskGuideSessionSnapshot = {
      messages: snapshot.messages.slice(-MAX_STORED_MESSAGES),
      isOpen: snapshot.isOpen,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore; chat still works in memory.
  }
}

export function clearAskGuideSession(storageKey: string): void {
  if (!canUseSessionStorage() || !storageKey) return;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

/** Highest `msg-N` suffix — bump the in-memory counter after hydrate. */
export function maxAskGuideMessageSeq(messages: ChatMessage[]): number {
  let max = 0;
  for (const msg of messages) {
    const match = /^msg-(\d+)$/.exec(msg.id);
    if (!match) continue;
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}
