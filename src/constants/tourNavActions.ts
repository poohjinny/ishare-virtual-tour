/** Top-right FAB dock — shared aria-label + hover tooltip copy. */

export type ExploreDirectoryLayout = 'gallery' | 'list';

export const TOUR_NAV_ACTION_EXPLORE = 'Explore tour';

export const TOUR_NAV_ACTION_CONTROLS = 'Viewer controls';

export const TOUR_NAV_ACTION_HELP = 'Help';

export const TOUR_NAV_ACTION_MORE = 'More options';

export function tourNavExploreLayoutActionLabel(
  layout: ExploreDirectoryLayout,
): string {
  return layout === 'gallery' ?
      'Switch to list view'
    : 'Switch to gallery view';
}

export const TOUR_NAV_ACTION_SEARCH_OPEN = 'Search';

export const TOUR_NAV_ACTION_SEARCH_CLOSE = 'Close search';

export const TOUR_NAV_HISTORY_BACK = 'Previous view';

export const TOUR_NAV_HISTORY_FORWARD = 'Next view';

/** Mirror label for screen readers (visual tooltip via IconTooltip / data-ishare-tooltip). */
export function tourNavIconButtonA11y(label: string): { 'aria-label': string } {
  return { 'aria-label': label };
}
