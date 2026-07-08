import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { tourGlassPanelBodyLeadClassName } from './tourGlassPanelVariants';
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

/** Shared idle glass surface for nav dock circle buttons (solid + alpha, no blur). */
const tourNavDockBtnSurfaceClassName = cn(
  'bg-white/[0.75] text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
  tourNavGlassShadow,
);

/** Hover/focus on the control itself (circle buttons). */
const tourNavDockBtnHoverClassName = cn(
  'hover:bg-white/[0.90] hover:text-foreground',
  'focus-visible:bg-white/[0.90] focus-visible:text-foreground',
);

/* ── Breadcrumb ── */

/** Marks the floating breadcrumb nav so the camera nudge can measure/clear it. */
export const TOUR_BREADCRUMB_ATTR = 'data-tour-breadcrumb';
export const tourBreadcrumbSelector = `[${TOUR_BREADCRUMB_ATTR}]`;

/** Portaled refine dropdown — excluded from explore panel outside-click dismiss. */
export const TOUR_EXPLORE_REFINE_MENU_ATTR = 'data-tour-explore-refine-menu';
export const tourExploreRefineMenuSelector = `[${TOUR_EXPLORE_REFINE_MENU_ATTR}]`;

export const tourNavBreadcrumbClassName = cn(
  'absolute top-[var(--tour-chrome-inset-top)] z-[var(--tour-chrome-z-index)]',
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

export const tourNavBreadcrumbRowClassName = cn(
  'flex w-fit max-w-full items-center justify-center gap-2.5',
  'max-[1023px]:justify-start max-[480px]:gap-2',
);

export const tourNavBreadcrumbBarClassName = cn(
  'flex h-11 w-fit max-w-full min-w-0 flex-[0_1_auto] items-center',
  'rounded-full bg-white/[0.75] px-7 transition-[background] duration-150 hover:bg-white/[0.90]',
  tourNavGlassShadow,
  'max-[480px]:h-10 max-[480px]:px-[22px]',
);

/** ← → grouped on the breadcrumb row (right of location pill). */
export const tourNavHistoryGroupClassName = cn(
  'inline-flex shrink-0 items-center gap-0.5 rounded-full p-0.5',
  'bg-white/[0.75]',
  tourNavGlassShadow,
  'max-[480px]:gap-px',
);

export const tourNavHistoryGroupBtnClassName = cn(
  'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none',
  'bg-transparent p-0 text-muted',
  'transition-[background,color,transform] duration-150',
  'hover:enabled:bg-white/[0.90] hover:enabled:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-35',
  'max-[480px]:size-9',
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
  'inline-flex cursor-pointer items-center border-none bg-transparent p-0',
  'font-[inherit] whitespace-nowrap text-muted transition-colors duration-150',
  'hover:enabled:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-50',
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
  'before:pointer-events-none before:absolute before:-inset-0.5 before:z-0 before:origin-center',
  'before:rounded-full before:border-2 before:border-[rgba(var(--ishare-primary-rgb),0.75)]',
  'before:bg-[rgba(var(--ishare-primary-rgb),0.25)]',
  'before:content-[""] before:animate-tour-nav-dot-pulse motion-reduce:before:animate-none',
  'after:pointer-events-none after:absolute after:-inset-0.5 after:z-0 after:origin-center',
  'after:rounded-full after:border-2 after:border-[rgba(var(--ishare-primary-rgb),0.5)]',
  'after:content-[""] after:animate-tour-nav-dot-pulse after:[animation-delay:1.1s]',
  'motion-reduce:after:animate-none',
);

/* ── Actions root ── */

export const tourNavActionsRootClassName = cn(
  'absolute top-[var(--tour-chrome-inset-top)] right-[var(--tour-chrome-inset-right)] z-[var(--tour-chrome-z-index)] flex flex-col-reverse items-end',
  '[--tour-directory-space:16px] [--tour-directory-divider-space:24px] [--tour-directory-section-group-lead-extra:8px] [--tour-directory-group-gap:20px]',
);

export const tourNavActionsDockClassName = cn(
  'relative flex items-center gap-2 overflow-visible',
);

/** ⋯ overflow menu anchor (mobile + compact). */
export const tourNavDockOverflowWrapClassName = cn('relative');

export const tourNavDockOverflowMenuClassName = cn(
  'absolute top-[calc(100%+6px)] right-0 z-20 m-0 w-max min-w-[190px] max-w-[min(260px,calc(100vw-96px))] list-none rounded-lg origin-top-right',
  'border border-[color:var(--ishare-border)] bg-white/95 p-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.14)]',
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
          'scale-[1.03]',
          tourNavDockBtnSurfaceClassName,
          tourNavDockBtnHoverClassName,
          'text-primary hover:text-primary focus-visible:text-primary',
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
  'fixed z-[var(--tour-chrome-menu-z-index)] m-0 w-max max-w-[min(280px,calc(100vw-96px))] rounded-lg origin-top-right',
  'border border-[color:var(--ishare-border)] bg-white/92 p-2 shadow-[var(--ishare-glass-dock-shadow)]',
);

export const tourNavExploreRefineGroupBlockClassName = cn(
  'flex flex-col gap-2',
);

export const tourNavExploreRefineGroupHeadingClassName = cn(
  'mb-3 px-2.5 pt-1 font-display text-lg font-semibold leading-[1.2] text-foreground',
);

export const tourNavExploreRefineSubsectionClassName = cn(
  'flex w-full items-center gap-1.5 px-3 pt-2 pb-0.5 font-display text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-muted',
);

export const tourNavExploreRefineSubsectionIconClassName = cn(
  materialSymbolCompactClassName,
  'text-muted',
);

export const tourNavExploreRefineFilterBlockClassName = cn(
  // Match the sort options' indent so filter controls align under the heading.
  'flex min-w-[13.75rem] flex-col pr-0 pl-6 pb-0.5',
);

export const tourNavExploreRefineTriggerActiveClassName = cn(
  'text-primary [&_.material-symbols-outlined]:text-primary',
);

export const tourNavExploreSortMenuClassName = cn(
  'absolute top-[calc(100%+6px)] right-0 z-30 m-0 w-max min-w-[190px] max-w-[min(260px,calc(100vw-96px))] list-none rounded-lg origin-top-right',
  'border border-[color:var(--ishare-border)] bg-white/92 p-1 shadow-[var(--ishare-glass-dock-shadow)]',
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
    'bg-transparent px-3 py-2 text-left font-body text-sm leading-snug text-body whitespace-nowrap',
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

export const tourNavExploreSortFieldListClassName = cn(
  // Indent options under the SORT/FILTER subsection heading label (icon + gap).
  'm-0 flex list-none flex-col gap-0.5 py-0 pr-0 pl-6',
);

export const tourNavExploreSortFieldRowClassName = cn(
  'flex min-w-0 items-center gap-0.5 rounded-lg',
);

export const tourNavExploreSortFieldOptionClassName = cn(
  'flex min-w-0 flex-1 cursor-pointer items-center rounded-lg border-none',
  'bg-transparent px-3 py-1.5 text-left font-body text-sm leading-snug text-body',
  'transition-[background,color] duration-150',
  'hover:bg-[rgba(15,23,42,0.05)] focus-visible:bg-[rgba(15,23,42,0.05)] focus-visible:outline-none',
  'data-[selected=true]:bg-transparent data-[selected=true]:cursor-default data-[selected=true]:font-semibold data-[selected=true]:text-foreground',
  'data-[selected=true]:hover:bg-transparent data-[selected=true]:focus-visible:bg-transparent',
);

export const tourNavExploreSortDirectionToggleClassName = cn(
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border-none',
  'bg-transparent px-2.5 py-1 font-body text-2xs font-medium leading-none text-primary whitespace-nowrap',
  'transition-[background,color] duration-150',
  'hover:bg-[rgba(15,23,42,0.06)] focus-visible:bg-[rgba(15,23,42,0.06)] focus-visible:outline-none',
);

/** Unidirectional sort field — check when active (no direction toggle). */
export const tourNavExploreSortFieldCheckClassName = cn(
  'inline-flex shrink-0 items-center justify-center px-2 py-1',
);

export const tourNavExploreSortDirectionLabelClassName = cn(
  'max-w-[5.5rem] truncate font-body text-2xs text-muted',
);

export const tourNavPanelSlotVariants = cva(
  cn(
    // Align the panel top with the FAB dock row (was dropped below it).
    '-mt-[var(--tour-chrome-fab-size)] origin-top-right',
    // Lift the header above the overlaid FAB dock so title + close stay clickable
    // (explore's directory header already does this in CSS).
    '[&_.tour-glass-panel__header]:relative [&_.tour-glass-panel__header]:z-10',
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
          '[&_.tour-glass-panel]:w-[min(var(--tour-explore-panel-width),calc(100vw-48px))]',
          'max-[480px]:[&_.tour-glass-panel]:w-[min(calc(100vw-32px),var(--tour-explore-panel-width-mobile-max))]',
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
    'group/card flex w-full flex-col rounded-lg p-0 text-left font-[inherit]',
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
          '[&_.tour-nav-gallery-card-hero]:after:border-[4px]',
          '[&_.tour-nav-gallery-card-hero]:after:border-primary',
          '[&_.tour-nav-gallery-card-hero]:after:content-[""]',
        ),
      },
    },
    defaultVariants: { active: false },
  },
);

