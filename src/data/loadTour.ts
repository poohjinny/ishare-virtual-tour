import type { Tour, TourKnowledge } from '../types/tour';

import { withBaseUrl } from '../utils/assetUrl';

import gphospitalfoundationTour from '../../tours/gphospitalfoundation.json';

import gphospitalfoundationKnowledge from '../../tours/gphospitalfoundation-knowledge.json';

import cancerresearchsocietyTour from '../../tours/cancerresearchsociety.json';

import cancerresearchsocietyKnowledge from '../../tours/cancerresearchsociety-knowledge.json';

const TOURS: Record<string, Tour> = {
  gphospitalfoundation: gphospitalfoundationTour as Tour,

  cancerresearchsociety: cancerresearchsocietyTour as Tour,
};

const KNOWLEDGE: Record<string, TourKnowledge> = {
  gphospitalfoundation: gphospitalfoundationKnowledge as TourKnowledge,

  cancerresearchsociety: cancerresearchsocietyKnowledge as TourKnowledge,
};

function normalizeTourAssets(tour: Tour): Tour {
  return {
    ...tour,

    branding:
      tour.branding ?
        { ...tour.branding, logo: withBaseUrl(tour.branding.logo) }
      : undefined,

    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => [
        id,

        { ...scene, panorama: withBaseUrl(scene.panorama) },
      ]),
    ),
  };
}

export const DEFAULT_TOUR_ID = 'gphospitalfoundation';

export interface TourListItem {
  id: string;

  label: string;

  facilityTitle: string;
}

export function listTourIds(): string[] {
  return Object.keys(TOURS);
}

export function listTours(): TourListItem[] {
  return listTourIds().map((id) => {
    const tour = TOURS[id];

    return {
      id,

      label: tour.organization?.name ?? tour.title,

      facilityTitle: tour.title,
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
