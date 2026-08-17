import { useSyncExternalStore } from 'react';
import type { DevPanelLayout, DevPanelTheme } from '../constants/devPanel';
import { TOUR_CHROME_MOBILE_MQ } from '../constants/tourChrome';
import {
  DEV_DEVICE_DEFAULT_FRAME_PRESET,
  DEV_DEVICE_RESPONSIVE_DEFAULT,
  DEV_DEVICE_RESPONSIVE_MAX,
  DEV_DEVICE_RESPONSIVE_MIN,
  getDevDevicePreset,
  isDevDeviceFramePresetId,
  isDevDevicePresetId,
  type DevDeviceOrientation,
  type DevDevicePresetId,
} from '../constants/devDevicePresets';

const THEME_KEY = 'ishare.devPanelTheme';
const LAYOUT_KEY = 'ishare.devPanelLayout';
const PANEL_OPEN_KEY = 'ishare.devPanelOpen';
const DEVICE_KEY = 'ishare.devPanelDevice';
const DEVICE_MODE_KEY = 'ishare.devPanelDeviceMode';
const DEVICE_ORIENTATION_KEY = 'ishare.devPanelDeviceOrientation';
const LAST_FRAME_DEVICE_KEY = 'ishare.devPanelLastFrameDevice';
const RESPONSIVE_SIZE_KEY = 'ishare.devPanelDeviceResponsiveSize';
const BROWSER_CHROME_KEY = 'ishare.devPanelDeviceBrowserChrome';
const DEVICE_EMBED_KEY = 'ishare.devPanelDeviceEmbed';

export type DevDeviceResponsiveSize = { width: number; height: number };

export type DevPanelPrefs = {
  theme: DevPanelTheme;
  layout: DevPanelLayout;
  /** Dev tools drawer / floating / push panel open. */
  panelOpen: boolean;
  /** Explicit device-preview shell (independent of the selected preset). */
  deviceMode: boolean;
  device: DevDevicePresetId;
  deviceOrientation: DevDeviceOrientation;
  deviceResponsiveSize: DevDeviceResponsiveSize;
  /** Shared browser chrome around the viewport (default on). */
  deviceBrowserChrome: boolean;
  /** Load preview iframe with `?embed=1` (host postMessage QA). */
  deviceEmbed: boolean;
};

function readTheme(): DevPanelTheme {
  if (typeof localStorage === 'undefined') return 'dark';
  return localStorage.getItem(THEME_KEY)?.trim() === 'light' ? 'light' : 'dark';
}

function readLayout(): DevPanelLayout {
  if (typeof localStorage === 'undefined') return 'push';
  const raw = localStorage.getItem(LAYOUT_KEY)?.trim();
  if (raw === 'overlay' || raw === 'floating' || raw === 'push') return raw;
  return 'push';
}

function readPanelOpen(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const raw = localStorage.getItem(PANEL_OPEN_KEY)?.trim();
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  // Unset: open on desktop/compact, closed on phone — same as pre-persist default.
  if (typeof window === 'undefined') return true;
  try {
    return !window.matchMedia(TOUR_CHROME_MOBILE_MQ).matches;
  } catch {
    return true;
  }
}

function readDevice(): DevDevicePresetId {
  if (typeof localStorage === 'undefined') return 'responsive';
  const raw = localStorage.getItem(DEVICE_KEY)?.trim() ?? '';
  return isDevDevicePresetId(raw) ? raw : 'responsive';
}

function readDeviceMode(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(DEVICE_MODE_KEY)?.trim();
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  // Migrate: older builds treated any non-responsive preset as device mode.
  return readDevice() !== 'responsive';
}

function readDeviceOrientation(): DevDeviceOrientation {
  if (typeof localStorage === 'undefined') return 'portrait';
  return localStorage.getItem(DEVICE_ORIENTATION_KEY)?.trim() === 'landscape' ?
      'landscape'
    : 'portrait';
}

