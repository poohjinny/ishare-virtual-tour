import { useEffect } from 'react';
import type { Tour } from '../types/tour';
import { applyClientFavicon, resetClientFavicon } from '../utils/clientFavicon';

import { resolveTourBranding } from '../utils/resolveTourBranding';

export function useClientFavicon(tour: Tour): void {
  const branding = resolveTourBranding(tour);
  const clientId = tour.clientId ?? tour.id;

  useEffect(() => {
    const cancelApply = applyClientFavicon(tour);
    return () => {
      cancelApply();
      resetClientFavicon();
    };
  }, [tour, clientId, branding?.favicon, branding?.logo]);
}
