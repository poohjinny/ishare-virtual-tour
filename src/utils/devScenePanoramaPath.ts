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

/** Dev — default GLB web path for a new 3D scene on the current tour. */
export function buildDefaultModelWebPath(
  clientId: string,
  tourId: string,
  sceneId: string,
  ext = 'glb',
): string {
  return `/assets/${clientId}/${tourId}/models/${sceneId}.${ext}`;
}

/** Shorter label for the dev panel preview. */
export function buildDefaultModelRelativePath(
  sceneId: string,
  ext = 'glb',
): string {
  return `models/${sceneId}.${ext}`;
}

/** Shorter label for optional 3D scene card thumbnail. */
export function buildDefaultSceneThumbnailRelativePath(
  sceneId: string,
): string {
  return `thumbnails/${sceneId}.webp`;
}

/** Dev — default scene card thumbnail for model3d viewpoints. */
export function buildDefaultSceneThumbnailWebPath(
  clientId: string,
  tourId: string,
  sceneId: string,
): string {
  return `/assets/${clientId}/${tourId}/thumbnails/${sceneId}.webp`;
}

/** Dev — shared tour GLB web path (one model per model3d tour). */
export function buildDefaultTourModelWebPath(
  clientId: string,
  tourId: string,
  ext = 'glb',
): string {
  return `/assets/${clientId}/${tourId}/models/${tourId}.${ext}`;
}

/** Shorter label for the dev panel preview. */
export function buildDefaultTourModelRelativePath(
  tourId: string,
  ext = 'glb',
): string {
  return `models/${tourId}.${ext}`;
}
