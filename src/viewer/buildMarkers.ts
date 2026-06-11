import type { Hotspot } from '../types/tour';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NAV_ARROW_SVG = `<svg class="hotspot-nav__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 12h13" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M13 8l5 4-5 4" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function buildNavHtml(label: string): string {
  return `
    <button type="button" class="hotspot-nav" data-hotspot-type="nav">
      <span class="hotspot-nav__pulse" aria-hidden="true"></span>
      <span class="hotspot-nav__pill">
        <span class="hotspot-nav__label">${escapeHtml(label)}</span>
        <span class="hotspot-nav__icon-wrap">${NAV_ARROW_SVG}</span>
      </span>
    </button>
  `;
}

function buildInfoHtml(): string {
  return `<div class="hotspot-info" data-hotspot-type="info">i</div>`;
}

export function hotspotToMarkerConfig(hotspot: Hotspot) {
  const html =
    hotspot.type === 'nav' ?
      buildNavHtml(hotspot.label ?? 'Go')
    : buildInfoHtml();

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
