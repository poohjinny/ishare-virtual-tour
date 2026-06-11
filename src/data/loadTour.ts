import type { Tour, TourKnowledge } from '../types/tour';
import kensargenthouseTour from '../../tours/kensargenthouse.json';
import kensargenthouseKnowledge from '../../tours/kensargenthouse-knowledge.json';

const TOURS: Record<string, Tour> = {
  kensargenthouse: kensargenthouseTour as Tour,
};

const KNOWLEDGE: Record<string, TourKnowledge> = {
  kensargenthouse: kensargenthouseKnowledge as TourKnowledge,
};

export const DEFAULT_TOUR_ID = 'kensargenthouse';

export function listTourIds(): string[] {
  return Object.keys(TOURS);
}

export function loadTour(tourId = DEFAULT_TOUR_ID): Tour {
  const tour = TOURS[tourId];
  if (!tour) {
    throw new Error(
      `Unknown tour: ${tourId}. Available: ${listTourIds().join(', ')}`,
    );
  }
  return tour;
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
