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

export function useTourPanelStack(): TourPanelStack {
  const stackRef = useRef<TourPanelStackId[]>([]);
  const handlersRef = useRef<Map<TourPanelStackId, CloseHandler>>(new Map());

  const openPanel = useCallback((id: TourPanelStackId) => {
    const stack = stackRef.current.filter((entry) => entry !== id);
    stack.push(id);
    stackRef.current = stack;
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
    () => ({
      openPanel,
      closePanel,
      closeTopPanel,
      registerPanel,
    }),
    [closePanel, closeTopPanel, openPanel, registerPanel],
  );
}
