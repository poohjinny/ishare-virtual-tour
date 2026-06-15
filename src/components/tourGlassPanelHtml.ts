import type {
  PopupContent,
  PopupCta,
  PopupWidthTier,
  NavPreviewContent,
  NavPreviewNamingItem,
  Tour,
} from '../types/tour';
import {
  navPreviewCtaLabel,
  navPreviewVisitAriaLabel,
} from '../utils/navPreview';
import {
  giftabulatorCtaButtonLabelHtml,
  popupCtaLabelLength,
  resolvePopupCta,
} from '../data/giftabulatorBrand';
import {
  namingOpportunityStatusConfig,
  resolvePopupContentCtas,
} from '../data/namingOpportunityStatus';
import {
  partitionPopupCtas,
  popupCtaRowClassName,
  popupCtaWrapClassName,
  resolvePopupCtaLayoutMode,
} from '../utils/popupCtaLayout';
import {
  isNamingStatusIconModifier,
  namingStatusBadgeIconHtml,
} from './namingStatusBadgeIcons';
import { BADGE_CLASS } from './ui/badgeClasses';
import {
  initPopupVideoPlayers,
  popupVideoPlayIconHtml,
  resolvePopupVideo,
  youtubeEmbedUrl,
} from '../utils/popupVideo';

export { youtubeEmbedUrl, initPopupVideoPlayers };

export const GLASS_PANEL_SIZE = {
  minWidth: 320,
  maxWidth: 500,
  defaultWidth: 380,
  minHeight: 0,
  maxHeight: 840,
  maxHeightRatio: 0.92,
  viewportMargin: 48,
  viewportMarginMobile: 32,
} as const;

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

function tierFromPopupContent(
  popup: PopupContent,
  tour?: Tour,
): PopupWidthTier {
  const resolvedCtas =
    tour ? resolvePopupContentCtas(popup, tour)
    : popup.cta ? [popup.cta]
    : [];
  const hasVideo = !!popup.videoUrl;
  const hasCta = resolvedCtas.length > 0;
  const longBody = popup.body.length > 300;
  const longCta = resolvedCtas.some((cta) => popupCtaLabelLength(cta) > 40);

  if (hasVideo && hasCta && (longBody || longCta)) return 'wide';
  if (hasVideo || hasCta) return 'rich';
  if (popup.body.length > 180) return 'standard';
  return 'compact';
}

function preferredWidthFromPopup(popup: PopupContent, tour?: Tour): number {
  if (typeof popup.width === 'number') return popup.width;
  if (popup.width) return GLASS_PANEL_WIDTH_TIER[popup.width];
  return GLASS_PANEL_WIDTH_TIER[tierFromPopupContent(popup, tour)];
}

/** clamp(viewport) ← tier(popup) ← json override */
export function resolveGlassPanelWidth(
  popup?: PopupContent,
  tour?: Tour,
): number {
  const preferred =
    popup ?
      preferredWidthFromPopup(popup, tour)
    : GLASS_PANEL_SIZE.defaultWidth;

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
): { width: number; height: number } {
  const width = resolveGlassPanelWidth(popup, tour);
  const contentHeight = measureAnchoredGlassPanelHeight(popup, hotspotId, tour);
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
  priceUnderTitleSold:
    'tour-glass-panel__price tour-glass-panel__price--under-title tour-glass-panel__price--sold',
  priceInline: 'tour-glass-panel__price tour-glass-panel__price--inline',
  priceInlineSold:
    'tour-glass-panel__price tour-glass-panel__price--inline tour-glass-panel__price--sold',
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
  return `<svg class="${GLASS_PANEL.closeIcon}" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
</svg>`;
}

function navPreviewCloseIconHtml(): string {
  return `<svg class="nav-preview-panel__close-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
</svg>`;
}