function readLastFrameDevice(): Exclude<DevDevicePresetId, 'responsive'> {
  if (typeof localStorage === 'undefined') {
    return DEV_DEVICE_DEFAULT_FRAME_PRESET;
  }
  const raw = localStorage.getItem(LAST_FRAME_DEVICE_KEY)?.trim() ?? '';
  return isDevDeviceFramePresetId(raw) ? raw : DEV_DEVICE_DEFAULT_FRAME_PRESET;
}

function clampResponsiveSize(
  size: DevDeviceResponsiveSize,
): DevDeviceResponsiveSize {
  return {
    width: Math.min(
      DEV_DEVICE_RESPONSIVE_MAX.width,
      Math.max(DEV_DEVICE_RESPONSIVE_MIN.width, Math.round(size.width)),
    ),
    height: Math.min(
      DEV_DEVICE_RESPONSIVE_MAX.height,
      Math.max(DEV_DEVICE_RESPONSIVE_MIN.height, Math.round(size.height)),
    ),
  };
}

function readResponsiveSize(): DevDeviceResponsiveSize {
  if (typeof localStorage === 'undefined') {
    return { ...DEV_DEVICE_RESPONSIVE_DEFAULT };
  }
  const raw = localStorage.getItem(RESPONSIVE_SIZE_KEY)?.trim() ?? '';
  if (!raw) return { ...DEV_DEVICE_RESPONSIVE_DEFAULT };
  try {
    const parsed = JSON.parse(raw) as Partial<DevDeviceResponsiveSize>;
    if (
      typeof parsed.width !== 'number' ||
      typeof parsed.height !== 'number' ||
      !Number.isFinite(parsed.width) ||
      !Number.isFinite(parsed.height)
    ) {
      return { ...DEV_DEVICE_RESPONSIVE_DEFAULT };
    }
    return clampResponsiveSize({ width: parsed.width, height: parsed.height });
  } catch {
    return { ...DEV_DEVICE_RESPONSIVE_DEFAULT };
  }
}

function readBrowserChrome(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const raw = localStorage.getItem(BROWSER_CHROME_KEY)?.trim();
  if (raw === '0' || raw === 'false') return false;
  return true;
}

function readDeviceEmbed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(DEVICE_EMBED_KEY)?.trim();
  return raw === '1' || raw === 'true';
}

function writeTheme(theme: DevPanelTheme): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

function writeLayout(layout: DevPanelLayout): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAYOUT_KEY, layout);
}

function writePanelOpen(open: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PANEL_OPEN_KEY, open ? '1' : '0');
}

function writeDevice(device: DevDevicePresetId): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEVICE_KEY, device);
}

function writeDeviceMode(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEVICE_MODE_KEY, enabled ? '1' : '0');
}

function writeDeviceOrientation(orientation: DevDeviceOrientation): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEVICE_ORIENTATION_KEY, orientation);
}

function writeLastFrameDevice(
  device: Exclude<DevDevicePresetId, 'responsive'>,
): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_FRAME_DEVICE_KEY, device);
}

function writeResponsiveSize(size: DevDeviceResponsiveSize): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(RESPONSIVE_SIZE_KEY, JSON.stringify(size));
}

function writeBrowserChrome(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(BROWSER_CHROME_KEY, enabled ? '1' : '0');
}

function writeDeviceEmbed(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEVICE_EMBED_KEY, enabled ? '1' : '0');
}

let prefs: DevPanelPrefs = {
  theme: readTheme(),
  layout: readLayout(),
  panelOpen: readPanelOpen(),
  deviceMode: readDeviceMode(),
  device: readDevice(),
  deviceOrientation: readDeviceOrientation(),
  deviceResponsiveSize: readResponsiveSize(),
  deviceBrowserChrome: readBrowserChrome(),
  deviceEmbed: readDeviceEmbed(),
};

/** Bumped to force the device-preview iframe to reload. */
let devicePreviewReloadNonce = 0;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function getDevPanelPrefs(): DevPanelPrefs {
  return prefs;
}

export function getDevDevicePreviewReloadNonce(): number {
  return devicePreviewReloadNonce;
}

