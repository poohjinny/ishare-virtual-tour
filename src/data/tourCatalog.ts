import catalogJson from '../../tours/catalog.json';
import {
  TOUR_CATEGORIES,
  type TourCategory,
} from '../constants/tourCategories';
import { getDevCatalogSnapshot } from './devCatalogSnapshot';

import type { ClientPhone } from '../types/tour';

export type CatalogTourVisibility = 'public' | 'unlisted' | 'internal';

export interface CatalogTourEntry {
  id: string;
  category: TourCategory;
  name: string;
  visibility?: CatalogTourVisibility;
  featured?: boolean;
}

/** Client record in catalog.json — contact lives here, not on individual tours. */
export interface CatalogClient {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  phoneLabel?: string;
  phones?: ClientPhone[];
  fax?: string;
  faxLabel?: string;
  address?: string;
  tours: CatalogTourEntry[];
}

interface TourCatalogFile {
  categories: TourCategory[];
  clients: CatalogClient[];
}

const catalog = catalogJson as TourCatalogFile;

function getCatalogData(): TourCatalogFile {
  return getDevCatalogSnapshot() ?? catalog;
}

const ROUTABLE_VISIBILITIES: ReadonlySet<CatalogTourVisibility> = new Set([
  'public',
  'unlisted',
]);

export function resolveCatalogTourVisibility(
  entry: CatalogTourEntry,
): CatalogTourVisibility {
  return entry.visibility ?? 'public';
}

export function listTourCategories(): readonly TourCategory[] {
  const data = getCatalogData();
  return data.categories.length > 0 ? data.categories : TOUR_CATEGORIES;
}

export function listCatalogClients(): CatalogClient[] {
  return getCatalogData().clients;
}

export function findCatalogClient(clientId: string): CatalogClient | undefined {
  return getCatalogData().clients.find((client) => client.id === clientId);
}

export interface CatalogTourListItem {
  tourId: string;
  clientId: string;
  clientName: string;
  category: TourCategory;
  tourName: string;
  visibility: CatalogTourVisibility;
  featured: boolean;
}

function flattenCatalogTours(
  visibilityFilter?: ReadonlySet<CatalogTourVisibility>,
): CatalogTourListItem[] {
  return getCatalogData().clients.flatMap((client) =>
    client.tours
      .filter((tour) => {
        const visibility = resolveCatalogTourVisibility(tour);
        return !visibilityFilter || visibilityFilter.has(visibility);
      })
      .map((tour) => ({
        tourId: tour.id,
        clientId: client.id,
        clientName: client.name,
        category: tour.category,
        tourName: tour.name,
        visibility: resolveCatalogTourVisibility(tour),
        featured: tour.featured ?? false,
      })),
  );
}

/** Tours shown on the public client intro gallery at `/`. */
export function listCatalogTours(): CatalogTourListItem[] {
  return flattenCatalogTours(new Set(['public']));
}

export function isFeaturedGalleryMode(searchParams: URLSearchParams): boolean {
  return searchParams.get('featured') === '1';
}

/** Featured tours first, then alphabetical by display name. */
export function sortCatalogToursForGallery(
  tours: CatalogTourListItem[],
): CatalogTourListItem[] {
  return [...tours].sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    return a.tourName.localeCompare(b.tourName);
  });
}

/** Tours reachable via direct URL / embed (`public` + `unlisted`). */
export function listRoutableCatalogTours(): CatalogTourListItem[] {
  return flattenCatalogTours(ROUTABLE_VISIBILITIES);
}

export function listPublicTourIds(): string[] {
  return listCatalogTours().map((entry) => entry.tourId);
}

export function listRoutableTourIds(): string[] {
  return listRoutableCatalogTours().map((entry) => entry.tourId);
}

export function listCatalogToursByCategory(): Array<{
  category: TourCategory;
  tours: CatalogTourListItem[];
}> {
  return listTourCategories()
    .map((category) => ({
      category,
      tours: listCatalogTours().filter((tour) => tour.category === category),
    }))
    .filter((group) => group.tours.length > 0);
}
