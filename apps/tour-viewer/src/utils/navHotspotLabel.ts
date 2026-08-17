import type { Hotspot, Tour } from '../types/tour';

/** Nav pill / CTA label — explicit override, else target scene title. */
export function resolveNavHotspotLabel(hotspot: Hotspot, tour: Tour): string {
  const override = hotspot.label?.trim();
  if (override) return override;

  const targetId = hotspot.targetScene?.trim();
  const title = targetId ? tour.scenes[targetId]?.title?.trim() : '';
  return title || 'Go';
}
