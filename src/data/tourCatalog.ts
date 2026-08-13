import catalogJson from '../../tours/catalog.json';
import {
  TOUR_CATEGORIES,
  type TourCategory,
} from '../constants/tourCategories';
import { getDevCatalogSnapshot } from './devCatalogSnapshot';

import type { ClientPhone, TourBranding } from '../types/tour';
import { hydrateCatalogClientBranding } from '../utils/tourAssetResolve.mjs';

export type CatalogTourVisibility = 'public' | 'unlisted' | 'internal';

export interface CatalogTourEntry {
  id: string;
  category: TourCategory;
  name: string;
  /** Short marketing blurb for gallery cards, share previews, and listings. */
  summary?: string;
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
  /**
   * Shared client branding — tours inherit unless `tour.branding` overrides.
   * Conventional logo/favicon paths are omitted in JSON; runtime infers logo.
   */
  branding?: TourBranding;
  tours: CatalogTourEntry[];
}

interface TourCatalogFile {
  categories: TourCategory[];
  clients: CatalogClient[];
}

const catalog = catalogJson as TourCatalogFile;

function withInferredClientBranding(client: CatalogClient): CatalogClient {
  const branding = hydrateCatalogClientBranding(client) as TourBranding | null;
  if (!branding) return client;
  if (branding === client.branding) return client;
  return { ...client, branding };
}

function withInferredCatalog(data: TourCatalogFile): TourCatalogFile {
  let changed = false;
  const clients = data.clients.map((client) => {
    const next = withInferredClientBranding(client);
    if (next !== client) changed = true;
    return next;
  });
  return changed ? { ...data, clients } : data;
}

function getCatalogData(): TourCatalogFile {
  return withInferredCatalog(getDevCatalogSnapshot() ?? catalog);
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

export function findCatalogTour(
  clientId: string,
  tourId: string,
): CatalogTourEntry | undefined {
  return findCatalogClient(clientId)?.tours.find((tour) => tour.id === tourId);
}

/** Locate a catalog tour entry by tour id (any client). */
export function findCatalogTourById(
  tourId: string,
): CatalogTourEntry | undefined {
  for (const client of listCatalogClients()) {
    const tour = client.tours.find((entry) => entry.id === tourId);
    if (tour) return tour;
  }
  return undefined;
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
