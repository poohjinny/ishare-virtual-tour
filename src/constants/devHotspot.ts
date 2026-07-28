import {
  NAMING_OPPORTUNITY_STATUS_ORDER,
  namingOpportunityStatusConfig,
} from '../data/namingOpportunityStatus';
import type { NamingDonorKind, NamingOpportunityStatus } from '../types/tour';

export const DEV_NAMING_STATUS_OPTIONS: {
  value: NamingOpportunityStatus;
  label: string;
}[] = NAMING_OPPORTUNITY_STATUS_ORDER.map((value) => ({
  value,
  label: namingOpportunityStatusConfig(value).label,
}));

/** Manage-list filter — All plus each naming status. */
export type DevNamingManageFilter = 'all' | NamingOpportunityStatus;

export const DEV_NAMING_MANAGE_FILTER_TABS: {
  id: DevNamingManageFilter;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  ...NAMING_OPPORTUNITY_STATUS_ORDER.map((value) => ({
    id: value,
    label: namingOpportunityStatusConfig(value).label,
  })),
];

export const DEV_NAMING_DONOR_KIND_OPTIONS: {
  value: NamingDonorKind;
  label: string;
}[] = [
  { value: 'organization', label: 'Organization' },
  { value: 'person', label: 'Person' },
];

export type DevHotspotTab = 'nav' | 'naming' | 'info' | 'overview';

/** Manage-list filter — includes All plus create-type buckets. */
export type DevHotspotManageFilter = 'all' | 'nav' | 'naming' | 'info';

export const DEV_INFO_DISPLAY_OPTIONS: {
  value: 'modal' | 'anchored';
  label: string;
}[] = [
  { value: 'anchored', label: 'Anchored panel on panorama' },
  { value: 'modal', label: 'Modal overlay' },
];

export const DEV_HOTSPOT_TABS: { id: DevHotspotTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'nav', label: 'Navigation' },
  { id: 'naming', label: 'Naming' },
  { id: 'info', label: 'Info' },
];

/** model3d — no place-overview pins. */
export const DEV_HOTSPOT_TABS_MODEL3D: { id: DevHotspotTab; label: string }[] =
  DEV_HOTSPOT_TABS.filter((tab) => tab.id !== 'overview');

export const DEV_HOTSPOT_MANAGE_FILTER_TABS: {
  id: DevHotspotManageFilter;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'nav', label: 'Nav' },
  { id: 'naming', label: 'NO' },
  { id: 'info', label: 'Info' },
];

/** Which hotspot bucket the dev panel is editing. */
export type DevHotspotManageScope = 'panorama-scene' | 'model3d-tour';

export interface DevNamingCatalogSectionConfig {
  title: string;
  description: string;
  emptyMessage: string;
  addButtonLabel: string;
}

export interface DevHotspotSectionConfig {
  title: string;
  description: string;
  emptyMessage: string;
  addButtonLabel: string;
  createTabs: { id: DevHotspotTab; label: string }[];
}

export function getDevNamingCatalogSectionConfig(
  scope: DevHotspotManageScope,
): DevNamingCatalogSectionConfig {
  switch (scope) {
    case 'model3d-tour':
      return {
        title: 'Naming catalog',
        description:
          'Tour-level naming opportunities (what) — name, price, status, donor, body, video, image. Place them under Scene → Hotspots.',
        emptyMessage:
          'No naming opportunities yet. Add one, then place under Scene → Hotspots.',
        addButtonLabel: 'Add naming opportunity',
      };
    default:
      return {
        title: 'Naming catalog',
        description:
          'Tour-level naming opportunities (what) — name, price, status, donor, body, video, image. Place them under Scene → Hotspots.',
        emptyMessage:
          'No naming opportunities yet. Add one, then place under Scene → Hotspots.',
        addButtonLabel: 'Add naming opportunity',
      };
  }
}

export function getDevHotspotSectionConfig(
  scope: DevHotspotManageScope,
): DevHotspotSectionConfig {
  switch (scope) {
    case 'model3d-tour':
      return {
        title: 'Hotspots',
        description:
          'Placements on the current viewpoint — nav, naming (where), and info. Naming business fields live on the Naming tab.',
        emptyMessage: 'No hotspots on this viewpoint yet.',
        addButtonLabel: 'Add hotspot',
        createTabs: DEV_HOTSPOT_TABS_MODEL3D,
      };
    default:
      return {
        title: 'Hotspots',
        description:
          'Placements on this scene — nav, naming (where), info, and place overview. Naming business fields live on the Naming tab.',
        emptyMessage: 'No hotspots on this scene yet.',
        addButtonLabel: 'Add hotspot',
        createTabs: DEV_HOTSPOT_TABS,
      };
  }
}
