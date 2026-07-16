/** Dev-only placeholder copy when tour/scene/NO content is not provided yet. */

export function defaultSceneDescription(tourTitle, sceneTitle) {
  const tour = tourTitle?.trim() || 'this facility';
  const scene = sceneTitle?.trim() || 'this area';
  return `Explore ${scene} as part of the ${tour} virtual tour.`;
}

export function defaultNamingBody(opportunityTitle, tourTitle) {
  const title = opportunityTitle?.trim() || 'This space';
  const tour = tourTitle?.trim() || 'this virtual tour';
  return `${title} is a naming opportunity at ${tour}. Recognition details, donor benefits, and placement copy will be confirmed with the foundation team.`;
}

export function defaultInfoBody(infoTitle, tourTitle) {
  const title = infoTitle?.trim() || 'this topic';
  const tour = tourTitle?.trim() || 'this virtual tour';
  return `Learn more about ${title} at ${tour}.`;
}

export function defaultKnowledgeGlobalSummary(tourTitle) {
  const tour = tourTitle?.trim() || 'This facility';
  return `Welcome to the ${tour} virtual tour. Explore scenes using navigation markers and learn more from information hotspots.`;
}

export function buildKnowledgeSceneEntry(
  tourTitle,
  sceneTitle,
  sceneDescription,
) {
  const title = sceneTitle?.trim() || 'Scene';
  const tour = tourTitle?.trim() || 'Virtual tour';
  const description =
    sceneDescription?.trim() || defaultSceneDescription(tour, title);

  return {
    title,
    description,
    facts: [
      `${title} is part of the ${tour} virtual tour.`,
      `Use navigation markers to move between areas of ${tour}.`,
    ],
    faqs: [
      { q: `What can I see in ${title}?`, a: description },
      {
        q: `What is ${tour}?`,
        a: `${tour} is an interactive virtual tour. Use navigation markers to move between scenes.`,
      },
    ],
    suggestedQuestions: [
      `Tell me about ${title}`,
      `What is available at ${tour}?`,
    ],
  };
}

function isBlank(value) {
  return !value || !String(value).trim();
}

/** Fill missing scene descriptions in tour JSON (returns true if mutated). */
export function fillMissingTourSceneDescriptions(tour) {
  // Empty scene descriptions are intentional (placeLead / NO soft leads).
  // Do not auto-inject placeholder copy on every save.
  void tour;
  return false;
}

/** Merge tour scenes into knowledge JSON with placeholder copy for empty fields. */
export function syncKnowledgeFromTour(tour, knowledge, options = {}) {
  const tourTitle = tour.title?.trim() || tour.id;
  const clientWebsite =
    options.clientWebsite ??
    tour.url ??
    tour.client?.website ??
    'https://example.com';
  const next = knowledge ?? {
    id: tour.id,
    url: clientWebsite,
    global: {},
    scenes: {},
  };

  next.id = tour.id;
  if (isBlank(next.url)) {
    next.url = clientWebsite;
  }

  next.global = next.global ?? {};
  if (isBlank(next.global.facilityName)) {
    next.global.facilityName = options.clientName?.trim() || tourTitle;
  }
  if (isBlank(next.global.summary)) {
    next.global.summary = defaultKnowledgeGlobalSummary(tourTitle);
  }

  next.scenes = next.scenes ?? {};

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    const sceneTitle = scene.title?.trim() || sceneId;
    const sceneDescription = scene.description?.trim();
    const defaults = buildKnowledgeSceneEntry(
      tourTitle,
      sceneTitle,
      sceneDescription,
    );
    const current = next.scenes[sceneId] ?? {};

    next.scenes[sceneId] = {
      title: isBlank(current.title) ? defaults.title : current.title.trim(),
      description:
        isBlank(current.description) ?
          defaults.description
        : current.description.trim(),
      facts:
        Array.isArray(current.facts) && current.facts.length > 0 ?
          current.facts
        : defaults.facts,
      faqs:
        Array.isArray(current.faqs) && current.faqs.length > 0 ?
          current.faqs
        : defaults.faqs,
      suggestedQuestions:
        (
          Array.isArray(current.suggestedQuestions) &&
          current.suggestedQuestions.length > 0
        ) ?
          current.suggestedQuestions
        : defaults.suggestedQuestions,
    };
  }

  return next;
}
