import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

const tourNavGlassShadow = cn(
  'shadow-[0_10px_28px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)]',
);

const tourNavGlassBackdrop = cn('backdrop-blur-[6px] backdrop-saturate-[120%]');

/** Shared idle glass surface for nav dock circle + search FAB. */
const tourNavDockBtnSurfaceClassName = cn(
  'bg-white/[0.52] text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
  tourNavGlassBackdrop,
  tourNavGlassShadow,
);

/** Hover/focus on the control itself (circle buttons). */
const tourNavDockBtnHoverClassName = cn(
  'hover:bg-white/[0.78] hover:text-foreground hover:[&_svg]:text-foreground',
  'focus-visible:bg-white/[0.78] focus-visible:text-foreground focus-visible:[&_svg]:text-foreground',
);

/** Hover/focus when the hit target is a nested trigger (search pill). */
const tourNavDockBtnNestedFocusClassName = cn(
  'has-[.tour-nav-search-pill-trigger:focus-visible]:bg-white/[0.78]',
  'has-[.tour-nav-search-pill-trigger:focus-visible]:text-foreground',
  'has-[.tour-nav-search-pill-trigger:focus-visible]:[&_svg]:text-foreground',
);

/** Scroll-into-view target for active directory items */
export const tourNavDirectoryActiveSelector =
  '[role="option"][aria-selected="true"]';

/* ── Breadcrumb ── */

export const tourNavBreadcrumbClassName = cn(
  'absolute top-6 left-1/2 z-[90] max-w-[min(calc(100vw-120px),680px)] -translate-x-1/2',
  'max-[480px]:top-4 max-[480px]:max-w-[calc(100vw-200px)]',
);

