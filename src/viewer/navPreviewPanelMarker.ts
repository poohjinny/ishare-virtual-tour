import type { Viewer } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot, NavPreviewContent, ViewPosition } from '../types/tour';
import {
  buildAnchoredNavPreviewHtml,
  navPreviewPanelMarkerSize,
} from '../components/tourGlassPanelHtml';
import { setActiveNavHotspot } from './navHotspotActive';
import {
  destroyNavPreviewMiniViewer,
  dismissNavPreviewHero,
  isNavPreviewMiniViewerEnabled,
  mountNavPreviewMiniViewer,
  mountNavPreviewVideoHero,
} from './navPreviewMiniViewer';
import { enableGlassPanelTextSelection } from './glassPanelTextSelection';
import {
  bindGlassPanelCtaOverflowTitles,
  refreshGlassPanelCtaOverflowTitles,
} from '../utils/glassPanelCtaOverflow';
import {
  anchoredPanelMarkerPosition,
  correctAnchoredPanelPixelGap,
  measureHotspotHalfHeightPx,
  NAV_HOTSPOT_HALF_HEIGHT_FALLBACK_PX,
} from './anchoredPanelPosition';
import { bindNavPreviewNamingAccordion } from './navPreviewNamingAccordion';
import { scheduleNudgeCameraForClippedPanel } from './anchoredPanelCameraNudge';
import { notifyAnchoredPanelOpened } from './anchoredPanelVisibility';

const PANEL_ID_SUFFIX = '-nav-panel';
const PANEL_EXIT_MS = 200;

const closingPanelIds = new Set<string>();
const namingAccordionCleanups = new Map<string, () => void>();
const ctaOverflowCleanups = new Map<string, () => void>();

function clearNavPreviewCtaOverflow(panelId: string): void {
  ctaOverflowCleanups.get(panelId)?.();
  ctaOverflowCleanups.delete(panelId);
}

function clearNavPreviewNamingAccordion(panelId: string): void {
  namingAccordionCleanups.get(panelId)?.();
  namingAccordionCleanups.delete(panelId);
  clearNavPreviewCtaOverflow(panelId);
}

interface NavPanelPositionTrack {
  panelId: string;
  hostHotspotId: string;
  hostPosition: ViewPosition;
}

let navPanelPositionTrack: NavPanelPositionTrack | null = null;

function panelMarkerId(hotspotId: string): string {
  return `${hotspotId}${PANEL_ID_SUFFIX}`;
}

function clearNavPanelPositionTrack(): void {
  navPanelPositionTrack = null;
}

export function syncNavPreviewPanelPosition(markers: MarkersPlugin): void {
  if (
    navPanelPositionTrack &&
    !markers.getMarker(navPanelPositionTrack.panelId)
  ) {
    clearNavPanelPositionTrack();
  }

  correctAnchoredPanelPixelGap(markers, navPanelPositionTrack);
}

export function closeAnchoredNavPreviewPanel(
  markers: MarkersPlugin,
  animate = true,
  clearActive = true,
): void {
  let clearingActive = false;

  for (const marker of markers.getMarkers()) {
    if (!marker.data?.navPanel) continue;

    clearNavPanelPositionTrack();

    if (!clearingActive && clearActive) {
      setActiveNavHotspot(markers, null);
      clearingActive = true;
    }

    const id = marker.id;
    if (closingPanelIds.has(id)) continue;

    if (!animate) {
      destroyNavPreviewMiniViewer(id);
      clearNavPreviewNamingAccordion(id);
      closingPanelIds.delete(id);
      markers.removeMarker(id);
      continue;
    }

    const shell = marker.domElement.querySelector('.tour-glass-panel__shell');
    if (!(shell instanceof HTMLElement)) {
      markers.removeMarker(id);
      continue;
    }

    closingPanelIds.add(id);
    destroyNavPreviewMiniViewer(id);
    clearNavPreviewNamingAccordion(id);
    shell.classList.remove('tour-glass-panel__shell--enter');
    shell.classList.add('tour-glass-panel__shell--exit');

    window.setTimeout(() => {
      closingPanelIds.delete(id);
      try {
        if (markers.getMarker(id)) {
          markers.removeMarker(id);
        }
      } catch {
        /* marker already removed */
      }
    }, PANEL_EXIT_MS);
  }
}

