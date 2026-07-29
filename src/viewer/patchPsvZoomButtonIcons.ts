import type { Viewer } from '@photo-sphere-viewer/core';
import { tourNavbarMaterialSymbolHtml } from './tourNavbarMaterialSymbol';

const ZOOM_ICON_BY_BUTTON_ID = { zoomIn: 'add', zoomOut: 'remove' } as const;

/**
 * PSV built-in zoom SVGs fill the icon box more heavily than Material Symbols
 * used by the rest of the navbar — swap them for visual weight parity.
 */
export function patchPsvZoomButtonIcons(viewer: Viewer): void {
  for (const [id, icon] of Object.entries(ZOOM_ICON_BY_BUTTON_ID)) {
    const button = viewer.navbar.getButton(id, false);
    if (!button) continue;

    const host = button.container;
    const next = tourNavbarMaterialSymbolHtml(icon);
    const existingSvg = host.querySelector('.psv-button-svg');
    if (existingSvg) {
      existingSvg.outerHTML = next;
      continue;
    }

    const existingSymbol = host.querySelector('.psv-navbar-material-symbol');
    if (existingSymbol) {
      existingSymbol.outerHTML = next;
      continue;
    }

    host.insertAdjacentHTML('beforeend', next);
  }
}