export function glassPanelCtaArrowIconHtml(): string {
  return `<svg class="${GLASS_PANEL.ctaIcon}" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function glassPanelInfoBadgeIconHtml(): string {
  return `<svg class="${GLASS_PANEL.badgeIcon}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
  <path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="8" r="1.25" fill="currentColor"/>
</svg>`;
}

export function glassPanelNamingBadgeIconHtml(): string {
  return `<svg class="${GLASS_PANEL.badgeIcon}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
</svg>`;
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
      class="${GLASS_PANEL.video} tour-glass-panel__video--preview"
      data-popup-video-kind="${escapeHtml(resolved.kind)}"
      data-popup-video-src="${escapeHtml(resolved.sourceUrl)}"
      data-popup-video-title="${escapeHtml(popup.title)}"
    >
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

function buildNamingPriceInlineHtml(price: string, sold: boolean): string {
  const priceClass =
    sold ? GLASS_PANEL.priceInlineSold : GLASS_PANEL.priceInline;

  return `<span class="${priceClass}">
    <span class="${GLASS_PANEL.priceSep}" aria-hidden="true">|</span>
    <span class="${GLASS_PANEL.priceValue}">${escapeHtml(price)}</span>
  </span>`;
}

export function buildNamingPriceUnderTitleHtml(
  price: string,
  sold: boolean,
): string {
  const priceClass =
    sold ? GLASS_PANEL.priceUnderTitleSold : GLASS_PANEL.priceUnderTitle;

  return `<p class="${priceClass}">
    <span class="${GLASS_PANEL.priceSep}" aria-hidden="true">|</span>
    <span class="${GLASS_PANEL.priceValue}">${escapeHtml(price)}</span>
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
          <span class="${GLASS_PANEL.badgeText}">Naming Opportunity</span>
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
    <span class="${GLASS_PANEL.badgeText}">Info</span>
  </span>`;
}

export function buildPopupCtaLabelHtml(cta: PopupCta): string {
  const resolved = resolvePopupCta(cta);

  if (resolved.kind === 'giftabulator' && !cta.label) {
    return giftabulatorCtaButtonLabelHtml(GLASS_PANEL.reg);
  }

  return escapeHtml(resolved.label);
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
  const className = `${GLASS_PANEL.cta}${isSecondary ? ' tour-glass-panel__cta--secondary' : ''}`;
  const arrowHtml = isSecondary ? '' : glassPanelCtaArrowIconHtml();

  return `<a
        class="${className}"
        href="${escapeHtml(resolved.url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${escapeHtml(resolved.ariaLabel)}"
      >${labelHtml}${arrowHtml}</a>`;
}

function buildPopupFooterButtonsHtml(ctas: PopupCta[]): string {
  const mode = resolvePopupCtaLayoutMode(ctas);

  if (mode === 'full') {
    return buildPopupCtaButtonHtml(ctas[0]);
  }

  const { ordered, primary, secondaries } = partitionPopupCtas(ctas);

  if (mode === 'row-equal') {
    return ordered.map((cta) => buildPopupCtaButtonHtml(cta)).join('');
  }

  const secondaryHtml =
    secondaries.length > 1 ?
      `<div class="${popupCtaRowClassName(secondaries.length)}">${secondaries.map((cta) => buildPopupCtaButtonHtml(cta)).join('')}</div>`
    : secondaries.map((cta) => buildPopupCtaButtonHtml(cta)).join('');

  return `${secondaryHtml}<div class="${GLASS_PANEL.ctaPrimaryGroup}">${buildPopupCtaButtonHtml(primary)}</div>`;
}

export function buildPopupFooterHtml(popup: PopupContent, tour?: Tour): string {
  const ctas =
    tour ? resolvePopupContentCtas(popup, tour)
    : popup.ctas?.length ? popup.ctas
    : popup.cta ? [popup.cta]
    : [];
  if (ctas.length === 0) return '';

  const buttonsHtml = buildPopupFooterButtonsHtml(ctas);
  const wrapClass = popupCtaWrapClassName(resolvePopupCtaLayoutMode(ctas));

  return `<footer class="${GLASS_PANEL.footer}">
    <div class="${wrapClass}">
      ${buttonsHtml}
    </div>
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
            <div class="${GLASS_PANEL.titleBlock}">
              <div class="${GLASS_PANEL.titleLine}">
                <h3 id="${escapeHtml(titleId)}" class="${GLASS_PANEL.title}">
                  ${escapeHtml(title)}
                </h3>
                ${titleAfterHtml}
              </div>
              ${titleSubHtml}
            </div>
            <button
              type="button"
              class="${GLASS_PANEL.close}"
              aria-label="Close"
              ${closeAttr}
            >
              ${glassPanelCloseIconHtml()}
            </button>
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
  options?: { animate?: boolean; tour?: Tour },
): string {
  const titleId = `info-panel-title-${hotspotId}`;
  const naming = popup.namingOpportunity;
  const titleAfterHtml =
    naming ?
      buildNamingPriceUnderTitleHtml(
        naming.price,
        namingOpportunityStatusConfig(naming.status).cssModifier === 'sold',
      )
    : '';
  const titleSubHtml =
    naming?.priceLabel ?
      `<p class="${GLASS_PANEL.priceLabel}">${escapeHtml(naming.priceLabel)}</p>`
    : '';

  return buildTourGlassPanelHtml({
    title: popup.title,
    titleId,
    titleAfterHtml,
    titleSubHtml,
    badgeHtml: buildPopupBadgeHtml(popup),
    bodyHtml: buildGlassPanelParagraphsHtml(popup.body),
    videoHtml: buildPopupVideoHtml(popup),
    footerHtml: buildPopupFooterHtml(popup, options?.tour),
    variant: 'anchored',
    animate: options?.animate ?? true,
    closeDataAttr: 'info-panel-close',
    rootDataAttrs: {
      'data-info-panel': 'true',
      'data-info-panel-for': hotspotId,
    },
  });
}

