import { useCallback, useMemo, useRef } from 'react';

export type TourPanelStackId =
  | 'explore-search'
  | 'explore'
  | 'help'
  | 'share'
  | 'info-popup'
  | 'ai-chat'
  | 'dev-panel'
  | 'anchored-panel';

type CloseHandler = () => void;

export interface TourPanelStack {
  openPanel: (id: TourPanelStackId) => void;
  closePanel: (id: TourPanelStackId) => void;
  closeTopPanel: () => boolean;
  registerPanel: (id: TourPanelStackId, onClose: CloseHandler) => () => void;
}

/**
 * Top-right dock chrome ↔ Ask Guide: only one surface at a time.
 * Explore search nests inside Explore, so it must not close Explore —
 * it only yields Ask Guide (and vice versa). Scene NO / nav panels stay
 * independent.
 */
function mutexClosuresFor(id: TourPanelStackId): TourPanelStackId[] {
  if (id === 'ai-chat') {
    return ['explore', 'help', 'share', 'explore-search'];
  }
  if (
    id === 'explore' ||
    id === 'help' ||
    id === 'share' ||
    id === 'explore-search'
  ) {
    return ['ai-chat'];
  }
  return [];
}

export function useTourPanelStack(): TourPanelStack {
  const stackRef = useRef<TourPanelStackId[]>([]);
  const handlersRef = useRef<Map<TourPanelStackId, CloseHandler>>(new Map());

  const openPanel = useCallback((id: TourPanelStackId) => {
    const peers = mutexClosuresFor(id);
    if (peers.length > 0) {
      let stack = stackRef.current;
      for (const peer of peers) {
        if (!stack.includes(peer)) continue;
        stack = stack.filter((entry) => entry !== peer);
        handlersRef.current.get(peer)?.();
      }
      stackRef.current = stack;
    }

    const next = stackRef.current.filter((entry) => entry !== id);
    next.push(id);
    stackRef.current = next;
  }, []);

  const closePanel = useCallback((id: TourPanelStackId) => {
    stackRef.current = stackRef.current.filter((entry) => entry !== id);
  }, []);

  const closeTopPanel = useCallback(() => {
    const stack = stackRef.current;
    const top = stack[stack.length - 1];
    if (!top) return false;

    stackRef.current = stack.slice(0, -1);
    handlersRef.current.get(top)?.();
    return true;
  }, []);

  const registerPanel = useCallback(
    (id: TourPanelStackId, onClose: CloseHandler) => {
      handlersRef.current.set(id, onClose);
      return () => {
        handlersRef.current.delete(id);
      };
    },
    [],
  );

  return useMemo(
    () => ({ openPanel, closePanel, closeTopPanel, registerPanel }),
    [closePanel, closeTopPanel, openPanel, registerPanel],
  );
}
