import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  bindPresentationFullscreenSync,
  isTourPresentationFullscreen,
  toggleTourFullscreen,
} from '../viewer/tourFullscreenNavbarButton';

/** Syncs React state with tour / browser fullscreen (3D icon + label). */
export function useTourFullscreen(
  rootRef: RefObject<HTMLElement | null> | undefined,
): { active: boolean; toggle: () => void } {
  const [active, setActive] = useState(false);

  const sync = useCallback(() => {
    setActive(isTourPresentationFullscreen(rootRef?.current ?? null));
  }, [rootRef]);

  useEffect(() => bindPresentationFullscreenSync(sync), [sync]);

  const toggle = useCallback(() => {
    const root = rootRef?.current ?? null;
    if (!root) return;
    toggleTourFullscreen(root);
    sync();
  }, [rootRef, sync]);

  return { active, toggle };
}
