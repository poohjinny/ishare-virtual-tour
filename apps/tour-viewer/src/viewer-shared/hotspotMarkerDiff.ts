import type { Hotspot, Scene, Tour, ViewPosition } from '../types/tour';
import { isWorldPosition } from '../types/tour';
import { buildHotspotMarkerHtml } from './buildMarkers';

export type HotspotMarkerUpdate = {
  next: Hotspot;
  /** True when only spherical/world position changed (html fingerprint identical). */
  positionOnly: boolean;
};

export type HotspotMarkerDiff = {
  added: Hotspot[];
  removed: Hotspot[];
  updated: HotspotMarkerUpdate[];
};

function positionFingerprint(hotspot: Hotspot): string {
  const pos = hotspot.position;
  if (isWorldPosition(pos)) {
    return `w:${pos.x},${pos.y},${pos.z}`;
  }
  const view = pos as ViewPosition;
  return `s:${view.yaw},${view.pitch}`;
}

function markerFingerprint(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
): { position: string; html: string } {
  return {
    position: positionFingerprint(hotspot),
    html: buildHotspotMarkerHtml(hotspot, tour, hostScene),
  };
}

/**
 * Diff audience-filtered hotspot lists for surgical marker patching.
 * Equality uses rendered pill HTML + position so inherited catalog/nav label
 * changes count as updates even when the hotspot JSON is unchanged.
 */
export function diffHotspotMarkers(
  prevHotspots: Hotspot[],
  nextHotspots: Hotspot[],
  previousTour: Tour,
  nextTour: Tour,
  previousHostScene?: Scene,
  nextHostScene?: Scene,
): HotspotMarkerDiff {
  const prevById = new Map(prevHotspots.map((h) => [h.id, h]));
  const nextById = new Map(nextHotspots.map((h) => [h.id, h]));

  const added: Hotspot[] = [];
  const removed: Hotspot[] = [];
  const updated: HotspotMarkerUpdate[] = [];

  for (const [id, next] of nextById) {
    const prev = prevById.get(id);
    if (!prev) {
      added.push(next);
      continue;
    }

    const prevFp = markerFingerprint(prev, previousTour, previousHostScene);
    const nextFp = markerFingerprint(next, nextTour, nextHostScene);
    if (prevFp.html === nextFp.html && prevFp.position === nextFp.position) {
      continue;
    }

    updated.push({
      next,
      positionOnly:
        prevFp.html === nextFp.html && prevFp.position !== nextFp.position,
    });
  }

  for (const [id, prev] of prevById) {
    if (!nextById.has(id)) removed.push(prev);
  }

  return { added, removed, updated };
}

export function hotspotMarkerDiffHasChanges(diff: HotspotMarkerDiff): boolean {
  return (
    diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0
  );
}
