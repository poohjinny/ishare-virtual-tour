import type { Tour, TourKnowledge } from '../types/tour';
import type { PublishedTourBundle } from '../types/publishedTour';
import { ApiTourRepository } from './apiTourRepository';
import { JsonTourRepository } from './jsonTourRepository';

export { JsonTourRepository } from './jsonTourRepository';
export { ApiTourRepository } from './apiTourRepository';
export { normalizeTourAssets } from './normalizeTourAssets';

function resolveTourApiBaseUrl(): string | undefined {
  const raw = import.meta.env.VITE_TOUR_API_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, '');
}

const jsonTourRepository = new JsonTourRepository();
const apiTourRepository =
  resolveTourApiBaseUrl() ?
    new ApiTourRepository(resolveTourApiBaseUrl()!)
  : null;

/** Active repository — JSON when `VITE_TOUR_API_URL` is unset (Phase 1 default). */
export const tourRepository = apiTourRepository ?? jsonTourRepository;

export function usesApiTourRepository(): boolean {
  return apiTourRepository !== null;
}

export function getJsonTourRepository(): JsonTourRepository {
  return jsonTourRepository;
}

export async function loadPublishedTourAsync(
  tourId: string,
): Promise<PublishedTourBundle> {
  if (apiTourRepository) {
    return apiTourRepository.loadPublishedTour(tourId);
  }
  return jsonTourRepository.loadPublishedTour(tourId);
}

export async function loadTourAsync(tourId: string): Promise<Tour> {
  return (await loadPublishedTourAsync(tourId)).tour;
}

export async function loadKnowledgeAsync(
  tourId: string,
): Promise<TourKnowledge> {
  if (apiTourRepository) {
    return apiTourRepository.loadKnowledge(tourId);
  }
  return jsonTourRepository.loadKnowledge(tourId);
}

/** Sync loader — JSON repository only (existing call sites). */
export function loadTourSync(tourId: string): Tour {
  if (apiTourRepository) {
    throw new Error(
      'Synchronous loadTour() is unavailable when VITE_TOUR_API_URL is set. Use loadTourAsync() instead.',
    );
  }
  return jsonTourRepository.loadTour(tourId);
}

/** Sync knowledge loader — JSON repository only. */
export function loadKnowledgeSync(tourId: string): TourKnowledge {
  if (apiTourRepository) {
    throw new Error(
      'Synchronous loadKnowledge() is unavailable when VITE_TOUR_API_URL is set. Use loadKnowledgeAsync() instead.',
    );
  }
  return jsonTourRepository.loadKnowledge(tourId);
}
