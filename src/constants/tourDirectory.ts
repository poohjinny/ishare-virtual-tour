/** Shared copy for locations menu + nav preview naming blocks. */
export const TOUR_DIRECTORY_PANEL_TITLE = 'Explore tour';

export const TOUR_DIRECTORY_SEARCH_PANEL_TITLE = 'Search';

export const TOUR_DIRECTORY_SECTION_LOCATIONS = 'Places';

export const TOUR_DIRECTORY_SECTION_NAMING = 'Naming opportunities';

/** Pinned section header highlighting the viewer's current scene. */
export const TOUR_DIRECTORY_CURRENT_LOCATION_LABEL = 'You are here';

/** Pinned section header for the tour's root/overview scene. */
export const TOUR_DIRECTORY_OVERVIEW_LABEL = 'Tour start';

/** Header for scenes not reachable from the tour start via nav hotspots. */
export const TOUR_DIRECTORY_GROUP_OTHER = 'More places';

export type TourDirectoryTab = 'all' | 'locations' | 'naming';

export const TOUR_DIRECTORY_TABS: {
  id: TourDirectoryTab;
  label: string;
  /** Compact label for narrow (mobile) tab bars where the full label overflows. */
  shortLabel?: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'locations', label: 'Places' },
  { id: 'naming', label: 'Naming opportunities', shortLabel: 'Naming' },
];

export const TOUR_DIRECTORY_TAB_ORDER: TourDirectoryTab[] =
  TOUR_DIRECTORY_TABS.map((tab) => tab.id);

export const TOUR_DIRECTORY_SEARCH_PLACEHOLDER = 'Explore by name…';

/** Explore panel body lead — collapsed after this many lines when overflow. */
export const EXPLORE_DIRECTORY_LEAD_CLAMP_LINES = 3;

export const TOUR_DIRECTORY_LEAD_SHOW_MORE = 'Show more';

export const TOUR_DIRECTORY_LEAD_SHOW_LESS = 'Show less';

export const TOUR_DIRECTORY_EMPTY_LOCATIONS = 'No places in this tour.';

export const TOUR_DIRECTORY_EMPTY_NAMING =
  'Naming opportunities let donors create a lasting impact through meaningful gifts. New opportunities may be added to this tour soon—please check back.';

export const TOUR_DIRECTORY_EMPTY_NAMING_PRICE =
  'No naming opportunities match this price range.';

export const TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL = 'Price';

export const EXPLORE_REFINE_PANEL_LABEL = 'Refine';
export const EXPLORE_REFINE_SUBSECTION_SORT = 'Sort';
export const EXPLORE_REFINE_SUBSECTION_FILTER = 'Filter';
export const EXPLORE_REFINE_SUBSECTION_SORT_ICON = 'sort';
export const EXPLORE_REFINE_SUBSECTION_FILTER_ICON = 'filter_list';

export const TOUR_DIRECTORY_EMPTY_SEARCH =
  'No places or naming opportunities match your search.';

/** Explore gallery card — hover CTA below description. */
export const EXPLORE_GALLERY_VISIT_LABEL = 'Visit';

export const EXPLORE_GALLERY_LOCATION_DETAILS_LABEL = 'Details';

export const EXPLORE_GALLERY_NAMING_VIEW_LABEL = 'View opportunity';

/** Collapsible group header — place count meta. */
export function exploreLocationGroupCountLabel(count: number): string {
  const n = Math.max(0, Math.round(count));
  return n === 1 ? '1 place' : `${n} places`;
}

export const TOUR_DIRECTORY_SCENE_DETAIL_BACK = 'Back to places';

/** Detail panel primary CTA — room for the place name (unlike compact gallery cards). */
export function tourDirectorySceneDetailVisitLabel(sceneTitle: string): string {
  const name = sceneTitle.trim();
  return name ? `Visit ${name}` : 'Visit';
}

/** Explore list/gallery info — opens in-panel place detail. */
export const TOUR_DIRECTORY_SCENE_INFO_TOOLTIP = 'Place details';

export function tourDirectorySceneInfoAriaLabel(sceneTitle: string): string {
  return `Place details for ${sceneTitle}`;
}
