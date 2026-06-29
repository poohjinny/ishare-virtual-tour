import type { TourDirectoryTab } from '../constants/tourDirectory';
import {
  TOUR_DIRECTORY_SECTION_LOCATIONS,
  TOUR_DIRECTORY_SECTION_NAMING,
} from '../constants/tourDirectory';

export const EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS: Record<
  TourDirectoryTab,
  string
> = { all: 'layers', locations: 'location_on', naming: 'favorite' };

export type ExploreDirectorySort =
  | 'name-asc'
  | 'name-desc'
  | 'naming-count-desc'
  | 'naming-count-asc'
  | 'location-asc'
  | 'location-desc'
  | 'status-asc'
  | 'price-asc'
  | 'price-desc';

export type ExploreLocationsSort =
  | 'name-asc'
  | 'name-desc'
  | 'naming-count-desc'
  | 'naming-count-asc';

export type ExploreDirectorySortGroup = 'locations' | 'naming';

export const EXPLORE_LOCATIONS_SORT_DEFAULT: ExploreLocationsSort = 'name-asc';
export const EXPLORE_NAMING_SORT_DEFAULT: ExploreDirectorySort = 'status-asc';

/** @deprecated Use {@link EXPLORE_LOCATIONS_SORT_DEFAULT}. */
export const EXPLORE_DIRECTORY_SORT_DEFAULT: ExploreDirectorySort =
  EXPLORE_LOCATIONS_SORT_DEFAULT;

export function isExploreNameSort(
  sort: ExploreDirectorySort,
): sort is ExploreLocationsSort {
  return (
    sort === 'name-asc' ||
    sort === 'name-desc' ||
    sort === 'naming-count-desc' ||
    sort === 'naming-count-asc'
  );
}

export function normalizeLocationsSort(
  sort: ExploreDirectorySort,
): ExploreLocationsSort {
  if (sort === 'name-desc') return 'name-desc';
  if (sort === 'naming-count-desc') return 'naming-count-desc';
  if (sort === 'naming-count-asc') return 'naming-count-asc';
  return 'name-asc';
}

export type ExploreDirectorySortContext = 'locations' | 'naming' | 'mixed';

export interface ExploreDirectorySortOption {
  id: ExploreDirectorySort;
  label: string;
  group: ExploreDirectorySortGroup;
}

export interface ExploreDirectorySortGroupConfig {
  id: ExploreDirectorySortGroup;
  label: string;
  options: ExploreDirectorySortOption[];
}

export const EXPLORE_DIRECTORY_SORT_GROUP_LABELS: Record<
  ExploreDirectorySortGroup,
  string
> = {
  locations: TOUR_DIRECTORY_SECTION_LOCATIONS,
  naming: TOUR_DIRECTORY_SECTION_NAMING,
};

export const EXPLORE_DIRECTORY_SORT_OPTIONS: ExploreDirectorySortOption[] = [
  { id: 'name-asc', label: 'Name A–Z', group: 'locations' },
  { id: 'name-desc', label: 'Name Z–A', group: 'locations' },
  {
    id: 'naming-count-desc',
    label: 'Most naming opportunities',
    group: 'locations',
  },
  {
    id: 'naming-count-asc',
    label: 'Fewest naming opportunities',
    group: 'locations',
  },
  { id: 'name-asc', label: 'Name A–Z', group: 'naming' },
  { id: 'name-desc', label: 'Name Z–A', group: 'naming' },
  { id: 'location-asc', label: 'Location A–Z', group: 'naming' },
  { id: 'location-desc', label: 'Location Z–A', group: 'naming' },
  { id: 'price-asc', label: 'Price low to high', group: 'naming' },
  { id: 'price-desc', label: 'Price high to low', group: 'naming' },
  { id: 'status-asc', label: 'Status', group: 'naming' },
];

export const EXPLORE_DIRECTORY_SORT_MATERIAL_ICONS: Record<
  ExploreDirectorySort,
  { name: string; flip?: 'vertical' | 'horizontal' }
> = {
  'name-asc': { name: 'sort_by_alpha' },
  'name-desc': { name: 'sort_by_alpha', flip: 'vertical' },
  'naming-count-desc': { name: 'favorite' },
  'naming-count-asc': { name: 'favorite', flip: 'vertical' },
  'location-asc': { name: 'location_on' },
  'location-desc': { name: 'location_on', flip: 'vertical' },
  'status-asc': { name: 'low_priority' },
  'price-asc': { name: 'arrow_upward' },
  'price-desc': { name: 'arrow_downward' },
};

const EXPLORE_DIRECTORY_SORT_GROUP_ORDER: ExploreDirectorySortGroup[] = [
  'locations',
  'naming',
];

export function exploreDirectorySortOptionsForContext(
  context: ExploreDirectorySortContext,
): ExploreDirectorySortOption[] {
  return exploreDirectorySortGroupsForContext(context).flatMap(
    (group) => group.options,
  );
}

export function exploreDirectorySortGroupsForContext(
  context: ExploreDirectorySortContext,
): ExploreDirectorySortGroupConfig[] {
  const groups: ExploreDirectorySortGroup[] =
    context === 'mixed' ?
      [...EXPLORE_DIRECTORY_SORT_GROUP_ORDER]
    : [context === 'locations' ? 'locations' : 'naming'];

  return groups.map((group) => ({
    id: group,
    label: EXPLORE_DIRECTORY_SORT_GROUP_LABELS[group],
    options: EXPLORE_DIRECTORY_SORT_OPTIONS.filter(
      (option) => option.group === group,
    ),
  }));
}

function sortOptionLabel(sort: ExploreDirectorySort): string {
  const match = EXPLORE_DIRECTORY_SORT_OPTIONS.find(
    (option) => option.id === sort,
  );
  return match?.label ?? 'Sort';
}

export function tourNavExploreRefineActionLabel(input: {
  context: ExploreDirectorySortContext;
  locationsSort: ExploreDirectorySort;
  namingSort: ExploreDirectorySort;
  namingPriceFilterActive?: boolean;
}): string {
  const {
    context,
    locationsSort,
    namingSort,
    namingPriceFilterActive = false,
  } = input;

  const filterNote = namingPriceFilterActive ? ' · Price filtered' : '';

  if (context === 'locations') {
    return `Refine locations: ${sortOptionLabel(locationsSort)}`;
  }

  if (context === 'naming') {
    return `Refine naming: ${sortOptionLabel(namingSort)}${filterNote}`;
  }

  return `Refine · Locations: ${sortOptionLabel(locationsSort)} · Naming: ${sortOptionLabel(namingSort)}${filterNote}`;
}

/** @deprecated Use {@link tourNavExploreRefineActionLabel}. */
export function tourNavExploreSortActionLabel(input: {
  context: ExploreDirectorySortContext;
  locationsSort: ExploreDirectorySort;
  namingSort: ExploreDirectorySort;
}): string {
  return tourNavExploreRefineActionLabel(input);
}
