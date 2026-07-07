/** Shared copy for locations menu + nav preview naming blocks. */
export const TOUR_DIRECTORY_PANEL_TITLE = 'Explore tour';

export const TOUR_DIRECTORY_SEARCH_PANEL_TITLE = 'Search';

export const TOUR_DIRECTORY_SECTION_LOCATIONS = 'Locations';

export const TOUR_DIRECTORY_SECTION_NAMING = 'Naming opportunities';

/** Header for scenes not reachable from the tour start via nav hotspots. */
export const TOUR_DIRECTORY_GROUP_OTHER = 'More locations';

export type TourDirectoryTab = 'all' | 'locations' | 'naming';

export const TOUR_DIRECTORY_TABS: { id: TourDirectoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'locations', label: 'Locations' },
  { id: 'naming', label: 'Naming opportunities' },
];

export const TOUR_DIRECTORY_TAB_ORDER: TourDirectoryTab[] =
  TOUR_DIRECTORY_TABS.map((tab) => tab.id);

export const TOUR_DIRECTORY_SEARCH_PLACEHOLDER = 'Explore by name…';

/** Explore panel body lead — collapsed after this many lines when overflow. */
export const EXPLORE_DIRECTORY_LEAD_CLAMP_LINES = 3;

export const TOUR_DIRECTORY_LEAD_SHOW_MORE = 'Show more';

export const TOUR_DIRECTORY_LEAD_SHOW_LESS = 'Show less';

export const TOUR_DIRECTORY_EMPTY_LOCATIONS = 'No locations in this tour.';

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
  'No locations or naming opportunities match your search.';

/** Explore gallery card — hover CTA below description. */
export const EXPLORE_GALLERY_VISIT_LABEL = 'Visit';

export const TOUR_DIRECTORY_SCENE_DETAIL_BACK = 'Back to locations';

export const TOUR_DIRECTORY_SCENE_DETAIL_VISIT = 'Go to location';

/** Explore list/gallery info — opens in-panel location detail. */
export const TOUR_DIRECTORY_SCENE_INFO_TOOLTIP = 'Location details';

export function tourDirectorySceneInfoAriaLabel(sceneTitle: string): string {
  return `Location details for ${sceneTitle}`;
}

/** Pinned firstScene row — explains sort order in Explore locations. */
export const TOUR_DIRECTORY_TOUR_START_TOOLTIP =
  'Tour start · stays at top when sorting';
