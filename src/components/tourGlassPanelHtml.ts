import type { PopupContent, PopupWidthTier } from '../types/tour';
import {
  giftabulatorCtaLabelHtml,
  popupCtaLabelLength,
  resolvePopupCta,
} from '../data/giftabulatorBrand';
import {
  namingOpportunityCtaEnabled,
  namingOpportunityStatusConfig,
} from '../data/namingOpportunityStatus';

export const GLASS_PANEL_SIZE = {
  minWidth: 320,
  maxWidth: 500,
  defaultWidth: 380,
  minHeight: 120,
  maxHeight: 720,
  maxHeightRatio: 0.88,
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

function tierFromPopupContent(popup: PopupContent): PopupWidthTier {
  const hasVideo = !!popup.videoUrl;
  const hasCta = !!popup.cta;
  const longBody = popup.body.length > 300;
  const longCta = popup.cta ? popupCtaLabelLength(popup.cta) > 40 : false;

  if (hasVideo && hasCta && (longBody || longCta)) return 'wide';
  if (hasVideo || hasCta) return 'rich';
  if (popup.body.length > 180) return 'standard';
  return 'compact';
}

function preferredWidthFromPopup(popup: PopupContent): number {
  if (typeof popup.width === 'number') return popup.width;
  if (popup.width) return GLASS_PANEL_WIDTH_TIER[popup.width];
  return GLASS_PANEL_WIDTH_TIER[tierFromPopupContent(popup)];
}

/** clamp(viewport) ← tier(popup) ← json override */
export function resolveGlassPanelWidth(popup?: PopupContent): number {
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

  const width = resolveGlassPanelWidth(popup);
  glassPanelMeasureHost.style.width = `${width}px`;

  const html = buildAnchoredPopupHtml(popup, hotspotId, { animate: false })
    .replace(
      GLASS_PANEL.rootAnchored,
      `${GLASS_PANEL.rootAnchored} tour-glass-panel--measure`,
    );
  glassPanelMeasureHost.innerHTML = html;

  const shell = glassPanelMeasureHost.querySelector(`.${GLASS_PANEL.shell}`);
  const measured =
    shell instanceof HTMLElement ? shell.offsetHeight : GLASS_PANEL_SIZE.minHeight;

  return Math.max(measured, GLASS_PANEL_SIZE.minHeight);
}

export function glassPanelMarkerSize(
  popup: PopupContent,
  hotspotId: string,
): {
  width: number;
  height: number;
} {
  const width = resolveGlassPanelWidth(popup);
  const contentHeight = measureAnchoredGlassPanelHeight(popup, hotspotId);
  const maxHeight = resolveGlassPanelMaxHeight(popup);

  return {
    width,
    height: Math.min(contentHeight, maxHeight),
  };
}

/** BEM class names — keep in sync with TourGlassPanel.css */
export const GLASS_PANEL = {
  root: 'tour-glass-panel',
  rootAnchored: 'tour-glass-panel tour-glass-panel--anchored',
  shell: 'tour-glass-panel__shell',
  shellEnter: 'tour-glass-panel__shell--enter',
  header: 'tour-glass-panel__header',
  titleRow: 'tour-glass-panel__title-row',
  title: 'tour-glass-panel__title',
  close: 'tour-glass-panel__close',
  closeIcon: 'tour-glass-panel__close-icon',
  badge: 'tour-glass-panel__badge',
  badgeNaming: 'tour-glass-panel__badge tour-glass-panel__badge--naming',
  badgePrice: 'tour-glass-panel__badge tour-glass-panel__badge--price',
  badgePriceSold: 'tour-glass-panel__badge tour-glass-panel__badge--price tour-glass-panel__badge--price-sold',
  badgeStatus: 'tour-glass-panel__badge tour-glass-panel__badge--status',
  badgeSponsor: 'tour-glass-panel__badge tour-glass-panel__badge--sponsor',
  badgeIcon: 'tour-glass-panel__badge-icon',
  badgeText: 'tour-glass-panel__badge-text',
  meta: 'tour-glass-panel__meta',
  metaRow: 'tour-glass-panel__meta-row',
  priceLabel: 'tour-glass-panel__price-label',
  body: 'tour-glass-panel__body',
  footer: 'tour-glass-panel__footer',
  copy: 'tour-glass-panel__copy',
  paragraph: 'tour-glass-panel__paragraph',
  video: 'tour-glass-panel__video',
  ctaWrap: 'tour-glass-panel__cta-wrap',
  cta: 'tour-glass-panel__cta',
  ctaText: 'tour-glass-panel__cta-text',
  reg: 'tour-glass-panel__reg',
  ctaIcon: 'tour-glass-panel__cta-icon',
  ctaSublabel: 'tour-glass-panel__cta-sublabel',
} as const;

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

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildGlassPanelParagraphsHtml(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="${GLASS_PANEL.paragraph}">${escapeHtml(p)}</p>`)
    .join('');
}

export function buildPopupBadgeHtml(popup: PopupContent): string {
  if (popup.namingOpportunity) {
    const { name, price, priceLabel, status } = popup.namingOpportunity;
    const statusConfig = namingOpportunityStatusConfig(status);
    const priceBadgeClass =
      statusConfig.cssModifier === 'sold' ?
        GLASS_PANEL.badgePriceSold
      : GLASS_PANEL.badgePrice;
    const labelHtml =
      priceLabel ?
        `<p class="${GLASS_PANEL.priceLabel}">${escapeHtml(priceLabel)}</p>`
      : '';

    return `<div class="${GLASS_PANEL.meta}" aria-label="${escapeHtml(name)}">
      <div class="${GLASS_PANEL.metaRow}">
        <span class="${GLASS_PANEL.badgeNaming}">
          ${glassPanelNamingBadgeIconHtml()}
          <span class="${GLASS_PANEL.badgeText}">Naming Opportunity</span>
        </span>
        <span class="${GLASS_PANEL.badgeStatus} tour-glass-panel__badge--status-${escapeHtml(statusConfig.cssModifier)}">
          <span class="${GLASS_PANEL.badgeText}">${escapeHtml(statusConfig.label)}</span>
        </span>
        <span class="${priceBadgeClass}">
          <span class="${GLASS_PANEL.badgeText}">${escapeHtml(price)}</span>
        </span>
      </div>
      ${labelHtml}
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

export function buildPopupVideoHtml(popup: PopupContent): string {
  if (!popup.videoUrl) return '';

  const embedUrl = youtubeEmbedUrl(popup.videoUrl);
  if (!embedUrl) return '';

  return `<div class="${GLASS_PANEL.video}">
    <iframe
      src="${escapeHtml(embedUrl)}"
      title="${escapeHtml(popup.title)} video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>`;
}

export function buildPopupCtaLabelHtml(popup: PopupContent): string {
  if (!popup.cta) return '';

  const resolved = resolvePopupCta(popup.cta);
  if (resolved.kind === 'giftabulator') {
    return giftabulatorCtaLabelHtml(GLASS_PANEL.reg);
  }

  return escapeHtml(resolved.label);
}

export function buildPopupFooterHtml(popup: PopupContent): string {
  if (!popup.cta) return '';
  if (
    popup.namingOpportunity &&
    !namingOpportunityCtaEnabled(popup.namingOpportunity.status)
  ) {
    return '';
  }

  const resolved = resolvePopupCta(popup.cta);
  const labelHtml = buildPopupCtaLabelHtml(popup);
  const sublabelHtml =
    resolved.sublabel ?
      `<p class="${GLASS_PANEL.ctaSublabel}">${escapeHtml(resolved.sublabel)}</p>`
    : '';

  return `<footer class="${GLASS_PANEL.footer}">
    <div class="${GLASS_PANEL.ctaWrap}">
      <a
        class="${GLASS_PANEL.cta}"
        href="${escapeHtml(resolved.url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${escapeHtml(resolved.ariaLabel)}"
      ><span class="${GLASS_PANEL.ctaText}">${labelHtml}</span>${glassPanelCtaArrowIconHtml()}</a>
      ${sublabelHtml}
    </div>
  </footer>`;
}

export interface GlassPanelHtmlOptions {
  title: string;
  titleId: string;
  badgeHtml?: string;
  bodyHtml: string;
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
    badgeHtml = '',
    bodyHtml,
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
            <h3 id="${escapeHtml(titleId)}" class="${GLASS_PANEL.title}">
              ${escapeHtml(title)}
            </h3>
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
          <div class="${GLASS_PANEL.copy}">${bodyHtml}</div>
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
  options?: { animate?: boolean },
): string {
  const titleId = `info-panel-title-${hotspotId}`;

  return buildTourGlassPanelHtml({
    title: popup.title,
    titleId,
    badgeHtml: buildPopupBadgeHtml(popup),
    bodyHtml: buildGlassPanelParagraphsHtml(popup.body),
    videoHtml: buildPopupVideoHtml(popup),
    footerHtml: buildPopupFooterHtml(popup),
    variant: 'anchored',
    animate: options?.animate ?? true,
    closeDataAttr: 'info-panel-close',
    rootDataAttrs: {
      'data-info-panel': 'true',
      'data-info-panel-for': hotspotId,
    },
  });
}