export function getOpenNavPreviewHostId(markers: MarkersPlugin): string | null {
  for (const marker of markers.getMarkers()) {
    const hostId = marker.data?.hostHotspotId as string | undefined;
    if (marker.data?.navPanel && hostId) return hostId;
  }
  return null;
}

export function getNavPanelNavigateTarget(
  markers: MarkersPlugin,
): {
  sceneId: string;
  targetView?: ViewPosition;
  tourId?: string;
  canNavigate: boolean;
} | null {
  for (const marker of markers.getMarkers()) {
    if (!marker.data?.navPanel) continue;

    return {
      sceneId: marker.data.targetSceneId as string,
      targetView: marker.data.targetView as ViewPosition | undefined,
      tourId: marker.data.tourId as string | undefined,
      canNavigate: marker.data.canNavigate !== false,
    };
  }
  return null;
}

export function openAnchoredNavPreviewPanel(
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspot: Hotspot,
  preview: NavPreviewContent,
  tourId: string,
  hideShare = false,
): void {
  closeAnchoredNavPreviewPanel(markers, false, false);
  setActiveNavHotspot(markers, hotspot.id);

  const id = panelMarkerId(hotspot.id);
  const hostMarker = markers.getMarker(hotspot.id);
  const halfHeight = measureHotspotHalfHeightPx(
    hostMarker?.domElement,
    NAV_HOTSPOT_HALF_HEIGHT_FALLBACK_PX,
  );

  markers.addMarker({
    id,
    html: buildAnchoredNavPreviewHtml(preview, hotspot.id, { hideShare }),
    size: navPreviewPanelMarkerSize(preview, hotspot.id, hideShare),
    position: anchoredPanelMarkerPosition(
      viewer,
      hotspot.position as ViewPosition,
      halfHeight,
    ),
    anchor: 'bottom center',
    data: {
      navPanel: true,
      hostHotspotId: hotspot.id,
      targetSceneId: preview.targetSceneId,
      targetView: preview.targetView,
      tourId,
      canNavigate: preview.canNavigate,
    },
  });

  navPanelPositionTrack = {
    panelId: id,
    hostHotspotId: hotspot.id,
    hostPosition: hotspot.position as ViewPosition,
  };

  const marker = markers.getMarker(id);
  if (marker?.domElement instanceof HTMLElement) {
    enableGlassPanelTextSelection(marker.domElement);
    ctaOverflowCleanups.set(
      id,
      bindGlassPanelCtaOverflowTitles(marker.domElement),
    );
    namingAccordionCleanups.set(
      id,
      bindNavPreviewNamingAccordion(marker.domElement),
    );
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
          const panelMarker = markers.getMarker(id);
          if (!(panelMarker?.domElement instanceof HTMLElement)) return;
          refreshGlassPanelCtaOverflowTitles(panelMarker.domElement);
          if (preview.videoUrl?.trim()) {
            mountNavPreviewVideoHero(panelMarker.domElement);
          } else if (isNavPreviewMiniViewerEnabled()) {
            mountNavPreviewMiniViewer(id, panelMarker.domElement, preview);
          } else {
            dismissNavPreviewHero(panelMarker.domElement);
          }
        },
      },
    );
  }

  notifyAnchoredPanelOpened();
}

export function toggleAnchoredNavPreviewPanel(
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspot: Hotspot,
  preview: NavPreviewContent,
  tourId: string,
  hideShare = false,
): void {
  const openHostId = getOpenNavPreviewHostId(markers);
  if (openHostId === hotspot.id) {
    closeAnchoredNavPreviewPanel(markers, true);
    return;
  }
  openAnchoredNavPreviewPanel(
    viewer,
    markers,
    hotspot,
    preview,
    tourId,
    hideShare,
  );
}
