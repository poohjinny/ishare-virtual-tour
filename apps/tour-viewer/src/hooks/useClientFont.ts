import { useEffect, type RefObject } from 'react';
import type { Tour } from '../types/tour';
import { resolveTourBranding } from '../utils/resolveTourBranding';
import { applyClientFont, resetClientFont } from '../utils/clientFont';

export function useClientFont(
  tour: Tour,
  rootRef: RefObject<HTMLElement | null>,
): void {
  const branding = resolveTourBranding(tour);

  useEffect(() => {
    const root = rootRef.current;
    applyClientFont(root, branding);
    return () => resetClientFont(root);
  }, [rootRef, tour.id, branding?.fontFamily, branding?.fontSourceUrl]);
}