export const tourNavBreadcrumbRowVariants = cva(
  cn(
    'flex w-fit max-w-full items-center justify-center gap-2.5 opacity-100 visible translate-y-0',
    'transition-[transform,opacity,visibility] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'max-[480px]:gap-2',
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

export const tourNavHistoryBtnIconClassName = cn('size-[18px]');

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
  'hover:enabled:text-primary hover:enabled:[&_svg]:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const tourNavBreadcrumbRootIconClassName = cn(
  'size-4 shrink-0 transition-colors duration-150',
);

export const tourNavBreadcrumbCurrentClassName = cn(
  'inline-flex min-w-0 max-w-full items-center gap-[15px] font-semibold text-foreground',
  '[&_svg]:text-primary',
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
  'absolute top-6 right-6 z-[90] flex flex-col-reverse items-end',
  '[--tour-directory-space:16px] [--tour-directory-divider-space:18px]',
  'max-[480px]:top-4 max-[480px]:right-4',
);

export const tourNavActionsDockClassName = cn('flex items-center gap-2');

export const tourNavSearchSlotVariants = cva('relative shrink-0', {
  variants: { results: { true: 'z-[2]', false: '' } },
  defaultVariants: { results: false },
});

export const tourNavSearchDropdownClassName = cn(
  'ishare-scrollbar absolute top-[calc(100%+6px)] right-0',
  'max-h-[min(50vh,360px)] w-[min(280px,calc(100vw-160px))] overflow-y-auto',
  'rounded-lg border border-[color:var(--ishare-border)] bg-white/[0.92] p-3.5 pb-4',
  'backdrop-blur-[10px] backdrop-saturate-[120%]',
  tourNavGlassShadow,
  'animate-tour-nav-search-dropdown-in motion-reduce:animate-none',
  '[&_h3]:px-1 [&_ul]:px-1',
  '[&_p]:px-1 [&_p]:py-2 [&_p]:leading-[1.6]',
);

export const tourNavCircleBtnVariants = cva(
  cn(
    'tour-nav-dock-btn flex size-[46px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none',
    'max-[480px]:size-11',
  ),
  {
    variants: {
      active: {
        false: cn(
          tourNavDockBtnSurfaceClassName,
          tourNavDockBtnHoverClassName,
        ),
        true: cn(
          'scale-[1.03] bg-primary text-white backdrop-blur-none backdrop-saturate-100',
          'shadow-[0_10px_28px_rgba(var(--ishare-primary-rgb),0.32),0_4px_12px_rgba(var(--ishare-primary-rgb),0.2)]',
          '[&_svg]:scale-[1.04] [&_svg]:text-white',
          'hover:bg-white/[0.78] hover:text-foreground hover:shadow-[0_10px_28px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)] hover:[&_svg]:scale-[1.04] hover:[&_svg]:text-foreground',
          'focus-visible:bg-white/[0.78] focus-visible:text-foreground focus-visible:shadow-[0_10px_28px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)] focus-visible:[&_svg]:scale-[1.04] focus-visible:[&_svg]:text-foreground',
        ),
      },
    },
    defaultVariants: { active: false },
  },
);

export const tourNavCircleIconClassName = cn(
  'size-[18px] transition-transform duration-200 ease-in-out max-[480px]:size-4',
);

export const tourNavCircleIconHelpClassName = cn(
  'size-[19px] max-[480px]:size-[17px]',
);

export const tourNavSearchPillVariants = cva(
  cn(
    'tour-nav-search-pill flex h-[46px] shrink-0 items-center overflow-hidden rounded-full border',
  ),
  {
    variants: {
      open: {
        false: cn(
          'w-[46px] border-transparent',
          tourNavDockBtnSurfaceClassName,
          tourNavDockBtnHoverClassName,
          tourNavDockBtnNestedFocusClassName,
        ),
        true: cn(
          'tour-nav-search-pill--open w-[min(280px,calc(100vw-160px))] border-[color:var(--ishare-border)] bg-white/[0.92] text-body',
          tourNavGlassBackdrop,
          tourNavGlassShadow,
          '[&_.tour-nav-search-icon]:static [&_.tour-nav-search-icon]:ml-3.5 [&_.tour-nav-search-icon]:shrink-0 [&_.tour-nav-search-icon]:translate-none',
          '[&_.tour-nav-search-input]:min-h-[46px] [&_.tour-nav-search-input]:min-w-0 [&_.tour-nav-search-input]:flex-1',
          '[&_.tour-nav-search-input]:border-none [&_.tour-nav-search-input]:bg-transparent [&_.tour-nav-search-input]:px-2.5 [&_.tour-nav-search-input]:pl-2.5 [&_.tour-nav-search-input]:shadow-none',
          '[&_.tour-nav-search-input]:hover:enabled:border-none [&_.tour-nav-search-input]:hover:enabled:bg-transparent [&_.tour-nav-search-input]:hover:enabled:shadow-none',
          '[&_.tour-nav-search-input]:focus:border-none [&_.tour-nav-search-input]:focus:bg-transparent [&_.tour-nav-search-input]:focus:shadow-none [&_.tour-nav-search-input]:focus:outline-none',
        ),
      },
    },
    defaultVariants: { open: false },
  },
);

export const tourNavSearchPillTriggerClassName = cn(
  'tour-nav-search-pill-trigger flex size-[46px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-inherit',
  'focus-visible:outline-none',
);

export const tourNavSearchPillCloseClassName = cn(
  'mr-[7px] flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-none',
  'bg-transparent p-0 text-muted transition-[background,color] duration-150',
  'hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground focus-visible:bg-[rgba(15,23,42,0.06)] focus-visible:text-foreground focus-visible:outline-none',
);

/** Search pill close — 14px icon; smaller than panel header close (18px). */
export const tourNavSearchCloseIconClassName = cn('!size-[14px]');

export const tourNavPanelSlotVariants = cva(
  cn(
    'mt-2.5 origin-top-right',
    '[&_.tour-glass-panel__header]:py-3.5',
    '[&_.tour-glass-panel__title-row]:items-center',
    '[&_.tour-glass-panel__close]:mt-0',
  ),
  {
    variants: {
      panel: {
        explore: '',
        help: cn(
          '[&_.tour-glass-panel]:w-[min(420px,calc(100vw-48px))]',
          'max-[480px]:[&_.tour-glass-panel]:w-[min(calc(100vw-32px),360px)]',
        ),
        share: '',
      },
    },
    defaultVariants: { panel: 'explore' },
  },
);

export const tourNavPanelScrollClassName = cn(
  'ishare-scrollbar min-h-0 flex-1 overflow-y-auto',
);

export const tourNavPanelScrollInnerClassName = cn('px-5 pb-5');

export const tourNavPanelLogoClassName = cn(
  'tour-nav-panel-logo mb-5 flex justify-center',
  '[.ishare-accordion__panel-inner_&]:mt-0',
);

export const tourNavLogoLinkClassName = cn(
  'block max-w-60 bg-transparent p-0 no-underline max-[480px]:max-w-[200px]',
);

export const tourNavLogoClassName = cn(
  'block h-11 w-full object-contain object-center max-[480px]:h-9',
);

export const tourNavSearchIconClassName = cn(
  'tour-nav-search-icon pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted',
);

export const tourNavSearchInputClassName = cn(
  'tour-nav-search-input w-full min-h-10 rounded-full border border-[color:var(--ishare-border)]',
  'bg-white/[0.85] py-2.5 pr-4 pl-9 font-display text-lg text-body outline-none',
  'transition-[border-color,background,box-shadow] duration-200 ease-in-out',
  'placeholder:font-display placeholder:text-muted',
  'hover:enabled:not(:focus):bg-[rgba(241,245,249,0.92)]',
  'focus:border-primary-light focus:shadow-[0_0_0_3px_rgba(var(--ishare-primary-rgb),0.12)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
  '[&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
  '[&::-ms-clear]:hidden [&::-moz-search-clear-button]:hidden',
);

export const tourNavListClassName = cn('m-0 flex list-none flex-col gap-1 p-0');

export const tourNavDirectoryItemVariants = cva(
  cn(
    'flex w-full cursor-pointer items-center gap-2.5 border',
    'rounded-lg px-3 py-2.5 text-left font-[inherit] text-md text-body',
    'transition-[background,border-color,color,box-shadow] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      kind: { location: '', naming: 'items-center gap-3 px-3.5 py-3' },
      statusTone: { default: '', sold: '' },
      active: {
        false: cn(
          'border-transparent bg-transparent',
          'hover:enabled:bg-white/[0.3] focus-visible:enabled:bg-white/[0.3]',
        ),
        true: '',
      },
    },
    compoundVariants: [
      {
        kind: 'location',
        active: false,
        class: cn(
          'hover:enabled:text-foreground focus-visible:enabled:text-foreground',
          'hover:enabled:[&_[data-tour-nav-dot]]:bg-primary',
          'hover:enabled:[&_[data-tour-nav-dot]]:shadow-none',
          'focus-visible:enabled:[&_[data-tour-nav-dot]]:bg-primary',
          'focus-visible:enabled:[&_[data-tour-nav-dot]]:shadow-none',
        ),
      },
      {
        kind: 'location',
        active: true,
        class: cn(
          'bg-[var(--ishare-active-item-bg)]',
          'border-[color:var(--ishare-active-item-border)]',
          'font-semibold text-foreground',
          '[&_[data-tour-nav-dot]]:bg-primary',
          '[&_[data-tour-nav-dot]]:shadow-[var(--ishare-active-icon-dot-ring)]',
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
          '[&_.tour-nav-item-leading]:size-[22px]',
          '[&_.tour-nav-item-leading]:rounded-full',
          '[&_.tour-nav-item-leading]:bg-[var(--ishare-active-icon-leading-bg)]',
          '[&_.tour-nav-item-leading]:[box-shadow:var(--ishare-active-icon-leading-ring)]',
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

export const tourNavItemDotClassName = cn(
  'size-[9px] shrink-0 rounded-full bg-[color:var(--ishare-border)] transition-[background] duration-150',
);

export const tourNavItemLabelClassName = cn(
  'tour-nav-item-label min-w-0 flex-1 transition-colors duration-150',
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
  'm-0 mb-[var(--tour-directory-space)] font-display text-lg font-semibold text-foreground',
);

export const tourNavDirectoryTabsClassName = cn('mx-5 mb-2 mt-0');

export const tourNavDirectoryPanelClassName = cn('flex flex-col gap-0');

export const tourNavDirectorySectionClassName = cn(
  '[&+&]:mt-[var(--tour-directory-divider-space)] [&+&]:border-t [&+&]:border-[rgba(15,23,42,0.08)] [&+&]:pt-[var(--tour-directory-divider-space)]',
);

export const tourNavItemBadgeClassName = cn(
  'ml-0.5 shrink-0 px-2.5 py-1 text-2xs font-semibold tracking-[0.03em]',
);

export const tourNavItemIconNamingVariants = cva(
  'size-3.5 transition-colors duration-150 ease-in-out',
  {
    variants: {
      active: { true: 'text-primary', false: 'text-[rgba(100,116,139,0.42)]' },
      sold: { true: '', false: '' },
    },
    defaultVariants: { active: false, sold: false },
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
  cn(
    'mb-5 flex flex-col items-center gap-[18px] text-center',
    '[.ishare-accordion__panel-inner_&]:mt-0',
  ),
  {
    variants: {
      hasLogo: {
        true: cn(
          'mb-8 gap-0',
          '[&_.tour-nav-panel-logo]:m-0 [&_.tour-nav-panel-logo]:w-full',
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
  'm-0 font-display text-lg font-semibold leading-[1.3] text-foreground',
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
  'mt-0 flex flex-col gap-2.5 p-0 pl-[18px] font-body text-md leading-[1.55]',
  'text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
  '[&_li]:pl-0.5 [&_strong]:font-semibold [&_strong]:text-foreground',
  '[.ishare-accordion__panel-inner_&]:mt-0',
);

export const tourNavControlsListClassName = cn(
  'mt-0 flex flex-col gap-2.5 p-0 pl-[18px] font-body text-md leading-[1.55]',
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
  'm-0 font-body text-lg leading-normal text-body',
  '[.ishare-accordion__panel-inner_&]:text-md',
  '[.ishare-accordion__panel-inner_&]:text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]',
);

export const tourNavContactValueAddressClassName = cn('whitespace-pre-line');

export const tourNavContactLinkClassName = cn(
  'break-words text-primary no-underline hover:underline focus-visible:underline focus-visible:outline-none',
);
