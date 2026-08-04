/** `postMessage` namespace — parent pages filter on `source`. */
export const TOUR_EMBED_MESSAGE_SOURCE = 'ishare-virtual-tour' as const;

export type TourEmbedMessageType = 'tour:ready' | 'tour:scene' | 'tour:resize';

interface TourEmbedMessageBase {
  source: typeof TOUR_EMBED_MESSAGE_SOURCE;
  type: TourEmbedMessageType;
  tourId: string;
}

export interface TourEmbedReadyMessage extends TourEmbedMessageBase {
  type: 'tour:ready';
  sceneId: string;
}

export interface TourEmbedSceneMessage extends TourEmbedMessageBase {
  type: 'tour:scene';
  sceneId: string;
  namingHotspotId: string | null;
}

export interface TourEmbedResizeMessage extends TourEmbedMessageBase {
  type: 'tour:resize';
  height: number;
}

export type TourEmbedMessage =
  | TourEmbedReadyMessage
  | TourEmbedSceneMessage
  | TourEmbedResizeMessage;

export type TourEmbedMessagePayload =
  | Omit<TourEmbedReadyMessage, 'source'>
  | Omit<TourEmbedSceneMessage, 'source'>
  | Omit<TourEmbedResizeMessage, 'source'>;

type TourEmbedDebugListener = (message: TourEmbedMessagePayload) => void;

const debugListeners = new Set<TourEmbedDebugListener>();

/** Dev panel — observe outbound embed messages without listening on `window`. */
export function subscribeTourEmbedDebug(
  listener: TourEmbedDebugListener,
): () => void {
  debugListeners.add(listener);
  return () => debugListeners.delete(listener);
}

function notifyTourEmbedDebug(message: TourEmbedMessagePayload): void {
  if (debugListeners.size === 0) return;
  for (const listener of debugListeners) {
    listener(message);
  }
}

export function postTourEmbedMessage(message: TourEmbedMessagePayload): void {
  notifyTourEmbedDebug(message);
  if (window.parent === window) return;
  window.parent.postMessage(
    { source: TOUR_EMBED_MESSAGE_SOURCE, ...message },
    '*',
  );
}

/** Parent harness — narrow `message` events to known tour embed payloads. */
export function parseTourEmbedMessage(data: unknown): TourEmbedMessage | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.source !== TOUR_EMBED_MESSAGE_SOURCE) return null;
  if (typeof message.tourId !== 'string' || typeof message.type !== 'string') {
    return null;
  }
  if (
    message.type !== 'tour:ready' &&
    message.type !== 'tour:scene' &&
    message.type !== 'tour:resize'
  ) {
    return null;
  }
  return data as TourEmbedMessage;
}
