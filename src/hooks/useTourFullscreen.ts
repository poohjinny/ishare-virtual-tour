import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  isTourElementFullscreen,
  toggleTourFullscreen,
} from '../viewer/tourFullscreenNavbarButton';

/** Syncs React state with tour-area browser fullscreen (3D icon + label). */
export function useTourFullscreen(
  rootRef: RefObject<HTMLElement | null> | undefined,
): { active: boolean; toggle: () => void } {
  const [active, setActive] = useState(false);

  const sync = useCallback(() => {
    setActive(isTourElementFullscreen(rootRef?.current ?? null));
  }, [rootRef]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    document.addEventListener('mozfullscreenchange', sync);
    sync();
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.removeEventListener('mozfullscreenchange', sync);
    };
  }, [sync]);

  const toggle = useCallback(() => {
    const root = rootRef?.current ?? null;
    if (!root) return;

    setActive((prev) => !prev);
    toggleTourFullscreen(root);
  }, [rootRef]);

  return { active, toggle };
}
