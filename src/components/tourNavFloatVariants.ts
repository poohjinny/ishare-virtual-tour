import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import {
  materialSymbolCheckClassName,
  materialSymbolCompactClassName,
  materialSymbolFabClassName,
} from './ui/materialSymbolClasses';
import { PREVIEW_HERO_SKELETON_CLASS } from './ui/previewHeroSkeletonClasses';
import { segmentedTabsTrackChromeClassName } from './ui/segmentedTabsClasses';

const tourNavGlassShadow = cn(
  'shadow-[0_10px_28px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)]',
);

const tourNavGlassBackdrop = cn('backdrop-blur-[6px] backdrop-saturate-[120%]');

/** Shared idle glass surface for nav dock circle buttons. */
const tourNavDockBtnSurfaceClassName = cn(
  'bg-white/[0.52] text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
  tourNavGlassBackdrop,
  tourNavGlassShadow,
);

/** Hover/focus on the control itself (circle buttons). */
const tourNavDockBtnHoverClassName = cn(
  'hover:bg-white/[0.78] hover:text-foreground',
  'focus-visible:bg-white/[0.78] focus-visible:text-foreground',
);

/** Scroll-into-view target for active directory items */
export const tourNavDirectoryActiveSelector =
  '[role="option"][aria-selected="true"]';

export const tourNavDirectoryActiveNamingSelector =
  '[data-tour-nav-directory-kind="naming"][role="option"][aria-selected="true"]';

export const tourNavDirectoryActiveLocationSelector =
  '[data-tour-nav-directory-kind="location"][role="option"][aria-selected="true"]';

