import { cn } from '../lib/cn';

/** Marker so dock outside-click helpers can ignore this menu. */
export const ANCHORED_SHARE_MENU_ATTR = 'data-anchored-share-menu';
export const anchoredShareMenuAttr = ANCHORED_SHARE_MENU_ATTR;

/** Match `--animate-explore-sort-menu-out` duration in globals.css. */
export const ANCHORED_SHARE_MENU_EXIT_MS = 140;

const anchoredShareMenuShellClassName = cn(
  'fixed z-[var(--tour-chrome-menu-z-index)] box-border',
  'border-none bg-[rgba(0,0,0,0.72)]',
  'shadow-[var(--ishare-glass-dock-shadow)]',
);

/** Fallback when Share is not on a hero — compact menu under the control. */
export const anchoredShareMenuDropdownClassName = cn(
  anchoredShareMenuShellClassName,
  'w-[min(22rem,calc(100vw-1.5rem))] rounded-xl px-5 py-4',
);

/** Cover the anchored panel hero — same box and top corner radius. */
export const anchoredShareMenuHeroOverlayClassName = cn(
  anchoredShareMenuShellClassName,
  'flex flex-col overflow-hidden px-6 py-5',
  'rounded-t-[calc(var(--ishare-panel-radius,1.125rem)-1px)] rounded-b-none',
);

export const anchoredShareMenuInClassName = cn(
  'animate-explore-sort-menu-in motion-reduce:animate-none',
);

export const anchoredShareMenuOutClassName = cn(
  'pointer-events-none animate-explore-sort-menu-out motion-reduce:animate-none',
);

export const ANCHOR_SHARE_HERO_OVERLAY_OPEN_ATTR =
  'data-anchored-share-overlay-open';

export const anchoredShareMenuLeadClassName = cn(
  'm-0 mb-2.5 min-w-0 pe-9 font-body text-sm leading-[1.45] text-white/75',
);

export const anchoredShareMenuHeroLeadClassName = cn(
  'm-0 mb-3 w-full pe-0 text-center font-body text-sm leading-[1.5] text-white/80',
);

/** Transparent chrome close — pinned to menu top-right (matches hero-actions inset). */
export const anchoredShareMenuCloseClassName = cn(
  'absolute top-2.5 right-2.5 z-[1] inline-flex size-[var(--ishare-panel-header-btn-size,2rem)]',
  'cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-white',
  'transition-[background,color] duration-150',
  'hover:bg-white/12 focus-visible:bg-white/12 focus-visible:outline-none',
);

export const anchoredShareMenuCloseIconClassName = cn(
  'shrink-0 text-white [&]:text-white',
);

export const anchoredShareMenuBodyClassName = cn(
  'flex min-h-0 flex-1 flex-col justify-center gap-1',
);

/** Hero overlay content column — lead + grid share one width. */
export const anchoredShareMenuHeroBodyClassName = cn(
  anchoredShareMenuBodyClassName,
  'mx-auto w-full max-w-[24rem] self-center',
);

/** Two-row channel grid. */
export const anchoredShareMenuGridClassName = cn(
  'm-0 mx-auto grid list-none grid-cols-4 justify-items-center gap-x-1 gap-y-2.5 p-0',
);

export const anchoredShareMenuHeroGridClassName = cn(
  'm-0 grid w-full list-none grid-cols-4 justify-items-center gap-x-1 gap-y-2.5 p-0',
);

export const anchoredShareMenuItemClassName = cn(
  'flex min-w-0 w-full justify-center',
);

export const anchoredShareMenuItemLabelClassName = cn(
  'max-w-full truncate text-center font-display text-[0.6875rem] font-semibold leading-[1.2] text-white/90',
);
