/** Dev — default panorama web path for a new scene on the current tour. */
export function buildDefaultPanoramaWebPath(
  clientId: string,
  tourId: string,
  sceneId: string,
): string {
  return `/assets/${clientId}/${tourId}/panoramas/${sceneId}.webp`;
}

/** Shorter label for the dev panel preview. */
export function buildDefaultPanoramaRelativePath(sceneId: string): string {
  return `panoramas/${sceneId}.webp`;
}
