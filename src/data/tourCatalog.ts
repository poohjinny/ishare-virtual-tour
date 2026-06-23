import catalogJson from '../../tours/catalog.json';
import {
  TOUR_CATEGORIES,
  type TourCategory,
} from '../constants/tourCategories';

export type CatalogTourVisibility = 'public' | 'unlisted' | 'internal';

export interface CatalogTourEntry {
  id: string;
  category: TourCategory;
  name: string;
  visibility?: CatalogTourVisibility;
  featured?: boolean;
}

export interface CatalogClient {
  id: string;
  name: string;
  tours: CatalogTourEntry[];
}

interface TourCatalogFile {
  categories: TourCategory[];
  clients: CatalogClient[];
}

const catalog = catalogJson as TourCatalogFile;

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
  return catalog.categories.length > 0 ? catalog.categories : TOUR_CATEGORIES;
}

export function listCatalogClients(): CatalogClient[] {
  return catalog.clients;
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
  return catalog.clients.flatMap((client) =>
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