export function scrollTourNavDirectoryToActiveItem(
  scrollRoot: HTMLElement,
  options: { preferNaming: boolean },
): void {
  const namingItem = scrollRoot.querySelector<HTMLElement>(
    tourNavDirectoryActiveNamingSelector,
  );
  const locationItem = scrollRoot.querySelector<HTMLElement>(
    tourNavDirectoryActiveLocationSelector,
  );

  const activeItem =
    options.preferNaming && namingItem ?
      namingItem
    : (locationItem ??
      namingItem ??
      scrollRoot.querySelector<HTMLElement>(tourNavDirectoryActiveSelector));

  activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ── Breadcrumb ── */

export const tourNavBreadcrumbClassName = cn(
  'absolute top-[var(--tour-chrome-inset-top)] z-[90]',
  'max-w-[min(680px,calc(100vw-var(--tour-chrome-inset-left)-var(--tour-chrome-inset-right)-var(--tour-chrome-top-dock-width)))]',
);

export const tourNavBreadcrumbAlignVariants = cva('', {
  variants: {
    align: {
      center: 'left-1/2 -translate-x-1/2',
      start: 'left-[var(--tour-chrome-inset-left)] translate-x-0',
    },
  },
  defaultVariants: { align: 'center' },
});

export const tourNavBreadcrumbRowVariants = cva(
  cn(
    'flex w-fit max-w-full items-center justify-center gap-2.5 opacity-100 visible translate-y-0',
    'transition-[transform,opacity,visibility] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'max-[1023px]:justify-start max-[480px]:gap-2',
  ),
  {
    variants: {
      hidden: {
        true: cn(
          'pointer-events-none opacity-0 invisible -translate-y-[calc(100%+28px)]',
          'transition-[transform,opacity,visibility] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-[0s,0s,280ms]',
        ),
        false: 'delay-[0s,0s,0s]',
      },
    },
    defaultVariants: { hidden: false },
  },
);

export const tourNavBreadcrumbBarClassName = cn(
  'flex w-fit max-w-full min-w-0 flex-[0_1_auto] items-center',
  'min-h-12 rounded-full bg-white/[0.78] px-7 py-2',
  tourNavGlassBackdrop,
  tourNavGlassShadow,
  'max-[480px]:min-h-11 max-[480px]:px-[22px] max-[480px]:py-[7px]',
);

export const tourNavHistoryBtnClassName = cn(
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-none',
  'bg-white/[0.78] p-0 text-muted',
  tourNavGlassBackdrop,
  tourNavGlassShadow,
  'transition-[background,color,transform] duration-150',
  'hover:enabled:scale-[1.03] hover:enabled:bg-white/[0.92] hover:enabled:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-45',
  'max-[480px]:size-10',
);

export const tourNavHistoryBtnIconClassName = materialSymbolCompactClassName;

export const tourNavBreadcrumbListClassName = cn(
  'm-0 flex min-w-0 list-none flex-nowrap items-center gap-0 p-0',
  'font-display text-lg font-normal leading-[1.25] tracking-[-0.01em]',
  'max-[480px]:text-md',
);

export const tourNavBreadcrumbItemClassName = cn(
  'flex min-w-0 shrink-0 items-center last:min-w-0 last:shrink',
);

export const tourNavBreadcrumbSepClassName = cn(
  'mx-3.5 shrink-0 font-normal text-muted max-[480px]:mx-[11px]',
);

export const tourNavBreadcrumbLinkClassName = cn(
  'inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0',
  'font-[inherit] whitespace-nowrap text-muted transition-colors duration-150',
  'hover:enabled:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const tourNavBreadcrumbRootIconClassName = cn(
  materialSymbolCompactClassName,
  'transition-colors duration-150',
);

export const tourNavBreadcrumbCurrentClassName = cn(
  'inline-flex min-w-0 max-w-full items-center gap-[15px] font-semibold text-foreground',
);

export const tourNavBreadcrumbCurrentLabelClassName = cn(
  'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap',
);

export const tourNavBreadcrumbPulseDotClassName = cn(
  'relative ml-0 size-2.5 shrink-0 rounded-full bg-primary',
  'shadow-[0_0_0_0_rgba(var(--ishare-primary-rgb),0.55)]',
  'animate-tour-nav-dot-glow motion-reduce:animate-none',
  'max-[480px]:size-[9px]',
  'before:absolute before:-inset-0.5 before:rounded-full',
  'before:border-2 before:border-[rgba(var(--ishare-primary-rgb),0.75)]',
  'before:bg-[rgba(var(--ishare-primary-rgb),0.25)]',
  'before:content-[""] before:animate-tour-nav-dot-pulse motion-reduce:before:animate-none',
  'after:absolute after:-inset-0.5 after:rounded-full',
  'after:border-2 after:border-[rgba(var(--ishare-primary-rgb),0.5)]',
  'after:content-[""] after:animate-tour-nav-dot-pulse after:[animation-delay:1.1s]',
  'motion-reduce:after:animate-none',
);

/* ── Actions root ── */

export const tourNavActionsRootClassName = cn(
  'absolute top-[var(--tour-chrome-inset-top)] right-[var(--tour-chrome-inset-right)] z-[90] flex flex-col-reverse items-end',
  '[--tour-directory-space:16px] [--tour-directory-divider-space:24px]',
);

export const tourNavActionsDockClassName = cn(
  'relative flex items-center gap-2 overflow-visible',
);

/** ⋯ overflow menu anchor (mobile + compact). */
export const tourNavDockOverflowWrapClassName = cn('relative');

export const tourNavDockOverflowMenuClassName = cn(
  'absolute top-[calc(100%+6px)] right-0 z-20 m-0 w-max min-w-[190px] max-w-[min(260px,calc(100vw-96px))] list-none rounded-lg origin-top-right',
  'border border-[color:var(--ishare-border)] bg-white/95 p-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.14)] backdrop-blur-[6px]',
);

export const tourNavDockOverflowItemClassName = cn(
  'flex w-full cursor-pointer items-center gap-2.5 rounded-md border-none bg-transparent px-3 py-2.5 text-left font-display text-md text-body',
  'transition-colors duration-150 hover:bg-[rgba(15,23,42,0.06)] focus-visible:bg-[rgba(15,23,42,0.06)] focus-visible:outline-none',
);

export const tourNavCircleBtnVariants = cva(
  cn(
    'tour-nav-dock-btn flex size-[46px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none',
    'max-[480px]:size-11',
  ),
  {
    variants: {
      active: {
        false: cn(tourNavDockBtnSurfaceClassName, tourNavDockBtnHoverClassName),
        true: cn(
          'scale-[1.03] bg-primary text-white backdrop-blur-none backdrop-saturate-100',
          'shadow-[0_10px_28px_rgba(var(--ishare-primary-rgb),0.32),0_4px_12px_rgba(var(--ishare-primary-rgb),0.2)]',
          'hover:bg-white/[0.78] hover:text-foreground hover:shadow-[0_10px_28px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)]',
          'focus-visible:bg-white/[0.78] focus-visible:text-foreground focus-visible:shadow-[0_10px_28px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)]',
        ),
      },
    },
    defaultVariants: { active: false },
  },
);

export const tourNavCircleIconClassName = cn(
  materialSymbolFabClassName,
  'transition-colors duration-200 ease-in-out',
);

export const tourNavSearchCloseIconClassName = materialSymbolCompactClassName;

export const tourNavExploreSearchIconClassName = cn(
  'tour-glass-panel__close-icon shrink-0',
);

/** Explore panel header — search pill + layout toggle */
export const tourNavExploreHeaderActionsClassName = cn(
  'flex min-w-0 flex-1 items-center justify-end gap-1 overflow-visible',
);

export const tourNavExploreSearchPillVariants = cva(
  cn(
    'flex items-center overflow-hidden',
    'transition-[max-width,width,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
  ),
  {
    variants: {
      open: {
        false:
          'h-[var(--ishare-panel-header-btn-size)] w-[var(--ishare-panel-header-btn-size)] max-w-[var(--ishare-panel-header-btn-size)] shrink-0 border-b border-transparent pb-0',
        true: cn(
          'h-[var(--ishare-panel-header-btn-size)] min-w-0 w-full max-w-[240px] flex-1 basis-24 gap-1.5',
          'border-b border-[color:var(--ishare-border)]',
          'focus-within:border-primary-light',
        ),
      },
    },
    defaultVariants: { open: false },
  },
);

export const tourNavExploreSearchTriggerClassName = cn(
  'flex size-[var(--ishare-panel-header-btn-size)] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-muted',
  'transition-[background,color] duration-150',
  'hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground',
  'focus-visible:bg-[rgba(15,23,42,0.06)] focus-visible:text-foreground focus-visible:outline-none',
);

export const tourNavExploreSearchInputWrapClassName = cn('min-w-0 flex-1');

export const tourNavExploreSearchInputClassName = cn(
  'block w-full appearance-none rounded-none border-none bg-transparent px-1.5 py-0.5',
  'font-display text-lg leading-normal text-body outline-none',
  'placeholder:font-display placeholder:text-muted',
);

export const tourNavExploreSearchCloseClassName = cn(
  'flex size-6 shrink-0 cursor-pointer items-center justify-center border-none',
  'bg-transparent p-0 text-muted transition-colors duration-150',
  'hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
);

export const tourNavExploreSortRootClassName = cn('relative shrink-0');

export const tourNavExploreRefineMenuClassName = cn(
  'fixed z-[200] m-0 w-max max-w-[min(280px,calc(100vw-96px))] rounded-lg origin-top-right',
  'border border-[color:var(--ishare-border)] bg-white/92 p-2 shadow-[var(--ishare-glass-dock-shadow)]',
  'backdrop-blur-[8px] backdrop-saturate-[120%]',
);

export const tourNavExploreRefineGroupBlockClassName = cn(
  'flex flex-col gap-0.5',
);

export const tourNavExploreRefineGroupHeadingClassName = cn(
  'mb-2 flex min-w-0 items-center gap-1.5 px-2.5 pt-1 pb-0 font-display text-sm font-semibold leading-[1.2] text-foreground',
);

export const tourNavExploreRefineSubsectionClassName = cn(
  'px-3 pt-0.5 pb-0.5 text-right font-display text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-muted',
);

export const tourNavExploreRefineFilterBlockClassName = cn(
  'flex min-w-[13.75rem] flex-col gap-1.5 px-1 pb-1',
);

export const tourNavExploreRefineTriggerActiveClassName = cn(
  'text-primary [&_.material-symbols-outlined]:text-primary',
);

export const tourNavExploreSortMenuClassName = cn(
  'absolute top-[calc(100%+6px)] right-0 z-30 m-0 w-max min-w-[190px] max-w-[min(260px,calc(100vw-96px))] list-none rounded-lg origin-top-right',
  'border border-[color:var(--ishare-border)] bg-white/92 p-1 shadow-[var(--ishare-glass-dock-shadow)]',
  'backdrop-blur-[8px] backdrop-saturate-[120%]',
);

export const tourNavExploreSortGroupHeadingClassName =
  tourNavExploreRefineGroupHeadingClassName;

export const tourNavExploreSortGroupSeparatorClassName = cn(
  'mx-2.5 my-3.5 h-0 shrink-0 border-0 border-t border-[rgba(15,23,42,0.06)]',
);

export const tourNavExploreSortMenuInClassName = cn(
  'animate-explore-sort-menu-in motion-reduce:animate-none',
);

export const tourNavExploreSortMenuOutClassName = cn(
  'pointer-events-none animate-explore-sort-menu-out motion-reduce:animate-none',
);

export const tourNavExploreSortOptionVariants = cva(
  cn(
    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-none',
    'bg-transparent px-3 py-2.5 text-left font-body text-md leading-snug text-body whitespace-nowrap',
    'transition-[background,color] duration-150',
    'hover:bg-[rgba(15,23,42,0.05)] focus-visible:bg-[rgba(15,23,42,0.05)] focus-visible:outline-none',
  ),
  {
    variants: {
      selected: {
        true: cn(
          'font-semibold text-foreground',
          '[&_.explore-sort-option-icon]:text-primary',
        ),
        false: '',
      },
    },
    defaultVariants: { selected: false },
  },
);

export const tourNavExploreSortOptionLeadingClassName = cn(
  'flex min-w-0 flex-1 items-center gap-2',
);

export const tourNavExploreSortOptionIconClassName = cn(
  'explore-sort-option-icon text-muted transition-colors duration-150',
  materialSymbolCompactClassName,
);

export const tourNavExploreSortCheckClassName = cn(
  materialSymbolCheckClassName,
  'text-primary',
);

export const tourNavPanelSlotVariants = cva(
  cn(
    'mt-2.5 origin-top-right',
    '[&_.tour-glass-panel__header]:py-3.5',
    '[&_.tour-glass-panel__title-row]:items-center',
    '[&_.tour-glass-panel__title-actions]:min-w-0',
    '[&_.tour-glass-panel__title-actions]:overflow-visible',
    '[&_[data-explore-search-pill]]:overflow-visible',
    '[&_[data-explore-refine-root]]:overflow-visible',
    '[&_.tour-glass-panel__close]:mt-0',
  ),
  {
    variants: {
      panel: {
        explore: cn(
          '[&_.tour-glass-panel]:w-[min(520px,calc(100vw-48px))]',
          'max-[480px]:[&_.tour-glass-panel]:w-[min(calc(100vw-32px),360px)]',
        ),
        help: cn(
          '[&_.tour-glass-panel]:w-[min(420px,calc(100vw-48px))]',
          'max-[480px]:[&_.tour-glass-panel]:w-[min(calc(100vw-32px),360px)]',
        ),
        share: cn(
          '[&_.tour-glass-panel]:w-[min(420px,calc(100vw-48px))]',
          'max-[480px]:[&_.tour-glass-panel]:w-[min(calc(100vw-32px),360px)]',
        ),
      },
    },
    defaultVariants: { panel: 'explore' },
  },
);

export const tourNavPanelScrollClassName = cn(
  'ishare-scrollbar min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto',
);

export const tourNavPanelScrollInnerClassName = cn(
  'px-[var(--tour-directory-inline-padding,20px)] pb-5 max-[480px]:pb-[18px]',
);

export const tourNavPanelLogoClassName = cn(
  'tour-nav-panel-logo mb-5 flex justify-center',
);

export const tourNavLogoLinkClassName = cn(
  'block max-w-60 bg-transparent p-0 no-underline max-[480px]:max-w-[200px]',
);

export const tourNavLogoClassName = cn(
  'block h-11 w-full object-contain object-center max-[480px]:h-9',
);

export const tourNavListClassName = cn('m-0 flex list-none flex-col gap-1 p-0');

export const tourNavLocationGalleryListClassName = cn(
  'm-0 grid list-none grid-cols-2 items-stretch gap-3 p-0 max-[480px]:grid-cols-1',
);

/** Client intro catalog cards — lighter chrome than explore gallery (no 2px border). */
export const clientIntroGalleryCardClassName = cn(
  'group/card flex w-full cursor-pointer flex-col overflow-hidden rounded-lg bg-white/72 p-0 text-left font-[inherit] shadow-[0_1px_4px_rgba(15,23,42,0.06)]',
  'transition-[box-shadow,transform] duration-150',
  'hover:shadow-[0_4px_14px_rgba(15,23,42,0.1)]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const tourNavLocationGalleryCardClassName = cva(
  cn(
    'group/card flex w-full flex-col overflow-hidden rounded-lg p-0 text-left font-[inherit]',
    'transition-[transform,color] duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      active: {
        false: cn('cursor-pointer', 'bg-white/72'),
        true: cn(
          'cursor-default',
          'bg-white/72',
          '[&_.tour-nav-gallery-card-hero]:after:pointer-events-none',
          '[&_.tour-nav-gallery-card-hero]:after:absolute',
          '[&_.tour-nav-gallery-card-hero]:after:inset-0',
          '[&_.tour-nav-gallery-card-hero]:after:z-[5]',
          '[&_.tour-nav-gallery-card-hero]:after:rounded-lg',
          '[&_.tour-nav-gallery-card-hero]:after:border-3',
          '[&_.tour-nav-gallery-card-hero]:after:border-primary',
          '[&_.tour-nav-gallery-card-hero]:after:content-[""]',
        ),
      },
    },
    defaultVariants: { active: false },
  },
);

