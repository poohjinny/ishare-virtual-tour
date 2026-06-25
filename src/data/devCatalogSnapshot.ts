import type { TourCategory } from '../constants/tourCategories';
import type { CatalogClient } from './tourCatalog';

export interface DevCatalogSnapshot {
  categories: TourCategory[];
  clients: CatalogClient[];
}

let devCatalogSnapshot: DevCatalogSnapshot | null = null;
const listeners = new Set<() => void>();

export function getDevCatalogSnapshot(): DevCatalogSnapshot | null {
  return devCatalogSnapshot;
}

export function setDevCatalogSnapshot(
  catalog: DevCatalogSnapshot | null,
): void {
  devCatalogSnapshot = catalog;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeDevCatalogSnapshot(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
