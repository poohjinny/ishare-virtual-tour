/**
 * Auto place-overview info pin — one per panorama scene when there is a real
 * description and no naming pins (NO covers scenes that have naming).
 * Display inherit lives in namingSceneInherit.
 *
 * Sync may create/update pins; it never auto-removes an existing overview.
 * Explicit delete sets `suppressPlaceOverview`.
 */

import { isDefaultSceneDescription } from './devContentPlaceholders.mjs';
import { isNamingUsableForPlaceLead } from './namingVisibility.mjs';

export const PLACE_OVERVIEW_HOTSPOT_ID = 'info-place';

export function isPlaceOverviewHotspot(hotspot) {
  if (!hotspot || hotspot.type !== 'info') return false;
  if (hotspot.role === 'placeOverview') return true;
  return hotspot.id === PLACE_OVERVIEW_HOTSPOT_ID;
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
 * Auto overview only for places without naming pins (NO covers those scenes).
 * Still requires real scene description for sync create.
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

function buildPlaceOverviewHotspot(tour, scene, position) {
  const title = scene.title?.trim() || 'Place';
  const body = resolvePlaceOverviewBody(tour, scene, title);
  const nextPosition = position ?? positionFromDefaultView(scene.defaultView);
  const defaultPos = positionFromDefaultView(scene.defaultView);
  const hotspot = {
    id: PLACE_OVERVIEW_HOTSPOT_ID,
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

  const clash = (scene.hotspots ?? []).some(
    (entry) =>
      entry.id === PLACE_OVERVIEW_HOTSPOT_ID && !isPlaceOverviewHotspot(entry),
  );
  if (clash) {
    throw new Error(
      `Hotspot id “${PLACE_OVERVIEW_HOTSPOT_ID}” is already used by a non-overview pin`,
    );
  }

  delete scene.suppressPlaceOverview;
  if (!Array.isArray(scene.hotspots)) scene.hotspots = [];
  const hotspot = buildPlaceOverviewHotspot(tour, scene, position);
  scene.hotspots.push(hotspot);
  return { hotspot, created: true };
}

/**
 * Ensure / update the place-overview pin for a panorama scene.
 * Does not auto-remove existing pins — use hotspot delete + suppress for that.
 * @returns {boolean} whether the tour/scene hotspot list changed
 */
export function syncPlaceOverviewFromScene(tour, scene) {
  if (!tour || !scene) return false;
  if (tour.viewerType === 'model3d') return false;

  const shouldHave = shouldHavePlaceOverview(tour, scene);
  const existing = findPlaceOverviewHotspot(tour, scene);

  if (!shouldHave) {
    // Keep existing overview when public naming is hidden or place copy is
    // empty — only explicit delete should remove the pin.
    return false;
  }

  if (scene.suppressPlaceOverview) {
    return false;
  }

  if (!existing) {
    if (!Array.isArray(scene.hotspots)) scene.hotspots = [];
    const clash = scene.hotspots.some(
      (entry) =>
        entry.id === PLACE_OVERVIEW_HOTSPOT_ID &&
        !isPlaceOverviewHotspot(entry),
    );
    if (clash) return false;
    scene.hotspots.push(buildPlaceOverviewHotspot(tour, scene));
    return true;
  }

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

/** Clear suppress when place copy is gone (fresh slate for later content). */
export function clearPlaceOverviewSuppressIfNoDescription(tour, scene) {
  if (!scene?.suppressPlaceOverview) return false;
  if (shouldHavePlaceOverview(tour, scene)) return false;
  delete scene.suppressPlaceOverview;
  return true;
}
