/**
 * Place-overview info pin — one per panorama scene.
 * Display inherit lives in namingSceneInherit.
 *
 * Create is explicit only (Add-scene checkbox or Manage “Overview” button).
 * Sync updates an existing pin’s title/body/position; it never auto-creates
 * unless `{ createIfMissing: true }`, and never auto-removes (delete + suppress).
 */

import { isDefaultSceneDescription } from './devContentPlaceholders.mjs';
import { isNamingUsableForPlaceLead } from './namingVisibility.mjs';
import { allocateOpaqueId, OPAQUE_HOTSPOT_ID_PREFIX } from './opaqueId.mjs';

export function isPlaceOverviewHotspot(hotspot) {
  return Boolean(
    hotspot && hotspot.type === 'info' && hotspot.role === 'placeOverview',
  );
}

export function hasRealSceneDescription(tour, scene) {
  const description = scene?.description?.trim();
  if (!description) return false;
  return !isDefaultSceneDescription(description, tour?.title, scene?.title);
}

function isNamingPin(hotspot) {
  return (
    hotspot?.type === 'info' &&
    Boolean(hotspot.namingId?.trim() || hotspot.popup?.namingOpportunity)
  );
}

function listSceneHotspots(tour, scene) {
  const sceneHotspots = scene.hotspots ?? [];
  const tourHotspots = (tour.hotspots ?? []).filter(
    (hotspot) => hotspot.sceneId === scene.id,
  );
  return [...sceneHotspots, ...tourHotspots];
}

/** True when this scene has at least one naming opportunity pin. */
export function sceneHasNamingPin(tour, scene) {
  return listSceneHotspots(tour, scene).some(isNamingPin);
}

/** First naming body for place soft-lead / overview inherit (public + unlisted). */
export function resolveFirstPublicNamingBody(tour, scene) {
  const catalog = tour.namingOpportunities ?? {};
  for (const hotspot of listSceneHotspots(tour, scene)) {
    if (!isNamingPin(hotspot)) continue;
    const namingId = hotspot.namingId?.trim();
    const record = namingId ? catalog[namingId] : null;
    if (namingId && !isNamingUsableForPlaceLead(record)) continue;
    const body =
      hotspot.popup?.body?.trim() ||
      record?.body?.trim() ||
      hotspot.popup?.namingOpportunity?.body?.trim() ||
      '';
    if (body) return body;
  }
  return null;
}

/**
 * Auto-create eligibility — real scene description and no naming pins.
 * Explicit create (Manage button) bypasses this via ensurePlaceOverviewHotspot.
 */
export function shouldHavePlaceOverview(tour, scene) {
  if (sceneHasNamingPin(tour, scene)) return false;
  return hasRealSceneDescription(tour, scene);
}

export function resolvePlaceOverviewBody(tour, scene, fallback = '') {
  if (hasRealSceneDescription(tour, scene)) {
    return scene.description.trim();
  }
  return resolveFirstPublicNamingBody(tour, scene) || fallback;
}

export function positionFromDefaultView(view) {
  return { yaw: Number(view?.yaw) || 0, pitch: Number(view?.pitch) || 0 };
}

function findPlaceOverviewHotspot(tour, scene) {
  if (tour.viewerType === 'model3d') {
    return (tour.hotspots ?? []).find(
      (entry) =>
        isPlaceOverviewHotspot(entry) &&
        (entry.sceneId === scene.id || !entry.sceneId),
    );
  }
  return (scene.hotspots ?? []).find((entry) => isPlaceOverviewHotspot(entry));
}

function collectTourHotspotIds(tour) {
  const ids = new Set();
  for (const hotspot of tour.hotspots ?? []) {
    if (hotspot?.id) ids.add(hotspot.id);
  }
  for (const scene of Object.values(tour.scenes ?? {})) {
    for (const hotspot of scene.hotspots ?? []) {
      if (hotspot?.id) ids.add(hotspot.id);
    }
  }
  return ids;
}

function buildPlaceOverviewHotspot(tour, scene, position) {
  const title = scene.title?.trim() || 'Place';
  const body = resolvePlaceOverviewBody(tour, scene, title);
  const nextPosition = position ?? positionFromDefaultView(scene.defaultView);
  const defaultPos = positionFromDefaultView(scene.defaultView);
  const hotspot = {
    id: allocateOpaqueId(OPAQUE_HOTSPOT_ID_PREFIX, collectTourHotspotIds(tour)),
    type: 'info',
    role: 'placeOverview',
    position: nextPosition,
    popup: { display: 'anchored', title, body },
  };
  if (
    position &&
    (Number(position.yaw) !== defaultPos.yaw ||
      Number(position.pitch) !== defaultPos.pitch)
  ) {
    hotspot.placeOverviewManual = true;
  }
  return hotspot;
}

