import type { ViewPosition } from '../types/tour';
import type { Tour, TourKnowledge } from '../types/tour';
import type {
  PublishedTourBundle,
  PublishedTourCatalogMeta,
} from '../types/publishedTour';
import { listRoutableCatalogTours } from '../data/tourCatalog';
import { normalizeTourAssets } from './normalizeTourAssets';

import kenSargentHouseTour from '../../tours/ken-sargent-house.json';
import kenSargentHouseKnowledge from '../../tours/ken-sargent-house-knowledge.json';
import cancerResearchTour from '../../tours/cancer-research.json';
import cancerResearchKnowledge from '../../tours/cancer-research-knowledge.json';
import holodomorMuseumTour from '../../tours/holodomor-museum.json';
import holodomorMuseumKnowledge from '../../tours/holodomor-museum-knowledge.json';
import qchHospitalTour from '../../tours/qch-hospital.json';
import qchHospitalKnowledge from '../../tours/qch-hospital-knowledge.json';

const TOURS: Record<string, Tour> = {
  'ken-sargent-house': kenSargentHouseTour as Tour,
  'cancer-research': cancerResearchTour as Tour,
  'holodomor-museum': holodomorMuseumTour as Tour,
  'qch-hospital': qchHospitalTour as Tour,
};

const KNOWLEDGE: Record<string, TourKnowledge> = {
  'ken-sargent-house': kenSargentHouseKnowledge as TourKnowledge,
  'cancer-research': cancerResearchKnowledge as TourKnowledge,
  'holodomor-museum': holodomorMuseumKnowledge as TourKnowledge,
  'qch-hospital': qchHospitalKnowledge as TourKnowledge,
};

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

    const knowledge = KNOWLEDGE[tourId];
    if (!knowledge) {
      throw new Error(`Unknown tour knowledge: ${tourId}`);
    }

    return {
      version: STATIC_PUBLISH_VERSION,
      publishedAt: 'static',
      tour: normalizeTourAssets(tour),
      knowledge,
      catalog: resolveCatalogMeta(tourId),
    };
  }

  loadTour(tourId: string): Tour {
    return this.loadPublishedTour(tourId).tour;
  }

  loadKnowledge(tourId: string): TourKnowledge {
    const knowledge = KNOWLEDGE[tourId];
    if (!knowledge) {
      throw new Error(`Unknown tour knowledge: ${tourId}`);
    }
    return knowledge;
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
