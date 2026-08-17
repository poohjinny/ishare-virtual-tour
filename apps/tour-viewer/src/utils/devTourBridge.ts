/**
 * Live handle from the tour experience → DevTools shell.
 * External store so Dev can sit beside the keyed viewer without prop-drilling
 * through splash / NotFound branches.
 *
 * Camera / click readouts are a separate store. Patching them must not
 * re-render DevToolsHost or TourPage (that hitches PSV transitions).
 */

import { useSyncExternalStore } from 'react';
import type { DevSceneOption } from '../components/dev/DevViewPanel';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import type { Tour, ViewPosition, WorldPosition } from '../types/tour';
import type { ClickCoords, DevSceneRef } from './devHotspotLogger';
import type { DevTourMutateOptions } from './devTourApi';

export type DevHotspotMovePosition =
  | { yaw: number; pitch: number }
  | WorldPosition;

export interface DevTourBridgeSnapshot {
  tour: Tour;
  scene: DevSceneRef;
  currentSceneId: string;
  sceneOptions: DevSceneOption[];
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
  activeNamingHotspotId: string | null;
  panelStack: TourPanelStack;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  captureSceneThumbnail: () => Promise<Blob | null>;
  getCurrentView: () => ViewPosition | null;
  animateToView: (view: ViewPosition) => Promise<void> | void;
  focusHotspot: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
  /** Sync viewer canvas to the stage box in the same frame as push/overlay. */
  syncLayoutSize: () => void;
  openNamingOpportunity?: (sceneId: string, hotspotId: string) => void;
  onHotspotPlacementCaptureChange?: (active: boolean) => void;
  /** Manage → Move — which hotspot the viewer should make draggable. */
  onHotspotMoveIdChange?: (hotspotId: string | null) => void;
  /** Register the Dev panel commit handler for drag-drop saves. */
  registerHotspotMoveCommit?: (
    handler: ((position: DevHotspotMovePosition) => Promise<void>) | null,
  ) => void;
}

let snapshot: DevTourBridgeSnapshot | null = null;
const listeners = new Set<() => void>();

let viewSnapshot: ViewPosition | null = null;
const viewListeners = new Set<() => void>();
let viewEmitTimer: ReturnType<typeof setTimeout> | null = null;

let clickSnapshot: ClickCoords | null = null;
const clickListeners = new Set<() => void>();

/** Wait until camera motion settles so Dev UI does not re-render mid-transition. */
const DEV_VIEW_EMIT_SETTLE_MS = 280;

function emit(): void {
  for (const listener of listeners) listener();
}

function emitView(): void {
  for (const listener of viewListeners) listener();
}

function emitClick(): void {
  for (const listener of clickListeners) listener();
}

export function getDevTourBridge(): DevTourBridgeSnapshot | null {
  return snapshot;
}

export function getDevTourView(): ViewPosition | null {
  return viewSnapshot;
}

export function getDevTourClickCoords(): ClickCoords | null {
  return clickSnapshot;
}

function cancelViewEmitTimer(): void {
  if (!viewEmitTimer) return;
  clearTimeout(viewEmitTimer);
  viewEmitTimer = null;
}

function syncReadoutsFromSnapshot(next: DevTourBridgeSnapshot | null): void {
  viewSnapshot = next?.view ?? null;
  clickSnapshot = next?.clickCoords ?? null;
}

export function publishDevTourBridge(next: DevTourBridgeSnapshot): void {
  cancelViewEmitTimer();
  snapshot = next;
  syncReadoutsFromSnapshot(snapshot);
  emit();
  emitView();
  emitClick();
}

/**
 * Camera readout for Dev — do not `setState` on TourPage (that re-renders PSV).
 * Snapshot updates immediately; only view subscribers refresh after settle.
 */
export function patchDevTourBridgeView(view: ViewPosition | null): void {
  viewSnapshot = view;
  if (snapshot) snapshot = { ...snapshot, view };
  if (view === null) {
    cancelViewEmitTimer();
    emitView();
    return;
  }
  cancelViewEmitTimer();
  viewEmitTimer = setTimeout(() => {
    viewEmitTimer = null;
    emitView();
    if (viewSnapshot && window.parent !== window) {
      window.parent.postMessage(
        {
          source: 'ishare-virtual-tour',
          type: 'tour:view',
          view: viewSnapshot,
        },
        '*',
      );
    }
  }, DEV_VIEW_EMIT_SETTLE_MS);
}

/** Panorama / 3D click readout — Dev Scene tab only, not TourPage. */
export function patchDevTourBridgeClickCoords(
  coords: ClickCoords | null,
): void {
  clickSnapshot = coords;
  if (snapshot) snapshot = { ...snapshot, clickCoords: coords };
  emitClick();
  if (coords && window.parent !== window) {
    window.parent.postMessage(
      {
        source: 'ishare-virtual-tour',
        type: 'tour:click',
        position: coords,
      },
      '*',
    );
  }
}

export function clearDevTourBridge(): void {
  cancelViewEmitTimer();
  if (snapshot === null && viewSnapshot === null && clickSnapshot === null) {
    return;
  }
  snapshot = null;
  viewSnapshot = null;
  clickSnapshot = null;
  emit();
  emitView();
  emitClick();
}

export function subscribeDevTourBridge(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeDevTourView(listener: () => void): () => void {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

export function subscribeDevTourClickCoords(listener: () => void): () => void {
  clickListeners.add(listener);
  return () => {
    clickListeners.delete(listener);
  };
}

export function useDevTourBridge(): DevTourBridgeSnapshot | null {
  return useSyncExternalStore(
    subscribeDevTourBridge,
    getDevTourBridge,
    getDevTourBridge,
  );
}

export function useDevTourView(): ViewPosition | null {
  return useSyncExternalStore(
    subscribeDevTourView,
    getDevTourView,
    getDevTourView,
  );
}

export function useDevTourClickCoords(): ClickCoords | null {
  return useSyncExternalStore(
    subscribeDevTourClickCoords,
    getDevTourClickCoords,
    getDevTourClickCoords,
  );
}