/**
 * Author opt-in: add place-overview pin (clears suppress). One per panorama scene.
 * @returns {{ hotspot: object, created: boolean }}
 */
export function ensurePlaceOverviewHotspot(tour, scene, position) {
  if (!tour || !scene) {
    throw new Error('Tour and scene are required');
  }
  if (tour.viewerType === 'model3d') {
    throw new Error('Place overview is not supported on model3d tours');
  }

  const existing = findPlaceOverviewHotspot(tour, scene);
  if (existing) {
    throw new Error('This scene already has a place overview hotspot');
  }

  delete scene.suppressPlaceOverview;
  if (!Array.isArray(scene.hotspots)) scene.hotspots = [];
  const hotspot = buildPlaceOverviewHotspot(tour, scene, position);
  scene.hotspots.push(hotspot);
  return { hotspot, created: true };
}

/**
 * Update the place-overview pin for a panorama scene (title / body / position).
 * Does not create unless `{ createIfMissing: true }` and the scene qualifies.
 * Does not auto-remove — use hotspot delete + suppress for that.
 * @param {{ createIfMissing?: boolean }} [options]
 * @returns {boolean} whether the tour/scene hotspot list changed
 */
export function syncPlaceOverviewFromScene(tour, scene, options = {}) {
  if (!tour || !scene) return false;
  if (tour.viewerType === 'model3d') return false;

  const createIfMissing = options.createIfMissing === true;
  const existing = findPlaceOverviewHotspot(tour, scene);

  if (scene.suppressPlaceOverview && !existing) {
    return false;
  }

  if (existing) {
    let changed = false;
    existing.role = 'placeOverview';
    if (!existing.popup) {
      existing.popup = { display: 'anchored', title: '', body: '' };
      changed = true;
    }
    const nextTitle = scene.title?.trim() || existing.popup.title || 'Place';
    const nextBody = resolvePlaceOverviewBody(
      tour,
      scene,
      existing.popup.body || nextTitle,
    );
    if (existing.popup.title !== nextTitle) {
      existing.popup.title = nextTitle;
      changed = true;
    }
    if (existing.popup.body !== nextBody) {
      existing.popup.body = nextBody;
      changed = true;
    }
    if (existing.popup.display !== 'anchored' && !existing.popup.display) {
      existing.popup.display = 'anchored';
      changed = true;
    }

    if (!existing.placeOverviewManual) {
      const nextPos = positionFromDefaultView(scene.defaultView);
      const cur = existing.position ?? {};
      if (cur.yaw !== nextPos.yaw || cur.pitch !== nextPos.pitch) {
        existing.position = nextPos;
        changed = true;
      }
    }

    return changed;
  }

  if (!createIfMissing) return false;
  if (scene.suppressPlaceOverview) return false;
  if (!shouldHavePlaceOverview(tour, scene)) return false;

  if (!Array.isArray(scene.hotspots)) scene.hotspots = [];
  scene.hotspots.push(buildPlaceOverviewHotspot(tour, scene));
  return true;
}

/** After Apply defaultView — move non-manual place-overview to view center. */
export function syncPlaceOverviewPositionToView(tour, scene, view) {
  if (!tour || !scene || tour.viewerType === 'model3d') return false;
  const existing = findPlaceOverviewHotspot(tour, scene);
  if (!existing || existing.placeOverviewManual) return false;
  const nextPos = positionFromDefaultView(view ?? scene.defaultView);
  const cur = existing.position ?? {};
  if (cur.yaw === nextPos.yaw && cur.pitch === nextPos.pitch) return false;
  existing.position = nextPos;
  return true;
}

export function markPlaceOverviewManual(hotspot) {
  if (!isPlaceOverviewHotspot(hotspot)) return false;
  if (hotspot.placeOverviewManual) return false;
  hotspot.placeOverviewManual = true;
  return true;
}

export function suppressPlaceOverviewOnDelete(scene, hotspot) {
  if (!scene || !isPlaceOverviewHotspot(hotspot)) return false;
  if (scene.suppressPlaceOverview) return false;
  scene.suppressPlaceOverview = true;
  return true;
}

/**
 * Formerly cleared suppress when description was empty (which let a later
 * edit auto-create). Suppress now stays sticky until explicit create.
 * @deprecated No-op — kept so existing callers compile.
 */
export function clearPlaceOverviewSuppressIfNoDescription(_tour, _scene) {
  return false;
}
