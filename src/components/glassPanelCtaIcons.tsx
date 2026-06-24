import type { PopupCtaIconKind } from '../utils/popupCtaIcon';

export const CTA_MATERIAL_SYMBOL_CLASS = 'material-symbols-rounded';
export const CTA_ICON_CLASS = 'tour-glass-panel__cta-icon';

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

export function glassPanelCtaIconHtml(
  kind: PopupCtaIconKind,
  className = CTA_ICON_CLASS,
): string {
  const icon = POPUP_CTA_MATERIAL_ICONS[kind];
  return `<span class="${ctaIconClassName(className)}" aria-hidden="true">${icon}</span>`;
}
