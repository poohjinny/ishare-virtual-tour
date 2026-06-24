import type { PopupCtaIconKind } from '../utils/popupCtaIcon';

export const CTA_MATERIAL_SYMBOL_CLASS = 'material-symbols-rounded';
export const CTA_ICON_CLASS = 'tour-glass-panel__cta-icon';

/** Default stroke weight — Material Symbols `wght` axis (300 = light). */
export const MATERIAL_SYMBOL_WGHT = 300;

export function materialSymbolVariation(fill: 0 | 1, opsz = 20): string {
  return `'FILL' ${fill}, 'wght' ${MATERIAL_SYMBOL_WGHT}, 'GRAD' 0, 'opsz' ${opsz}`;
}

export const POPUP_CTA_MATERIAL_ICONS: Record<PopupCtaIconKind, string> = {
  arrow: 'arrow_forward',
  mail: 'mail',
  bell: 'notifications',
  external: 'open_in_new',
  heart: 'favorite',
};

function ctaIconClassName(className = CTA_ICON_CLASS): string {
  return `${CTA_MATERIAL_SYMBOL_CLASS} ${className}`;
}

export function PopupCtaIcon({ kind }: { kind: PopupCtaIconKind }) {
  return (
    <span className={ctaIconClassName()} aria-hidden='true'>
      {POPUP_CTA_MATERIAL_ICONS[kind]}
    </span>
  );
}

export function materialSymbolHtml(
  name: string,
  options: { className?: string; sizePx: number; filled?: boolean },
): string {
  const { className = '', sizePx, filled = false } = options;
  const classes = [
    CTA_MATERIAL_SYMBOL_CLASS,
    'shrink-0',
    'leading-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const variation = materialSymbolVariation(filled ? 1 : 0, sizePx);
  return `<span class="${classes}" style="font-size:${sizePx}px;line-height:1;font-variation-settings:${variation}" aria-hidden="true">${name}</span>`;
}

export function glassPanelCtaIconHtml(
  kind: PopupCtaIconKind,
  className = CTA_ICON_CLASS,
): string {
  const icon = POPUP_CTA_MATERIAL_ICONS[kind];
  return `<span class="${ctaIconClassName(className)}" aria-hidden="true">${icon}</span>`;
}
