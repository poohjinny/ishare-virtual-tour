'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  clampGuideDockWidth,
  GUIDE_DOCK_STORAGE_KEY,
  GUIDE_DOCK_WIDTH_DEFAULT,
  GUIDE_DOCK_WIDTH_STORAGE_KEY,
  syncGuideDockBootState,
  syncGuideDockBootWidth,
} from '@/lib/admin-guide-dock';

function readStored(key: string, defaultEnabled: boolean) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultEnabled;
    return raw !== '0';
  } catch {
    return defaultEnabled;
  }
}

function writeStored(key: string, eventName: string, enabled: boolean) {
  try {
    window.localStorage.setItem(key, enabled ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new Event(eventName));
}

const subscribeHydration = () => () => undefined;
const getClientReady = () => true;
const getServerReady = () => false;

function usePersistedFlag(
  storageKey: string,
  eventName: string,
  defaultEnabled: boolean,
) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      window.addEventListener(eventName, onStoreChange);
      window.addEventListener('storage', onStoreChange);
      return () => {
        window.removeEventListener(eventName, onStoreChange);
        window.removeEventListener('storage', onStoreChange);
      };
    },
    [eventName],
  );
  const getSnapshot = useCallback(
    () => readStored(storageKey, defaultEnabled),
    [defaultEnabled, storageKey],
  );
  const getServerSnapshot = useCallback(() => defaultEnabled, [defaultEnabled]);
  const enabled = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const ready = useSyncExternalStore(
    subscribeHydration,
    getClientReady,
    getServerReady,
  );

  return {
    enabled,
    ready,
    setEnabled: (next: boolean) => writeStored(storageKey, eventName, next),
  };
}

const PAUSE_PREVIEW_IFRAME_KEY = 'ishare.admin.debug.pausePreviewIframe';
const PREVIEW_IFRAME_EVENT = 'ishare-admin-debug-preview-iframe';
const FORCE_SKELETON_KEY = 'ishare.admin.debug.forceImageSkeleton';
const FORCE_SKELETON_EVENT = 'ishare-admin-debug-force-image-skeleton';
const FORCE_NAV_PROGRESS_KEY = 'ishare.admin.debug.forceNavProgress';
const FORCE_NAV_PROGRESS_EVENT = 'ishare-admin-debug-force-nav-progress';
const SHOW_DEBUG_KEY = 'ishare.admin.debug.showMenu';
const SHOW_DEBUG_EVENT = 'ishare-admin-debug-show-menu';
const GUIDE_DOCK_EVENT = 'ishare-admin-guide-dock-open';
const GUIDE_WIDTH_EVENT = 'ishare-admin-guide-dock-width';

export {
  GUIDE_DOCK_WIDTH_DEFAULT,
  GUIDE_DOCK_WIDTH_MAX,
  GUIDE_DOCK_WIDTH_MIN,
} from '@/lib/admin-guide-dock';

function readGuideDockWidth() {
  try {
    const raw = window.localStorage.getItem(GUIDE_DOCK_WIDTH_STORAGE_KEY);
    if (raw === null) return GUIDE_DOCK_WIDTH_DEFAULT;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return GUIDE_DOCK_WIDTH_DEFAULT;
    return clampGuideDockWidth(parsed);
  } catch {
    return GUIDE_DOCK_WIDTH_DEFAULT;
  }
}

function writeGuideDockWidth(width: number) {
  // The rail sizes off the boot custom property, so this is the live value too.
  syncGuideDockBootWidth(width);
  try {
    window.localStorage.setItem(
      GUIDE_DOCK_WIDTH_STORAGE_KEY,
      String(clampGuideDockWidth(width)),
    );
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new Event(GUIDE_WIDTH_EVENT));
}

/** Unload and suppress the authoring iframe. Default off: previews load normally. */
export function usePausePreviewIframe() {
  return usePersistedFlag(
    PAUSE_PREVIEW_IFRAME_KEY,
    PREVIEW_IFRAME_EVENT,
    false,
  );
}

/** Hide AssetImage bitmap and hold the viewer shimmer so the fixture is visible. */
export function useForceImageSkeleton() {
  return usePersistedFlag(FORCE_SKELETON_KEY, FORCE_SKELETON_EVENT, false);
}

/**
 * Loop the route progress bar through full runs. Visual only — does not mark
 * navigation pending, so the preview iframe stays mounted.
 */
export function useForceNavProgress() {
  return usePersistedFlag(
    FORCE_NAV_PROGRESS_KEY,
    FORCE_NAV_PROGRESS_EVENT,
    false,
  );
}

/** Settings toggle: Admin Debug on the breadcrumb header. Default off. */
export function useShowAdminDebug() {
  return usePersistedFlag(SHOW_DEBUG_KEY, SHOW_DEBUG_EVENT, false);
}

/**
 * Admin Guide right dock — open state persists so it can stay beside the
 * workspace. Default on: the panel is meant to stay available while authoring.
 */
export function useAdminGuideDock() {
  const dock = usePersistedFlag(GUIDE_DOCK_STORAGE_KEY, GUIDE_DOCK_EVENT, true);

  return {
    ...dock,
    setEnabled: (next: boolean) => {
      // Same tick as the click, so the boot mirror never fights the toggle.
      syncGuideDockBootState(next);
      dock.setEnabled(next);
    },
  };
}

/** Persisted Guide dock width (px), clamped to min/max. */
export function useAdminGuideDockWidth() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(GUIDE_WIDTH_EVENT, onStoreChange);
    window.addEventListener('storage', onStoreChange);
    return () => {
      window.removeEventListener(GUIDE_WIDTH_EVENT, onStoreChange);
      window.removeEventListener('storage', onStoreChange);
    };
  }, []);
  const width = useSyncExternalStore(
    subscribe,
    readGuideDockWidth,
    () => GUIDE_DOCK_WIDTH_DEFAULT,
  );

  return { width, setWidth: (next: number) => writeGuideDockWidth(next) };
}
