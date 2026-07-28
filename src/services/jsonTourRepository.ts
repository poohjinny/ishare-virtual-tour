import type { ViewPosition } from '../types/tour';
import type { Tour } from '../types/tour';
import type {
  PublishedTourBundle,
  PublishedTourCatalogMeta,
} from '../types/publishedTour';
import { listRoutableCatalogTours } from '../data/tourCatalog';
import { normalizeTourAssets } from './normalizeTourAssets';

const tourJsonModules = import.meta.glob('../../tours/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Tour>;

function buildTourRegistry(): Record<string, Tour> {
  const tours: Record<string, Tour> = {};

  for (const [path, tour] of Object.entries(tourJsonModules)) {
    if (path.endsWith('catalog.json')) continue;
    if (path.endsWith('-knowledge.json')) continue;
    if (!tour?.id) continue;
    tours[tour.id] = tour;
  }

  return tours;
}

const TOURS = buildTourRegistry();

/** Static bundle revision — bump when shipped tour JSON changes materially. */
const STATIC_PUBLISH_VERSION = 1;

const catalogByTourId = new Map<string, PublishedTourCatalogMeta>(
  listRoutableCatalogTours().map((entry) => [
    entry.tourId,
    {
      tourId: entry.tourId,
      clientId: entry.clientId,
      clientName: entry.clientName,
      category: entry.category,
      tourName: entry.tourName,
      visibility: entry.visibility,
      featured: entry.featured,
    },
  ]),
);

function resolveCatalogMeta(
  tourId: string,
): PublishedTourCatalogMeta | undefined {
  return catalogByTourId.get(tourId);
}

export class JsonTourRepository {
  listRegisteredTourIds(): string[] {
    return Object.keys(TOURS);
  }

  hasTour(tourId: string): boolean {
    return tourId in TOURS;
  }

  loadPublishedTour(tourId: string): PublishedTourBundle {
    const tour = TOURS[tourId];
    if (!tour) {
      throw new Error(
        `Unknown tour: ${tourId}. Available: ${this.listRegisteredTourIds().join(', ')}`,
      );
    }

    return {
      version: STATIC_PUBLISH_VERSION,
      publishedAt: 'static',
      tour: normalizeTourAssets(tour),
      catalog: resolveCatalogMeta(tourId),
    };
  }

  loadTour(tourId: string): Tour {
    return this.loadPublishedTour(tourId).tour;
  }
}

export interface CatalogTourPreviewSource {
  thumbnail?: string;
  panorama: string;
  view: ViewPosition;
}

export function getCatalogTourPreviewSourceFromTour(
  tour: Tour,
): CatalogTourPreviewSource | null {
  const scene = tour.scenes[tour.firstScene];
  if (!scene?.panorama) return null;
  return {
    thumbnail: scene.thumbnail,
    panorama: scene.panorama,
    view: scene.defaultView,
  };
}
