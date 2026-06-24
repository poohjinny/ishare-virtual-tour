/** Shared copy for locations menu + nav preview naming blocks. */
export const TOUR_DIRECTORY_PANEL_TITLE = 'Explore tour';

export const TOUR_DIRECTORY_SEARCH_PANEL_TITLE = 'Search';

export const TOUR_DIRECTORY_SECTION_LOCATIONS = 'Locations';

export const TOUR_DIRECTORY_SECTION_NAMING = 'Naming opportunities';

export type TourDirectoryTab = 'all' | 'locations' | 'naming';

export const TOUR_DIRECTORY_TABS: { id: TourDirectoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'locations', label: 'Locations' },
  { id: 'naming', label: 'Naming opportunities' },
];

export const TOUR_DIRECTORY_TAB_ORDER: TourDirectoryTab[] =
  TOUR_DIRECTORY_TABS.map((tab) => tab.id);

export const TOUR_DIRECTORY_SEARCH_PLACEHOLDER = 'Explore by name…';

export const TOUR_DIRECTORY_EMPTY_LOCATIONS = 'No locations in this tour.';

export const TOUR_DIRECTORY_EMPTY_NAMING =
  'No naming opportunities in this tour.';

export const TOUR_DIRECTORY_EMPTY_NAMING_PRICE =
  'No naming opportunities match this price range.';

export const TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL = 'Price range';

export const TOUR_DIRECTORY_EMPTY_SEARCH =
  'No locations or naming opportunities match your search.';
