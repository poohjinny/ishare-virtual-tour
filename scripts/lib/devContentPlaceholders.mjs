/** Dev-only placeholder copy when tour/scene/NO content is not provided yet. */

export function defaultSceneDescription(tourTitle, sceneTitle) {
  const tour = tourTitle?.trim() || 'this facility';
  const scene = sceneTitle?.trim() || 'this area';
  return `Explore ${scene} as part of the ${tour} virtual tour.`;
}

/**
 * True when copy matches the auto scene placeholder (not real client copy).
 * Soft-lead sync treats these as empty so NO bodies can replace them.
 */
export function isDefaultSceneDescription(description, tourTitle, sceneTitle) {
  const trimmed = typeof description === 'string' ? description.trim() : '';
  if (!trimmed) return false;
  return trimmed === defaultSceneDescription(tourTitle, sceneTitle);
}

/** Keep in sync with src/utils/namingDescriptionPlaceholder.ts */
export function defaultNamingBody(opportunityTitle, tourTitle) {
  const title = opportunityTitle?.trim() || 'This space';
  const tour = tourTitle?.trim() || 'this place';
  return `${title} is available to name. Contribute to support the people who rely on ${tour}.`;
}

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
