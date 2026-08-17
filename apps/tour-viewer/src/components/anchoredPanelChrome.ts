/**
 * Shared chrome for anchored media panels (nav preview + info).
 * Content adapters stay separate; this is only hero / main / footer shell.
 */
import { materialSymbolHtml } from './glassPanelCtaIcons';
import { MATERIAL_SYMBOL_SIZE_CHROME_HEADER } from './ui/materialSymbolClasses';

const ROOT_ANCHORED =
  'tour-glass-panel tour-glass-panel--anchored psv--capture-event';
const SHELL = 'tour-glass-panel__shell';
const ANCHORED_ENTER = 'tour-glass-panel--anchored-enter';
const ANCHOR_ARROW = 'anchored-panel__anchor-arrow';

/** Light header chrome (matches dock / tour-glass-panel header buttons). */
const PANEL_TITLE_ACTIONS = 'tour-glass-panel__title-actions';
const PANEL_HEADER_BTN = 'tour-glass-panel__header-btn';
const PANEL_HEADER_BTN_ICON = 'tour-glass-panel__header-btn-icon';
const PANEL_CLOSE = 'tour-glass-panel__close';
const PANEL_CLOSE_ICON = 'tour-glass-panel__close-icon';

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
  /** Pinned title/intro above the scroll body. */
  header: 'anchored-panel__header',
  body: 'anchored-panel__body',
  close: 'anchored-panel__close',
  closeIcon: 'anchored-panel__close-icon',
  headerBtn: 'anchored-panel__header-btn',
  headerBtnIcon: 'anchored-panel__header-btn-icon',
  /** Bottom tip pointing at the host hotspot (info + nav preview). */
  anchorArrow: ANCHOR_ARROW,
} as const;

/**
 * Glass tip under anchored panels.
 * Fill is CSS-driven: footer wash when a footer exists, else body wash.
 */
export function anchoredPanelAnchorArrowHtml(): string {
  return `<svg class="${ANCHOR_ARROW}" viewBox="0 0 16 8" aria-hidden="true" focusable="false">
      <path d="M0 0 L8 8 L16 0 Z"/>
    </svg>`;
}

export function anchoredPanelCloseIconHtml(): string {
  return materialSymbolHtml('close', {
    className: ANCHORED_PANEL.closeIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
  });
}

function panelCloseIconHtml(): string {
  return materialSymbolHtml('close', {
    className: PANEL_CLOSE_ICON,
    sizePx: MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
  });
}

export function anchoredPanelShareIconHtml(): string {
  return materialSymbolHtml('share', {
    className: ANCHORED_PANEL.headerBtnIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
  });
}

function panelShareIconHtml(): string {
  return materialSymbolHtml('share', {
    className: PANEL_HEADER_BTN_ICON,
    sizePx: MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
  });
}

/**
 * Share control for anchored panels.
 * `surface: 'onMedia'` — dark disc over hero; `'onPanel'` — light header chrome.
 */
export function buildAnchoredPanelShareButtonHtml(options: {
  dataAttr: string;
  ariaLabel: string;
  tooltipLabel: string;
  surface?: 'onMedia' | 'onPanel';
}): string {
  const onPanel = options.surface === 'onPanel';
  const className =
    onPanel ?
      `${PANEL_HEADER_BTN} ishare-tooltip-host ishare-tooltip-host--portal`
    : `${ANCHORED_PANEL.headerBtn} ishare-tooltip-host ishare-tooltip-host--portal`;
  const icon = onPanel ? panelShareIconHtml() : anchoredPanelShareIconHtml();

  return `<button
            type="button"
            class="${className}"
            data-${options.dataAttr}="true"
            aria-label="${escapeHtml(options.ariaLabel)}"
            data-ishare-tooltip="${escapeHtml(options.tooltipLabel)}"
            data-ishare-tooltip-placement="left"
          >${icon}</button>`;
}

export function buildAnchoredPanelCloseButtonHtml(options: {
  closeDataAttr: string;
  surface?: 'onMedia' | 'onPanel';
}): string {
  const onPanel = options.surface === 'onPanel';
  const className = onPanel ? PANEL_CLOSE : ANCHORED_PANEL.close;
  const icon = onPanel ? panelCloseIconHtml() : anchoredPanelCloseIconHtml();

  return `<button
            type="button"
            class="${className}"
            data-${options.closeDataAttr}="true"
            aria-label="Close"
          >${icon}</button>`;
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

/**
 * Share/close for panels without a hero — reuse dock title-actions chrome
 * (no separate body-toolbar strip).
 */
export function buildAnchoredPanelTitleActionsHtml(options: {
  shareHtml?: string;
  closeDataAttr: string;
}): string {
  return `<div class="${PANEL_TITLE_ACTIONS}">
          ${options.shareHtml ?? ''}
          ${buildAnchoredPanelCloseButtonHtml({
            closeDataAttr: options.closeDataAttr,
            surface: 'onPanel',
          })}
        </div>`;
}

export interface AnchoredMediaPanelShellOptions {
  titleId: string;
  /** Extra classes on the article (e.g. tour-glass-panel--nav-preview). */
  rootExtraClass?: string;
  animate?: boolean;
  rootDataAttrs?: Record<string, string>;
  heroHtml: string;
  /**
   * Optional title/intro block pinned above the scroll body
   * (identity stays visible while copy scrolls).
   */
  headerHtml?: string;
  /** Full body element HTML (scrollable copy). */
  bodyHtml: string;
  footerHtml?: string;
}

/**
 * Shared article shell: hero (optional) + main(header? + body + footer).
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
    headerHtml = '',
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
          ${headerHtml}
          ${bodyHtml}
          ${footerHtml}
        </div>
      </div>
      ${anchoredPanelAnchorArrowHtml()}
    </article>
  `;
}
