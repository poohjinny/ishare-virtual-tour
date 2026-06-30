import { useEffect } from 'react';
import type { Tour } from '../types/tour';
import { applyClientFavicon, resetClientFavicon } from '../utils/clientFavicon';

import { resolveTourBranding } from '../utils/resolveTourBranding';

export function useClientFavicon(tour: Tour): void {
  const branding = resolveTourBranding(tour);

  useEffect(() => {
    applyClientFavicon(tour);
    return resetClientFavicon;
  }, [tour, branding?.favicon, branding?.logo]);
}
