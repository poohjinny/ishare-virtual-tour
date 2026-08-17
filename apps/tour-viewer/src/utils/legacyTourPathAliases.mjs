/**
 * Former kebab tour ids and `/{clientId}/…` path segments → opaque `t_*`.
 * Shared by SPA routing (`tourPaths.ts`) and tour-og Worker.
 */
export const LEGACY_TOUR_PATH_ALIASES = {
  'ken-sargent-house': 't_l01wnq8eh6',
  'cancer-research': 't_8kx3m2p9qa',
  'holodomor-museum': 't_r7v4n1c0wd',
  'queensway-carleton-hospital': 't_9zs0j4a7xt',
  'queensway-carleton-general-hospital': 't_9zs0j4a7xt',
  gphospitalfoundation: 't_l01wnq8eh6',
  cancerresearchsociety: 't_8kx3m2p9qa',
  holodomor: 't_r7v4n1c0wd',
};

export function canonicalizeTourPathId(segment) {
  const id = String(segment || '').trim();
  return LEGACY_TOUR_PATH_ALIASES[id] ?? id;
}

export function isLegacyTourPathAlias(segment) {
  const id = String(segment || '').trim();
  return Object.prototype.hasOwnProperty.call(LEGACY_TOUR_PATH_ALIASES, id);
}
