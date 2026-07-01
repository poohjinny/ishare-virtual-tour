import { findCatalogTour } from '../data/tourCatalog';
import type { Tour } from '../types/tour';
import { getTourClientId } from './tourClientId';

/** Explore panel body lead — catalog summary, else first-scene description. */
export function resolveExploreDirectoryLead(
  tour: Pick<Tour, 'id' | 'clientId' | 'firstScene' | 'scenes'>,
): string | undefined {
  const summary = findCatalogTour(
    getTourClientId(tour),
    tour.id,
  )?.summary?.trim();
  if (summary) {
    return summary;
  }

  const overview = tour.scenes[tour.firstScene];
  return overview?.description?.trim() || undefined;
}
