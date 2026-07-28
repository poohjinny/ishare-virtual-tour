import type { Hotspot } from '../types/tour';
import { isNamingHotspot } from '../utils/namingSceneInherit';

/** Panel / popup type badge — info icon + label row */
export const GENERAL_INFO_BADGE_LABEL = 'Information';

export function isGeneralInfoHotspot(hotspot: Hotspot): boolean {
  return hotspot.type === 'info' && !isNamingHotspot(hotspot);
}

export function isNamingInfoHotspot(hotspot: Hotspot): boolean {
  return isNamingHotspot(hotspot);
}
