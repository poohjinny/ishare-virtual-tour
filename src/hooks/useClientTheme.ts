import { useEffect } from 'react';
import type { Tour } from '../types/tour';
import { resolveTourBranding } from '../utils/resolveTourBranding';
import { applyClientTheme, resetClientTheme } from '../utils/clientTheme';

export function useClientTheme(tour: Tour): void {
  const primaryColor = resolveTourBranding(tour)?.primaryColor;

  useEffect(() => {
    applyClientTheme(primaryColor);
    return resetClientTheme;
  }, [tour.id, primaryColor]);
}
