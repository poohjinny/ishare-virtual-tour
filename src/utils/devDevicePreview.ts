import {
  DEV_DEVICE_RESPONSIVE_DEFAULT,
  getDevDevicePreset,
  resolveDevDeviceSize,
  type DevDeviceOrientation,
  type DevDevicePresetId,
} from '../constants/devDevicePresets';
import { TOUR_PUBLIC_ORIGIN } from '../constants/tourOrigin';

/**
 * Build the device-preview iframe URL from the parent location.
 * Keeps parent query flags (`dev`, `askGuide`, `guideMock`, `skipLanding`, …)
 * and adds `deviceFrame=1` (no nested DevTools) plus optional `deviceTouch` /
 * `embed`. Preview-only keys are preserved across in-iframe scene nav so the
 * frame does not drop them or recurse into another device preview.
 */
export function buildDevDevicePreviewSrc(
  href: string,
  options: { touch: boolean; embed?: boolean },
): string {
  const url = new URL(href, window.location.origin);
  // Prefer the live address bar when React `location.search` lags a Debug toggle.
  const live = new URLSearchParams(window.location.search);
  for (const [key, value] of live) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('deviceFrame', '1');
  if (options.touch) {
    url.searchParams.set('deviceTouch', '1');
  } else {
    url.searchParams.delete('deviceTouch');
  }
  if (options.embed) {
    url.searchParams.set('embed', '1');
  } else {
    url.searchParams.delete('embed');
  }
  // Nested preview would recurse via shared localStorage prefs.
  url.searchParams.delete('devicePreview');
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Fake browser address bar — host + path + QA query (hides preview plumbing
 * `deviceFrame` / `deviceTouch` so Debug flags like `askGuide` stay visible).
 */
export function formatDevDeviceChromeUrl(
  pathname: string,
  search: string = '',
): string {
  let host = 'tour.ishare.ca';
  try {
    host = new URL(TOUR_PUBLIC_ORIGIN).host;
  } catch {
    // keep default
  }
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  params.delete('deviceFrame');
  params.delete('deviceTouch');
  const path = pathname.replace(/^\//, '');
  const base = path ? `${host}/${path}` : host;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export type DevDeviceActiveFrame = {
  presetId: DevDevicePresetId;
  label: string;
  width: number;
  height: number;
  touch: boolean;
};

export function resolveActiveDevDeviceFrame(
  device: DevDevicePresetId,
  orientation: DevDeviceOrientation,
  responsiveSize: {
    width: number;
    height: number;
  } = DEV_DEVICE_RESPONSIVE_DEFAULT,
): DevDeviceActiveFrame | null {
  const preset = getDevDevicePreset(device);
  if (!preset) return null;

  if (device === 'responsive') {
    return {
      presetId: 'responsive',
      label: preset.label,
      width: responsiveSize.width || DEV_DEVICE_RESPONSIVE_DEFAULT.width,
      height: responsiveSize.height || DEV_DEVICE_RESPONSIVE_DEFAULT.height,
      touch: false,
    };
  }

  const size = resolveDevDeviceSize(preset, orientation);
  return {
    presetId: preset.id,
    label: preset.label,
    width: size.width,
    height: size.height,
    touch: preset.touch,
  };
}
