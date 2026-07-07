import type { Viewer } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

import type { ViewPosition } from '../types/tour';

/** Gap between hotspot top edge and anchored panel bottom edge (px). */
export const ANCHORED_PANEL_GAP_PX = 32;

/** Nav pill min-height 32px / 2 */
export const NAV_HOTSPOT_HALF_HEIGHT_FALLBACK_PX = 17;

/** Info pill min-height 34px / 2 */
export const INFO_HOTSPOT_HALF_HEIGHT_FALLBACK_PX = 17;

const PITCH_OFFSET_MIN_DEG = 0.5;
const PITCH_OFFSET_MAX_DEG = 45;
const PITCH_OFFSET_FALLBACK_DEG = 2;

export interface AnchoredPanelPositionTrack {
  panelId: string;
  hostHotspotId: string;
  hostPosition: ViewPosition;
}

type MarkerRuntimeState = {
  state?: {
    position2D?: { x: number; y: number } | null;
    size?: { width: number; height: number };
  };
  domElement: HTMLElement | SVGElement;
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Pitch offset (deg above hotspot) for initial panel placement at open.
 * Ongoing camera movement is corrected via screen-space translate only.
 */
export function resolveAnchoredPanelPitchOffsetDeg(
  viewer: Viewer,
  hotspotPosition: ViewPosition,
  hotspotHalfHeightPx: number,
  gapPx = ANCHORED_PANEL_GAP_PX,
): number {
  const { dataHelper } = viewer;
  const yawRad = toRad(hotspotPosition.yaw);
  const pitchRad = toRad(hotspotPosition.pitch);

  const hotspotPoint = dataHelper.sphericalCoordsToViewerCoords({
    yaw: yawRad,
    pitch: pitchRad,
  });

  const targetPanelBottomY = hotspotPoint.y - hotspotHalfHeightPx - gapPx;

  let low = PITCH_OFFSET_MIN_DEG;
  let high = PITCH_OFFSET_MAX_DEG;

  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    const panelPoint = dataHelper.sphericalCoordsToViewerCoords({
      yaw: yawRad,
      pitch: pitchRad + toRad(mid),
    });

    if (panelPoint.y > targetPanelBottomY) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const offset = (low + high) / 2;
  if (!Number.isFinite(offset)) return PITCH_OFFSET_FALLBACK_DEG;

  return Math.max(PITCH_OFFSET_MIN_DEG, Math.min(PITCH_OFFSET_MAX_DEG, offset));
}

export function anchoredPanelMarkerPosition(
  viewer: Viewer,
  hotspotPosition: ViewPosition,
  hotspotHalfHeightPx: number,
): { yaw: string; pitch: string } {
  const offset = resolveAnchoredPanelPitchOffsetDeg(
    viewer,
    hotspotPosition,
    hotspotHalfHeightPx,
  );

  return {
    yaw: `${hotspotPosition.yaw}deg`,
    pitch: `${hotspotPosition.pitch + offset}deg`,
  };
}

export function measureHotspotHalfHeightPx(
  hostMarkerEl: Element | null | undefined,
  fallbackPx: number,
): number {
  if (hostMarkerEl instanceof HTMLElement && hostMarkerEl.offsetHeight > 0) {
    return hostMarkerEl.offsetHeight / 2;
  }
  return fallbackPx;
}

/** Shrink the PSV marker box to match rendered panel height (content-height panels). */
export function fitAnchoredPanelMarkerSize(
  markers: MarkersPlugin,
  panelId: string,
): boolean {
  const marker = markers.getMarker(panelId) as
    | { config?: { size?: { width: number; height: number } | number } }
    | undefined;
  const el = markers.getMarker(panelId)?.domElement;
  if (!(el instanceof HTMLElement)) return false;

  const article = el.querySelector('.tour-glass-panel--anchored');
  if (!(article instanceof HTMLElement)) return false;

  const width = Math.round(article.offsetWidth);
  const height = Math.round(article.offsetHeight);
  if (width <= 0 || height <= 0) return false;

  const size = marker?.config?.size;
  const current =
    typeof size === 'number' ?
      { width: size, height: size }
    : (size ?? { width: 0, height: 0 });

  if (
    Math.abs(current.width - width) < 1 &&
    Math.abs(current.height - height) < 1
  ) {
    return false;
  }

  markers.updateMarker({ id: panelId, size: { width, height } });
  return true;
}

/**
 * After PSV renderMarkers, nudge panel translate to keep a fixed px gap.
 * Does not change spherical position — avoids visibility flicker on drag.
 */
export function correctAnchoredPanelPixelGap(
  markers: MarkersPlugin,
  track: AnchoredPanelPositionTrack | null,
): void {
  if (!track) return;

  const panelMarker = markers.getMarker(track.panelId) as
    | MarkerRuntimeState
    | undefined;
  const hostMarker = markers.getMarker(track.hostHotspotId);

  if (!panelMarker?.domElement || !hostMarker?.domElement) return;

  const panelEl = panelMarker.domElement;
  const hostEl = hostMarker.domElement;

  if (
    !panelEl.classList.contains('psv-marker--visible') ||
    !hostEl.classList.contains('psv-marker--visible')
  ) {
    return;
  }

  const pos2d = panelMarker.state?.position2D;
  if (!pos2d) return;

  const article = panelEl.querySelector('.tour-glass-panel--anchored');
  if (!(article instanceof HTMLElement)) return;

  // Pure screen-space placement: measure the rendered rects directly so the
  // gap stays uniform regardless of zoom or pitch. Mixing viewer-projection
  // coords with DOM measurements drifted at high pitch / high zoom because the
  // projection scale differs from the fixed-size marker DOM.
  const hostRect = hostEl.getBoundingClientRect();
  const articleRect = article.getBoundingClientRect();
  if (hostRect.height <= 0 || articleRect.height <= 0) return;

  // Panel bottom sits a fixed gap above the hotspot top edge.
  const deltaY = hostRect.top - ANCHORED_PANEL_GAP_PX - articleRect.bottom;

  // Panel horizontal center aligns with the hotspot center.
  const hostCenterX = (hostRect.left + hostRect.right) / 2;
  const articleCenterX = (articleRect.left + articleRect.right) / 2;
  const deltaX = hostCenterX - articleCenterX;

  if (Math.abs(deltaY) < 0.5 && Math.abs(deltaX) < 0.5) return;

  panelEl.style.translate = `${Math.round(pos2d.x + deltaX)}px ${Math.round(pos2d.y + deltaY)}px 0px`;
}