const NAV_PREVIEW_PANEL_WIDTH = 440;
const NAV_PREVIEW_HERO_ASPECT = 8 / 16;
const NAV_PREVIEW_MAX_HEIGHT = 960;
const NAV_PREVIEW_MAX_HEIGHT_RATIO = 0.96;

export function resolveNavPreviewPanelWidth(): number {
  return Math.round(Math.min(NAV_PREVIEW_PANEL_WIDTH, viewportMaxPanelWidth()));
}

export function resolveNavPreviewHeroHeight(
  panelWidth = resolveNavPreviewPanelWidth(),
): number {
  return Math.round(panelWidth * NAV_PREVIEW_HERO_ASPECT);
}

export function resolveNavPreviewPanelMaxHeight(): number {
  return Math.min(
    Math.round(window.innerHeight * NAV_PREVIEW_MAX_HEIGHT_RATIO),
    NAV_PREVIEW_MAX_HEIGHT,
  );
}

export function measureAnchoredNavPreviewHeight(
  preview: NavPreviewContent,
  hotspotId: string,
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
): { width: number; height: number } {
  const contentHeight = measureAnchoredNavPreviewHeight(preview, hotspotId);
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
        item.statusModifier === 'sold',
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

export function buildAnchoredNavPreviewHtml(
  preview: NavPreviewContent,
  hotspotId: string,
  options?: { animate?: boolean },
): string {
  const titleId = `nav-panel-title-${hotspotId}`;
  const shellClass =
    options?.animate === false ?
      GLASS_PANEL.shell
    : `${GLASS_PANEL.shell} ${GLASS_PANEL.shellEnter}`;

  const titleHtml = `<h3 id="${escapeHtml(titleId)}" class="${GLASS_PANEL.title} nav-preview-panel__title">${escapeHtml(preview.title)}</h3>`;

  const heroTitleOverlayHtml =
    preview.panorama ?
      `<div class="nav-preview-panel__hero-title">${titleHtml}</div>`
    : '';

  const heroHeight = resolveNavPreviewHeroHeight();

  const heroHtml =
    preview.panorama ?
      `<div class="nav-preview-panel__hero nav-preview-panel__hero--loading" style="height:${heroHeight}px" aria-busy="true">
        <div class="nav-preview-panel__hero-skeleton" aria-hidden="true"></div>
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
        <button
          type="button"
          class="nav-preview-panel__close"
          data-nav-panel-close="true"
          aria-label="Close"
        >${navPreviewCloseIconHtml()}</button>
      </div>`
    : '';

  const closeInBodyHtml =
    preview.panorama ? '' : (
      `<div class="nav-preview-panel__body-toolbar">
        <button
          type="button"
          class="nav-preview-panel__close nav-preview-panel__close--inline"
          data-nav-panel-close="true"
          aria-label="Close"
        >${navPreviewCloseIconHtml()}</button>
      </div>`
    );

  const bodyTitleHtml = preview.panorama ? '' : titleHtml;

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
  const footerHtml = `<footer class="${GLASS_PANEL.footer}">
    <div class="${GLASS_PANEL.ctaWrap} tour-glass-panel__cta-wrap--full">
      <button
        type="button"
        class="${GLASS_PANEL.cta}"
        data-nav-panel-go="true"
        aria-label="${escapeHtml(visitAriaLabel)}"
      >${buildGlassPanelCtaTextHtml(ctaLabel)}${glassPanelCtaArrowIconHtml()}</button>
    </div>
  </footer>`;

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
