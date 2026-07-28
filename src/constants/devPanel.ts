export type DevPanelTab =
  | 'scene'
  | 'scenes'
  | 'naming'
  | 'tour'
  | 'client'
  | 'debug';

/** Order: current Scene → catalogs → Tour/Client settings → Debug. */
export const DEV_PANEL_TABS: { id: DevPanelTab; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'naming', label: 'Namings' },
  { id: 'tour', label: 'Tours' },
  { id: 'client', label: 'Clients' },
  { id: 'debug', label: 'Debug' },
];

export type DevCatalogTourVisibility = 'public' | 'unlisted' | 'internal';

export const DEV_CATALOG_VISIBILITY_OPTIONS: {
  value: DevCatalogTourVisibility;
  label: string;
}[] = [
  { value: 'public', label: 'Public (home gallery)' },
  { value: 'unlisted', label: 'Unlisted (direct link only)' },
  { value: 'internal', label: 'Internal (hidden from routing)' },
];

/** Scene discoverability — same tiers as catalog tours. */
export const DEV_SCENE_VISIBILITY_OPTIONS: {
  value: DevCatalogTourVisibility;
  label: string;
}[] = [
  { value: 'public', label: 'Public (Explore)' },
  {
    value: 'unlisted',
    label: 'Unlisted (link only — hidden from Explore & nav)',
  },
  { value: 'internal', label: 'Internal (?dev=1 only)' },
];

export type DevCrudModeTab = 'manage' | 'create';

export const DEV_CRUD_MODE_TABS: { id: DevCrudModeTab; label: string }[] = [
  { id: 'manage', label: 'Manage' },
  { id: 'create', label: 'Create' },
];
