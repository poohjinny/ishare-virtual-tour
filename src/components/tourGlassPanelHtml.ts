import type {
  PopupContent,
  PopupCta,
  PopupWidthTier,
  NavPreviewContent,
  NavPreviewNamingItem,
  Tour,
} from '../types/tour';
import { formatNamingPriceDisplay } from '../utils/namingPrice';
import {
  navPreviewCtaLabel,
  navPreviewVisitAriaLabel,
} from '../utils/navPreview';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import {
  glassPanelCtaIconHtml,
  materialSymbolHtml,
} from './glassPanelCtaIcons';
import {
  MATERIAL_SYMBOL_SIZE_16,
  MATERIAL_SYMBOL_SIZE_22,
} from './ui/materialSymbolClasses';
import {
  resolvePopupCtaIconKind,
  shouldShowPopupCtaIcon,
} from '../utils/popupCtaIcon';
import { GENERAL_INFO_BADGE_LABEL } from '../data/generalInfoHotspot';
import {
  NAMING_OPPORTUNITY_BADGE_LABEL,
  namingOpportunityStatusConfig,
  resolvePopupContentCtas,
} from '../data/namingOpportunityStatus';
import {
  TOUR_SHARE_LOCATION_ARIA,
  TOUR_SHARE_LOCATION_LABEL,
  TOUR_SHARE_OPPORTUNITY_ARIA,
  TOUR_SHARE_OPPORTUNITY_LABEL,
} from '../constants/tourShare';
import { isMailtoCtaUrl } from '../utils/popupCtaPlacement';
import {
  popupCtaRowClassName,
  popupCtaWrapClassName,
  resolvePopupFooterLayout,
} from '../utils/popupCtaLayout';
import {
  isNamingStatusIconModifier,
  namingStatusBadgeIconHtml,
} from './namingStatusBadgeIcons';
import { BADGE_CLASS } from './ui/badgeClasses';
import { PREVIEW_HERO_SKELETON_CLASS } from './ui/previewHeroSkeletonClasses';
import {
  initPopupVideoPlayers,
  popupVideoPlayIconHtml,
  popupVideoSkeletonHtml,
  resolvePopupVideo,
  youtubeEmbedUrl,
} from '../utils/popupVideo';

export { youtubeEmbedUrl, initPopupVideoPlayers };

export const GLASS_PANEL_SIZE = {
  minWidth: 320,
  maxWidth: 500,
  defaultWidth: 440,
  minHeight: 0,
  maxHeight: 840,
  maxHeightRatio: 0.92,
  viewportMargin: 48,
  viewportMarginMobile: 32,
} as const;

/** Shared dock width — dev panel, nav preview, info panels. */
export const TOUR_DOCK_PANEL_WIDTH = 440;

const GLASS_PANEL_WIDTH_TIER: Record<PopupWidthTier, number> = {
  compact: 320,
  standard: 380,
  rich: 440,
  wide: 500,
};

function viewportMaxPanelWidth(): number {
  const margin =
    typeof window !== 'undefined' && window.innerWidth <= 480 ?
      GLASS_PANEL_SIZE.viewportMarginMobile
    : GLASS_PANEL_SIZE.viewportMargin;
  const viewport =
    typeof window !== 'undefined' ?
      window.innerWidth
    : GLASS_PANEL_SIZE.maxWidth + margin;
  return Math.max(GLASS_PANEL_SIZE.minWidth, viewport - margin);
}

function preferredWidthFromPopup(popup: PopupContent): number {
  if (typeof popup.width === 'number') return popup.width;
  if (popup.width) return GLASS_PANEL_WIDTH_TIER[popup.width];
  return TOUR_DOCK_PANEL_WIDTH;
}

/** clamp(viewport) ← dock default ← json override / tier preset */
export function resolveGlassPanelWidth(
  popup?: PopupContent,
  _tour?: Tour,
): number {
  const preferred =
    popup ? preferredWidthFromPopup(popup) : GLASS_PANEL_SIZE.defaultWidth;

  return Math.round(
    Math.min(
      viewportMaxPanelWidth(),
      Math.max(GLASS_PANEL_SIZE.minWidth, preferred),
    ),
  );
}

export function resolveGlassPanelMaxHeight(popup?: PopupContent): number {
  const ratio =
    popup?.videoUrl ?
      Math.min(GLASS_PANEL_SIZE.maxHeightRatio + 0.02, 0.92)
    : GLASS_PANEL_SIZE.maxHeightRatio;

  return Math.min(
    Math.round(window.innerHeight * ratio),
    GLASS_PANEL_SIZE.maxHeight,
  );
}

let glassPanelMeasureHost: HTMLDivElement | null = null;

