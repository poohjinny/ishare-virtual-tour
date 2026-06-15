import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type { ViewPosition } from '../types/tour';
import { animateViewerToView } from './pendingNamingInfoHotspot';

export const RECENTER_VIEW_NAVBAR_BUTTON_ID = 'recenter-view';

const RECENTER_VIEW_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.75"/>
  <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
</svg>`;

export function createRecenterViewNavbarButton(
  resolveDefaultView: () => ViewPosition | null,
  isDisabled?: () => boolean,
): NavbarCustomButton {
  return {
    id: RECENTER_VIEW_NAVBAR_BUTTON_ID,
    title: 'Default view',
    className: 'psv-recenter-button',
    content: RECENTER_VIEW_ICON,
    collapsable: true,
    onClick(viewer: Viewer) {
      if (isDisabled?.()) return;

      const view = resolveDefaultView();
      if (!view) return;

      void animateViewerToView(viewer, view);
    },
  };
}
