import { materialSymbolHtml } from '../components/glassPanelCtaIcons';
import {
  buildNavHotspotAriaLabel,
  navHotspotVariantModifierClass,
  resolveNavHotspotVariant,
} from '../constants/navHotspotVariant';
import { PLACE_OVERVIEW_HOTSPOT_LABEL } from '../constants/tourDirectory';
import { isGeneralInfoHotspot } from '../data/generalInfoHotspot';
import {
  namingOpportunityStatusConfig,
  namingOpportunityStatusShowsBadge,
  stripNamingOpportunitySuffix,
} from '../data/namingOpportunityStatus';
import { resolveNavHotspotLabel } from '../utils/navHotspotLabel';
import {
  resolveHotspotHostScene,
  resolveNamingPopup,
  isNamingHotspot,
} from '../utils/namingSceneInherit';
import { isPlaceOverviewHotspot } from '../utils/placeOverview';
import type { Hotspot, Scene, Tour, ViewPosition } from '../types/tour';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** NO pill: name · status (status in muted tone via CSS). */
export function buildNamingHotspotPillLabelHtml(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
): string {
  const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
  const popup = resolveNamingPopup(tour, hotspot, scene);
  const naming = popup?.namingOpportunity;
  if (!naming) {
    const fallback =
      hotspot.popup?.title?.trim() ?? hotspot.label?.trim() ?? 'Learn more';
    return escapeHtml(fallback);
  }

  const statusConfig = namingOpportunityStatusConfig(naming.status);
  const name =
    naming.name?.trim() ?
      stripNamingOpportunitySuffix(naming.name)
    : (hotspot.popup?.title?.trim() ??
      hotspot.label?.trim() ??
      statusConfig.hotspotLabel);

  if (!namingOpportunityStatusShowsBadge(naming.status)) {
    return `<span class="hotspot-info__name">${escapeHtml(name)}</span>`;
  }

  return `<span class="hotspot-info__name">${escapeHtml(name)}</span><span class="hotspot-info__label-sep" aria-hidden="true">·</span><span class="hotspot-info__status">${escapeHtml(statusConfig.label)}</span>`;
}

export function buildNamingHotspotAriaLabel(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
): string {
  const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
  const popup = resolveNamingPopup(tour, hotspot, scene);
  const naming = popup?.namingOpportunity;
  if (!naming) {
    return (
      hotspot.popup?.title?.trim() ?? hotspot.label?.trim() ?? 'Information'
    );
  }

  const statusConfig = namingOpportunityStatusConfig(naming.status);
  const name =
    naming.name?.trim() ?
      stripNamingOpportunitySuffix(naming.name)
    : (hotspot.popup?.title?.trim() ??
      hotspot.label?.trim() ??
      statusConfig.hotspotLabel);

  if (!namingOpportunityStatusShowsBadge(naming.status)) {
    return name;
  }

  return `${name} · ${statusConfig.label}`;
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

function buildNavHtml(hotspot: Hotspot, tour: Tour): string {
  const label = resolveNavHotspotLabel(hotspot, tour);
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

const HOTSPOT_GENERAL_INFO_ICON_SIZE_PX = 16;

const HOTSPOT_GENERAL_INFO_ICON_HTML = materialSymbolHtml('info_i', {
  className: 'hotspot-general-info__icon-symbol',
  sizePx: HOTSPOT_GENERAL_INFO_ICON_SIZE_PX,
});

const HOTSPOT_PLACE_OVERVIEW_ICON_HTML = materialSymbolHtml('flag', {
  className: 'hotspot-general-info__icon-symbol',
  sizePx: HOTSPOT_GENERAL_INFO_ICON_SIZE_PX,
});

function buildGeneralInfoHtml(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
): string {
  const placeOverview = isPlaceOverviewHotspot(hotspot);
  const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
  const title =
    placeOverview ?
      scene?.title?.trim() || hotspot.popup?.title?.trim() || 'Place'
    : (hotspot.popup?.title?.trim() ?? hotspot.label?.trim());
  const ariaLabel =
    placeOverview ?
      `${title} — ${PLACE_OVERVIEW_HOTSPOT_LABEL}`
    : (title ?? 'Information');
  const tooltipLabel =
    placeOverview ? PLACE_OVERVIEW_HOTSPOT_LABEL : (title ?? 'Learn more');
  const modifierClass =
    placeOverview ? ' hotspot-general-info--place-overview' : '';
  const iconHtml =
    placeOverview ?
      HOTSPOT_PLACE_OVERVIEW_ICON_HTML
    : HOTSPOT_GENERAL_INFO_ICON_HTML;

  return `
    <button type="button" class="hotspot-general-info${modifierClass} ishare-tooltip-host" data-hotspot-type="info" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}" data-ishare-tooltip="${escapeHtml(tooltipLabel)}" data-ishare-tooltip-placement="top">
      <span class="hotspot-general-info__chip" aria-hidden="true">
        <span class="hotspot-general-info__icon">${iconHtml}</span>
      </span>
    </button>
  `;
}

const INFO_HEART_SVG = `<svg class="hotspot-info__icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
</svg>`;

function buildInfoHtml(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
): string {
  const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
  const popup = resolveNamingPopup(tour, hotspot, scene);
  const naming = popup?.namingOpportunity;
  const ariaLabel =
    naming ?
      buildNamingHotspotAriaLabel(hotspot, tour, hostScene)
    : (hotspot.popup?.title?.trim() ?? hotspot.label?.trim() ?? 'Information');
  const statusClass =
    (
      naming &&
      namingOpportunityStatusConfig(naming.status).cssModifier === 'sold'
    ) ?
      ' hotspot-info--status-sold'
    : '';

  return `
    <button type="button" class="hotspot-info${statusClass}" data-hotspot-type="info" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}">
      <span class="hotspot-info__pulse" aria-hidden="true"></span>
      <span class="hotspot-info__pill">
        <span class="hotspot-info__icon-wrap">${INFO_HEART_SVG}</span>
        <span class="hotspot-info__label">${buildNamingHotspotPillLabelHtml(hotspot, tour, hostScene)}</span>
      </span>
    </button>
  `;
}

export function hotspotToMarkerConfig(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
) {
  const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
  const displayHotspot =
    isNamingHotspot(hotspot) ?
      { ...hotspot, popup: resolveNamingPopup(tour, hotspot, scene) }
    : hotspot;

  const html =
    displayHotspot.type === 'nav' ? buildNavHtml(displayHotspot, tour)
    : isGeneralInfoHotspot(displayHotspot) ?
      buildGeneralInfoHtml(displayHotspot, tour, hostScene)
    : buildInfoHtml(displayHotspot, tour, hostScene);

  const pos = hotspot.position as ViewPosition;
  return {
    id: hotspot.id,
    position: { yaw: `${pos.yaw}deg`, pitch: `${pos.pitch}deg` },
    html,
    anchor: 'center center' as const,
    data: { hotspot },
  };
}