export function isDevPanelDeviceModeEnabled(
  deviceMode: boolean = prefs.deviceMode,
): boolean {
  return deviceMode;
}

export function subscribeDevPanelPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setDevPanelTheme(theme: DevPanelTheme): void {
  if (prefs.theme === theme) return;
  prefs = { ...prefs, theme };
  writeTheme(theme);
  emit();
}

export function setDevPanelLayout(layout: DevPanelLayout): void {
  if (prefs.layout === layout) return;
  prefs = { ...prefs, layout };
  writeLayout(layout);
  emit();
}

export function setDevPanelOpen(open: boolean): void {
  const alreadyStored =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(PANEL_OPEN_KEY) != null;
  if (prefs.panelOpen === open && alreadyStored) return;
  prefs = { ...prefs, panelOpen: open };
  writePanelOpen(open);
  emit();
}

export function setDevPanelDevice(device: DevDevicePresetId): void {
  if (prefs.device === device) return;
  if (isDevDeviceFramePresetId(device)) writeLastFrameDevice(device);
  const nativeOrientation = getDevDevicePreset(device)?.nativeOrientation;
  const deviceOrientation =
    nativeOrientation && prefs.deviceOrientation !== nativeOrientation ?
      nativeOrientation
    : prefs.deviceOrientation;
  const orientationChanged = deviceOrientation !== prefs.deviceOrientation;
  prefs = { ...prefs, device, deviceOrientation };
  writeDevice(device);
  if (orientationChanged) writeDeviceOrientation(deviceOrientation);
  emit();
}

export function setDevPanelDeviceResponsiveSize(
  size: DevDeviceResponsiveSize,
): void {
  const next = clampResponsiveSize(size);
  if (
    prefs.deviceResponsiveSize.width === next.width &&
    prefs.deviceResponsiveSize.height === next.height
  ) {
    return;
  }
  prefs = { ...prefs, deviceResponsiveSize: next };
  writeResponsiveSize(next);
  emit();
}

export function setDevPanelDeviceBrowserChrome(enabled: boolean): void {
  if (prefs.deviceBrowserChrome === enabled) return;
  prefs = { ...prefs, deviceBrowserChrome: enabled };
  writeBrowserChrome(enabled);
  emit();
}

export function toggleDevPanelDeviceBrowserChrome(): void {
  setDevPanelDeviceBrowserChrome(!prefs.deviceBrowserChrome);
}

/** True when the preview shell is the Embed harness (`?embed=1` + parent log). */
export function isDevPanelEmbedPreviewEnabled(
  prefsSnapshot: Pick<DevPanelPrefs, 'deviceMode' | 'deviceEmbed'> = prefs,
): boolean {
  return prefsSnapshot.deviceMode && prefsSnapshot.deviceEmbed;
}

/**
 * Debug → Embed mode harness.
 * Shared viewport shell + `?embed=1` and parent postMessage log.
 */
export function setDevPanelEmbedPreviewMode(enabled: boolean): void {
  if (enabled) {
    if (prefs.deviceMode && prefs.deviceEmbed) return;
    if (isDevDeviceFramePresetId(prefs.device)) {
      writeLastFrameDevice(prefs.device);
    }
    prefs = {
      ...prefs,
      deviceMode: true,
      deviceEmbed: true,
      device: 'responsive',
    };
    writeDeviceMode(true);
    writeDeviceEmbed(true);
    writeDevice('responsive');
    emit();
    return;
  }

  if (!prefs.deviceEmbed) return;
  if (isDevDeviceFramePresetId(prefs.device)) {
    writeLastFrameDevice(prefs.device);
  }
  prefs = { ...prefs, deviceMode: false, deviceEmbed: false };
  writeDeviceMode(false);
  writeDeviceEmbed(false);
  emit();
}

