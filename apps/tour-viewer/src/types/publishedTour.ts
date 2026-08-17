import type { TourCategory } from '../constants/tourCategories';
import type { CatalogTourVisibility } from '../data/tourCatalog';
import type { Tour } from './tour';

/** Catalog row bundled with a published tour snapshot (API / future admin publish). */
export interface PublishedTourCatalogMeta {
  tourId: string;
  clientId: string;
  clientName: string;
  category: TourCategory;
  tourName: string;
  visibility: CatalogTourVisibility;
}

/** Immutable published payload the viewer consumes (static JSON today, API in Phase 2). */
export interface PublishedTourBundle {
  version: number;
  publishedAt: string;
  tour: Tour;
  catalog?: PublishedTourCatalogMeta;
}
