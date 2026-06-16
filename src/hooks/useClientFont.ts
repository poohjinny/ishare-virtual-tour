import { useEffect, type RefObject } from 'react';
import type { Tour } from '../types/tour';
import { applyClientFont, resetClientFont } from '../utils/clientFont';

export function useClientFont(
  tour: Tour,
  rootRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const root = rootRef.current;
    applyClientFont(root, tour.branding);
    return () => resetClientFont(root);
  }, [
    rootRef,
    tour.id,
    tour.branding?.fontFamily,
    tour.branding?.fontSourceUrl,
  ]);
}
