import {
  assertCatalogVisibility,
  resolveCatalogVisibility,
} from '../../src/utils/catalogVisibilityCore.mjs';

export const resolveNamingVisibility = resolveCatalogVisibility;
export const assertNamingVisibility = assertCatalogVisibility;

export function isNamingVisibleInExplore(record) {
  return resolveNamingVisibility(record) === 'public';
}

export function isNamingUsableForPlaceLead(record) {
  return resolveNamingVisibility(record) !== 'internal';
}