export const tourNavLocationGalleryCardHeroClassName = cn(
  'tour-nav-gallery-card-hero relative block aspect-[16/10] overflow-hidden',
);

export const tourNavLocationGalleryCardHeroSkeletonClassName =
  PREVIEW_HERO_SKELETON_CLASS;

export const tourNavLocationGalleryCardHeroImageClassName = cva(
  cn(
    'tour-nav-gallery-card-hero-media relative z-[1] block h-full w-full object-cover object-center opacity-0',
  ),
  {
    variants: {
      active: { false: 'tour-nav-gallery-card-hero-media--zoomable', true: '' },
    },
    defaultVariants: { active: false },
  },
);

export const tourNavLocationGalleryCardFooterClassName = cn(
  'flex items-center gap-2 px-3 pt-2.5 pb-3 max-[480px]:items-center max-[480px]:gap-3 max-[480px]:px-3.5 max-[480px]:pt-3 max-[480px]:pb-3.5',
);

export const tourNavLocationGalleryCardTitleClassName = cn(
  'font-display text-sm font-bold leading-[1.3] tracking-tight text-foreground max-[480px]:text-md',
);

export const tourNavLocationGalleryCardMetaClassName = cn(
  'text-xs leading-[1.35] text-muted',
);

/** Hero badge placement — shared by location + naming gallery cards. */
export const tourNavLocationGalleryHeroBadgePlacementClassName = cn(
  'absolute top-2 right-2 z-[2] max-w-[calc(100%-16px)]',
);

