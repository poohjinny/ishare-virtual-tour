import {
  fillMissingTourSceneDescriptions,
} from './devContentPlaceholders.mjs';
import {
  readTourJson,
  resolveTourJsonPath,
  writeTourJson,
} from './tourSceneDev.mjs';

/** Fill missing scene descriptions in tour JSON when needed. */
export function persistTourContentPlaceholders(toursDir, tourId) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const tourChanged = fillMissingTourSceneDescriptions(tour);
  if (tourChanged) {
    writeTourJson(tourPath, tour);
  }

  return { tourPath, tour, tourChanged };
}
