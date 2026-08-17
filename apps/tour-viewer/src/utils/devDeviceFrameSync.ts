/**
 * Same-origin device / embed preview — keep the parent (Dev Tools) URL in
 * sync when the nested `deviceFrame` document navigates (intro → tour, scenes).
 */

export const DEV_DEVICE_FRAME_MESSAGE_SOURCE =
  'ishare-dev-device-frame' as const;

export const DEV_DEVICE_FRAME_LOCATION_TYPE = 'location' as const;

export type DevDeviceFrameLocationMessage = {
  source: typeof DEV_DEVICE_FRAME_MESSAGE_SOURCE;
  type: typeof DEV_DEVICE_FRAME_LOCATION_TYPE;
  pathname: string;
  search: string;
  hash: string;
};

/** Nested preview frame → parent host. */
export function postDevDeviceFrameLocation(location: {
  pathname: string;
  search: string;
  hash: string;
}): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  const message: DevDeviceFrameLocationMessage = {
    source: DEV_DEVICE_FRAME_MESSAGE_SOURCE,
    type: DEV_DEVICE_FRAME_LOCATION_TYPE,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
  window.parent.postMessage(message, window.location.origin);
}

export function parseDevDeviceFrameLocationMessage(
  data: unknown,
): DevDeviceFrameLocationMessage | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.source !== DEV_DEVICE_FRAME_MESSAGE_SOURCE) return null;
  if (message.type !== DEV_DEVICE_FRAME_LOCATION_TYPE) return null;
  if (typeof message.pathname !== 'string') return null;
  if (typeof message.search !== 'string') return null;
  if (typeof message.hash !== 'string') return null;
  return message as DevDeviceFrameLocationMessage;
}

/** Drop iframe-only preview plumbing from a URL for the parent address bar. */
export function toParentHrefFromDeviceFrameLocation(location: {
  pathname: string;
  search: string;
  hash?: string;
}): string {
  const params = new URLSearchParams(
    location.search.startsWith('?') ?
      location.search.slice(1)
    : location.search,
  );
  params.delete('deviceFrame');
  params.delete('deviceTouch');
  // Embed chrome is iframe-only (`?embed=1`); never leak onto the Dev host URL.
  params.delete('embed');
  const qs = params.toString();
  return `${location.pathname}${qs ? `?${qs}` : ''}${location.hash ?? ''}`;
}

function searchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const key of keys) {
    if (a.get(key) !== b.get(key)) return false;
  }
  return true;
}

/**
 * True when the iframe document already shows `desiredSrc` (same-origin).
 * Used so parent URL sync after in-frame nav does not remount the iframe.
 */
export function iframeAlreadyShowsSrc(
  iframe: HTMLIFrameElement,
  desiredSrc: string,
): boolean {
  try {
    const win = iframe.contentWindow;
    if (!win) return false;
    const desired = new URL(desiredSrc, window.location.origin);
    const actual = win.location;
    return (
      actual.pathname === desired.pathname &&
      searchParamsEqual(
        new URLSearchParams(actual.search),
        desired.searchParams,
      ) &&
      actual.hash === desired.hash
    );
  } catch {
    return false;
  }
}