/** Inline row for current + status chips on naming gallery heroes. */
export const tourNavLocationGalleryHeroBadgeGroupClassName = cn(
  tourNavLocationGalleryHeroBadgePlacementClassName,
  'flex flex-row flex-wrap items-center justify-end gap-1.5',
);

/** Solid chips on gallery hero previews. */
export const tourNavLocationGalleryHeroBadgeClassName = cn('font-normal');

export const tourNavLocationGalleryFeaturedBadgeClassName = cn(
  tourNavLocationGalleryHeroBadgeClassName,
  'gap-0.5 bg-gold text-white',
);

export const tourNavLocationGalleryCurrentBadgeClassName = cn(
  tourNavLocationGalleryHeroBadgeClassName,
  'gap-0.5 bg-primary text-white',
);

export const tourNavLocationGalleryStatusBadgeVariants = cva(
  cn(tourNavLocationGalleryHeroBadgeClassName, 'text-white'),
  {
    variants: {
      status: {
        open: 'bg-[var(--color-status-open)]',
        closed: 'bg-[#475569]',
        reserved: 'bg-[var(--color-accent-dark)]',
        soon: 'bg-[var(--color-status-soon)]',
      },
    },
  },
);

export const tourNavLocationGalleryHeroBottomOverlayClassName = cn(
  'pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-2.5 pt-5 pb-1.5',
  'bg-gradient-to-t from-[rgba(15,23,42,0.82)] via-[rgba(15,23,42,0.4)] via-35% to-transparent',
);

