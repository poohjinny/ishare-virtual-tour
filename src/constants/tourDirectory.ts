/** Shared copy for locations menu + nav preview naming blocks. */
export const TOUR_DIRECTORY_PANEL_TITLE = 'Explore tour';

export const TOUR_DIRECTORY_SEARCH_PANEL_TITLE = 'Search';

export const TOUR_DIRECTORY_SECTION_LOCATIONS = 'Locations';

export const TOUR_DIRECTORY_SECTION_NAMING = 'Naming opportunities';

export type TourDirectoryTab = 'all' | 'locations' | 'naming';

export const TOUR_DIRECTORY_TABS: { id: TourDirectoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'locations', label: 'Locations' },
  { id: 'naming', label: 'Naming' },
];

export const TOUR_DIRECTORY_SEARCH_PLACEHOLDER =
  'Search locations and naming opportunities…';
