export const SEGMENTED_TABS_LIST_CLASS = 'ishare-segmented-tabs';
export const SEGMENTED_TAB_CLASS = 'ishare-segmented-tab';
export const SEGMENTED_TAB_ACTIVE_CLASS = 'ishare-segmented-tab--active';

export function segmentedTabClassName(
  active: boolean,
  extraClassName = '',
): string {
  return [
    SEGMENTED_TAB_CLASS,
    active ? SEGMENTED_TAB_ACTIVE_CLASS : '',
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ');
}