export const tourNavLocationGalleryHeroCtaOverlayClassName = cn(
  'pointer-events-none absolute inset-0 z-[3] flex items-center justify-center',
);

export const tourNavLocationGalleryHeroTitleOverlayClassName = cn(
  'min-w-0 flex-1 font-display text-lg font-bold leading-[1.3] tracking-tight text-white',
);

export const tourNavLocationGalleryHeroNamingLabelClassName = cn(
  tourNavLocationGalleryHeroTitleOverlayClassName,
  'flex min-w-0 items-baseline gap-x-1.5',
);

export const tourNavLocationGalleryHeroNamingNameClassName =
  cn('min-w-0 truncate');

export const tourNavLocationGalleryHeroNamingSeparatorClassName = cn(
  'shrink-0 font-normal text-white/55',
);

export const tourNavLocationGalleryHeroMetaOverlayClassName = cn(
  'text-2xs leading-[1.2] text-white/85',
);

export const tourNavLocationGalleryHeroNamingLocationClassName = cn(
  tourNavLocationGalleryHeroMetaOverlayClassName,
  'min-w-0 shrink truncate font-normal',
);

export const tourNavLocationGalleryCtaClassName = cn(
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white max-[480px]:size-11',
  'pointer-events-none scale-95 opacity-0 transition-[opacity,transform] duration-200',
  'group-hover/card:pointer-events-auto group-hover/card:scale-100 group-hover/card:opacity-100',
  'group-focus-visible/card:pointer-events-auto group-focus-visible/card:scale-100 group-focus-visible/card:opacity-100',
  'group-hover/card:[&_.material-symbols-rounded]:translate-x-px group-focus-visible/card:[&_.material-symbols-rounded]:translate-x-px',
  'motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none',
);