/** Off-screen measure — panel height follows content, capped later by max-height. */
export function measureAnchoredGlassPanelHeight(
  popup: PopupContent,
  hotspotId: string,
  tour?: Tour,
  hideShare = false,
): number {
  if (typeof document === 'undefined') return GLASS_PANEL_SIZE.minHeight;

  if (!glassPanelMeasureHost) {
    glassPanelMeasureHost = document.createElement('div');
    glassPanelMeasureHost.id = 'glass-panel-measure-host';
    glassPanelMeasureHost.setAttribute('aria-hidden', 'true');
    glassPanelMeasureHost.style.cssText =
      'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;z-index:-1';
    document.body.appendChild(glassPanelMeasureHost);
  }

  const width = resolveGlassPanelWidth(popup, tour);
  glassPanelMeasureHost.style.width = `${width}px`;

  const html = buildAnchoredPopupHtml(popup, hotspotId, {
    animate: false,
    tour,
    hideShare,
  }).replace(
    GLASS_PANEL.rootAnchored,
    `${GLASS_PANEL.rootAnchored} tour-glass-panel--measure`,
  );
  glassPanelMeasureHost.innerHTML = html;

  return readMeasuredAnchoredPanelHeight(glassPanelMeasureHost);
}

export function glassPanelMarkerSize(
  popup: PopupContent,
  hotspotId: string,
  tour?: Tour,
  hideShare = false,
): { width: number; height: number } {
  const width = resolveGlassPanelWidth(popup, tour);
  const contentHeight = measureAnchoredGlassPanelHeight(
    popup,
    hotspotId,
    tour,
    hideShare,
  );
  const maxHeight = resolveGlassPanelMaxHeight(popup);

  return { width, height: Math.min(contentHeight, maxHeight) };
}

/** PSV skips panorama drag (mousedown preventDefault) inside this class */
export const PSV_CAPTURE_EVENTS_CLASS = 'psv--capture-event';

/** BEM class names — keep in sync with TourGlassPanel.css */
export const GLASS_PANEL = {
  root: 'tour-glass-panel',
  rootAnchored: `tour-glass-panel tour-glass-panel--anchored ${PSV_CAPTURE_EVENTS_CLASS}`,
  shell: 'tour-glass-panel__shell',
  shellEnter: 'tour-glass-panel__shell--enter',
  header: 'tour-glass-panel__header',
  titleRow: 'tour-glass-panel__title-row',
  headerLeading: 'tour-glass-panel__header-leading',
  titleBlock: 'tour-glass-panel__title-block',
  titleLine: 'tour-glass-panel__title-line',
  title: 'tour-glass-panel__title',
  close: 'tour-glass-panel__close',
  closeIcon: 'tour-glass-panel__close-icon',
  badge: BADGE_CLASS.fillLgAccentIcon,
  badgeNaming: BADGE_CLASS.fillLgPrimaryIcon,
  price: 'tour-glass-panel__price',
  priceUnderTitle:
    'tour-glass-panel__price tour-glass-panel__price--under-title',
  priceUnderTitleClosed:
    'tour-glass-panel__price tour-glass-panel__price--under-title tour-glass-panel__price--closed',
  priceInline: 'tour-glass-panel__price tour-glass-panel__price--inline',
  priceInlineClosed:
    'tour-glass-panel__price tour-glass-panel__price--inline tour-glass-panel__price--closed',
  priceSep: 'tour-glass-panel__price-sep',
  priceValue: 'tour-glass-panel__price-value',
  badgeStatus: (modifier: string) => BADGE_CLASS.fillLgStatus(modifier),
  badgeStatusIcon: (modifier: string) => BADGE_CLASS.fillLgStatusIcon(modifier),
  badgeSponsor: BADGE_CLASS.fillLgSponsor,
  badgeIcon: BADGE_CLASS.icon,
  badgeText: BADGE_CLASS.label,
  meta: 'tour-glass-panel__meta',
  metaRow: 'tour-glass-panel__meta-row',
  priceLabel: 'tour-glass-panel__price-label',
  body: 'tour-glass-panel__body',
  footer: 'tour-glass-panel__footer',
  copy: 'tour-glass-panel__copy',
  paragraph: 'tour-glass-panel__paragraph',
  video: 'tour-glass-panel__video',
  ctaWrap: 'tour-glass-panel__cta-wrap',
  ctaPrimaryGroup: 'tour-glass-panel__cta-primary-group',
  ctaRow: 'tour-glass-panel__cta-row',
  cta: 'tour-glass-panel__cta',
  ctaText: 'tour-glass-panel__cta-text',
  reg: 'tour-glass-panel__reg',
  ctaIcon: 'tour-glass-panel__cta-icon',
  titleActions: 'tour-glass-panel__title-actions',
  headerActions: 'tour-glass-panel__header-actions',
  headerBtn: 'tour-glass-panel__header-btn',
  headerBtnIcon: 'tour-glass-panel__header-btn-icon',
} as const;

