import type { Tour } from '../types/tour';

/** Asset paths and favicons use client id; URLs and loadTour keys use tour id. */
export function getTourClientId(tour: Pick<Tour, 'id' | 'clientId'>): string {
  return tour.clientId ?? tour.id;
}
