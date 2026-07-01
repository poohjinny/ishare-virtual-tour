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

export type ExploreSortFieldId =
  | 'name'
  | 'naming-count'
  | 'location'
  | 'price'
  | 'status';

export type ExploreSortDirection = 'asc' | 'desc';

export interface ExploreDirectorySortField {
  id: ExploreSortFieldId;
  label: string;
  group: ExploreDirectorySortGroup;
  asc: ExploreDirectorySort;
  desc?: ExploreDirectorySort;
  defaultDirection: ExploreSortDirection;
}

export interface ExploreDirectorySortGroupConfig {
  id: ExploreDirectorySortGroup;
  label: string;
  fields: ExploreDirectorySortField[];
}

/** @deprecated Flat asc/desc rows — use {@link ExploreDirectorySortField}. */
export interface ExploreDirectorySortOption {
  id: ExploreDirectorySort;
  label: string;
  group: ExploreDirectorySortGroup;
}

export const EXPLORE_DIRECTORY_SORT_GROUP_LABELS: Record<
  ExploreDirectorySortGroup,
  string
> = {
  locations: TOUR_DIRECTORY_SECTION_LOCATIONS,
  naming: TOUR_DIRECTORY_SECTION_NAMING,
};

export const EXPLORE_DIRECTORY_SORT_FIELDS: ExploreDirectorySortField[] = [
  {
    id: 'name',
    label: 'Name',
    group: 'locations',
    asc: 'name-asc',
    desc: 'name-desc',
    defaultDirection: 'asc',
  },
  {
    id: 'naming-count',
    label: 'Naming opportunities',
    group: 'locations',
    asc: 'naming-count-asc',
    desc: 'naming-count-desc',
    defaultDirection: 'desc',
  },
  {
    id: 'name',
    label: 'Name',
    group: 'naming',
    asc: 'name-asc',
    desc: 'name-desc',
    defaultDirection: 'asc',
  },
  {
    id: 'location',
    label: 'Location',
    group: 'naming',
    asc: 'location-asc',
    desc: 'location-desc',
    defaultDirection: 'asc',
  },
  {
    id: 'price',
    label: 'Price',
    group: 'naming',
    asc: 'price-asc',
    desc: 'price-desc',
    defaultDirection: 'asc',
  },
  {
    id: 'status',
    label: 'Status',
    group: 'naming',
    asc: 'status-asc',
    defaultDirection: 'asc',
  },
];

/** @deprecated Use {@link EXPLORE_DIRECTORY_SORT_FIELDS}. */
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

export function exploreSortFieldsForGroup(
  group: ExploreDirectorySortGroup,
): ExploreDirectorySortField[] {
  return EXPLORE_DIRECTORY_SORT_FIELDS.filter((field) => field.group === group);
}

export function resolveExploreSortField(
  sort: ExploreDirectorySort,
  group: ExploreDirectorySortGroup,
): ExploreDirectorySortField | undefined {
  return exploreSortFieldsForGroup(group).find(
    (field) => field.asc === sort || field.desc === sort,
  );
}

export function resolveExploreSortDirection(
  sort: ExploreDirectorySort,
  field: ExploreDirectorySortField,
): ExploreSortDirection {
  return field.desc === sort ? 'desc' : 'asc';
}

export function exploreSortIdForField(
  field: ExploreDirectorySortField,
  direction: ExploreSortDirection,
): ExploreDirectorySort {
  if (direction === 'desc' && field.desc) return field.desc;
  return field.asc;
}

export function flipExploreSortDirection(
  sort: ExploreDirectorySort,
  field: ExploreDirectorySortField,
): ExploreDirectorySort {
  if (!field.desc) return field.asc;
  const direction = resolveExploreSortDirection(sort, field);
  return exploreSortIdForField(field, direction === 'asc' ? 'desc' : 'asc');
}

export function exploreSortDirectionLabel(
  field: ExploreDirectorySortField,
  direction: ExploreSortDirection,
): string {
  switch (field.id) {
    case 'name':
      return direction === 'asc' ? 'A–Z' : 'Z–A';
    case 'naming-count':
      return direction === 'desc' ? 'Most' : 'Least';
    case 'location':
      return direction === 'asc' ? 'A–Z' : 'Z–A';
    case 'price':
      return direction === 'asc' ? 'Low–High' : 'High–Low';
    case 'status':
      return 'Default order';
    default:
      return direction === 'asc' ? 'Ascending' : 'Descending';
  }
}

export function exploreSortDirectionToggleLabel(
  field: ExploreDirectorySortField,
  direction: ExploreSortDirection,
): string {
  if (!field.desc) return field.label;
  const flipped = direction === 'asc' ? 'desc' : 'asc';
  return `Sort ${field.label.toLowerCase()} · ${exploreSortDirectionLabel(field, flipped)}`;
}

/** Hover tooltip — current direction and the option a click will switch to. */
export function exploreSortDirectionToggleTooltip(
  field: ExploreDirectorySortField,
  direction: ExploreSortDirection,
): string {
  const current = exploreSortDirectionLabel(field, direction);
  if (!field.desc) return `${field.label}: ${current}`;
  const flipped = direction === 'asc' ? 'desc' : 'asc';
  const next = exploreSortDirectionLabel(field, flipped);
  return `${field.label}: ${current}. Switch to ${next}.`;
}

export function exploreDirectorySortOptionsForContext(
  context: ExploreDirectorySortContext,
): ExploreDirectorySortOption[] {
  return exploreDirectorySortGroupsForContext(context).flatMap((group) =>
    group.fields.flatMap((field) => {
      const options: ExploreDirectorySortOption[] = [
        {
          id: field.asc,
          label: `${field.label} · ${exploreSortDirectionLabel(field, 'asc')}`,
          group: field.group,
        },
      ];
      if (field.desc) {
        options.push({
          id: field.desc,
          label: `${field.label} · ${exploreSortDirectionLabel(field, 'desc')}`,
          group: field.group,
        });
      }
      return options;
    }),
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
    fields: exploreSortFieldsForGroup(group),
  }));
}

function sortOptionLabel(sort: ExploreDirectorySort): string {
  for (const group of EXPLORE_DIRECTORY_SORT_GROUP_ORDER) {
    const field = resolveExploreSortField(sort, group);
    if (!field) continue;
    const direction = resolveExploreSortDirection(sort, field);
    return `${field.label} · ${exploreSortDirectionLabel(field, direction)}`;
  }
  return 'Sort';
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
