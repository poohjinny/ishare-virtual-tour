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

/** Panorama visual editor workspace (scenes + hotspots in one screen). */
export function tourVisualEditPath(tourId: string, sceneId?: string) {
  const base = `${tourPath(tourId)}/edit` as const;
  if (!sceneId) return base;
  return `${base}?scene=${encodeURIComponent(sceneId)}` as const;
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
