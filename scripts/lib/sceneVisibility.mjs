/** Same tiers as catalog tours — omit / undefined = public. */

/**
 * @param {{ visibility?: string } | null | undefined} scene
 * @returns {'public' | 'unlisted' | 'internal'}
 */
export function resolveSceneVisibility(scene) {
  const value = scene?.visibility;
  if (value === 'unlisted' || value === 'internal') return value;
  return 'public';
}

/**
 * @param {{ visibility?: string } | null | undefined} scene
 */
export function isScenePublic(scene) {
  return resolveSceneVisibility(scene) === 'public';
}

/**
 * @param {string | undefined} visibility
 */
export function assertSceneVisibility(visibility) {
  if (visibility === undefined || visibility === null || visibility === '') {
    return undefined;
  }
  const value = String(visibility).trim();
  if (value === 'public' || value === 'unlisted' || value === 'internal') {
    return value;
  }
  throw new Error(
    `visibility must be public, unlisted, or internal (got ${visibility})`,
  );
}