export const tourNavDirectoryItemVariants = cva(
  cn(
    'flex w-full items-center gap-2.5 border',
    'rounded-lg px-3 py-2.5 text-left font-[inherit] text-md text-body',
    'transition-[background,border-color,color,box-shadow] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      kind: { location: '', naming: 'items-center px-3.5 py-3' },
      statusTone: { default: '', closed: '' },
      active: {
        false: cn(
          'cursor-pointer',
          'border-transparent bg-transparent',
          'hover:enabled:bg-white/[0.3] focus-visible:enabled:bg-white/[0.3]',
        ),
        true: 'cursor-default',
      },
    },
    compoundVariants: [
      {
        kind: 'location',
        active: false,
        class: cn(
          'hover:enabled:text-foreground focus-visible:enabled:text-foreground',
          'hover:enabled:[&_[data-tour-nav-location-icon]]:text-primary',
          'focus-visible:enabled:[&_[data-tour-nav-location-icon]]:text-primary',
        ),
      },
      {
        kind: 'location',
        active: true,
        class: cn(
          'bg-[var(--ishare-active-item-bg)]',
          'border-[color:var(--ishare-active-item-border)]',
          'font-semibold text-foreground',
          '[&_[data-tour-nav-location-icon]]:text-primary',
        ),
      },
      {
        kind: 'naming',
        active: false,
        class: cn(
          'hover:enabled:[&_[data-tour-nav-naming-icon]]:text-primary',
          'focus-visible:enabled:[&_[data-tour-nav-naming-icon]]:text-primary',
          'hover:enabled:[&_.tour-nav-item-label]:text-foreground',
          'focus-visible:enabled:[&_.tour-nav-item-label]:text-foreground',
        ),
      },
      {
        kind: 'naming',
        active: true,
        class: cn(
          'bg-[var(--ishare-active-item-bg)]',
          'border-[color:var(--ishare-active-item-border)]',
          'text-foreground',
          'hover:enabled:bg-white/[0.3] focus-visible:enabled:bg-white/[0.3]',
          '[&_.tour-nav-item-label]:font-semibold',
          '[&_.tour-nav-item-meta]:font-normal',
          '[&_[data-tour-nav-naming-icon]]:text-primary',
          'hover:enabled:[&_[data-tour-nav-naming-icon]]:text-primary',
          'focus-visible:enabled:[&_[data-tour-nav-naming-icon]]:text-primary',
          'hover:enabled:[&_.tour-nav-item-label]:text-foreground',
          'focus-visible:enabled:[&_.tour-nav-item-label]:text-foreground',
        ),
      },
    ],
    defaultVariants: { kind: 'location', active: false, statusTone: 'default' },
  },
);

