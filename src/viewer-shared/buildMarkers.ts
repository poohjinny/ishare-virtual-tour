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
import {
  resolveHotspotMarkerVisibility,
  type SceneVisibility,
} from '../utils/sceneVisibility';
import type { Hotspot, Scene, Tour, ViewPosition } from '../types/tour';

function visibilityLabel(visibility: SceneVisibility): string | null {
  if (visibility === 'unlisted') return 'Unlisted';
  if (visibility === 'internal') return 'Internal';
  return null;
}

/** Dim dashed chrome for pins hidden from visitors (authoring only). */
function authoringGhostClassName(
  tour: Tour,
  hotspot: Hotspot,
): { className: string; visibilityNote: string | null } {
  const visibility = resolveHotspotMarkerVisibility(tour, hotspot);
  const note = visibilityLabel(visibility);
  if (!note) return { className: '', visibilityNote: null };
  return {
    className: ` hotspot--authoring-ghost hotspot--visibility-${visibility}`,
    visibilityNote: note,
  };
}

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

function buildNavLeadingHtml(hotspot: Hotspot): string {
  const variant = resolveNavHotspotVariant(hotspot);

  if (variant === 'back') {
    return `<span class="hotspot-nav__icon" aria-hidden="true">${materialSymbolHtml(
      'arrow_back',
      { className: 'hotspot-nav__icon-symbol' },
    )}</span>`;
  }

  if (variant === 'hub') {
    return `<span class="hotspot-nav__icon" aria-hidden="true">${materialSymbolHtml(
      'home',
      { className: 'hotspot-nav__icon-symbol' },
    )}</span>`;
  }

  return '<span class="hotspot-nav__dot" aria-hidden="true"></span>';
}

function buildNavHtml(hotspot: Hotspot, tour: Tour): string {
  const label = resolveNavHotspotLabel(hotspot, tour);
  const variant = resolveNavHotspotVariant(hotspot);
  const variantClass = navHotspotVariantModifierClass(variant);
  const { className: ghostClass, visibilityNote } = authoringGhostClassName(
    tour,
    hotspot,
  );
  const ariaLabel =
    visibilityNote ?
      `${buildNavHotspotAriaLabel(label, variant)} (${visibilityNote})`
    : buildNavHotspotAriaLabel(label, variant);

  const visibilityHtml =
    visibilityNote ?
      `<span class="hotspot-nav__visibility" aria-hidden="true">${escapeHtml(visibilityNote)}</span>`
    : '';

  /* Compact markup — no whitespace text nodes between flex children (PSV
   * was growing the chip via anonymous flex items / font metrics). */
  return `<button type="button" class="hotspot-nav${variantClass ? ` ${variantClass}` : ''}${ghostClass}" data-hotspot-type="nav" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}"><span class="hotspot-nav__pill">${buildNavLeadingHtml(hotspot)}<span class="hotspot-nav__label">${escapeHtml(label)}</span>${visibilityHtml}</span></button>`;
}

const HOTSPOT_GENERAL_INFO_ICON_HTML = materialSymbolHtml('info_i', {
  className: 'hotspot-general-info__icon-symbol',
});

const HOTSPOT_PLACE_OVERVIEW_ICON_HTML = materialSymbolHtml('flag', {
  className: 'hotspot-general-info__icon-symbol',
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
    <button type="button" class="hotspot-general-info${modifierClass} ishare-tooltip-host ishare-tooltip-host--portal" data-hotspot-type="info" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}" data-ishare-tooltip="${escapeHtml(tooltipLabel)}" data-ishare-tooltip-placement="top">
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
  const baseAria =
    naming ?
      buildNamingHotspotAriaLabel(hotspot, tour, hostScene)
    : (hotspot.popup?.title?.trim() ?? hotspot.label?.trim() ?? 'Information');
  const { className: ghostClass, visibilityNote } = authoringGhostClassName(
    tour,
    hotspot,
  );
  const ariaLabel =
    visibilityNote ? `${baseAria} (${visibilityNote})` : baseAria;
  const statusClass =
    (
      naming &&
      namingOpportunityStatusConfig(naming.status).cssModifier === 'sold'
    ) ?
      ' hotspot-info--status-sold'
    : '';

  return `
    <button type="button" class="hotspot-info${statusClass}${ghostClass}" data-hotspot-type="info" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-expanded="false" aria-label="${escapeHtml(ariaLabel)}">
      <span class="hotspot-info__pulse" aria-hidden="true"></span>
      <span class="hotspot-info__pill">
        <span class="hotspot-info__icon-wrap">${INFO_HEART_SVG}</span>
        <span class="hotspot-info__label">${buildNamingHotspotPillLabelHtml(hotspot, tour, hostScene)}</span>
        ${
          visibilityNote ?
            `<span class="hotspot-info__visibility" aria-hidden="true">${escapeHtml(visibilityNote)}</span>`
          : ''
        }
      </span>
    </button>
  `;
}

/** Shared pill / chip HTML for panorama markers and model3d CSS2D labels. */
export function buildHotspotMarkerHtml(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
): string {
  const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
  const displayHotspot =
    isNamingHotspot(hotspot) ?
      { ...hotspot, popup: resolveNamingPopup(tour, hotspot, scene) }
    : hotspot;

  if (displayHotspot.type === 'nav') {
    return buildNavHtml(displayHotspot, tour);
  }
  if (isGeneralInfoHotspot(displayHotspot)) {
    return buildGeneralInfoHtml(displayHotspot, tour, hostScene);
  }
  return buildInfoHtml(displayHotspot, tour, hostScene);
}

export function hotspotToMarkerConfig(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene,
) {
  const pos = hotspot.position as ViewPosition;
  return {
    id: hotspot.id,
    position: { yaw: `${pos.yaw}deg`, pitch: `${pos.pitch}deg` },
    html: buildHotspotMarkerHtml(hotspot, tour, hostScene),
    anchor: 'center center' as const,
    hoverScale: false,
    data: { hotspot },
  };
}
