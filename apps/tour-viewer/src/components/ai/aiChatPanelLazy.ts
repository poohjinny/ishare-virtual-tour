import { lazy } from 'react';

export const AiChatPanelLazy = lazy(() =>
  import('./AiChatPanel').then((module) => ({
    default: module.AiChatPanel,
  })),
);

let panelChunkPromise: Promise<unknown> | null = null;

/** Warm the guide panel chunk (FAB hover / idle). Safe to call repeatedly. */
export function preloadAiChatPanel(): void {
  if (!panelChunkPromise) {
    panelChunkPromise = import('./AiChatPanel');
  }
}
