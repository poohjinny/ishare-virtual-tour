import { useEffect } from 'react';
import type { Tour } from '../types/tour';
import { applyClientTheme, resetClientTheme } from '../utils/clientTheme';

export function useClientTheme(tour: Tour): void {
  useEffect(() => {
    applyClientTheme(tour.branding?.primaryColor);
    return resetClientTheme;
  }, [tour.id, tour.branding?.primaryColor]);
}
