import { useEffect, type RefObject } from 'react';

import { isTypingTarget } from '../utils/isTypingTarget';
import { toggleTourFullscreen } from '../viewer/tourFullscreenNavbarButton';

interface UseTourViewerShortcutsOptions {
  disabled?: boolean;
  onRecenter?: () => void;
  onToggleBackgroundMusic?: () => void;
}

export function useTourViewerShortcuts(
  fullscreenRootRef: RefObject<HTMLElement | null>,
  {
    disabled = false,
    onRecenter,
    onToggleBackgroundMusic,
  }: UseTourViewerShortcutsOptions = {},
) {
  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 'f') {
        event.preventDefault();
        toggleTourFullscreen(fullscreenRootRef.current);
        return;
      }
      if (key === 'r') {
        event.preventDefault();
        onRecenter?.();
        return;
      }
      if (key === 'm' && onToggleBackgroundMusic) {
        event.preventDefault();
        onToggleBackgroundMusic();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, fullscreenRootRef, onRecenter, onToggleBackgroundMusic]);
}
