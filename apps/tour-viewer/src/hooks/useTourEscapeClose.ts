import { useEffect } from 'react';

import type { TourPanelStack } from './useTourPanelStack';
import { isTypingTarget } from '../utils/isTypingTarget';

export function useTourEscapeClose(
  panelStack: TourPanelStack,
  { disabled = false }: { disabled?: boolean } = {},
) {
  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isTypingTarget(event.target)) return;
      if (!panelStack.closeTopPanel()) return;

      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, panelStack]);
}
