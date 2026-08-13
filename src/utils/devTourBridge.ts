/**
 * Live handle from the tour experience → DevTools shell.
 * External store so Dev can sit beside the keyed viewer without prop-drilling
 * through splash / NotFound branches.
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

function emit(): void {
  for (const listener of listeners) listener();
}

export function getDevTourBridge(): DevTourBridgeSnapshot | null {
  return snapshot;
}

export function publishDevTourBridge(next: DevTourBridgeSnapshot): void {
  snapshot = next;
  emit();
}

export function clearDevTourBridge(): void {
  if (snapshot === null) return;
  snapshot = null;
  emit();
}

export function subscribeDevTourBridge(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDevTourBridge(): DevTourBridgeSnapshot | null {
  return useSyncExternalStore(
    subscribeDevTourBridge,
    getDevTourBridge,
    getDevTourBridge,
  );
}
