/**
 * Dev auto scene description placeholder.
 * Keep in sync with scripts/lib/devContentPlaceholders.mjs.
 */

export function defaultSceneDescription(
  tourTitle: string | null | undefined,
  sceneTitle: string | null | undefined,
): string {
  const tour = tourTitle?.trim() || 'this facility';
  const scene = sceneTitle?.trim() || 'this area';
  return `Explore ${scene} as part of the ${tour} virtual tour.`;
}

/** True when copy is the auto placeholder, not real client place copy. */
export function isDefaultSceneDescription(
  description: string | null | undefined,
  tourTitle: string | null | undefined,
  sceneTitle: string | null | undefined,
): boolean {
  const trimmed = description?.trim() ?? '';
  if (!trimmed) return false;
  return trimmed === defaultSceneDescription(tourTitle, sceneTitle);
}
