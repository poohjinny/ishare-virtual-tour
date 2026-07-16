/**
 * Shared chrome for anchored media panels (nav preview + info).
 * Content adapters stay separate; this is only hero / main / footer shell.
 */
import { materialSymbolHtml } from './glassPanelCtaIcons';
import { MATERIAL_SYMBOL_SIZE_22 } from './ui/materialSymbolClasses';

const ROOT_ANCHORED =
  'tour-glass-panel tour-glass-panel--anchored psv--capture-event';
const SHELL = 'tour-glass-panel__shell';
const ANCHORED_ENTER = 'tour-glass-panel--anchored-enter';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const ANCHORED_PANEL = {
  hero: 'anchored-panel__hero',
  heroVideo: 'anchored-panel__hero--video',
  heroImage: 'anchored-panel__hero--image',
  heroLoading: 'anchored-panel__hero--loading',
  heroError: 'anchored-panel__hero--error',
  heroActions: 'anchored-panel__hero-actions',
  heroImageEl: 'anchored-panel__hero-image',
  heroImageLoaded: 'anchored-panel__hero-image--loaded',
  heroViewer: 'anchored-panel__hero-viewer',
  heroFallback: 'anchored-panel__hero-fallback',
  heroFallbackLoaded: 'anchored-panel__hero-fallback--loaded',
  main: 'anchored-panel__main',
  body: 'anchored-panel__body',
  bodyToolbar: 'anchored-panel__body-toolbar',
  toolbarActions: 'anchored-panel__toolbar-actions',
  close: 'anchored-panel__close',
  closeInline: 'anchored-panel__close--inline',
  closeIcon: 'anchored-panel__close-icon',
  headerBtn: 'anchored-panel__header-btn',
  headerBtnInline: 'anchored-panel__header-btn--inline',
  headerBtnIcon: 'anchored-panel__header-btn-icon',
} as const;

export function anchoredPanelCloseIconHtml(): string {
  return materialSymbolHtml('close', {
    className: ANCHORED_PANEL.closeIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

export function anchoredPanelShareIconHtml(): string {
  return materialSymbolHtml('share', {
    className: ANCHORED_PANEL.headerBtnIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

export function buildAnchoredPanelShareButtonHtml(options: {
  dataAttr: string;
  ariaLabel: string;
  tooltipLabel: string;
  inline?: boolean;
}): string {
  const className =
    options.inline ?
      `${ANCHORED_PANEL.headerBtn} ${ANCHORED_PANEL.headerBtnInline} ishare-tooltip-host`
    : `${ANCHORED_PANEL.headerBtn} ishare-tooltip-host`;

  return `<button
            type="button"
            class="${className}"
            data-${options.dataAttr}="true"
            aria-label="${escapeHtml(options.ariaLabel)}"
            data-ishare-tooltip="${escapeHtml(options.tooltipLabel)}"
            data-ishare-tooltip-placement="left"
          >${anchoredPanelShareIconHtml()}</button>`;
}

export function buildAnchoredPanelCloseButtonHtml(options: {
  closeDataAttr: string;
  inline?: boolean;
}): string {
  const className =
    options.inline ?
      `${ANCHORED_PANEL.close} ${ANCHORED_PANEL.closeInline}`
    : ANCHORED_PANEL.close;

  return `<button
            type="button"
            class="${className}"
            data-${options.closeDataAttr}="true"
            aria-label="Close"
          >${anchoredPanelCloseIconHtml()}</button>`;
}

export function buildAnchoredPanelHeroActionsHtml(options: {
  shareHtml?: string;
  closeDataAttr: string;
}): string {
  return `<div class="${ANCHORED_PANEL.heroActions}">
          ${options.shareHtml ?? ''}
          ${buildAnchoredPanelCloseButtonHtml({ closeDataAttr: options.closeDataAttr })}
        </div>`;
}

export function buildAnchoredPanelBodyToolbarHtml(options: {
  shareHtml?: string;
  closeDataAttr: string;
}): string {
  return `<div class="${ANCHORED_PANEL.bodyToolbar}">
        <div class="${ANCHORED_PANEL.toolbarActions}">
          ${options.shareHtml ?? ''}
          ${buildAnchoredPanelCloseButtonHtml({
            closeDataAttr: options.closeDataAttr,
            inline: true,
          })}
        </div>
      </div>`;
}

export interface AnchoredMediaPanelShellOptions {
  titleId: string;
  /** Extra classes on the article (e.g. tour-glass-panel--nav-preview). */
  rootExtraClass?: string;
  animate?: boolean;
  rootDataAttrs?: Record<string, string>;
  heroHtml: string;
  /** Full body element HTML (includes toolbar / intro / copy). */
  bodyHtml: string;
  footerHtml?: string;
}

/**
 * Shared article shell: hero (optional) + main(body + footer).
 */
export function buildAnchoredMediaPanelHtml(
  options: AnchoredMediaPanelShellOptions,
): string {
  const {
    titleId,
    rootExtraClass = '',
    animate = true,
    rootDataAttrs = {},
    heroHtml,
    bodyHtml,
    footerHtml = '',
  } = options;

  const articleEnterClass = animate ? ` ${ANCHORED_ENTER}` : '';
  const extra = rootExtraClass ? ` ${rootExtraClass.trim()}` : '';
  const rootAttrs = Object.entries(rootDataAttrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');

  return `
    <article
      class="${ROOT_ANCHORED}${extra}${articleEnterClass}"
      role="dialog"
      aria-labelledby="${escapeHtml(titleId)}"
      ${rootAttrs}
    >
      <div class="${SHELL}">
        ${heroHtml}
        <div class="${ANCHORED_PANEL.main}">
          ${bodyHtml}
          ${footerHtml}
        </div>
      </div>
    </article>
  `;
}
