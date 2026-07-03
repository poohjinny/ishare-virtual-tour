import type { Hotspot, NavHotspotVariant } from '../types/tour';

export const NAV_HOTSPOT_VARIANT_DEFAULT: NavHotspotVariant = 'discover';

export const NAV_HOTSPOT_VARIANT_OPTIONS: {
  value: NavHotspotVariant;
  label: string;
  hint: string;
}[] = [
  {
    value: 'discover',
    label: 'Discover',
    hint: 'Explore a new location — dot marker, preview card by default',
  },
  {
    value: 'back',
    label: 'Back',
    hint: 'Return one step along the visit path — back arrow, usually instant',
  },
  {
    value: 'hub',
    label: 'Hub',
    hint: 'Jump to the tour start scene — home icon, usually instant',
  },
];

export function resolveNavHotspotVariant(hotspot: Hotspot): NavHotspotVariant {
  const variant = hotspot.navVariant;
  if (variant === 'back' || variant === 'hub') return variant;
  return NAV_HOTSPOT_VARIANT_DEFAULT;
}

export function navHotspotVariantModifierClass(
  variant: NavHotspotVariant,
): string {
  return variant === NAV_HOTSPOT_VARIANT_DEFAULT ? '' : (
      `hotspot-nav--${variant}`
    );
}

export function buildNavHotspotAriaLabel(
  label: string,
  variant: NavHotspotVariant,
): string {
  const destination = label.trim() || 'location';
  switch (variant) {
    case 'hub':
      return `Return to ${destination}`;
    case 'back':
      return `Back to ${destination}`;
    default:
      return `Go to ${destination}`;
  }
}

/** Persist only non-default variants in tour JSON. */
export function serializeNavHotspotVariant(
  variant: NavHotspotVariant,
): NavHotspotVariant | undefined {
  return variant === NAV_HOTSPOT_VARIANT_DEFAULT ? undefined : variant;
}

export function parseNavHotspotVariant(
  value: unknown,
): NavHotspotVariant | undefined {
  if (value === 'back' || value === 'hub') return value;
  return undefined;
}
