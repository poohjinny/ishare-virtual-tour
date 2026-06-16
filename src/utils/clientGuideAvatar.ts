import { VIRTUAL_TOUR_GUIDE_AVATAR } from '../constants/branding';
import type { Tour } from '../types/tour';
import { withBaseUrl } from './assetUrl';
import { tourAssetPath } from './tourAssetPath';

/** Tour override — drop at `assets/{clientId}/{tourId}/brand/tour-guide.png`. */
export function getClientGuideAvatarPath(
  tour: Pick<Tour, 'id' | 'clientId'>,
): string {
  return tourAssetPath(tour, 'brand', 'tour-guide.png');
}

export function resolveClientGuideAvatarUrl(
  tour: Pick<Tour, 'id' | 'clientId'>,
): string {
  return withBaseUrl(getClientGuideAvatarPath(tour));
}

const probeCache = new Map<string, boolean>();

function cacheProbeResult(url: string, exists: boolean): boolean {
  probeCache.set(url, exists);
  return exists;
}

/** Image load probe — avoids SPA dev-server false positives on HEAD (200 text/html). */
export function hasClientGuideAvatar(url: string): Promise<boolean> {
  const cached = probeCache.get(url);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve(cacheProbeResult(url, true));
    };

    img.onerror = () => {
      resolve(cacheProbeResult(url, false));
    };

    img.src = url;
  });
}

export async function resolveGuideAvatarUrl(
  tour: Pick<Tour, 'id' | 'clientId'>,
): Promise<string> {
  const clientUrl = resolveClientGuideAvatarUrl(tour);
  const hasClientAsset = await hasClientGuideAvatar(clientUrl);
  return hasClientAsset ? clientUrl : VIRTUAL_TOUR_GUIDE_AVATAR;
}
