import { materialSymbolHtml } from '../components/glassPanelCtaIcons';
import { MATERIAL_SYMBOL_SIZE_16 } from '../components/ui/materialSymbolClasses';

export const PSV_NAVBAR_MATERIAL_SYMBOL_CLASS = 'psv-navbar-material-symbol';
export const PSV_NAVBAR_MATERIAL_SYMBOL_FILLED_CLASS =
  'psv-navbar-material-symbol--filled';

/** Material Symbol HTML for PSV / 3D navbar buttons (16px — matches `--psv-nav-icon-size`). */
export function tourNavbarMaterialSymbolHtml(
  name: string,
  { filled = false }: { filled?: boolean } = {},
): string {
  const className =
    filled ?
      `${PSV_NAVBAR_MATERIAL_SYMBOL_CLASS} ${PSV_NAVBAR_MATERIAL_SYMBOL_FILLED_CLASS}`
    : PSV_NAVBAR_MATERIAL_SYMBOL_CLASS;

  return materialSymbolHtml(name, {
    className,
    sizePx: MATERIAL_SYMBOL_SIZE_16,
    filled,
  });
}

export const tourNavbarMaterialSymbolProps = {
  sizePx: MATERIAL_SYMBOL_SIZE_16,
  className: PSV_NAVBAR_MATERIAL_SYMBOL_CLASS,
} as const;

export const TOUR_FULLSCREEN_BUTTON_HTML = `<span class="psv-fullscreen-icon psv-fullscreen-icon--enter" aria-hidden="true">${tourNavbarMaterialSymbolHtml('fullscreen')}</span><span class="psv-fullscreen-icon psv-fullscreen-icon--exit" aria-hidden="true">${tourNavbarMaterialSymbolHtml('fullscreen_exit')}</span>`;

export const RECENTER_VIEW_ICON_HTML =
  tourNavbarMaterialSymbolHtml('gps_fixed');
