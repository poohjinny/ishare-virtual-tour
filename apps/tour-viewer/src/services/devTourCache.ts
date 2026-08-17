import type { Tour } from '../types/tour';

const devTourCache = new Map<string, Tour>();

export function setDevTourCache(tour: Tour): void {
  devTourCache.set(tour.id, tour);
}

export function getDevTourCache(tourId: string): Tour | undefined {
  return devTourCache.get(tourId);
}

export function removeDevTourCache(tourId: string): void {
  devTourCache.delete(tourId);
}

export function clearDevTourCache(): void {
  devTourCache.clear();
}
