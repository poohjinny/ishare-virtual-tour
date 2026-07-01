export type DevPanelTab = 'scene' | 'client' | 'tour' | 'debug';

export const DEV_PANEL_TABS: { id: DevPanelTab; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'tour', label: 'Tour' },
  { id: 'client', label: 'Client' },
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

export type DevCrudModeTab = 'manage' | 'create';

export const DEV_CRUD_MODE_TABS: { id: DevCrudModeTab; label: string }[] = [
  { id: 'manage', label: 'Manage' },
  { id: 'create', label: 'Create' },
];
