import type { Viewer } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type {
  Hotspot,
  PopupContent,
  Scene,
  Tour,
  ViewPosition,
} from '../types/tour';
import { isPlaceOverviewHotspot } from '../utils/placeOverview';
import {
  isNamingHotspot,
  resolveHotspotHostScene,
  resolveNamingPopup,
} from '../utils/namingSceneInherit';
import {
  buildAnchoredPopupHtml,
  glassPanelMarkerSize,
} from '../components/tourGlassPanelHtml';
import {
  mountNavPreviewImageHero,
  mountNavPreviewVideoHero,
} from './navPreviewMiniViewer';
import { setActiveInfoHotspot } from './infoHotspotActive';
import { enableGlassPanelTextSelection } from './glassPanelTextSelection';
import { bindGlassPanelCtaOverflowTitles } from '../utils/glassPanelCtaOverflow';
import { releaseAllTourMedia } from '../utils/tourMediaCoordinator';
import {
  anchoredPanelMarkerPosition,
  correctAnchoredPanelPixelGap,
  fitAnchoredPanelMarkerSize,
  INFO_HOTSPOT_HALF_HEIGHT_FALLBACK_PX,
  measureHotspotHalfHeightPx,
} from './anchoredPanelPosition';
import {
  clearAnchoredPanelCameraRestore,
  revealCameraForOffViewPanel,
  restoreAnchoredPanelCameraIfNeeded,
  scheduleNudgeCameraForClippedPanel,
  waitForAnchoredPanelEnter,
} from './anchoredPanelCameraNudge';
import { notifyAnchoredPanelOpened } from './anchoredPanelVisibility';

const PANEL_ID_SUFFIX = '-panel';
const PANEL_EXIT_MS = 200;

const closingPanelIds = new Set<string>();
const closingPanelTimeouts = new Map<string, number>();

function cancelPanelExit(id: string): void {
  const timeoutId = closingPanelTimeouts.get(id);
  if (timeoutId != null) {
    window.clearTimeout(timeoutId);
    closingPanelTimeouts.delete(id);
  }
  closingPanelIds.delete(id);
}

interface InfoPanelPositionTrack {
  panelId: string;
  hostHotspotId: string;
  hostPosition: ViewPosition;
}

let infoPanelPositionTrack: InfoPanelPositionTrack | null = null;

function panelMarkerId(hotspotId: string): string {
  return `${hotspotId}${PANEL_ID_SUFFIX}`;
}

function clearInfoPanelPositionTrack(): void {
  infoPanelPositionTrack = null;
}

/**
 * Resolve which panorama scene owns this hotspot instance.
 * Place-overview pins share id `info-place` across scenes — never use a bare
 * id lookup across Object.values(scenes).
 */
