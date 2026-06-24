import type { Tour, TourKnowledge, ViewPosition } from '../types/tour';
import type { TourCategory } from '../constants/tourCategories';
import { getTourProductFullName } from '../utils/tourProductName';
import { listRoutableCatalogTours } from './tourCatalog';
export {
  listCatalogTours,
  listCatalogToursByCategory,
  listPublicTourIds,
  listRoutableCatalogTours,
  listRoutableTourIds,
  listTourCategories,
} from './tourCatalog';
export { getTourClientId } from '../utils/tourClientId';
export type { CatalogTourListItem } from './tourCatalog';

import { loadKnowledgeSync, loadTourSync } from '../services/tourRepository';
import { getDevTourCache } from '../services/devTourCache';
import { getCatalogTourPreviewSourceFromTour } from '../services/jsonTourRepository';

export const DEFAULT_TOUR_ID = 'ken-sargent-house';

export interface TourListItem {
  id: string;
  clientId: string;
  category: TourCategory;
  label: string;
  /** Client tour product — `{client full name} Virtual Tour`. */
  productFullName: string;
  /** Experience / facility name from catalog. */
  facilityTitle: string;
}

export function listTourIds(): string[] {
  return listRoutableCatalogTours().map((entry) => entry.tourId);
}

export function listTours(): TourListItem[] {
  return listRoutableCatalogTours().map((entry) => {
    const tour = loadTour(entry.tourId);

    return {
      id: entry.tourId,
      clientId: entry.clientId,
      category: entry.category,
      label: entry.clientName,
      productFullName: getTourProductFullName(tour),
      facilityTitle: entry.tourName,
    };
  });
}

export function loadTour(tourId = DEFAULT_TOUR_ID): Tour {
  const cached = getDevTourCache(tourId);
  if (cached) return cached;
  return loadTourSync(tourId);
}

export {
  setDevTourCache,
  getDevTourCache,
  removeDevTourCache,
} from '../services/devTourCache';

export function loadKnowledge(tourId = DEFAULT_TOUR_ID): TourKnowledge {
  return loadKnowledgeSync(tourId);
}

export function getSceneList(tour: Tour) {
  return Object.values(tour.scenes);
}

export function getTourWebsite(tour: Tour): string {
  return tour.organization?.website ?? tour.url;
}

export interface CatalogTourPreviewSource {
  thumbnail?: string;
  panorama: string;
  view: ViewPosition;
}

/** Panorama + default view for intro card preview rendering. */
export function getCatalogTourPreviewSource(
  tourId: string,
): CatalogTourPreviewSource | null {
  const tour = loadTour(tourId);
  return getCatalogTourPreviewSourceFromTour(tour);
}

export {
  loadTourAsync,
  loadKnowledgeAsync,
  loadPublishedTourAsync,
  tourRepository,
  usesApiTourRepository,
} from '../services/tourRepository';

export type { PublishedTourBundle } from '../types/publishedTour';
