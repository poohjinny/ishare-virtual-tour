import { useEffect } from 'react';
import type { Tour } from '../types/tour';
import { applyClientFavicon, resetClientFavicon } from '../utils/clientFavicon';

export function useClientFavicon(tour: Tour): void {
  useEffect(() => {
    applyClientFavicon(tour);
    return resetClientFavicon;
  }, [tour.id, tour.branding?.favicon]);
}