export const tourNavItemLeadingClassName = cn(
  'tour-nav-item-leading flex size-4 shrink-0 items-center justify-center',
);

export const tourNavItemLocationIconClassName = cn(
  materialSymbolCompactClassName,
  'text-[rgba(100,116,139,0.42)] transition-colors duration-150',
);

export const tourNavItemLabelClassName = cn(
  'tour-nav-item-label min-w-0 flex-1 font-medium transition-colors duration-150',
);

export const tourNavItemNamingLabelClassName = cn(
  'flex min-w-0 flex-1 items-baseline gap-x-1.5',
);

export const tourNavItemNamingNameClassName = cn(
  'tour-nav-item-label min-w-0 truncate font-medium transition-colors duration-150',
);

export const tourNavItemNamingSeparatorClassName = cn('shrink-0 text-muted');

export const tourNavItemNamingLocationClassName = cn(
  'tour-nav-item-meta min-w-0 shrink truncate text-xs leading-[1.3] text-muted',
);

export const tourNavItemTextClassName = cn(
  'flex min-w-0 flex-1 flex-col gap-0.5',
);

export const tourNavItemMetaClassName = cn(
  'tour-nav-item-meta text-xs leading-[1.3] text-muted',
);

export const tourNavEmptyClassName = cn(
  'm-0 px-1 py-2 text-center text-md leading-[1.55] text-muted',
);

export const tourNavSectionTitleClassName = cn(
  'm-0 mb-[var(--tour-directory-space)] font-display text-lg-plus font-semibold text-foreground',
);

export const tourNavDirectoryTabsClassName = cn(
  'mx-[var(--tour-directory-inline-padding,20px)] mb-2 mt-0 box-border w-[calc(100%-2*var(--tour-directory-inline-padding,20px))] max-w-full min-w-0 shrink-0 overflow-y-hidden',
  segmentedTabsTrackChromeClassName,
  // Desktop — equal full-width pills
  'min-[1024px]:[&_[data-segmented-tab]]:min-w-0 min-[1024px]:[&_[data-segmented-tab]]:flex-1 min-[1024px]:[&_[data-segmented-tab]]:basis-0 min-[1024px]:[&_[data-segmented-tab]]:overflow-hidden',
  // Mobile + compact — horizontal scroll
  'max-[1023px]:[&_[data-segmented-tab]]:shrink-0 max-[1023px]:[&_[data-segmented-tab]]:flex-none max-[1023px]:[&_[data-segmented-tab]]:min-w-[8.75rem] max-[1023px]:[&_[data-segmented-tab]]:overflow-hidden',
  'max-[1023px]:[&_#tour-nav-directory-tab-naming]:min-w-[10.5rem]',
);

export const tourNavDirectoryPanelClassName = cn('flex flex-col gap-0');

export const tourNavDirectorySectionClassName = cn(
  '[&+&]:mt-[var(--tour-directory-divider-space)] [&+&]:border-t [&+&]:border-[rgba(15,23,42,0.08)] [&+&]:pt-[var(--tour-directory-divider-space)]',
);

