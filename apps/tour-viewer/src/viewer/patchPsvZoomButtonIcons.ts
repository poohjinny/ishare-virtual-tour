import type { Viewer } from '@photo-sphere-viewer/core';
import { tourNavbarMaterialSymbolHtml } from '../viewer-shared/tourNavbarMaterialSymbol';

/** Built-in PSV buttons that ship SVG icons — swap once for Material Symbols. */
const NAVBAR_ICON_BY_BUTTON_ID = {
  zoomIn: 'add',
  zoomOut: 'remove',
  moveLeft: 'chevron_left',
  moveRight: 'chevron_right',
  moveUp: 'expand_less',
  moveDown: 'expand_more',
} as const;

/**
 * Replace PSV's built-in SVG icons with the same Material Symbol markup used by
 * custom navbar buttons (recenter, play, fullscreen, …).
 */
export function patchPsvZoomButtonIcons(viewer: Viewer): void {
  for (const [id, icon] of Object.entries(NAVBAR_ICON_BY_BUTTON_ID)) {
    const button = viewer.navbar.getButton(id, false);
    if (!button) continue;

    const host = button.container;
    if (host.querySelector('.psv-navbar-material-symbol')) continue;

    const svg = host.querySelector('.psv-button-svg, svg');
    const next = tourNavbarMaterialSymbolHtml(icon);
    if (svg) {
      svg.outerHTML = next;
    } else {
      host.innerHTML = next;
    }
  }
}
