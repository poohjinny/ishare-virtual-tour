import { cn } from '../../lib/cn';
import { materialSymbolTabClassName } from './materialSymbolClasses';

/** Tablist/tab hooks query these attributes (not Tailwind class strings). */
export const SEGMENTED_TAB_ATTR = 'data-segmented-tab';
export const SEGMENTED_TAB_ACTIVE_ATTR = 'data-active';

export const segmentedTabActiveSelector = `[${SEGMENTED_TAB_ATTR}][${SEGMENTED_TAB_ACTIVE_ATTR}="true"]`;
export const segmentedTabSelector = `[${SEGMENTED_TAB_ATTR}]`;

/** @deprecated HTML-marker era — React uses Tailwind + data attributes. */
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

export const segmentedTabsListClassName = cn(
  'relative box-border flex items-stretch gap-1 rounded-full border border-[color:var(--ishare-border)] bg-white/55 p-1',
);

export const segmentedTabsIndicatorClassName = cn(
  'pointer-events-none absolute top-1 bottom-1 left-0 z-0 rounded-full bg-white/95 shadow-[0_1px_4px_rgba(15,23,42,0.1)]',
);

export function segmentedTabButtonClassName(active: boolean): string {
  return cn(
    'relative z-[1] inline-flex min-h-8 min-w-0 flex-1 cursor-pointer appearance-none items-center justify-center gap-1.5 rounded-full border-none bg-transparent px-3 text-center font-[inherit] text-sm font-semibold leading-[1.2] whitespace-nowrap text-muted transition-[background,color,box-shadow] duration-150 [-webkit-tap-highlight-color:transparent]',
    'data-[active=false]:hover:text-foreground data-[active=false]:hover:bg-white/45',
    'disabled:cursor-not-allowed disabled:opacity-50',
    active && 'text-foreground',
  );
}

export const segmentedTabIconClassName = materialSymbolTabClassName;

export const segmentedTabsScrollableClassName = cn(
  'flex-nowrap overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_[data-segmented-tab]]:min-w-20 [&_[data-segmented-tab]]:flex-none',
);

export const segmentedTabsIndicatorReadyClassName =
  'transition-[transform,width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none';

/** Clip enter animations; avoid overflow-x-only (forces overflow-y: auto → scrollbar flash). */
export const segmentedTabPanelContentClassName = cn('overflow-hidden');

/** Single token — safe for `classList.add` / `classList.remove` retrigger. */
export const segmentedTabPanelAnimateInClassName =
  'animate-segmented-tab-panel-in';

export const segmentedTabPanelAnimateClassName = cn(
  segmentedTabPanelAnimateInClassName,
  'motion-reduce:animate-none',
);

/** Gallery ↔ list layout switch — soft vertical settle (direction via --layout-enter-y). */
export const segmentedTabLayoutPanelAnimateInClassName =
  'animate-segmented-tab-layout-in';

export const segmentedTabLayoutPanelAnimateClassName = cn(
  segmentedTabLayoutPanelAnimateInClassName,
  'motion-reduce:animate-none',
);
