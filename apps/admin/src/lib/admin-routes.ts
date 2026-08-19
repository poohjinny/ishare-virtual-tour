export const TOURS_PATH = '/tours';
export const CLIENTS_PATH = '/clients';
export const USERS_PATH = '/users';
export const TOUR_CREATE_QUERY_KEY = 'create';
export const TOUR_CREATE_QUERY_VALUE = 'tour';
export const TOUR_CREATE_HREF =
  `${TOURS_PATH}?${TOUR_CREATE_QUERY_KEY}=${TOUR_CREATE_QUERY_VALUE}` as const;

export const TOUR_EDIT_QUERY_KEY = 'edit';
export const TOUR_EDIT_QUERY_VALUE = 'tour';

export function tourPath(tourId: string) {
  return `${TOURS_PATH}/${tourId}` as const;
}

export function clientPath(clientId: string) {
  return `${CLIENTS_PATH}/${clientId}` as const;
}

export function tourEditHref(tourId: string) {
  return `${tourPath(tourId)}?${TOUR_EDIT_QUERY_KEY}=${TOUR_EDIT_QUERY_VALUE}` as const;
}

/** Layout Close return — allowlisted tokens, not a free URL. */
export const TOUR_LAYOUT_FROM_QUERY_KEY = 'from';
export const TOUR_LAYOUT_FROM_SCENES = 'scenes';
const TOUR_LAYOUT_FROM_SCENE_PREFIX = 'scene:';

export function tourLayoutFromScene(sceneId: string) {
  return `${TOUR_LAYOUT_FROM_SCENE_PREFIX}${sceneId}`;
}

/** Panorama layout tool route (scenes + hotspots in one screen). */
export function tourVisualEditPath(
  tourId: string,
  sceneId?: string,
  from?: string,
) {
  const base = `${tourPath(tourId)}/edit` as const;
  const params = new URLSearchParams();
  if (sceneId) params.set('scene', sceneId);
  if (from) params.set(TOUR_LAYOUT_FROM_QUERY_KEY, from);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Layout Close target. Missing or unknown `from` → tour Details.
 * `scene:` must still exist on the tour so a deleted opener cannot 404.
 */
export function tourLayoutCloseHref(
  tourId: string,
  from: string | undefined,
  knownSceneIds?: readonly string[],
) {
  const details = tourPath(tourId);
  if (!from) return details;
  if (from === TOUR_LAYOUT_FROM_SCENES) return `${details}/scenes`;
  if (from.startsWith(TOUR_LAYOUT_FROM_SCENE_PREFIX)) {
    const sceneId = from.slice(TOUR_LAYOUT_FROM_SCENE_PREFIX.length);
    if (
      !sceneId ||
      sceneId.includes('/') ||
      sceneId.includes('?') ||
      sceneId.includes('#')
    ) {
      return details;
    }
    if (knownSceneIds && !knownSceneIds.includes(sceneId)) return details;
    return `${details}/scenes/${sceneId}`;
  }
  return details;
}

/** Details header Layout — same gate for catalog kebabs. */
export function showTourVisualEditor(viewerType: string) {
  return viewerType === 'panorama';
}

/** Absolute http(s) href — adds `https://` when the stored value has no scheme. */
export function httpHref(url: string) {
  const value = url.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

export function mapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/** Showcase fixture tour for Guide edit/create demos. */
export const GUIDE_FIXTURE_TOUR_ID = 't_l01wnq8eh6';
export const GUIDE_FIXTURE_TOUR_EDIT_HREF = tourEditHref(GUIDE_FIXTURE_TOUR_ID);
