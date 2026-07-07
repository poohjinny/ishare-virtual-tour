import {
  NAMING_OPPORTUNITY_STATUS_ORDER,
  namingOpportunityStatusConfig,
} from '../data/namingOpportunityStatus';
import type { NamingOpportunityStatus } from '../types/tour';

export const DEV_NAMING_STATUS_OPTIONS: {
  value: NamingOpportunityStatus;
  label: string;
}[] = NAMING_OPPORTUNITY_STATUS_ORDER.map((value) => ({
  value,
  label: namingOpportunityStatusConfig(value).label,
}));

export type DevHotspotTab = 'nav' | 'naming' | 'info';

export const DEV_INFO_DISPLAY_OPTIONS: {
  value: 'modal' | 'anchored';
  label: string;
}[] = [
  { value: 'anchored', label: 'Anchored panel on panorama' },
  { value: 'modal', label: 'Modal overlay' },
];

export const DEV_HOTSPOT_TABS: { id: DevHotspotTab; label: string }[] = [
  { id: 'nav', label: 'Navigation' },
  { id: 'naming', label: 'Naming opportunity' },
  { id: 'info', label: 'Info' },
];

/** Which hotspot bucket the dev panel is editing. */
export type DevHotspotManageScope = 'panorama-scene' | 'model3d-tour';

export interface DevHotspotSectionConfig {
  title: string;
  description: string;
  manageHint: string;
  createHint: string;
  emptyMessage: string;
  addButtonLabel: string;
  createTabs: { id: DevHotspotTab; label: string }[];
}

export function getDevHotspotSectionConfig(
  scope: DevHotspotManageScope,
): DevHotspotSectionConfig {
  switch (scope) {
    case 'model3d-tour':
      return {
        title: 'Hotspots',
        description:
          'Nav, naming, and info hotspots on the shared GLB. Scenes are camera viewpoints only.',
        manageHint:
          'Move, edit, or delete tour-level hotspots (stored in tour.json → hotspots[]).',
        createHint:
          'Add hotspots from a 3D viewer click (world x/y/z). Info / naming use the current scene as viewpoint (sceneId).',
        emptyMessage: 'No hotspots on this tour yet.',
        addButtonLabel: 'Add hotspot',
        createTabs: DEV_HOTSPOT_TABS,
      };
    default:
      return {
        title: 'Hotspots',
        description:
          'Manage hotspots on this scene — nav, naming opportunity, and info.',
        manageHint: 'Move, edit, or delete existing hotspots on this scene.',
        createHint:
          'Add nav, naming opportunity, or info hotspots from a panorama click.',
        emptyMessage: 'No hotspots on this scene yet.',
        addButtonLabel: 'Add hotspot',
        createTabs: DEV_HOTSPOT_TABS,
      };
  }
}
