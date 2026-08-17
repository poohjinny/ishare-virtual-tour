export type DevPanelTab = 'scene' | 'scenes' | 'naming' | 'tour' | 'client';

/** DevTools placeholder when `?dev=1` is on intro / no live tour. */
export const DEV_SHELL_TOUR_ID = '__dev_shell__';

/** Primary tab strip — Debug is a header dropdown (not a tab). */
export const DEV_PANEL_PRIMARY_TABS: {
  id: DevPanelTab;
  label: string;
  /** Lead under the tab strip — what this tab is for. */
  description: string;
}[] = [
  {
    id: 'scene',
    label: 'Scene',
    description:
      'Work on the place you are viewing right now. Set the landing camera and thumbnail, replace panorama or viewpoint media, and manage hotspots (nav links, naming pins, info, place overview) that sit in this scene.',
  },
  {
    id: 'scenes',
    label: 'Scenes',
    description:
      'Build and organize every scene on this tour. Add new panoramas or viewpoints, edit titles and visibility, and reorder the Explore tour list. Group Up/Down changes list order only — not the nav-graph floor links visitors follow in the viewer.',
  },
  {
    id: 'naming',
    label: 'Namings',
    description:
      'Tour-level naming opportunity catalog — the “what” (name, price, status, donor, body, video, image). Create and edit entries here, then place them on a scene under Scene → Hotspots. Deleting a catalog entry also removes its hotspot placements.',
  },
  {
    id: 'tour',
    label: 'Tours',
    description:
      'All tours in the catalog. Create a new tour under a client (with a first scene), open one in the viewer, copy its public link, or edit title, visibility, experience, and branding. Delete permanently removes tour JSON and assets.',
  },
  {
    id: 'client',
    label: 'Clients',
    description:
      'Catalog clients shared across tours — display name, contact, and branding (logo, color, fonts). Tours can inherit this branding or override it. Create clients here first, then add tours on the Tours tab.',
  },
];

/** Header Debug dropdown copy (not a primary tab). */
export const DEV_PANEL_DEBUG_MENU = {
  label: 'Debug',
  description:
    'Local QA tools for this page. Toggle preserved URL flags without a reload, and open Tour Guide / chat / frozen UI fixtures to verify chrome and layouts while you author.',
} as const;

/** Primary tabs (for description lookup). */
export const DEV_PANEL_TABS: {
  id: DevPanelTab;
  label: string;
  description: string;
}[] = DEV_PANEL_PRIMARY_TABS;

export type DevPanelTheme = 'light' | 'dark';

/**
 * Dev panel placement:
 * - floating — inset card over the tour (legacy)
 * - overlay — full-height drawer over the tour
 * - push — full-height drawer; shrinks the tour stage
 */
export type DevPanelLayout = 'floating' | 'overlay' | 'push';

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