export const tourNavItemBadgeClassName = cn(
  'ml-0.5 shrink-0 px-2.5 py-1 text-2xs font-semibold tracking-[0.03em]',
);

export const tourNavItemIconNamingVariants = cva(
  cn(
    materialSymbolCompactClassName,
    'transition-colors duration-150 ease-in-out',
  ),
  {
    variants: {
      active: { true: 'text-primary', false: 'text-[rgba(100,116,139,0.42)]' },
      closed: { true: '', false: '' },
    },
    defaultVariants: { active: false, closed: false },
  },
);

/* ── Help / contact (TourHelpPanel, TourContactInfo) ── */

export const tourNavHelpLeadClassName = cn(
  'm-0 font-body text-lg leading-[1.6] text-[var(--ishare-glass-body-text)]',
);

export const tourNavHelpDividerClassName = cn(
  'my-7 mb-6 border-0 border-t border-[rgba(15,23,42,0.1)]',
);

export const tourNavContactBrandVariants = cva(
  cn('mb-5 flex flex-col items-center gap-[18px] text-center'),
  {
    variants: {
      hasLogo: {
        true: cn(
          'mt-5 mb-8 gap-0',
          '[&_.tour-nav-panel-logo]:mx-0 [&_.tour-nav-panel-logo]:mb-0 [&_.tour-nav-panel-logo]:mt-0 [&_.tour-nav-panel-logo]:w-full',
          '[&_a]:max-w-[280px] [&_img]:h-[52px]',
          'max-[480px]:[&_a]:max-w-60 max-[480px]:[&_img]:h-11',
        ),
        false: '',
      },
    },
    defaultVariants: { hasLogo: false },
  },
);

export const tourNavContactNameClassName = cn(
  'm-0 font-display text-md font-semibold leading-[1.4] text-foreground',
);

export const tourNavContactSectionLeadClassName = cn(
  'mb-4 font-body text-md leading-[1.55] text-[var(--ishare-glass-body-text)]',
);

export const tourNavHelpFaqListClassName = cn(
  'mt-0 flex flex-col gap-4 p-0 [.ishare-accordion__panel-inner_&]:mt-0',
);

export const tourNavHelpFaqItemClassName = cn('m-0');

export const tourNavHelpFaqQuestionClassName = cn(
  'mb-1.5 font-body text-md font-semibold leading-[1.4] text-body',
);

export const tourNavHelpFaqAnswerClassName = cn(
  'm-0 font-body text-sm leading-normal text-[color-mix(in_srgb,var(--color-body)_45%,var(--color-muted))]',
);

export const tourNavHelpListClassName = cn(
  'tour-nav-help-list mt-0 flex list-disc list-outside flex-col gap-2.5 p-0 pl-[1.125rem] font-body text-md leading-[1.55]',
  'text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
  '[&_li]:pl-0.5 [&_strong]:font-semibold [&_strong]:text-foreground',
  '[.ishare-accordion__panel-inner_&]:mt-0',
);

export const tourNavControlsListClassName = cn(
  'tour-nav-help-list mt-0 flex list-disc list-outside flex-col gap-2.5 p-0 pl-[1.125rem] font-body text-md leading-[1.55]',
  'text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
  '[&_li]:pl-0.5',
  '[.ishare-accordion__panel-inner_&]:mt-0',
);

export const tourNavContactListClassName = cn('m-0 flex flex-col gap-3');

export const tourNavContactItemClassName = cn('m-0 grid gap-0.5');

export const tourNavContactLabelClassName = cn(
  'm-0 font-display text-xs font-semibold leading-[1.3] tracking-[0.04em] text-muted uppercase',
);

export const tourNavContactValueClassName = cn(
  'm-0 font-body text-md leading-[1.55] text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
);

export const tourNavContactValueAddressClassName = cn('whitespace-pre-line');

export const tourNavContactLinkClassName = cn(
  'break-words text-primary no-underline hover:underline focus-visible:underline focus-visible:outline-none',
);
