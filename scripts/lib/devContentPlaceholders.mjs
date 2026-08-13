/** Dev-only placeholder copy when tour/scene/NO content is not provided yet. */

export {
  defaultSceneDescription,
  isDefaultSceneDescription,
  defaultNamingDescription as defaultNamingBody,
} from '../../src/utils/ogShareCopy.mjs';

export function defaultInfoBody(infoTitle, tourTitle) {
  const title = infoTitle?.trim() || 'this topic';
  const tour = tourTitle?.trim() || 'this virtual tour';
  return `Learn more about ${title} at ${tour}.`;
}

/** Fill missing scene descriptions in tour JSON (returns true if mutated). */
export function fillMissingTourSceneDescriptions(tour) {
  // Empty scene descriptions are intentional (NO inherit at display time).
  // Do not auto-inject placeholder copy on every save.
  void tour;
  return false;
}
