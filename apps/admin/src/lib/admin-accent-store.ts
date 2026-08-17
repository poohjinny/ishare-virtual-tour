'use client';

import { useEffect, useSyncExternalStore } from 'react';

import {
  ADMIN_ACCENT_BOOT_ATTR,
  ADMIN_ACCENT_DEFAULT,
  ADMIN_ACCENT_EVENT,
  ADMIN_ACCENT_STORAGE_KEY,
  type AdminAccentId,
  isAdminAccentId,
} from '@/lib/admin-accent';

function readAdminAccent(): AdminAccentId {
  try {
    const stored = window.localStorage.getItem(ADMIN_ACCENT_STORAGE_KEY);
    return isAdminAccentId(stored) ? stored : ADMIN_ACCENT_DEFAULT;
  } catch {
    return ADMIN_ACCENT_DEFAULT;
  }
}

function syncAdminAccentBootState(accent: AdminAccentId) {
  document.documentElement.setAttribute(ADMIN_ACCENT_BOOT_ATTR, accent);
}

function subscribe(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key !== ADMIN_ACCENT_STORAGE_KEY) return;
    syncAdminAccentBootState(readAdminAccent());
    onStoreChange();
  }

  window.addEventListener(ADMIN_ACCENT_EVENT, onStoreChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(ADMIN_ACCENT_EVENT, onStoreChange);
    window.removeEventListener('storage', handleStorage);
  };
}

export function setAdminAccent(accent: AdminAccentId) {
  try {
    window.localStorage.setItem(ADMIN_ACCENT_STORAGE_KEY, accent);
  } catch {
    // The document attribute still keeps this tab usable when storage is blocked.
  }

  syncAdminAccentBootState(accent);
  window.dispatchEvent(new Event(ADMIN_ACCENT_EVENT));
}

export function useAdminAccent() {
  return useSyncExternalStore(
    subscribe,
    readAdminAccent,
    () => ADMIN_ACCENT_DEFAULT,
  );
}

/**
 * React rebuilds `<html>` when hydration does not match — a DOM-editing browser
 * extension is enough — and the rebuilt element only carries the attributes the
 * server rendered. That drops whatever the boot script stamped, so the page
 * silently falls back to the default palette. The dock and the rail survive
 * because their stores re-apply their boot state; the accent needs the same.
 */
export function useAdminAccentBoot() {
  const accent = useAdminAccent();

  useEffect(() => {
    syncAdminAccentBootState(accent);
  }, [accent]);
}
