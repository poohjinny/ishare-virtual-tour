import type {
  Hotspot,
  Tour,
  TourImmersiveBackground,
  TourKnowledge,
  ViewPosition,
} from '../types/tour';
import { withBaseUrl } from '../utils/assetUrl';
import { getTourProductFullName } from '../utils/tourProductName';
import type { TourCategory } from '../constants/tourCategories';
import { GLOBAL_IMMERSIVE_BACKGROUND } from '../constants/immersiveBackground';
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

import kenSargentHouseTour from '../../tours/ken-sargent-house.json';

import kenSargentHouseKnowledge from '../../tours/ken-sargent-house-knowledge.json';

import cancerResearchTour from '../../tours/cancer-research.json';

import cancerResearchKnowledge from '../../tours/cancer-research-knowledge.json';

import holodomorMuseumTour from '../../tours/holodomor-museum.json';

import holodomorMuseumKnowledge from '../../tours/holodomor-museum-knowledge.json';

const TOURS: Record<string, Tour> = {
  'ken-sargent-house': kenSargentHouseTour as Tour,

  'cancer-research': cancerResearchTour as Tour,

  'holodomor-museum': holodomorMuseumTour as Tour,
};

const KNOWLEDGE: Record<string, TourKnowledge> = {
  'ken-sargent-house': kenSargentHouseKnowledge as TourKnowledge,

  'cancer-research': cancerResearchKnowledge as TourKnowledge,

  'holodomor-museum': holodomorMuseumKnowledge as TourKnowledge,
};

function normalizeHotspot(hotspot: Hotspot): Hotspot {
  const preview =
    hotspot.preview?.image ?
      { ...hotspot.preview, image: withBaseUrl(hotspot.preview.image) }
    : hotspot.preview;

  const popup =
    hotspot.popup?.image ?
      { ...hotspot.popup, image: withBaseUrl(hotspot.popup.image) }
    : hotspot.popup;

  if (preview === hotspot.preview && popup === hotspot.popup) return hotspot;

  return {
    ...hotspot,
    ...(preview !== undefined ? { preview } : {}),
    ...(popup !== undefined ? { popup } : {}),
  };
}

function normalizeImmersiveBackground(
  config: TourImmersiveBackground,
): TourImmersiveBackground {
  return {
    ...config,
    audio: config.audio ? withBaseUrl(config.audio) : undefined,
    playlist: config.playlist?.map(withBaseUrl),
    playlistManifest:
      config.playlistManifest ?
        withBaseUrl(config.playlistManifest)
      : undefined,
  };
}

function normalizeTourAssets(tour: Tour): Tour {
  return {
    ...tour,

    branding:
      tour.branding ?
        { ...tour.branding, logo: withBaseUrl(tour.branding.logo) }
      : undefined,

    floorPlan:
      tour.floorPlan ?
        { ...tour.floorPlan, image: withBaseUrl(tour.floorPlan.image) }
      : undefined,

    immersiveBackground: normalizeImmersiveBackground(
      tour.immersiveBackground ?? GLOBAL_IMMERSIVE_BACKGROUND,
    ),
    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => [
        id,

        {
          ...scene,
          panorama: withBaseUrl(scene.panorama),
          hotspots: scene.hotspots.map(normalizeHotspot),
        },
      ]),
    ),
  };
}

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
    const tour = TOURS[entry.tourId];
    if (!tour) {
      throw new Error(
        `Catalog tour "${entry.tourId}" is not registered in loadTour.ts`,
      );
    }

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
  const tour = TOURS[tourId];

  if (!tour) {
    throw new Error(
      `Unknown tour: ${tourId}. Available: ${listTourIds().join(', ')}`,
    );
  }

  return normalizeTourAssets(tour);
}

export function loadKnowledge(tourId = DEFAULT_TOUR_ID): TourKnowledge {
  const knowledge = KNOWLEDGE[tourId];

  if (!knowledge) {
    throw new Error(`Unknown tour knowledge: ${tourId}`);
  }

  return knowledge;
}

export function getSceneList(tour: Tour) {
  return Object.values(tour.scenes);
}

export function getTourWebsite(tour: Tour): string {
  return tour.organization?.website ?? tour.url;
}

export interface CatalogTourPreviewSource {
  panorama: string;
  view: ViewPosition;
}

/** Panorama + default view for intro card preview rendering. */
export function getCatalogTourPreviewSource(
  tourId: string,
): CatalogTourPreviewSource | null {
  const tour = loadTour(tourId);
  const scene = tour.scenes[tour.firstScene];
  if (!scene?.panorama) return null;

  return { panorama: scene.panorama, view: scene.defaultView };
}
