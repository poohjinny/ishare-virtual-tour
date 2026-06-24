import type { Hotspot } from '../types/tour';

/** Panel / popup type badge — info icon + label row */
export const GENERAL_INFO_BADGE_LABEL = 'Information';

export function isGeneralInfoHotspot(hotspot: Hotspot): boolean {
  return hotspot.type === 'info' && !hotspot.popup?.namingOpportunity;
}

export function isNamingInfoHotspot(hotspot: Hotspot): boolean {
  return hotspot.type === 'info' && Boolean(hotspot.popup?.namingOpportunity);
}
