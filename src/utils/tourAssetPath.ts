import type { Tour } from '../types/tour';
import { getTourClientId } from './tourClientId';

/** Root path for a tour's assets: `/assets/{clientId}/{tourId}`. */
export function getTourAssetBasePath(
  tour: Pick<Tour, 'id' | 'clientId'>,
): string {
  return `/assets/${getTourClientId(tour)}/${tour.id}`;
}

export function tourAssetPath(
  tour: Pick<Tour, 'id' | 'clientId'>,
  ...segments: string[]
): string {
  const suffix = segments.filter(Boolean).join('/');
  return suffix ?
      `${getTourAssetBasePath(tour)}/${suffix}`
    : getTourAssetBasePath(tour);
}
