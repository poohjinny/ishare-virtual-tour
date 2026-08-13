import {
  assertCatalogVisibility,
  resolveCatalogVisibility,
} from '../../src/utils/catalogVisibilityCore.mjs';

export const resolveSceneVisibility = resolveCatalogVisibility;
export const assertSceneVisibility = assertCatalogVisibility;

export function isScenePublic(scene) {
  return resolveSceneVisibility(scene) === 'public';
}
