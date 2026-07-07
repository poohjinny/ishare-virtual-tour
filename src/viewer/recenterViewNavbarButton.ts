import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type { ViewPosition } from '../types/tour';
import { RECENTER_VIEW_ICON_HTML } from './tourNavbarMaterialSymbol';
import { animateViewerToView } from './pendingNamingInfoHotspot';

export const RECENTER_VIEW_NAVBAR_BUTTON_ID = 'recenter-view';

export function createRecenterViewNavbarButton(
  resolveDefaultView: () => ViewPosition | null,
  isDisabled?: () => boolean,
): NavbarCustomButton {
  return {
    id: RECENTER_VIEW_NAVBAR_BUTTON_ID,
    title: 'Default view',
    className: 'psv-recenter-button',
    content: RECENTER_VIEW_ICON_HTML,
    collapsable: false,
    onClick(viewer: Viewer) {
      if (isDisabled?.()) return;

      const view = resolveDefaultView();
      if (!view) return;

      void animateViewerToView(viewer, view);
    },
  };
}
