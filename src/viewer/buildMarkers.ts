import { materialSymbolHtml } from '../components/glassPanelCtaIcons';
import {
  buildNavHotspotAriaLabel,
  navHotspotVariantModifierClass,
  resolveNavHotspotVariant,
} from '../constants/navHotspotVariant';
import { isGeneralInfoHotspot } from '../data/generalInfoHotspot';
import type { Hotspot } from '../types/tour';
import {
  namingOpportunityStatusConfig,
  stripNamingOpportunitySuffix,
} from '../data/namingOpportunityStatus';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NAV_HOTSPOT_ICON_SIZE_PX = 16;

function buildNavLeadingHtml(hotspot: Hotspot): string {
  const variant = resolveNavHotspotVariant(hotspot);

  if (variant === 'back') {
    return `<span class="hotspot-nav__icon" aria-hidden="true">${materialSymbolHtml(
      'arrow_back',
      {
        className: 'hotspot-nav__icon-symbol',
        sizePx: NAV_HOTSPOT_ICON_SIZE_PX,
      },
    )}</span>`;
  }

  if (variant === 'hub') {
    return `<span class="hotspot-nav__icon" aria-hidden="true">${materialSymbolHtml(
      'home',
      {
        className: 'hotspot-nav__icon-symbol',
        sizePx: NAV_HOTSPOT_ICON_SIZE_PX,
      },
    )}</span>`;
  }

  return '<span class="hotspot-nav__dot" aria-hidden="true"></span>';
}

function buildNavHtml(hotspot: Hotspot): string {
  const label = hotspot.label?.trim() || 'Go';
  const variant = resolveNavHotspotVariant(hotspot);
  const variantClass = navHotspotVariantModifierClass(variant);
  const ariaLabel = buildNavHotspotAriaLabel(label, variant);

  return `
    <button type="button" class="hotspot-nav${variantClass ? ` ${variantClass}` : ''}" data-hotspot-type="nav" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}">
      <span class="hotspot-nav__pill">
        ${buildNavLeadingHtml(hotspot)}
        <span class="hotspot-nav__label">${escapeHtml(label)}</span>
      </span>
    </button>
  `;
}

const HOTSPOT_GENERAL_INFO_ICON_HTML = materialSymbolHtml('info_i', {
  className: 'hotspot-general-info__icon-symbol',
  sizePx: 18,
});

function buildGeneralInfoHtml(hotspot: Hotspot): string {
  const title = hotspot.popup?.title?.trim() ?? hotspot.label?.trim();
  const ariaLabel = title ?? 'Information';
  const tooltipLabel = title ?? 'Learn more';

  return `
    <button type="button" class="hotspot-general-info ishare-tooltip-host" data-hotspot-type="info" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}" data-ishare-tooltip="${escapeHtml(tooltipLabel)}" data-ishare-tooltip-placement="top">
      <span class="hotspot-general-info__chip" aria-hidden="true">
        <span class="hotspot-general-info__icon">${HOTSPOT_GENERAL_INFO_ICON_HTML}</span>
      </span>
    </button>
  `;
}

const INFO_HEART_SVG = `<svg class="hotspot-info__icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
</svg>`;

function buildInfoHtml(hotspot: Hotspot): string {
  const title = hotspot.popup?.title?.trim() ?? hotspot.label?.trim();
  const ariaLabel = title ?? 'Naming opportunity';
  const naming = hotspot.popup?.namingOpportunity;
  const statusConfig =
    naming ? namingOpportunityStatusConfig(naming.status) : null;
  const pillLabel =
    naming?.name?.trim() ? stripNamingOpportunitySuffix(naming.name)
    : statusConfig ? statusConfig.hotspotLabel
    : (hotspot.label?.trim() ?? 'Learn more');
  const statusClass =
    (
      naming &&
      namingOpportunityStatusConfig(naming.status).cssModifier === 'closed'
    ) ?
      ' hotspot-info--status-closed'
    : '';

  return `
    <button type="button" class="hotspot-info${statusClass}" data-hotspot-type="info" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}">
      <span class="hotspot-info__pulse" aria-hidden="true"></span>
      <span class="hotspot-info__pill">
        <span class="hotspot-info__icon-wrap">${INFO_HEART_SVG}</span>
        <span class="hotspot-info__label">${escapeHtml(pillLabel)}</span>
      </span>
    </button>
  `;
}

export function hotspotToMarkerConfig(hotspot: Hotspot) {
  const html =
    hotspot.type === 'nav' ? buildNavHtml(hotspot)
    : isGeneralInfoHotspot(hotspot) ? buildGeneralInfoHtml(hotspot)
    : buildInfoHtml(hotspot);

  return {
    id: hotspot.id,
    position: {
      yaw: `${hotspot.position.yaw}deg`,
      pitch: `${hotspot.position.pitch}deg`,
    },
    html,
    anchor: 'center center' as const,
    data: { hotspot },
  };
}
