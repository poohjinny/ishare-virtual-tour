import { useEffect, type RefObject } from 'react';

import { isTypingTarget } from '../utils/isTypingTarget';
import { handleTourFullscreenHotkey } from '../viewer/tourFullscreenNavbarButton';

interface UseTourViewerShortcutsOptions {
  disabled?: boolean;
  onRecenter?: () => void;
  onToggleBackgroundMusic?: () => void;
  onToggleToolbar?: () => void;
}

export function useTourViewerShortcuts(
  fullscreenRootRef: RefObject<HTMLElement | null>,
  {
    disabled = false,
    onRecenter,
    onToggleBackgroundMusic,
    onToggleToolbar,
  }: UseTourViewerShortcutsOptions = {},
) {
  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === 'F11' || event.key.toLowerCase() === 'f') {
        handleTourFullscreenHotkey(event, fullscreenRootRef.current);
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'r') {
        event.preventDefault();
        onRecenter?.();
        return;
      }
      if (key === 'c' && onToggleToolbar) {
        event.preventDefault();
        onToggleToolbar();
        return;
      }
      if (key === 'm' && onToggleBackgroundMusic) {
        event.preventDefault();
        onToggleBackgroundMusic();
      }
    };

    // Capture so F11 can be redirected to the Fullscreen API when the browser allows.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    disabled,
    fullscreenRootRef,
    onRecenter,
    onToggleBackgroundMusic,
    onToggleToolbar,
  ]);
}
