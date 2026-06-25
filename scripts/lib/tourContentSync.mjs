import { writeFileSync } from 'node:fs';
import {
  fillMissingTourSceneDescriptions,
  syncKnowledgeFromTour,
} from './devContentPlaceholders.mjs';
import {
  readKnowledgeJson,
  resolveKnowledgeJsonPath,
} from './tourKnowledgeDev.mjs';
import {
  readTourJson,
  resolveTourJsonPath,
  writeTourJson,
} from './tourSceneDev.mjs';

/** Fill missing scene descriptions in tour JSON and sync knowledge placeholders. */
export function persistTourContentPlaceholders(toursDir, tourId) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const tourChanged = fillMissingTourSceneDescriptions(tour);
  if (tourChanged) {
    writeTourJson(tourPath, tour);
  }

  const { knowledge: existing } = readKnowledgeJson(toursDir, tourId);
  const knowledgePath = resolveKnowledgeJsonPath(toursDir, tourId);
  const knowledge = syncKnowledgeFromTour(tour, existing);
  writeFileSync(
    knowledgePath,
    `${JSON.stringify(knowledge, null, 2)}\n`,
    'utf8',
  );

  return { tourPath, knowledgePath, tour, knowledge, tourChanged };
}
