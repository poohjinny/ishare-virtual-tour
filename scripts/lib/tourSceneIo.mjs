import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripConventionalTourAssets } from '../../src/utils/tourAssetResolve.mjs';

export function resolveTourJsonPath(toursDir, tourId) {
  const tourPath = join(toursDir, `${tourId}.json`);
  if (!existsSync(tourPath)) {
    throw new Error(`Tour not found: ${tourId}`);
  }
  return tourPath;
}

export function readTourJson(tourPath) {
  return JSON.parse(readFileSync(tourPath, 'utf8'));
}

export function writeTourJson(tourPath, tour) {
  stripConventionalTourAssets(tour);
  writeFileSync(tourPath, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
}

/**
 * Keep authored Explore / Play order in sync with `tour.scenes`.
 * Missing `sceneOrder` is seeded from current scene keys (stable Object.keys).
 */
export function ensureTourSceneOrder(tour) {
  const known = new Set(Object.keys(tour.scenes ?? {}));
  const seen = new Set();
  const next = [];

  const authored = Array.isArray(tour.sceneOrder) ? tour.sceneOrder : [];
  for (const raw of authored) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  for (const id of Object.keys(tour.scenes ?? {})) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  tour.sceneOrder = next;
  return next;
}

export function appendSceneToOrder(tour, sceneId) {
  const id = sceneId?.trim();
  if (!id || !tour.scenes?.[id]) return ensureTourSceneOrder(tour);
  ensureTourSceneOrder(tour);
  if (!tour.sceneOrder.includes(id)) {
    tour.sceneOrder.push(id);
  }
  return tour.sceneOrder;
}

export function removeSceneFromOrder(tour, sceneId) {
  const id = sceneId?.trim();
  if (!id) return ensureTourSceneOrder(tour);
  if (!Array.isArray(tour.sceneOrder)) {
    return ensureTourSceneOrder(tour);
  }
  tour.sceneOrder = tour.sceneOrder.filter((entry) => entry !== id);
  return ensureTourSceneOrder(tour);
}

/**
 * Replace authored scene order. Payload must list every scene id exactly once.
 */
export function updateSceneOrder({ toursDir, tourId, sceneOrder }) {
  if (!Array.isArray(sceneOrder)) {
    throw new Error('sceneOrder must be an array of scene ids');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const known = Object.keys(tour.scenes ?? {});
  const knownSet = new Set(known);

  const next = [];
  const seen = new Set();
  for (const raw of sceneOrder) {
    if (typeof raw !== 'string') {
      throw new Error('sceneOrder entries must be strings');
    }
    const id = raw.trim();
    if (!id) continue;
    if (!knownSet.has(id)) {
      throw new Error(`Unknown scene id in sceneOrder: ${id}`);
    }
    if (seen.has(id)) {
      throw new Error(`Duplicate scene id in sceneOrder: ${id}`);
    }
    seen.add(id);
    next.push(id);
  }

  if (next.length !== known.length) {
    throw new Error(
      `sceneOrder must include every scene exactly once (got ${next.length}, expected ${known.length})`,
    );
  }

  tour.sceneOrder = next;
  writeTourJson(tourPath, tour);
  return { tourPath, sceneOrder: next };
}