function readMeasuredAnchoredPanelHeight(host: ParentNode): number {
  const panel = host.querySelector('.tour-glass-panel--measure');
  if (panel instanceof HTMLElement) {
    return panel.offsetHeight;
  }

  const shell = host.querySelector(`.${GLASS_PANEL.shell}`);
  if (shell instanceof HTMLElement) {
    return shell.offsetHeight;
  }

  return GLASS_PANEL_SIZE.minHeight;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function glassPanelCloseIconHtml(): string {
  return materialSymbolHtml('close', {
    className: GLASS_PANEL.closeIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

function glassPanelShareIconHtml(): string {
  return materialSymbolHtml('share', {
    className: GLASS_PANEL.headerBtnIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

function navPreviewShareIconHtml(): string {
  return materialSymbolHtml('share', {
    className: 'nav-preview-panel__header-btn-icon',
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

function glassPanelMailIconHtml(): string {
  return materialSymbolHtml('mail', {
    className: GLASS_PANEL.headerBtnIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

function glassPanelExternalLinkIconHtml(): string {
  return materialSymbolHtml('open_in_new', {
    className: GLASS_PANEL.headerBtnIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

function buildShareHeaderButtonHtml(
  dataAttr: string,
  ariaLabel: string,
  tooltipLabel: string,
  className = GLASS_PANEL.headerBtn,
): string {
  return `<button
        type="button"
        class="${className} ishare-tooltip-host"
        data-${dataAttr}="true"
        aria-label="${escapeHtml(ariaLabel)}"
        data-ishare-tooltip="${escapeHtml(tooltipLabel)}"
        data-ishare-tooltip-placement="left"
      >${glassPanelShareIconHtml()}</button>`;
}

function buildPopupHeaderActionHtml(cta: PopupCta): string {
  const resolved = resolvePopupCta(cta);
  const iconHtml =
    isMailtoCtaUrl(resolved.url) ?
      glassPanelMailIconHtml()
    : glassPanelExternalLinkIconHtml();

  return `<a
        class="${GLASS_PANEL.headerBtn}"
        href="${escapeHtml(resolved.url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${escapeHtml(resolved.ariaLabel)}"
      >${iconHtml}</a>`;
}

function buildPopupHeaderActionsHtml(options: {
  headerCtas: PopupCta[];
  shareHtml?: string;
}): string {
  const actionHtml = [
    options.shareHtml ?? '',
    ...options.headerCtas.map((cta) => buildPopupHeaderActionHtml(cta)),
  ]
    .filter(Boolean)
    .join('');

  if (!actionHtml) return '';

  return `<div class="${GLASS_PANEL.headerActions}">${actionHtml}</div>`;
}

function buildPopupFooterInnerHtml(ctas: PopupCta[]): string {
  const layout = resolvePopupFooterLayout(ctas);
  if (!layout) return '';

  const { mode, primary, secondaries } = layout;
  const primaryButton = buildPopupCtaButtonHtml({
    ...primary,
    variant: 'primary',
  });

  if (secondaries.length === 0) {
    return `<div class="${GLASS_PANEL.ctaWrap} ${popupCtaWrapClassName('full')}">
      ${primaryButton}
    </div>`;
  }

  const secondaryButtons = secondaries
    .map((cta) => buildPopupCtaButtonHtml({ ...cta, variant: 'secondary' }))
    .join('');

  if (mode === 'row-equal') {
    return `<div class="${GLASS_PANEL.ctaWrap} ${popupCtaWrapClassName('row-equal')}">
      <div class="${popupCtaRowClassName(secondaries.length)}">
        ${secondaryButtons}
        ${primaryButton}
      </div>
    </div>`;
  }

  return `<div class="${GLASS_PANEL.ctaWrap} ${popupCtaWrapClassName('primary-stack')}">
    ${secondaryButtons}
    <div class="${GLASS_PANEL.ctaPrimaryGroup}">
      ${primaryButton}
    </div>
  </div>`;
}

function navPreviewCloseIconHtml(): string {
  return materialSymbolHtml('close', {
    className: 'nav-preview-panel__close-icon',
    sizePx: MATERIAL_SYMBOL_SIZE_22,
  });
}

export function glassPanelCtaArrowIconHtml(): string {
  return glassPanelCtaIconHtml('arrow', GLASS_PANEL.ctaIcon);
}

export function glassPanelInfoBadgeIconHtml(): string {
  return materialSymbolHtml('info', {
    className: GLASS_PANEL.badgeIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_16,
  });
}

export function glassPanelNamingBadgeIconHtml(): string {
  return materialSymbolHtml('favorite', {
    className: GLASS_PANEL.badgeIcon,
    sizePx: MATERIAL_SYMBOL_SIZE_16,
  });
}

export function buildPopupImageHtml(popup: PopupContent): string {
  if (!popup.image) return '';

  return `<img class="tour-glass-panel__image" src="${escapeHtml(popup.image)}" alt="" />`;
}

export function buildPopupVideoHtml(popup: PopupContent): string {
  if (!popup.videoUrl) return '';

  const resolved = resolvePopupVideo(popup.videoUrl, popup.videoPoster);
  if (!resolved) return '';

  const thumbHtml =
    resolved.thumbnailUrl ?
      `<img class="tour-glass-panel__video-thumb" src="${escapeHtml(resolved.thumbnailUrl)}" alt="" />`
    : '';

  return `<div
      class="${GLASS_PANEL.video} tour-glass-panel__video--preview tour-glass-panel__video--thumb-loading"
      data-popup-video-kind="${escapeHtml(resolved.kind)}"
      data-popup-video-src="${escapeHtml(resolved.sourceUrl)}"
      data-popup-video-title="${escapeHtml(popup.title)}"
    >
      ${popupVideoSkeletonHtml()}
      ${thumbHtml}
      <button
        type="button"
        class="tour-glass-panel__video-play"
        aria-label="Play video: ${escapeHtml(popup.title)}"
      >${popupVideoPlayIconHtml()}</button>
    </div>`;
}

/** @deprecated Use {@link initPopupVideoPlayers} */
export function mountAnchoredPopupVideo(root: ParentNode): void {
  initPopupVideoPlayers(root);
}

export function buildGlassPanelParagraphsHtml(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="${GLASS_PANEL.paragraph}">${escapeHtml(p)}</p>`)
    .join('');
}

function buildNamingPriceInlineHtml(price: number, closed: boolean): string {
  const priceClass =
    closed ? GLASS_PANEL.priceInlineClosed : GLASS_PANEL.priceInline;
  const displayPrice = formatNamingPriceDisplay(price);

  return `<span class="${priceClass}">
    <span class="${GLASS_PANEL.priceSep}" aria-hidden="true">|</span>
    <span class="${GLASS_PANEL.priceValue}">${escapeHtml(displayPrice)}</span>
  </span>`;
}

export function buildNamingPriceUnderTitleHtml(
  price: number,
  closed: boolean,
): string {
  const priceClass =
    closed ? GLASS_PANEL.priceUnderTitleClosed : GLASS_PANEL.priceUnderTitle;
  const displayPrice = formatNamingPriceDisplay(price);

  return `<p class="${priceClass}">
    <span class="${GLASS_PANEL.priceSep}" aria-hidden="true">|</span>
    <span class="${GLASS_PANEL.priceValue}">${escapeHtml(displayPrice)}</span>
  </p>`;
}

export function buildPopupBadgeHtml(popup: PopupContent): string {
  if (popup.namingOpportunity) {
    const { name, status } = popup.namingOpportunity;
    const statusConfig = namingOpportunityStatusConfig(status);
    const statusModifier = statusConfig.cssModifier;
    const statusIconHtml =
      isNamingStatusIconModifier(statusModifier) ?
        namingStatusBadgeIconHtml(statusModifier, GLASS_PANEL.badgeIcon)
      : '';

    return `<div class="${GLASS_PANEL.meta}" aria-label="${escapeHtml(name)}">
      <div class="${GLASS_PANEL.metaRow}">
        <span class="${GLASS_PANEL.badgeNaming}">
          ${glassPanelNamingBadgeIconHtml()}
          <span class="${GLASS_PANEL.badgeText}">${escapeHtml(NAMING_OPPORTUNITY_BADGE_LABEL)}</span>
        </span>
        <span class="${GLASS_PANEL.badgeStatusIcon(escapeHtml(statusModifier))}">
          ${statusIconHtml}
          <span class="${GLASS_PANEL.badgeText}">${escapeHtml(statusConfig.label)}</span>
        </span>
      </div>
    </div>`;
  }

  if (popup.sponsor) {
    return `<span class="${GLASS_PANEL.badgeSponsor}">
      <span class="${GLASS_PANEL.badgeText}">${escapeHtml(popup.sponsor.label ?? 'Presented by')} ${escapeHtml(popup.sponsor.name)}</span>
    </span>`;
  }

  return `<span class="${GLASS_PANEL.badge}">
    ${glassPanelInfoBadgeIconHtml()}
    <span class="${GLASS_PANEL.badgeText}">${escapeHtml(GENERAL_INFO_BADGE_LABEL)}</span>
  </span>`;
}

export function buildPopupCtaLabelHtml(cta: PopupCta): string {
  return escapeHtml(resolvePopupCta(cta).label);
}

export function buildPopupCtaTextHtml(cta: PopupCta): string {
  const resolved = resolvePopupCta(cta);
  const innerHtml = buildPopupCtaLabelHtml(cta);

  return `<span class="${GLASS_PANEL.ctaText}" data-cta-label="${escapeHtml(resolved.label)}">${innerHtml}</span>`;
}

export function buildGlassPanelCtaTextHtml(label: string): string {
  return `<span class="${GLASS_PANEL.ctaText}" data-cta-label="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}

export function buildPopupCtaButtonHtml(cta: PopupCta): string {
  const resolved = resolvePopupCta(cta);
  const labelHtml = buildPopupCtaTextHtml(cta);
  const isSecondary = cta.variant === 'secondary';
  const iconHtml =
    shouldShowPopupCtaIcon(cta, isSecondary) ?
      glassPanelCtaIconHtml(resolvePopupCtaIconKind(cta), GLASS_PANEL.ctaIcon)
    : '';
  const className = `${GLASS_PANEL.cta}${isSecondary ? ' tour-glass-panel__cta--secondary' : ''}${iconHtml ? ' tour-glass-panel__cta--has-trailing-icon' : ''}`;

  return `<a
        class="${className}"
        href="${escapeHtml(resolved.url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${escapeHtml(resolved.ariaLabel)}"
      >${labelHtml}${iconHtml}</a>`;
}

function buildPopupFooterButtonsHtml(ctas: PopupCta[]): string {
  return buildPopupFooterInnerHtml(ctas);
}

export function buildPopupFooterHtml(popup: PopupContent, tour?: Tour): string {
  const ctas =
    tour ? resolvePopupContentCtas(popup, tour)
    : popup.ctas?.length ? popup.ctas
    : popup.cta ? [popup.cta]
    : [];
  if (ctas.length === 0) return '';

  const buttonsHtml = buildPopupFooterButtonsHtml(ctas);
  if (!buttonsHtml) return '';

  return `<footer class="${GLASS_PANEL.footer}">
    ${buttonsHtml}
  </footer>`;
}

export interface GlassPanelHtmlOptions {
  title: string;
  titleId: string;
  titleAfterHtml?: string;
  titleSubHtml?: string;
  badgeHtml?: string;
  bodyHtml: string;
  bodyAfterHtml?: string;
  mediaHtml?: string;
  videoHtml?: string;
  footerHtml?: string;
  headerActionsHtml?: string;
  variant?: 'anchored' | 'dock';
  animate?: boolean;
  closeDataAttr?: string;
  rootDataAttrs?: Record<string, string>;
}

export function buildTourGlassPanelHtml(
  options: GlassPanelHtmlOptions,
): string {
  const {
    title,
    titleId,
    titleAfterHtml = '',
    titleSubHtml = '',
    badgeHtml = '',
    bodyHtml,
    bodyAfterHtml = '',
    mediaHtml = '',
    videoHtml = '',
    footerHtml = '',
    headerActionsHtml = '',
    variant = 'anchored',
    animate = true,
    closeDataAttr,
    rootDataAttrs = {},
  } = options;

  const rootClass =
    variant === 'anchored' ?
      GLASS_PANEL.rootAnchored
    : `${GLASS_PANEL.root} tour-glass-panel--dock`;

  const shellClass =
    animate ?
      `${GLASS_PANEL.shell} ${GLASS_PANEL.shellEnter}`
    : GLASS_PANEL.shell;

  const rootAttrs = Object.entries(rootDataAttrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');

  const closeAttr = closeDataAttr ? ` data-${closeDataAttr}="true"` : '';

  return `
    <article
      class="${rootClass}"
      role="dialog"
      aria-labelledby="${escapeHtml(titleId)}"
      ${rootAttrs}
    >
      <div class="${shellClass}">
        <div class="${GLASS_PANEL.header}">
          <div class="${GLASS_PANEL.titleRow}">
            <div class="${GLASS_PANEL.headerLeading}">
              <div class="${GLASS_PANEL.titleBlock}">
                <div class="${GLASS_PANEL.titleLine}">
                  <h3 id="${escapeHtml(titleId)}" class="${GLASS_PANEL.title}">
                    ${escapeHtml(title)}
                  </h3>
                  ${titleAfterHtml}
                </div>
                ${titleSubHtml}
              </div>
            </div>
            <div class="${GLASS_PANEL.titleActions}">
              ${headerActionsHtml}
              <button
                type="button"
                class="${GLASS_PANEL.close}"
                aria-label="Close"
                ${closeAttr}
              >
                ${glassPanelCloseIconHtml()}
              </button>
            </div>
          </div>
          ${badgeHtml}
        </div>
        <div class="${GLASS_PANEL.body} ishare-scrollbar">
          ${mediaHtml}
          <div class="${GLASS_PANEL.copy}">${bodyHtml}</div>
          ${bodyAfterHtml}
          ${videoHtml}
        </div>
        ${footerHtml}
      </div>
    </article>
  `;
}

export function buildAnchoredPopupHtml(
  popup: PopupContent,
  hotspotId: string,
  options?: { animate?: boolean; tour?: Tour; hideShare?: boolean },
): string {
  const titleId = `info-panel-title-${hotspotId}`;
  const naming = popup.namingOpportunity;
  const titleAfterHtml =
    naming ?
      buildNamingPriceUnderTitleHtml(
        naming.price,
        namingOpportunityStatusConfig(naming.status).cssModifier === 'closed',
      )
    : '';
  const titleSubHtml =
    naming?.priceLabel ?
      `<p class="${GLASS_PANEL.priceLabel}">${escapeHtml(naming.priceLabel)}</p>`
    : '';

  const ctas =
    options?.tour ? resolvePopupContentCtas(popup, options.tour) : [];
  const headerActionsHtml = buildPopupHeaderActionsHtml({
    headerCtas: [],
    shareHtml:
      naming && !options?.hideShare ?
        buildShareHeaderButtonHtml(
          'info-panel-share',
          TOUR_SHARE_OPPORTUNITY_ARIA,
          TOUR_SHARE_OPPORTUNITY_LABEL,
        )
      : undefined,
  });

  const visitSceneId = popup.visitScene;
  const visitSceneTitle =
    visitSceneId && options?.tour ?
      (options.tour.scenes[visitSceneId]?.title ?? visitSceneId)
    : null;
  const visitCtaLabel = visitSceneTitle ? `Visit ${visitSceneTitle}` : null;
  const visitFooterHtml =
    visitSceneId && visitCtaLabel ?
      `<footer class="${GLASS_PANEL.footer}">
    <div class="${GLASS_PANEL.ctaWrap} tour-glass-panel__cta-wrap--full">
      <button
        type="button"
        class="${GLASS_PANEL.cta} tour-glass-panel__cta--has-trailing-icon"
        data-visit-scene="${escapeHtml(visitSceneId)}"
        aria-label="${escapeHtml(visitCtaLabel)}"
      >${buildGlassPanelCtaTextHtml(visitCtaLabel)}${glassPanelCtaArrowIconHtml()}</button>
    </div>
  </footer>`
    : '';

  const ctaFooterHtml =
    ctas.length > 0 ?
      `<footer class="${GLASS_PANEL.footer}">${buildPopupFooterInnerHtml(ctas)}</footer>`
    : buildPopupFooterHtml(popup, options?.tour);

  const footerHtml = ctaFooterHtml + visitFooterHtml;

  return buildTourGlassPanelHtml({
    title: popup.title,
    titleId,
    titleAfterHtml,
    titleSubHtml,
    badgeHtml: buildPopupBadgeHtml(popup),
    bodyHtml: buildGlassPanelParagraphsHtml(popup.body),
    mediaHtml: buildPopupImageHtml(popup),
    videoHtml: buildPopupVideoHtml(popup),
    headerActionsHtml,
    footerHtml,
    variant: 'anchored',
    animate: options?.animate ?? true,
    closeDataAttr: 'info-panel-close',
    rootDataAttrs: {
      'data-info-panel': 'true',
      'data-info-panel-for': hotspotId,
      ...(naming ? { 'data-info-panel-naming': 'true' } : {}),
    },
  });
}

const NAV_PREVIEW_HERO_ASPECT = 8 / 16;

export function resolveNavPreviewPanelWidth(): number {
  return Math.round(Math.min(TOUR_DOCK_PANEL_WIDTH, viewportMaxPanelWidth()));
}

export function resolveNavPreviewHeroHeight(
  panelWidth = resolveNavPreviewPanelWidth(),
): number {
  return Math.round(panelWidth * NAV_PREVIEW_HERO_ASPECT);
}

export function resolveNavPreviewPanelMaxHeight(): number {
  return Math.min(
    Math.round(window.innerHeight * GLASS_PANEL_SIZE.maxHeightRatio),
    GLASS_PANEL_SIZE.maxHeight,
  );
}

export function measureAnchoredNavPreviewHeight(
  preview: NavPreviewContent,
  hotspotId: string,
  hideShare = false,
): number {
  if (typeof document === 'undefined') return GLASS_PANEL_SIZE.minHeight;

  if (!glassPanelMeasureHost) {
    glassPanelMeasureHost = document.createElement('div');
    glassPanelMeasureHost.id = 'glass-panel-measure-host';
    glassPanelMeasureHost.setAttribute('aria-hidden', 'true');
    glassPanelMeasureHost.style.cssText =
      'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;z-index:-1';
    document.body.appendChild(glassPanelMeasureHost);
  }

  glassPanelMeasureHost.style.width = `${resolveNavPreviewPanelWidth()}px`;

  const html = buildAnchoredNavPreviewHtml(preview, hotspotId, {
    animate: false,
    hideShare,
  }).replace(
    GLASS_PANEL.rootAnchored,
    `${GLASS_PANEL.rootAnchored} tour-glass-panel--measure`,
  );
  glassPanelMeasureHost.innerHTML = html;

  const panel = glassPanelMeasureHost.querySelector(
    '.tour-glass-panel--nav-preview',
  );
  const panelWidth = resolveNavPreviewPanelWidth();
  if (panel instanceof HTMLElement) {
    panel.style.width = '100%';
    const hero = panel.querySelector('.nav-preview-panel__hero');
    if (hero instanceof HTMLElement) {
      hero.style.height = `${resolveNavPreviewHeroHeight(panelWidth)}px`;
    }
  }

  return readMeasuredAnchoredPanelHeight(glassPanelMeasureHost);
}

export function navPreviewPanelMarkerSize(
  preview: NavPreviewContent,
  hotspotId: string,
  hideShare = false,
): { width: number; height: number } {
  const contentHeight = measureAnchoredNavPreviewHeight(
    preview,
    hotspotId,
    hideShare,
  );
  const maxHeight = resolveNavPreviewPanelMaxHeight();

  return {
    width: resolveNavPreviewPanelWidth(),
    height: Math.min(contentHeight, maxHeight),
  };
}

function buildNavPreviewNamingStatusHtml(item: NavPreviewNamingItem): string {
  const priceLabelHtml =
    item.priceLabel ?
      `<p class="${GLASS_PANEL.priceLabel} nav-preview-panel__naming-price-label">${escapeHtml(item.priceLabel)}</p>`
    : '';

  return `<span class="nav-preview-panel__naming-trigger-badges">
    <span class="${GLASS_PANEL.badgeStatus(escapeHtml(item.statusModifier))} nav-preview-panel__naming-status">
      <span class="${GLASS_PANEL.badgeText}">${escapeHtml(item.statusLabel)}</span>
    </span>
    ${priceLabelHtml}
  </span>`;
}

export function buildNavPreviewNamingListHtml(
  items: NavPreviewNamingItem[] | undefined,
  hotspotId: string,
): string {
  if (!items?.length) return '';

  const cards = items
    .map((item, index) => {
      const panelId = `nav-naming-panel-${hotspotId}-${index}`;

      const descriptionHtml =
        item.description ?
          `<p class="nav-preview-panel__naming-desc">${escapeHtml(item.description)}</p>`
        : '';

      const statusHtml = buildNavPreviewNamingStatusHtml(item);
      const priceHtml = buildNamingPriceInlineHtml(
        item.price,
        item.statusModifier === 'closed',
      );
      const ctaHtml = buildNavPreviewNamingActionsHtml(item);

      const panelContent = `${descriptionHtml}${ctaHtml}`;

      return `<article class="nav-preview-panel__naming-card">
        <button
          type="button"
          class="nav-preview-panel__naming-trigger"
          data-nav-naming-toggle="true"
          aria-expanded="false"
          aria-controls="${escapeHtml(panelId)}"
        >
          <span class="nav-preview-panel__naming-trigger-inner">
            <span class="nav-preview-panel__naming-chevron" aria-hidden="true">${navPreviewNamingChevronHtml()}</span>
            <span class="nav-preview-panel__naming-title-line">
              <span class="nav-preview-panel__naming-name">${escapeHtml(item.name)}</span>
              ${priceHtml}
            </span>
          </span>
          ${statusHtml}
        </button>
        <div class="nav-preview-panel__naming-panel-wrap" aria-hidden="true">
          <div
            id="${escapeHtml(panelId)}"
            class="nav-preview-panel__naming-panel"
          ><div class="nav-preview-panel__naming-panel-inner">${panelContent}</div></div>
        </div>
      </article>`;
    })
    .join('');

  const countLabel =
    items.length === 1 ?
      ''
    : ` <span class="nav-preview-panel__naming-count">(${items.length})</span>`;

  return `<section class="nav-preview-panel__naming">
    <div class="nav-preview-panel__naming-divider">
      <span class="nav-preview-panel__naming-divider-line" aria-hidden="true"></span>
      <h4 class="nav-preview-panel__naming-heading">
        <span class="nav-preview-panel__naming-heading-label">
          ${navPreviewNamingHeadingIconHtml()}
          <span class="nav-preview-panel__naming-heading-text">Naming Opportunities${countLabel}</span>
        </span>
      </h4>
      <span class="nav-preview-panel__naming-divider-line" aria-hidden="true"></span>
    </div>
    <div class="nav-preview-panel__naming-accordion" data-nav-naming-accordion="true">${cards}</div>
  </section>`;
}

function navPreviewNamingHeadingIconHtml(): string {
  return `<svg class="nav-preview-panel__naming-heading-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
</svg>`;
}

function navPreviewNamingChevronHtml(): string {
  return `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function buildNavPreviewNamingActionsHtml(item: NavPreviewNamingItem): string {
  return `<div class="nav-preview-panel__naming-actions">
    <button
      type="button"
      class="nav-preview-panel__naming-cta nav-preview-panel__naming-cta--view"
      data-nav-naming-go="${escapeHtml(item.hotspotId)}"
      aria-label="View ${escapeHtml(item.name)} naming opportunity"
    ><span class="nav-preview-panel__naming-cta-text">View opportunity</span>${navPreviewNamingCtaArrowHtml()}</button>
  </div>`;
}

function navPreviewNamingCtaArrowHtml(): string {
  return `<svg class="nav-preview-panel__naming-cta-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function navPreviewShareButtonHtml(inline = false): string {
  const className =
    inline ?
      'nav-preview-panel__header-btn nav-preview-panel__header-btn--inline ishare-tooltip-host'
    : 'nav-preview-panel__header-btn ishare-tooltip-host';

  return `<button
            type="button"
            class="${className}"
            data-nav-panel-share="true"
            aria-label="${escapeHtml(TOUR_SHARE_LOCATION_ARIA)}"
            data-ishare-tooltip="${escapeHtml(TOUR_SHARE_LOCATION_LABEL)}"
            data-ishare-tooltip-placement="left"
          >${navPreviewShareIconHtml()}</button>`;
}

export function buildAnchoredNavPreviewHtml(
  preview: NavPreviewContent,
  hotspotId: string,
  options?: { animate?: boolean; hideShare?: boolean },
): string {
  const titleId = `nav-panel-title-${hotspotId}`;
  const shellClass =
    options?.animate === false ?
      GLASS_PANEL.shell
    : `${GLASS_PANEL.shell} ${GLASS_PANEL.shellEnter}`;

  const titleHtml = `<h3 id="${escapeHtml(titleId)}" class="${GLASS_PANEL.title} nav-preview-panel__title">${escapeHtml(preview.title)}</h3>`;

  const trimmedVideoUrl = preview.videoUrl?.trim();
  const hasVideo = Boolean(trimmedVideoUrl);
  const hasPanorama = Boolean(preview.panorama) && !hasVideo;
  const hasHero = hasVideo || hasPanorama;

  const heroTitleOverlayHtml =
    hasHero ?
      `<div class="nav-preview-panel__hero-title">${titleHtml}</div>`
    : '';

  const heroHeight = resolveNavPreviewHeroHeight();

  const hideShare = options?.hideShare ?? false;
  const navShareHtml = hideShare ? '' : navPreviewShareButtonHtml();

  const heroActionsHtml = `<div class="nav-preview-panel__hero-actions">
          ${navShareHtml}
          <button
            type="button"
            class="nav-preview-panel__close"
            data-nav-panel-close="true"
            aria-label="Close"
          >${navPreviewCloseIconHtml()}</button>
        </div>`;

  const heroHtml =
    hasVideo ?
      `<div class="nav-preview-panel__hero nav-preview-panel__hero--video nav-preview-panel__hero--loading" style="height:${heroHeight}px" aria-busy="true">
        <div class="${PREVIEW_HERO_SKELETON_CLASS}" aria-hidden="true"></div>
        ${buildPopupVideoHtml({ title: preview.title, body: '', videoUrl: trimmedVideoUrl! })}
        ${heroTitleOverlayHtml}
        ${heroActionsHtml}
      </div>`
    : hasPanorama ?
      `<div class="nav-preview-panel__hero nav-preview-panel__hero--loading" style="height:${heroHeight}px" aria-busy="true">
        <div class="${PREVIEW_HERO_SKELETON_CLASS}" aria-hidden="true"></div>
        <div class="nav-preview-panel__hero-viewer"></div>
        ${
          preview.image ?
            `<img
          src="${escapeHtml(preview.image)}"
          alt=""
          class="nav-preview-panel__hero-fallback"
          hidden
          decoding="async"
        />`
          : ''
        }
        ${heroTitleOverlayHtml}
        ${heroActionsHtml}
      </div>`
    : '';

  const closeInBodyHtml =
    hasHero ? '' : (
      `<div class="nav-preview-panel__body-toolbar">
        <div class="nav-preview-panel__toolbar-actions">
          ${hideShare ? '' : navPreviewShareButtonHtml(true)}
          <button
            type="button"
            class="nav-preview-panel__close nav-preview-panel__close--inline"
            data-nav-panel-close="true"
            aria-label="Close"
          >${navPreviewCloseIconHtml()}</button>
        </div>
      </div>`
    );

  const bodyTitleHtml = hasHero ? '' : titleHtml;

  const descriptionHtml =
    preview.description ?
      buildGlassPanelParagraphsHtml(preview.description)
    : '';
  const namingHtml = buildNavPreviewNamingListHtml(
    preview.namingItems,
    hotspotId,
  );

  const ctaLabel = navPreviewCtaLabel(preview);
  const visitAriaLabel = navPreviewVisitAriaLabel(preview);
  const footerHtml =
    preview.canNavigate ?
      `<footer class="${GLASS_PANEL.footer}">
    <div class="${GLASS_PANEL.ctaWrap} tour-glass-panel__cta-wrap--full">
      <button
        type="button"
        class="${GLASS_PANEL.cta} tour-glass-panel__cta--has-trailing-icon"
        data-nav-panel-go="true"
        aria-label="${escapeHtml(visitAriaLabel)}"
      >${buildGlassPanelCtaTextHtml(ctaLabel)}${glassPanelCtaArrowIconHtml()}</button>
    </div>
  </footer>`
    : '';

  const bodyHtml = `<div class="${GLASS_PANEL.body} nav-preview-panel__body ishare-scrollbar">
    ${closeInBodyHtml}
    ${bodyTitleHtml}
    ${descriptionHtml ? `<div class="${GLASS_PANEL.copy}">${descriptionHtml}</div>` : ''}
    ${namingHtml}
  </div>`;

  return `
    <article
      class="${GLASS_PANEL.rootAnchored} tour-glass-panel--nav-preview"
      role="dialog"
      aria-labelledby="${escapeHtml(titleId)}"
      data-nav-panel="true"
      data-nav-panel-for="${escapeHtml(hotspotId)}"
    >
      <div class="${shellClass}">
        ${heroHtml}
        <div class="nav-preview-panel__main">
          ${bodyHtml}
          ${footerHtml}
        </div>
      </div>
    </article>
  `;
}
