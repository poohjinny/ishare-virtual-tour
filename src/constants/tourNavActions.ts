/** Top-right FAB dock — shared aria-label + hover tooltip copy. */

export function tourNavExploreActionLabel(isOpen: boolean): string {
  return isOpen ? 'Close explore tour' : 'Explore tour';
}

export const TOUR_NAV_ACTION_SEARCH_OPEN = 'Search';

export const TOUR_NAV_ACTION_SEARCH_CLOSE = 'Close search';

export function tourNavControlsActionLabel(visible: boolean): string {
  return visible ? 'Hide viewer controls' : 'Viewer controls';
}

export function tourNavHelpActionLabel(isOpen: boolean): string {
  return isOpen ? 'Close help' : 'Help';
}

/** Mirror label on `title` for hover tooltips (native + screen readers). */
export function tourNavIconButtonA11y(label: string): {
  'aria-label': string;
  title: string;
} {
  return { 'aria-label': label, title: label };
}