/** Debug → Device mode toggle. Remembers the last phone/tablet preset on enter. */
export function setDevPanelDeviceMode(enabled: boolean): void {
  if (enabled) {
    if (prefs.deviceMode && !prefs.deviceEmbed) return;
    const nextDevice =
      isDevDeviceFramePresetId(prefs.device) ?
        prefs.device
      : readLastFrameDevice();
    if (isDevDeviceFramePresetId(nextDevice)) writeLastFrameDevice(nextDevice);
    prefs = {
      ...prefs,
      deviceMode: true,
      deviceEmbed: false,
      device: nextDevice,
    };
    writeDeviceMode(true);
    writeDeviceEmbed(false);
    writeDevice(nextDevice);
    emit();
    return;
  }

  if (!prefs.deviceMode) return;
  if (isDevDeviceFramePresetId(prefs.device)) {
    writeLastFrameDevice(prefs.device);
  }
  prefs = { ...prefs, deviceMode: false, deviceEmbed: false };
  writeDeviceMode(false);
  writeDeviceEmbed(false);
  emit();
}

export function setDevPanelDeviceOrientation(
  deviceOrientation: DevDeviceOrientation,
): void {
  if (prefs.deviceOrientation === deviceOrientation) return;
  prefs = { ...prefs, deviceOrientation };
  writeDeviceOrientation(deviceOrientation);
  emit();
}

export function toggleDevPanelDeviceOrientation(): void {
  if (prefs.device === 'responsive') {
    const { width, height } = prefs.deviceResponsiveSize;
    setDevPanelDeviceResponsiveSize({ width: height, height: width });
  }
  setDevPanelDeviceOrientation(
    prefs.deviceOrientation === 'portrait' ? 'landscape' : 'portrait',
  );
}

export function bumpDevDevicePreviewReload(): void {
  devicePreviewReloadNonce += 1;
  emit();
}

export function useDevPanelPrefs(): DevPanelPrefs {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    getDevPanelPrefs,
    getDevPanelPrefs,
  );
}

/** Primitive slices — avoid re-rendering subscribers that don't use the field. */
export function useDevPanelTheme(): DevPanelTheme {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    () => getDevPanelPrefs().theme,
    () => getDevPanelPrefs().theme,
  );
}

export function useDevPanelLayout(): DevPanelLayout {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    () => getDevPanelPrefs().layout,
    () => getDevPanelPrefs().layout,
  );
}

export function useDevPanelOpen(): boolean {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    () => getDevPanelPrefs().panelOpen,
    () => getDevPanelPrefs().panelOpen,
  );
}

export function useDevPanelDeviceMode(): boolean {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    () => getDevPanelPrefs().deviceMode,
    () => getDevPanelPrefs().deviceMode,
  );
}

let devicePreviewFlagsCache = {
  deviceMode: false,
  deviceEmbed: false,
};

function getDevicePreviewFlagsSnapshot(): {
  deviceMode: boolean;
  deviceEmbed: boolean;
} {
  const { deviceMode, deviceEmbed } = getDevPanelPrefs();
  if (
    devicePreviewFlagsCache.deviceMode === deviceMode &&
    devicePreviewFlagsCache.deviceEmbed === deviceEmbed
  ) {
    return devicePreviewFlagsCache;
  }
  devicePreviewFlagsCache = { deviceMode, deviceEmbed };
  return devicePreviewFlagsCache;
}

export function useDevPanelDevicePreviewFlags(): {
  deviceMode: boolean;
  deviceEmbed: boolean;
} {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    getDevicePreviewFlagsSnapshot,
    getDevicePreviewFlagsSnapshot,
  );
}

export function useDevDevicePreviewReloadNonce(): number {
  return useSyncExternalStore(
    subscribeDevPanelPrefs,
    getDevDevicePreviewReloadNonce,
    getDevDevicePreviewReloadNonce,
  );
}

/** @deprecated Prefer {@link useDevPanelPrefs} / {@link setDevPanelTheme}. */
export function readDevPanelTheme(): DevPanelTheme {
  return getDevPanelPrefs().theme;
}

/** @deprecated Prefer {@link setDevPanelTheme}. */
export function writeDevPanelTheme(theme: DevPanelTheme): void {
  setDevPanelTheme(theme);
}