function findSceneOwningHotspot(
  tour: Tour,
  hotspot: Hotspot,
  preferredSceneId?: string,
): Scene | undefined {
  if (preferredSceneId) {
    const preferred = tour.scenes[preferredSceneId];
    if (preferred?.hotspots?.includes(hotspot)) return preferred;
    if (preferred?.hotspots?.some((entry) => entry.id === hotspot.id)) {
      return preferred;
    }
  }

  for (const scene of Object.values(tour.scenes ?? {})) {
    if (scene.hotspots?.includes(hotspot)) return scene;
  }

  const matches = Object.values(tour.scenes ?? {}).filter((scene) =>
    scene.hotspots?.some((entry) => entry.id === hotspot.id),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function syncInfoPanelPosition(markers: MarkersPlugin): void {
  if (
    infoPanelPositionTrack &&
    !markers.getMarker(infoPanelPositionTrack.panelId)
  ) {
    clearInfoPanelPositionTrack();
  }

  if (infoPanelPositionTrack) {
    fitAnchoredPanelMarkerSize(markers, infoPanelPositionTrack.panelId);
  }

  correctAnchoredPanelPixelGap(markers, infoPanelPositionTrack);
}

export function closeAnchoredInfoPanel(
  markers: MarkersPlugin,
  animate = true,
  options?: { restoreCamera?: boolean },
): void {
  releaseAllTourMedia();
  let clearingActive = false;
  let closedAny = false;
  const restoreCamera = options?.restoreCamera ?? animate;

  for (const marker of markers.getMarkers()) {
    if (!marker.data?.infoPanel) continue;
    closedAny = true;

    clearInfoPanelPositionTrack();

    if (!clearingActive) {
      setActiveInfoHotspot(markers, null);
      clearingActive = true;
    }

    const id = marker.id;

    if (!animate) {
      cancelPanelExit(id);
      try {
        markers.removeMarker(id);
      } catch {
        /* marker already removed */
      }
      continue;
    }

    if (closingPanelIds.has(id)) continue;

    // Exit scale runs on the article (ancestor of the glass shell), matching the
    // entrance — retained from the frosted-glass era (when animating the
    // backdrop-filter shell tripped a Chromium paint bug).
    const article = marker.domElement.querySelector(
      '.tour-glass-panel--anchored',
    );
    if (!(article instanceof HTMLElement)) {
      cancelPanelExit(id);
      markers.removeMarker(id);
      continue;
    }

    closingPanelIds.add(id);
    article.classList.remove('tour-glass-panel--anchored-enter');
    article.classList.add('tour-glass-panel--anchored-exit');

    const timeoutId = window.setTimeout(() => {
      closingPanelTimeouts.delete(id);
      closingPanelIds.delete(id);
      try {
        if (markers.getMarker(id)) {
          markers.removeMarker(id);
        }
      } catch {
        /* marker already removed */
      }
    }, PANEL_EXIT_MS);
    closingPanelTimeouts.set(id, timeoutId);
  }

  if (!closedAny) return;
  if (restoreCamera) void restoreAnchoredPanelCameraIfNeeded();
  else clearAnchoredPanelCameraRestore();
}

export function getOpenAnchoredPanelHostId(
  markers: MarkersPlugin,
): string | null {
  for (const marker of markers.getMarkers()) {
    const hostId = marker.data?.hostHotspotId as string | undefined;
    if (marker.data?.infoPanel && hostId) return hostId;
  }
  return null;
}

export function openAnchoredInfoPanel(
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspot: Hotspot,
  tour: Tour,
  hideShare = false,
  options?: {
    skipCameraNudge?: boolean;
    /** Owning scene — required when hotspot ids collide (place-overview). */
    hostScene?: Scene | null;
    hostSceneId?: string;
  },
): void {
  if (
    !hotspot.popup &&
    !isNamingHotspot(hotspot) &&
    !isPlaceOverviewHotspot(hotspot)
  ) {
    return;
  }

  closeAnchoredInfoPanel(markers, false);

  const hostScene = resolveHotspotHostScene(
    tour,
    hotspot,
    options?.hostScene ??
      findSceneOwningHotspot(tour, hotspot, options?.hostSceneId),
  );
  const popup =
    isNamingHotspot(hotspot) || isPlaceOverviewHotspot(hotspot) ?
      resolveNamingPopup(tour, hotspot, hostScene)
    : hotspot.popup;
  if (!popup) return;

  const shareAsLocation = isPlaceOverviewHotspot(hotspot);
  const id = panelMarkerId(hotspot.id);
  const hostMarker = markers.getMarker(hotspot.id);
  const halfHeight = measureHotspotHalfHeightPx(
    hostMarker?.domElement,
    INFO_HOTSPOT_HALF_HEIGHT_FALLBACK_PX,
  );
  const markerSize = glassPanelMarkerSize(popup, hotspot.id, tour, hideShare, {
    shareAsLocation,
  });

  markers.addMarker({
    id,
    html: buildAnchoredPopupHtml(popup, hotspot.id, {
      tour,
      hideShare,
      shareAsLocation,
    }),
    size: markerSize,
    position: anchoredPanelMarkerPosition(
      viewer,
      hotspot.position as ViewPosition,
      halfHeight,
    ),
    anchor: 'bottom center',
    data: { infoPanel: true, hostHotspotId: hotspot.id },
  });

  infoPanelPositionTrack = {
    panelId: id,
    hostHotspotId: hotspot.id,
    hostPosition: hotspot.position as ViewPosition,
  };

  const marker = markers.getMarker(id);
  if (marker?.domElement instanceof HTMLElement) {
    enableGlassPanelTextSelection(marker.domElement);
    bindGlassPanelCtaOverflowTitles(marker.domElement);
  }

  setActiveInfoHotspot(markers, hotspot.id);
  notifyAnchoredPanelOpened();

  if (!(marker?.domElement instanceof HTMLElement)) return;

  // Heavy hero media waits until enter + camera have both settled. Camera nudge
  // may already be running in parallel with the entrance scale.
  let cameraSettled = options?.skipCameraNudge ?? false;
  let enterDone = false;
  const revealMedia = () => {
    if (!cameraSettled || !enterDone) return;
    const live = markers.getMarker(id);
    if (!(live?.domElement instanceof HTMLElement)) return;
    if (live.domElement.querySelector('.anchored-panel__hero--video')) {
      mountNavPreviewVideoHero(live.domElement);
    } else if (live.domElement.querySelector('.anchored-panel__hero--image')) {
      mountNavPreviewImageHero(live.domElement);
    }
  };

  void waitForAnchoredPanelEnter(marker.domElement).then(() => {
    enterDone = true;
    revealMedia();
  });

  // NO entries pre-frame the camera in one move, so their panel open skips this
  // follow-up clip-correcting nudge to avoid a second, redundant camera move.
  if (options?.skipCameraNudge) return;

  const hostPosition = hotspot.position as ViewPosition;
  scheduleNudgeCameraForClippedPanel(
    viewer,
    () => {
      const panelMarker = markers.getMarker(id);
      return panelMarker?.domElement instanceof HTMLElement ?
          panelMarker.domElement
        : null;
    },
    {
      afterSettled: () => {
        cameraSettled = true;
        revealMedia();
      },
      onPanelOffView: () =>
        revealCameraForOffViewPanel(
          viewer,
          { yawDeg: hostPosition.yaw, pitchDeg: hostPosition.pitch },
          markerSize,
          () => {
            const panelMarker = markers.getMarker(id);
            return panelMarker?.domElement instanceof HTMLElement ?
                panelMarker.domElement
              : null;
          },
        ),
    },
  );
}

export function toggleAnchoredInfoPanel(
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspot: Hotspot,
  tour: Tour,
  hideShare = false,
): void {
  const openHostId = getOpenAnchoredPanelHostId(markers);
  if (openHostId === hotspot.id) {
    closeAnchoredInfoPanel(markers, true);
    return;
  }
  openAnchoredInfoPanel(viewer, markers, hotspot, tour, hideShare);
}

export function isAnchoredPopup(popup: PopupContent): boolean {
  if (popup.namingOpportunity) return true;
  return popup.display === 'anchored';
}
