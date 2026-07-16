/**
 * Soft placeLead from naming-opportunity bodies (Node / dev tour writes).
 * Keep in sync with src/utils/resolveScenePlaceLead.ts + tourDirectory constant.
 */

export const SCENE_PLACE_LEAD_MAX_CHARS = 480;

function firstParagraphs(body, count = 2) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return body.trim();
  return paragraphs.slice(0, count).join(' ');
}

/** First ~2 paragraphs, word-aware ellipsis at maxChars. */
export function abbreviateNamingBodyLead(
  body,
  maxChars = SCENE_PLACE_LEAD_MAX_CHARS,
) {
  const text = firstParagraphs(body, 2).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${clipped.replace(/[.,;:!?–—-]+$/u, '').trimEnd()}…`;
}

function listSceneNamingBodies(tour, scene) {
  const bodies = [];
  const sceneHotspots = scene.hotspots ?? [];
  const tourHotspots = (tour.hotspots ?? []).filter(
    (hotspot) => hotspot.sceneId === scene.id,
  );
  const hotspots = [...sceneHotspots, ...tourHotspots];

  for (const hotspot of hotspots) {
    if (!hotspot.popup?.namingOpportunity) continue;
    const body = hotspot.popup.body?.trim();
    if (body) bodies.push(body);
  }
  return bodies;
}

/**
 * Build placeLead from the first NO body on the scene.
 * Returns null when there is no usable NO body.
 */
export function buildScenePlaceLeadFromNaming(tour, scene) {
  const bodies = listSceneNamingBodies(tour, scene);
  if (bodies.length === 0) return null;
  const lead = abbreviateNamingBodyLead(bodies[0]);
  return lead || null;
}

/**
 * When scene.description is empty, set or clear placeLead from NO bodies.
 * Does nothing when description is set (client place copy wins).
 * @returns {boolean} whether scene.placeLead changed
 */
export function syncScenePlaceLeadFromNaming(tour, scene) {
  if (scene.description?.trim()) return false;

  const lead = buildScenePlaceLeadFromNaming(tour, scene);
  const current = scene.placeLead?.trim() ?? '';

  if (lead) {
    if (current === lead) return false;
    scene.placeLead = lead;
    return true;
  }

  if (!current) return false;
  delete scene.placeLead;
  return true;
}