export const tourNavLocationGalleryCardHeroClassName = cn(
  'tour-nav-gallery-card-hero relative block aspect-[16/10] overflow-hidden rounded-lg',
);

export const tourNavLocationGalleryCardHeroSkeletonClassName =
  PREVIEW_HERO_SKELETON_CLASS;

export const tourNavLocationGalleryCardHeroImageClassName = cva(
  cn(
    'tour-nav-gallery-card-hero-media pointer-events-none relative z-[1] block h-full w-full object-cover object-center opacity-0',
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
  'pointer-events-none absolute top-2 right-2 z-[2] max-w-[calc(100%-16px)]',
);

/** Inline row for current + status chips on naming gallery heroes. */
export const tourNavLocationGalleryHeroBadgeGroupClassName = cn(
  tourNavLocationGalleryHeroBadgePlacementClassName,
  'flex flex-row flex-wrap items-center justify-end gap-1.5',
);

/** Solid chips on gallery hero previews — bg at ~70% so photo shows through. */
export const tourNavLocationGalleryHeroBadgeClassName = cn('font-normal');

export const tourNavLocationGalleryFeaturedBadgeClassName = cn(
  tourNavLocationGalleryHeroBadgeClassName,
  'gap-0.5 bg-gold/70 text-white',
);

export const tourNavLocationGalleryStatusBadgeVariants = cva(
  cn(tourNavLocationGalleryHeroBadgeClassName, 'text-white'),
  {
    variants: {
      status: {
        open: 'bg-[color-mix(in_srgb,var(--color-status-open)_70%,transparent)]',
        closed: 'bg-[color-mix(in_srgb,#475569_70%,transparent)]',
        reserved:
          'bg-[color-mix(in_srgb,var(--color-accent-dark)_70%,transparent)]',
        soon: 'bg-[color-mix(in_srgb,var(--color-status-soon)_70%,transparent)]',
      },
    },
  },
);

export const tourNavLocationGalleryHeroBottomOverlayClassName = cn(
  'tour-nav-gallery-card-hero-overlay pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-2.5 py-1.5',
  'transition-[padding] duration-[var(--tour-gallery-hover-duration)] ease-[var(--tour-gallery-hover-ease)]',
  'group-hover/card:py-2 group-focus-visible/card:py-2',
);

export const tourNavLocationGalleryHeroOverlayInnerClassName = cn(
  'relative flex min-w-0 flex-col gap-1.5',
);

export const tourNavLocationGalleryHeroHoverBodyClassName = cn(
  'tour-nav-gallery-card-hero-hover-body grid min-w-0 grid-rows-[0fr]',
  'group-hover/card:grid-rows-[1fr] group-focus-visible/card:grid-rows-[1fr]',
);

export const tourNavLocationGalleryHeroHoverBodyInnerClassName =
  'min-h-0 overflow-hidden';

export const tourNavLocationGalleryHeroTitleRowClassName = cn(
  'flex min-w-0 items-end gap-1.5',
);

export const tourNavLocationGalleryHeroDescriptionClassName = cn(
  'tour-nav-gallery-card-hero-desc min-w-0 text-xs leading-[1.4] text-white/85 line-clamp-3',
);

/** Shared arrow motion tokens — nudge is applied only on text CTAs via explore-cta-text-arrow. */
const exploreCtaArrowIconMotionClassName = cn(
  materialSymbolCompactClassName,
  'transition-transform duration-[var(--tour-gallery-hover-duration,0.45s)] ease-[var(--tour-gallery-hover-ease,cubic-bezier(0.22,1,0.36,1))]',
  'motion-reduce:transition-none motion-reduce:translate-x-0',
);

/** Icon-only gallery hero / center CTA — stays centered; no horizontal nudge. */
export const exploreGalleryCtaArrowIconClassName = cn(
  exploreCtaArrowIconMotionClassName,
  'explore-gallery-cta-arrow',
);

/** Trailing arrow on pill text CTAs (e.g. Go to location). */
export const exploreCtaTextArrowIconClassName = cn(
  exploreCtaArrowIconMotionClassName,
  'explore-cta-text-arrow',
);

/** Gallery hero action chips — shared outer hit target (info outline + visit fill). */
export const tourNavLocationGalleryHeroActionChipClassName = cn(
  'inline-flex size-6 shrink-0 items-center justify-center rounded-full box-border',
);

export const tourNavLocationGalleryHeroCtaClassName = cn(
  tourNavLocationGalleryHeroActionChipClassName,
  'bg-primary text-white',
);

export const tourNavLocationGalleryHeroCtaInActionsClassName = cn(
  tourNavLocationGalleryHeroCtaClassName,
  'pointer-events-none',
);

export const tourNavLocationGalleryHeroCtaOverlayClassName = cn(
  'pointer-events-none absolute inset-0 z-[3] flex items-center justify-center',
);

export const tourNavLocationGalleryHeroTitleOverlayClassName = cn(
  'min-w-0 truncate font-display text-lg font-bold leading-[1.3] tracking-tight text-white',
);

export const tourNavLocationGalleryHeroNamingTitleRowClassName = cn(
  'flex min-w-0 flex-1 items-center gap-2',
);

export const tourNavLocationGalleryHeroNamingNameClassName = cn(
  'min-w-0 flex-1 truncate font-display text-lg font-bold leading-[1.3] tracking-tight text-white',
);

export const tourNavLocationGalleryHeroNamingSeparatorClassName = cn(
  'shrink-0 font-normal text-white/55',
);

export const tourNavLocationGalleryHeroMetaOverlayClassName = cn(
  'text-2xs leading-[1.2] text-white/85',
);

/** Title block + location — tighter than overlay inner gap. */
export const tourNavLocationGalleryHeroNamingHeaderClassName = cn(
  'flex min-w-0 flex-col gap-0.5',
);

export const tourNavLocationGalleryHeroNamingLocationClassName = cn(
  'min-w-0 truncate text-xs leading-[1.3] text-white/65',
);

export const tourNavLocationGalleryHeroNamingPriceClassName = cn(
  'shrink-0 font-display text-lg font-bold tabular-nums leading-[1.3] tracking-tight text-white',
);

export const tourNavLocationGalleryHeroHoverBodyInnerColumnClassName = cn(
  tourNavLocationGalleryHeroHoverBodyInnerClassName,
  'flex min-h-0 flex-col gap-2',
);

/** Meta action row below gallery card description. */
export const tourNavLocationGalleryHeroMetaRowClassName = cn(
  'flex min-w-0 items-center gap-2',
);

/** Primary solid CTA on gallery overlay — theme solid, desc-sized text. */
export const tourNavLocationGalleryHeroPillCtaClassName = cn(
  'inline-flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border-none',
  'bg-primary px-2.5 py-0 font-display text-xs font-semibold leading-none text-white',
  'shadow-[0_6px_16px_rgba(var(--ishare-primary-rgb),0.24),0_2px_8px_rgba(var(--ishare-primary-rgb),0.14)]',
  'transition-[background,transform] duration-150 hover:bg-primary-dark',
  'motion-reduce:transition-none',
);

/** Secondary pill on gallery overlay — details / info actions. */
export const tourNavLocationGalleryHeroPillCtaSecondaryClassName = cn(
  'inline-flex h-7 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full',
  'border border-white/28 bg-white/10',
  'px-2.5 py-0 font-display text-xs font-semibold leading-none text-white/90',
);

export const tourNavLocationGalleryCenterCtaClassName = cn(
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white max-[480px]:size-11',
  'pointer-events-none scale-95 opacity-0 transition-[opacity,transform] duration-[var(--tour-gallery-hover-duration)] ease-[var(--tour-gallery-hover-ease)]',
  'group-hover/card:pointer-events-auto group-hover/card:scale-100 group-hover/card:opacity-100',
  'group-focus-visible/card:pointer-events-auto group-focus-visible/card:scale-100 group-focus-visible/card:opacity-100',
  'motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none',
);

/** @deprecated Use {@link tourNavLocationGalleryCenterCtaClassName}. */
export const tourNavLocationGalleryCtaClassName =
  tourNavLocationGalleryCenterCtaClassName;

export const tourNavDirectoryItemVariants = cva(
  cn(
    'flex w-full items-center gap-2.5 border',
    'rounded-lg px-3 py-2.5 text-left font-[inherit] text-md text-body',
    'transition-[background,border-color,color,box-shadow] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      kind: {
        location: cn('group/listitem items-start px-3 py-3'),
        naming: cn('group/listitem items-start px-3.5 py-3'),
      },
      statusTone: { default: '', closed: '' },
      active: {
        false: cn(
          'cursor-pointer',
          'border-transparent bg-transparent',
          'hover:bg-white/[0.3] focus-within:bg-white/[0.3]',
        ),
        true: 'cursor-default',
      },
    },
    compoundVariants: [
      {
        kind: 'location',
        active: false,
        class: cn(
          'hover:bg-white/[0.3] focus-within:bg-white/[0.3]',
          'hover:text-foreground focus-within:text-foreground',
          'hover:[&_[data-tour-nav-location-icon]]:text-primary',
          'focus-within:[&_[data-tour-nav-location-icon]]:text-primary',
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
          '[&_.tour-nav-item-description]:font-normal',
        ),
      },
      {
        kind: 'naming',
        active: false,
        class: cn(
          'hover:[&_[data-tour-nav-naming-icon]]:text-primary',
          'focus-within:[&_[data-tour-nav-naming-icon]]:text-primary',
          'hover:[&_.tour-nav-item-label]:text-foreground',
          'focus-within:[&_.tour-nav-item-label]:text-foreground',
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
          '[&_.tour-nav-item-description]:font-normal',
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

export const tourNavItemLeadingLocationClassName = cn(
  tourNavItemLeadingClassName,
  'mt-0.5',
);

export const tourNavItemLocationIconClassName = cn(
  materialSymbolCompactClassName,
  'text-[rgba(100,116,139,0.42)] transition-colors duration-150',
);

export const tourNavItemLabelClassName = cn(
  'tour-nav-item-label min-w-0 font-medium transition-colors duration-150',
);

export const tourNavItemNamingLabelClassName = cn(
  'flex min-w-0 flex-1 items-baseline gap-x-1.5',
);

export const tourNavItemNamingNameClassName = cn(
  'tour-nav-item-label min-w-0 truncate font-medium transition-colors duration-150',
);

/** NO list — title row + location stacked with tight spacing. */
export const tourNavItemNamingHeaderClassName = cn(
  'flex min-w-0 flex-col gap-0.5',
);

/** NO list — name + status badge share a row; badge at the trailing edge. */
export const tourNavItemNamingTitleRowClassName = cn(
  'flex min-w-0 items-center justify-between gap-x-2',
);

export const tourNavItemNamingLocationClassName = cn(
  'tour-nav-item-meta min-w-0 shrink truncate text-xs leading-[1.3] text-muted',
);

/** Price mirrors the title type scale in a muted tone. */
export const tourNavItemNamingPriceClassName = cn(
  'shrink-0 font-medium tabular-nums leading-[1.3] text-muted',
);

export const tourNavItemTextClassName = cn(
  'flex min-w-0 flex-1 flex-col gap-1.5',
);

/** Wraps directory row label + optional pin so the pin sits beside the title. */
export const tourNavDirectoryItemTitleRowClassName = cn(
  'flex min-w-0 items-end gap-1.5',
);

export const tourNavItemMetaClassName = cn(
  'tour-nav-item-meta text-xs leading-[1.3] text-muted',
);

export const tourNavItemDescriptionClassName = cn(
  'tour-nav-item-description mb-1.5 text-xs leading-[1.35] text-muted line-clamp-2',
);

export const tourNavItemBadgePlacementClassName = cn('shrink-0 self-center');

export const tourNavDirectoryListItemSelectClassName = cn(
  'flex min-w-0 flex-1 items-start gap-2.5 border-none bg-transparent p-0 text-left font-[inherit] text-inherit',
  'cursor-pointer focus-visible:outline-none disabled:cursor-not-allowed',
);

export const tourNavDirectoryListItemTrailingClassName = cn(
  'flex shrink-0 items-center gap-2 self-center pl-1',
);

/** Explore location list — detail CTA reveals on row hover/focus. */
export const tourNavDirectoryListItemRevealClassName = cn(
  'opacity-0 transition-opacity duration-150',
  'group-hover/listitem:opacity-100 group-focus-within/listitem:opacity-100',
  'pointer-coarse:opacity-100',
  'motion-reduce:transition-none',
);

/** List row — hover-expand action slot (no layout space when collapsed). */
export const tourNavDirectoryListItemActionsClassName = cn(
  'tour-nav-directory-list-item-actions grid min-w-0 grid-rows-[0fr]',
  'group-hover/listitem:grid-rows-[1fr] group-focus-within/listitem:grid-rows-[1fr]',
  'pointer-coarse:grid-rows-[1fr]',
  'transition-[grid-template-rows] duration-[var(--tour-directory-group-expand-duration,0.35s)] ease-[var(--tour-directory-group-expand-ease,cubic-bezier(0.22,1,0.36,1))]',
  'motion-reduce:transition-none',
);

export const tourNavDirectoryListItemActionsInnerClassName =
  'min-h-0 overflow-hidden';

export const tourNavDirectoryListItemActionsRowClassName = cn(
  'flex min-w-0 items-center gap-2 pt-1.5',
);

export const tourNavDirectoryListItemDetailCtaClassName = cn(
  'group/detail pointer-events-auto inline-flex h-7 shrink-0 cursor-pointer items-center gap-0.5 rounded-full border border-[rgba(15,23,42,0.12)] bg-white/60 px-3.5 py-0',
  'font-display text-xs font-semibold text-primary',
  'transition-[background,border-color] duration-150',
  'hover:border-primary/35 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:pointer-events-none disabled:opacity-45',
);

/** Primary list-row CTA — Visit / View opportunity. */
export const tourNavDirectoryListItemPrimaryCtaClassName = cn(
  tourNavLocationGalleryHeroPillCtaClassName,
  'pointer-events-auto w-auto flex-none px-3.5',
);

export const tourNavEmptyClassName = cn(
  'm-0 px-1 py-2 text-center text-md leading-[1.55] text-muted',
);

export const tourNavSectionTitleClassName = cn(
  'm-0 mb-[var(--tour-directory-space)] font-display text-lg-plus font-semibold text-foreground',
);

/** Pinned "current location" block above the grouped directory lists. */
export const tourNavCurrentPinnedClassName = cn(
  'mb-[var(--tour-directory-space,16px)] flex flex-col',
);

export const tourNavCurrentPinnedLabelClassName = cn(
  'mb-1.5 flex items-center gap-1 px-1',
  'font-display text-xs font-bold uppercase tracking-[0.04em] text-primary',
);

/** Overview pin label — muted, so the current-location pin reads as primary. */
export const tourNavOverviewPinnedLabelClassName = cn(
  tourNavCurrentPinnedLabelClassName,
  'text-muted',
);

/** Inline "You are here" marker on the active list row (in place of the top pin). */
export const tourNavCurrentInlineLabelClassName = cn(
  'mb-0.5 flex items-center gap-1',
  'font-display text-2xs font-bold uppercase tracking-[0.04em] text-primary',
);

/** "You are here" chip over the active gallery card hero image. */
export const tourNavCurrentHeroChipClassName = cn(
  'pointer-events-none absolute left-2 top-2 z-[2] inline-flex items-center gap-1',
  'rounded-full bg-primary px-2 py-0.5 shadow-sm',
  'font-display text-2xs font-bold uppercase tracking-[0.03em] text-white',
);

export const tourNavDirectoryLeadRootClassName = cn(
  'relative mx-[var(--tour-directory-inline-padding,20px)] mb-1 box-border w-[calc(100%-2*var(--tour-directory-inline-padding,20px))] max-w-full min-w-0 shrink-0',
);

/** @deprecated Use {@link tourNavDirectoryLeadRootClassName} + {@link tourNavDirectoryLeadBodyClassName}. */
export const tourNavDirectoryLeadClassName = cn(
  tourNavDirectoryLeadRootClassName,
  tourGlassPanelBodyLeadClassName,
);

export const tourNavDirectoryLeadBodyClassName = cn(
  tourGlassPanelBodyLeadClassName,
  'm-0 whitespace-pre-wrap',
);

/** Collapsed preview — 3 lines (see {@link EXPLORE_DIRECTORY_LEAD_CLAMP_LINES}). */
export const tourNavDirectoryLeadBodyClampedClassName = cn(
  tourNavDirectoryLeadBodyClassName,
  'line-clamp-3',
);

export const tourNavDirectoryLeadBodyAnimateClassName = cn(
  tourNavDirectoryLeadBodyClassName,
  'overflow-hidden transition-[max-height] duration-[var(--tour-gallery-hover-duration,0.45s)] ease-[var(--tour-gallery-hover-ease,cubic-bezier(0.22,1,0.36,1))]',
  'motion-reduce:transition-none',
);

export const tourNavDirectoryLeadMeasureClassName = cn(
  tourNavDirectoryLeadBodyClassName,
  'pointer-events-none invisible absolute inset-x-0 top-0 h-auto opacity-0',
);

export const tourNavDirectoryLeadToggleClassName = cn(
  'mt-1.5 inline-flex cursor-pointer border-none bg-transparent p-0 font-display text-sm font-semibold text-primary',
  'transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
);

export const tourNavSceneInfoButtonClassName = cva(
  cn(
    'pointer-events-auto inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full p-0 transition-[background,color] duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:pointer-events-none disabled:opacity-45',
    'motion-reduce:transition-none',
  ),
  {
    variants: {
      variant: {
        gallery: cn(
          'size-6 border-none bg-white/88 text-primary shadow-[0_1px_4px_rgba(15,23,42,0.12)]',
          'transition-[background,transform,color] hover:bg-white hover:scale-[1.04]',
          'motion-reduce:hover:scale-100',
        ),
        /** Hero overlay — outlined chip matching visit CTA outer size. */
        galleryHero: cn(
          tourNavLocationGalleryHeroActionChipClassName,
          'border-2 border-solid border-white/65 bg-white/8 text-white/85 shadow-none',
          'hover:border-white/75 hover:bg-white/12 hover:text-white/95',
        ),
        /** Hero overlay — secondary pill text button below description. */
        galleryHeroText: cn(
          tourNavLocationGalleryHeroPillCtaSecondaryClassName,
          'pointer-events-auto relative z-[3] cursor-pointer',
          'transition-[background,border-color,color] duration-150',
          'hover:border-white/40 hover:bg-white/16 hover:text-white',
        ),
        list: cn(
          'size-8 border-none bg-transparent text-muted shadow-none',
          'hover:bg-[rgba(15,23,42,0.06)] hover:text-primary',
        ),
        /** List row — text pill below description; reveals on row hover. */
        listText: tourNavDirectoryListItemDetailCtaClassName,
      },
    },
    defaultVariants: { variant: 'gallery' },
  },
);

/** Single token — safe for `classList.add` / `classList.remove` retrigger. */
export const exploreSceneDetailAnimateInClassName =
  'animate-explore-scene-detail-in';

export const exploreSceneDetailAnimateOutClassName =
  'animate-explore-scene-detail-out';

export const EXPLORE_SCENE_DETAIL_ENTER_X_PX = 16;

export const EXPLORE_SCENE_DETAIL_EXIT_X_PX = 16;

export const tourNavSceneDetailPanelClassName = cn(
  'motion-reduce:animate-none',
);

export const exploreDirectoryBackAnimateInClassName =
  'animate-explore-directory-back-in';

export const EXPLORE_DIRECTORY_BACK_ENTER_X_PX = -16;

export const tourNavExploreDirectoryPanelClassName = cn(
  'flex min-h-0 flex-1 flex-col gap-[var(--tour-directory-space,16px)]',
  'motion-reduce:animate-none',
);

export const tourNavSceneDetailLayoutClassName = cn(
  'flex min-h-0 flex-1 flex-col gap-[var(--tour-directory-space,16px)]',
);

/** Hero image → title/description block. */
export const tourNavSceneDetailHeroCopyStackClassName = cn(
  'flex flex-col gap-[var(--tour-directory-divider-space,24px)]',
);

export const tourNavSceneDetailBackClassName = cn(
  'inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border-none bg-transparent p-0 font-display text-sm font-semibold text-primary',
  'transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:pointer-events-none disabled:opacity-45',
);

/**
 * Hero shell aspect follows its content: a preview video embed is 16/9, so
 * match it to avoid the container background peeking below the player. Static
 * thumbnails use the taller 16/10 crop.
 */
export const tourNavSceneDetailHeroClassName = (hasVideo = false) =>
  cn(
    'relative w-full overflow-hidden rounded-xl bg-[#e2e8f0]',
    hasVideo ? 'aspect-[16/9]' : 'aspect-[16/10]',
  );

export const tourNavSceneDetailHeroImageClassName = cn(
  'block h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 motion-reduce:transition-none',
);

export const tourNavSceneDetailHeroSkeletonClassName =
  PREVIEW_HERO_SKELETON_CLASS;

export const tourNavSceneDetailCopyClassName = cn(
  'flex min-w-0 flex-col gap-[var(--tour-directory-space,16px)]',
);

export const tourNavSceneDetailTitleClassName = cn(
  'm-0 min-w-0 flex-1 font-display text-lg-plus font-semibold leading-[1.3] tracking-tight text-foreground',
);

export const tourNavSceneDetailBodyClassName = cn(
  'm-0 font-body text-md leading-[1.55] text-[var(--ishare-glass-body-text)] whitespace-pre-wrap',
);

export const tourNavSceneDetailFooterClassName = cn('flex justify-center pt-1');

export const tourNavSceneDetailVisitClassName = cn(
  'group/visit inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-primary px-5 py-2 font-display text-sm font-semibold text-white',
  'transition-[background,transform] duration-150 hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'hover:[&_.explore-cta-text-arrow]:translate-x-1.5 focus-visible:[&_.explore-cta-text-arrow]:translate-x-1.5',
  'disabled:pointer-events-none disabled:opacity-45',
);

/** info_i glyph inside gallery hero outlined chip. */
export const tourNavGalleryHeroInfoIconClassName = cn(
  materialSymbolCompactClassName,
);

/** Info affordance — hover/focus on card; always on touch when parent renders it. */
export const tourNavSceneInfoRevealClassName = cn(
  'opacity-0 transition-opacity duration-150',
  'group-hover/card:opacity-100 group-focus-within/card:opacity-100',
  'pointer-coarse:opacity-100',
);

/** Info + visit CTA — side by side on title row; reveals together on card hover. */
export const tourNavLocationGalleryHeroTitleActionsClassName = cn(
  tourNavSceneInfoRevealClassName,
  'pointer-events-none flex shrink-0 items-center gap-1.5',
  'transition-opacity duration-[var(--tour-gallery-hover-duration)] ease-[var(--tour-gallery-hover-ease)]',
  'motion-reduce:transition-none',
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

/** Wrapper for collapsible sector/department groups under a section. */
export const tourNavDirectoryGroupedListClassName = cva('flex flex-col', {
  variants: {
    /** Extra lead when section title is followed by a group header (not images). */
    sectionLead: {
      true: '[&>:first-child]:mt-[var(--tour-directory-section-group-lead-extra,8px)]',
      false: '',
    },
  },
  defaultVariants: { sectionLead: false },
});

/** Collapsible department group in the grouped locations list. */
export const tourNavLocationGroupClassName = cn(
  'tour-nav-location-group flex flex-col [&+&]:mt-[var(--tour-directory-group-gap,20px)]',
);

export const tourNavLocationGroupExpandedClassName =
  'tour-nav-location-group--expanded';

export const tourNavLocationGroupPanelClassName =
  'tour-nav-location-group__panel';

export const tourNavLocationGroupPanelInnerClassName =
  'tour-nav-location-group__panel-inner';

export const tourNavLocationGroupPanelContentClassName =
  'tour-nav-location-group__content';

export const tourNavLocationGroupHeaderClassName = cn(
  // pr aligns the trailing meta label with list-item content (px-3 + 1px border).
  'flex w-full items-center gap-1.5 border-none bg-transparent p-0 pr-[calc(0.75rem+1px)] text-left',
  'cursor-pointer',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const tourNavLocationGroupChevronClassName = cn(
  'shrink-0 text-muted transition-transform duration-[var(--tour-directory-group-expand-duration,0.35s)] ease-[var(--tour-directory-group-expand-ease,cubic-bezier(0.22,1,0.36,1))]',
  'motion-reduce:transition-none',
);

export const tourNavLocationGroupChevronOpenClassName = cn('rotate-90');

export const tourNavLocationGroupTitleClassName = cn(
  'min-w-0 flex-1 truncate font-display text-lg font-semibold text-foreground',
);

/** Muted meta on group header — location count or sector total. */
export const tourNavLocationGroupMetaClassName = cn(
  'shrink-0 text-xs font-medium tabular-nums text-muted',
);

/** Wraps the per-scene naming subgroups inside a sector group (list view). */
export const tourNavNamingSceneSubgroupsClassName = cn('flex flex-col gap-3');

/** Scene (place) subheader above its naming items — smaller than the sector title.
 *  pl-10 aligns the label with the item title (item px-3.5 + icon 16px + gap 10px). */
export const tourNavNamingSceneSubheaderClassName = cn(
  'mb-1 min-w-0 truncate pl-10 pr-1 font-display text-xs font-semibold text-foreground/75',
);

/** @deprecated Use {@link tourNavLocationGroupMetaClassName}. */
export const tourNavLocationGroupCountClassName =
  tourNavLocationGroupMetaClassName;

/** @deprecated Use {@link tourNavLocationGroupMetaClassName}. */
export const tourNavLocationGroupAmountClassName =
  tourNavLocationGroupMetaClassName;

/** @deprecated No longer used — group meta is plain text. */
export const tourNavLocationGroupAmountIconClassName = cn(
  materialSymbolCompactClassName,
  'text-primary',
);

export const tourNavItemBadgeClassName = cn(
  'ml-0.5 shrink-0 px-2.5 py-1 text-2xs font-semibold tracking-[0.03em]',
);

/** Directory list — fixed trailing column (longest NO label: "Coming soon"). */
export const tourNavDirectoryListItemBadgeColumnClassName = cn(
  'flex w-24 shrink-0 flex-row items-center justify-end gap-1.5 self-center pl-1',
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

export const tourNavHelpLeadClassName = tourGlassPanelBodyLeadClassName;

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
  tourGlassPanelBodyLeadClassName,
  'mb-4',
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
