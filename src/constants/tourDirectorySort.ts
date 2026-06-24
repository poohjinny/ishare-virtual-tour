import type { TourDirectoryTab } from '../constants/tourDirectory';

export const EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS: Record<
  TourDirectoryTab,
  string
> = { all: 'layers', locations: 'location_on', naming: 'favorite' };

export type ExploreDirectorySort =
  | 'tour-order'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc';

export const EXPLORE_DIRECTORY_SORT_DEFAULT: ExploreDirectorySort =
  'tour-order';

export type ExploreDirectorySortContext = 'locations' | 'naming' | 'mixed';

export interface ExploreDirectorySortOption {
  id: ExploreDirectorySort;
  label: string;
  namingOnly?: boolean;
}

export const EXPLORE_DIRECTORY_SORT_OPTIONS: ExploreDirectorySortOption[] = [
  { id: 'tour-order', label: 'Tour order' },
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'name-desc', label: 'Name Z–A' },
  { id: 'price-asc', label: 'Price low to high', namingOnly: true },
  { id: 'price-desc', label: 'Price high to low', namingOnly: true },
];

export const EXPLORE_DIRECTORY_SORT_MATERIAL_ICONS: Record<
  ExploreDirectorySort,
  { name: string; flip?: 'vertical' | 'horizontal' }
> = {
  'tour-order': { name: 'format_list_bulleted' },
  'name-asc': { name: 'sort_by_alpha' },
  'name-desc': { name: 'sort_by_alpha', flip: 'vertical' },
  'price-asc': { name: 'arrow_upward' },
  'price-desc': { name: 'arrow_downward' },
};

export function exploreDirectorySortOptionsForContext(
  context: ExploreDirectorySortContext,
): ExploreDirectorySortOption[] {
  const showNaming = context === 'naming' || context === 'mixed';

  return EXPLORE_DIRECTORY_SORT_OPTIONS.filter(
    (option) => !option.namingOnly || showNaming,
  );
}

export function tourNavExploreSortActionLabel(
  sort: ExploreDirectorySort,
): string {
  const match = EXPLORE_DIRECTORY_SORT_OPTIONS.find(
    (option) => option.id === sort,
  );
  return match ? `Sort: ${match.label}` : 'Sort';
}
