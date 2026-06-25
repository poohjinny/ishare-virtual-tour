/** Dev-only placeholder copy when tour/scene/NO content is not provided yet. */

export function defaultSceneDescription(tourTitle, sceneTitle) {
  const tour = tourTitle?.trim() || 'this facility';
  const scene = sceneTitle?.trim() || 'this area';
  return `Explore ${scene} at ${tour}. Scene description and donor content can be updated in the dev panel or tour JSON.`;
}

export function defaultNamingBody(opportunityTitle, tourTitle) {
  const title = opportunityTitle?.trim() || 'This space';
  const tour = tourTitle?.trim() || 'this virtual tour';
  return `${title} is a naming opportunity at ${tour}. Recognition details, donor benefits, and placement copy will be confirmed with the foundation team.`;
}

export function defaultInfoBody(infoTitle, tourTitle) {
  const title = infoTitle?.trim() || 'this topic';
  const tour = tourTitle?.trim() || 'this virtual tour';
  return `Learn more about ${title} at ${tour}. Additional text, images, or video can be added in the dev panel.`;
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
      'Add facility-specific facts in the knowledge editor or tours/*-knowledge.json.',
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
  const tourTitle = tour.title?.trim() || tour.id;
  let changed = false;

  for (const scene of Object.values(tour.scenes ?? {})) {
    if (isBlank(scene.description)) {
      scene.description = defaultSceneDescription(
        tourTitle,
        scene.title ?? scene.id,
      );
      changed = true;
    }
  }

  return changed;
}

/** Merge tour scenes into knowledge JSON with placeholder copy for empty fields. */
export function syncKnowledgeFromTour(tour, knowledge) {
  const tourTitle = tour.title?.trim() || tour.id;
  const next = knowledge ?? {
    id: tour.id,
    url: tour.url ?? tour.organization?.website ?? 'https://example.com',
    global: {},
    scenes: {},
  };

  next.id = tour.id;
  if (isBlank(next.url)) {
    next.url = tour.url ?? tour.organization?.website ?? 'https://example.com';
  }

  next.global = next.global ?? {};
  if (isBlank(next.global.facilityName)) {
    next.global.facilityName = tourTitle;
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
