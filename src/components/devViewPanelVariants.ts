import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

/** Shared corner radius — text fields, selects, file inputs, action buttons, tab chips. */
export const devViewPanelControlRadiusClassName = 'rounded-md';

/** Same chrome insets as nav dock; ≤1023px anchors bottom-left (mobile + compact). */
export const devToolsStackClassName = cn(
  'pointer-events-none absolute left-[var(--tour-chrome-inset-left)] z-[var(--tour-chrome-z-index)]',
  'top-[var(--tour-chrome-inset-top)]',
  'flex w-[min(440px,calc(100vw-var(--tour-chrome-inset-left)-var(--tour-chrome-inset-right)))] flex-col gap-2',
  '[&>*]:pointer-events-auto',
  'max-[1023px]:top-auto max-[1023px]:bottom-[var(--tour-chrome-inset-bottom)] max-[1023px]:flex-col-reverse',
);

export const devFabVariants = cva(
  cn(
    'inline-flex h-9 shrink-0 items-center justify-center self-start rounded-full border px-3',
    'font-mono text-2xs font-bold uppercase tracking-[0.08em]',
    'shadow-[0_8px_20px_rgba(15,23,42,0.28)]',
  ),
  {
    variants: {
      open: {
        true: 'border-[rgba(0,255,128,0.65)] bg-[rgba(0,20,12,0.92)] text-[#4ade80]',
        false:
          'border-[rgba(0,255,128,0.35)] bg-[rgba(0,0,0,0.85)] text-[#86efac] hover:border-[rgba(0,255,128,0.55)] hover:text-[#4ade80]',
      },
    },
    defaultVariants: { open: false },
  },
);

export const devViewPanelRootClassName = cn(
  'flex max-h-[min(calc(100vh-72px),900px)] min-h-0 flex-col overflow-hidden rounded-lg border border-[rgba(0,255,128,0.35)] bg-[rgba(0,0,0,0.85)] font-mono text-xs text-[#e2e8f0]',
  'max-[1023px]:max-h-[min(calc(100vh-var(--tour-chrome-inset-bottom)-var(--tour-chrome-inset-top)-4.5rem),900px)]',
);

export const devViewPanelStickyHeaderClassName = cn(
  'sticky top-0 z-[2] shrink-0 flex flex-col gap-2.5 border-b border-[rgba(0,255,128,0.2)] px-3.5 pb-2.5 pt-3.5',
);

export const devViewPanelBodyClassName = cn(
  'flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-3.5 pt-2.5',
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
);

export const devViewPanelTitleClassName = cn(
  'm-0 font-bold uppercase tracking-[0.05em] text-[#4ade80]',
);

export const devViewPanelStickyTourTitleClassName = cn(
  'm-0 text-xs font-semibold leading-snug text-[#f0fdf4]',
);

export const devViewPanelStickyTourClientClassName = cn(
  'font-normal text-[#94a3b8]',
);

export const devViewPanelTourSwitcherClassName = cn(
  'flex min-w-0 items-center gap-2.5',
);

export const devViewPanelStickyTourLogoWrapClassName = cn(
  'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1',
);

export const devViewPanelStickyTourLogoClassName = cn(
  'block max-h-full max-w-full object-contain object-center',
);

export const devViewPanelTourSwitchAnchorClassName = cn(
  'relative min-w-0 flex-1',
);

export const devViewPanelTourSwitchTriggerClassName = cn(
  'flex w-full min-w-0 items-center gap-2 border border-transparent px-0 py-0.5 text-left',
  devViewPanelControlRadiusClassName,
  'text-xs font-semibold leading-snug text-[#f0fdf4]',
  'hover:border-[rgba(100,116,139,0.35)] hover:bg-[rgba(15,23,42,0.45)]',
  'focus-visible:border-[#38bdf8] focus-visible:outline-none',
);

export const devViewPanelTourSwitchChevronClassName = cn(
  'ml-auto h-5 w-5 shrink-0 text-[#64748b]',
);

export const devViewPanelTourSwitchMenuClassName = cn(
  'fixed z-[var(--tour-chrome-menu-z-index)] max-h-[min(60vh,420px)] overflow-y-auto border border-[rgba(100,116,139,0.45)] bg-[rgba(15,23,42,0.98)] py-1 shadow-[0_10px_24px_rgba(15,23,42,0.55)]',
  devViewPanelControlRadiusClassName,
  '[scrollbar-width:thin] [scrollbar-color:rgba(100,116,139,0.55)_transparent]',
);

/** Client name row — non-interactive group label above its tours. */
export const devViewPanelTourSwitchGroupHeadingClassName = cn(
  'block truncate px-2.5 pb-1 pt-2.5 text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-[#94a3b8]',
);

export const devViewPanelTourSwitchMenuItemClassName = cn(
  'block w-full truncate py-1.5 pl-5 pr-2.5 text-left text-2xs text-[#e2e8f0]',
  'hover:bg-[rgba(56,189,248,0.12)] hover:text-[#f0fdf4]',
  'focus-visible:bg-[rgba(56,189,248,0.12)] focus-visible:outline-none',
);

export const devViewPanelTourSwitchMenuItemActiveClassName = cn(
  'bg-[rgba(74,222,128,0.12)] text-[#86efac]',
);

export const devViewPanelSceneIdClassName = cn(
  'font-medium normal-case tracking-normal text-[#86efac]',
);

export const devViewPanelSectionClassName = cn('flex flex-col');

export const devViewPanelTabPanelClassName = cn(
  'flex flex-col',
  '[&>section:not(:first-child)]:mt-7 [&>section:not(:first-child)]:border-t [&>section:not(:first-child)]:border-[rgba(100,116,139,0.28)] [&>section:not(:first-child)]:pt-7',
);

export const devViewPanelSubsectionClassName = cn(
  'mt-5 border-t border-[rgba(100,116,139,0.22)] pt-5',
);

export const devViewPanelFormSectionClassName = cn('flex flex-col gap-3');

export const devViewPanelFormSectionBodyClassName = cn('flex flex-col gap-3');

/** Save / error block below stacked form subsections. */
export const devViewPanelStackedFormFooterClassName = cn(
  'mt-5 flex flex-col gap-3',
);

export const devViewPanelSectionHeaderClassName = cn('flex flex-col gap-1.5');

export const devViewPanelSectionHeaderCollapsibleClassName = cn(
  'flex flex-row items-start justify-between gap-2',
);

/** Collapsible section header — whole row toggles expand/collapse. */
export const devViewPanelSectionChevronClassName = cn(
  'mt-px shrink-0 text-[#64748b] transition-[transform,color] duration-200',
);

export const devViewPanelSectionChevronOpenClassName = cn(
  'rotate-180 text-[#86efac]',
);

export const devViewPanelSectionDescriptionClassName = cn('space-y-1');

export const devViewPanelSectionContentClassName = cn(
  'mt-5 flex flex-col gap-3',
);

export const devViewPanelFormGroupClassName = cn(
  'flex flex-col gap-3 border border-[rgba(100,116,139,0.28)] bg-[rgba(15,23,42,0.35)] p-3',
  devViewPanelControlRadiusClassName,
);

/** Form group whose children (subsections) supply their own vertical rhythm. */
export const devViewPanelFormGroupStackedClassName = cn(
  devViewPanelFormGroupClassName,
  'gap-0',
);

export const devViewPanelInlineFormGroupClassName = cn(
  'mt-2 flex flex-col gap-3 border border-[rgba(100,116,139,0.22)] bg-[rgba(0,0,0,0.2)] p-2.5',
  devViewPanelControlRadiusClassName,
);

/** Manage-tab inline edit — flows inside active list row (no nested card). */
export const devViewPanelManageEditFormClassName = cn(
  'flex flex-col gap-3 border-t border-[rgba(100,116,139,0.22)] pt-3',
);

export const devViewPanelFormRowClassName = cn(
  'grid grid-cols-2 gap-x-3 gap-y-3',
);

export const devViewPanelFormRow3ClassName = cn(
  'grid grid-cols-3 gap-x-2 gap-y-3',
);

export const devViewPanelTabPanelBodyClassName = cn('flex flex-col gap-2.5');

export const devViewPanelSectionTitleClassName = cn(
  'm-0 text-2xs font-bold uppercase tracking-[0.06em] text-[#f0fdf4]',
);

export const devViewPanelFormGroupTitleClassName = cn(
  'm-0 text-2xs font-bold uppercase tracking-[0.06em] text-[#f0fdf4]',
);

/** In-section group heading (e.g. Experience, Organization inside Tour). */
export const devViewPanelSubsectionTitleClassName = cn(
  devViewPanelSectionTitleClassName,
  'mt-5 border-t border-[rgba(100,116,139,0.22)] pt-5',
);

export const devViewPanelSectionLeadClassName = cn(
  'm-0 text-2xs leading-[1.35] text-[#64748b] [&_code]:text-[#86efac]',
);

export const devViewPanelCoordsClassName = cn(
  'm-0 break-all bg-[rgba(0,0,0,0.35)] px-2 py-1.5 text-2xs leading-[1.4] text-[#f0fdf4]',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFieldClassName = cn('flex flex-col gap-1.5');

export const devViewPanelFieldLabelClassName = cn('text-2xs text-[#94a3b8]');

export const devViewPanelInputClassName = cn(
  'box-border w-full border border-[rgba(100,116,139,0.55)] bg-[rgba(15,23,42,0.75)] px-2.5 py-1.5 font-[inherit] text-2xs text-[#f0fdf4] placeholder:text-[#64748b] focus:border-[#38bdf8] focus:outline-none',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFileFieldClassName = cn(
  'flex flex-col overflow-hidden border border-[rgba(100,116,139,0.55)] bg-[rgba(15,23,42,0.75)]',
  devViewPanelControlRadiusClassName,
  'focus-within:border-[#38bdf8]',
);

export const devViewPanelFileFieldPreviewClassName = cn(
  'border-t border-[rgba(100,116,139,0.35)] bg-[rgba(0,0,0,0.2)] px-2.5 py-2',
);

export const devViewPanelFilePreviewStackClassName = cn('flex flex-col gap-2');

export const devViewPanelFilePreviewRowClassName = cn(
  'flex items-start justify-end gap-2',
);

export const devViewPanelFilePreviewContentClassName = cn('min-w-0 flex-1');

export const devViewPanelPanoramaPreviewImageClassName = cn(
  'block aspect-[2/1] w-full object-cover object-center',
);

export const devViewPanelBrandLogoClassName = cn(
  'block max-h-10 max-w-full w-auto shrink-0 object-contain object-left',
);

export const devViewPanelBrandFaviconClassName = cn(
  'block max-h-10 max-w-full w-auto shrink-0 object-contain object-left',
);

/** @deprecated Use {@link devViewPanelBrandLogoClassName} or {@link devViewPanelPanoramaPreviewImageClassName}. */
export const devViewPanelFilePreviewImageClassName =
  devViewPanelBrandLogoClassName;

export const devViewPanelFilePreviewClearClassName = cn(
  'shrink-0 cursor-pointer border border-[#64748b] bg-[#1e293b] px-1.5 py-0.5 font-[inherit] text-[0.625rem] text-[#f0fdf4] hover:bg-[#334155]',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFileInputRowClassName = cn(
  'flex min-w-0 items-center gap-2 px-2.5 py-1.5',
);

export const devViewPanelFileChooseBtnClassName = cn(
  'shrink-0 cursor-pointer border border-[#64748b] bg-[#1e293b] px-2 py-1 font-[inherit] text-2xs text-[#f0fdf4] hover:enabled:bg-[#334155]',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFileNameClassName = cn(
  'min-w-0 flex-1 truncate font-[inherit] text-2xs text-[#f0fdf4]',
);

/** @deprecated Use {@link DevPanelFileInput}. */
export const devViewPanelFileInputInnerClassName =
  devViewPanelFileInputRowClassName;

/** @deprecated Use {@link DevPanelFileField} + {@link devViewPanelFileInputInnerClassName}. */
export const devViewPanelFileInputClassName = cn(
  devViewPanelFileFieldClassName,
  devViewPanelFileInputInnerClassName,
);

export const devViewPanelSelectClassName = cn(
  devViewPanelInputClassName,
  'cursor-pointer appearance-none pr-7 [background-image:linear-gradient(45deg,transparent_50%,#94a3b8_50%),linear-gradient(135deg,#94a3b8_50%,transparent_50%)] [background-position:calc(100%-14px)_calc(50%+2px),calc(100%-9px)_calc(50%+2px)] [background-size:5px_5px,5px_5px] [background-repeat:no-repeat]',
);

export const devViewPanelScrollbarClassName = cn(
  '[scrollbar-width:thin] [scrollbar-color:rgba(100,116,139,0.55)_transparent]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(100,116,139,0.55)]',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[rgba(148,163,184,0.75)]',
  '[&::-webkit-scrollbar-corner]:bg-[rgba(15,23,42,0.75)]',
);

export const devViewPanelTextareaClassName = cn(
  devViewPanelInputClassName,
  devViewPanelScrollbarClassName,
  'min-h-[56px] resize-y overflow-y-auto leading-[1.4]',
);

export const devViewPanelSlugPreviewClassName = cn(
  'm-0 text-2xs leading-[1.4] text-[#94a3b8] [&_code]:text-[#86efac]',
);

export const devViewPanelActionsClassName = cn('flex flex-wrap gap-2');

export const devViewPanelColorFieldClassName = cn(
  'flex items-center gap-1.5 py-1.5 pl-1.5 pr-2 overflow-hidden border border-[rgba(100,116,139,0.55)] bg-[rgba(15,23,42,0.75)]',
  devViewPanelControlRadiusClassName,
  'focus-within:border-[#38bdf8]',
);

export const devViewPanelColorInputInnerClassName = cn(
  'min-w-0 flex-1 border-none bg-transparent px-0.5 py-0.5 font-[inherit] text-2xs text-[#f0fdf4] placeholder:text-[#64748b] outline-none',
);

export const devViewPanelColorPickerClassName = cn(
  'size-5 shrink-0 cursor-pointer overflow-hidden rounded-full border-0 bg-transparent p-0',
  '[&::-webkit-color-swatch-wrapper]:p-0',
  '[&::-webkit-color-swatch]:size-full [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0',
  '[&::-moz-color-swatch]:size-full [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0',
);

/** @deprecated Preview sits inside {@link DevPanelFileField}. */
export const devViewPanelPanoramaPreviewWrapClassName =
  devViewPanelFileFieldPreviewClassName;

/** @deprecated Preview sits inside {@link DevPanelFileField}. */
export const devViewPanelBrandPreviewWrapClassName =
  devViewPanelFileFieldPreviewClassName;

/** @deprecated Preview sits inside {@link DevPanelFileField}. */
export const devViewPanelBrandFaviconWrapClassName =
  devViewPanelFileFieldPreviewClassName;

export const devViewPanelBtnVariants = cva(
  cn(
    'cursor-pointer whitespace-nowrap border px-2.5 py-1.5 font-[inherit] text-2xs leading-[1.35] text-[#f0fdf4] disabled:cursor-not-allowed disabled:opacity-40',
    devViewPanelControlRadiusClassName,
  ),
  {
    variants: {
      tone: {
        primary:
          'border-[#4ade80] bg-[#166534] text-[#f0fdf4] hover:enabled:bg-[#15803d]',
        secondary:
          'border-[#64748b] bg-[#1e293b] text-[#f0fdf4] hover:enabled:bg-[#334155]',
        danger:
          'border-[#f87171] bg-[#7f1d1d] text-[#f0fdf4] hover:enabled:bg-[#991b1b]',
        nav: 'border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#bae6fd] hover:enabled:bg-[rgba(56,189,248,0.38)]',
        naming:
          'border-[#f472b6] bg-[rgba(244,114,182,0.28)] text-[#fbcfe8] hover:enabled:bg-[rgba(244,114,182,0.38)]',
        info: 'border-[#facc15] bg-[rgba(250,204,21,0.28)] text-[#fef08a] hover:enabled:bg-[rgba(250,204,21,0.38)]',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

export const devViewPanelSectionHintClassName = cn(
  'm-0 text-2xs leading-[1.35] text-[#64748b]',
);

/** Hint below Manage / Create or tertiary tabs — centered with tab row. */
export const devViewPanelTabHintClassName = cn(
  devViewPanelSectionHintClassName,
  'text-center',
);

export const devViewPanelHotspotSectionClassName = cn('flex flex-col gap-1.5');

export const devViewPanelPrimaryTabsClassName = cn(
  'flex gap-1 border border-[rgba(0,255,128,0.35)] bg-[rgba(0,0,0,0.45)] p-1',
  devViewPanelControlRadiusClassName,
);

/** Section mode tabs — Manage / Create, Existing / New client. */
export const devViewPanelSecondaryTabsClassName = cn(
  'flex gap-0.5 border border-[rgba(100,116,139,0.28)] bg-[rgba(15,23,42,0.35)] p-0.5',
  devViewPanelControlRadiusClassName,
);

export type DevPanelTertiaryTabKind =
  | 'nav'
  | 'naming'
  | 'info'
  | 'tour'
  | 'scene';

/** Pill segmented row — content width, centered under secondary tabs. */
export const devViewPanelTertiaryTabsWrapClassName = cn(
  'flex w-full justify-center',
);

/** Pill track — narrower than secondary; sizes to tab labels. */
export const devViewPanelTertiaryTabsClassName = cn(
  'relative inline-flex w-auto items-stretch rounded-full bg-[rgba(30,41,59,0.9)] p-0.5',
);

export const devViewPanelTertiaryTabIndicatorClassName = cn(
  'pointer-events-none absolute top-0.5 bottom-0.5 left-0 z-0 rounded-full bg-[rgba(71,85,105,0.95)] opacity-0 motion-reduce:transition-none',
);

export const devViewPanelTertiaryTabIndicatorReadyClassName = cn(
  'opacity-100 transition-[left,width,opacity] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
);

export const devViewPanelTertiaryTabButtonVariants = cva(
  'relative z-[1] shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 bg-transparent px-5 py-1 font-[inherit] text-2xs font-medium uppercase tracking-[0.03em] transition-colors',
  {
    variants: {
      active: {
        true: 'text-[#f1f5f9]',
        false: 'text-[#94a3b8] hover:text-[#cbd5e1]',
      },
    },
    defaultVariants: { active: false },
  },
);

/** @deprecated Use depth-specific tab list classes instead. */
export const devViewPanelTabsClassName = devViewPanelSecondaryTabsClassName;

/** @deprecated Use devViewPanelTertiaryTabsClassName for sub-tabs. */
export const devViewPanelSubTabsClassName = cn(
  devViewPanelTertiaryTabsClassName,
  'sticky top-0 z-[1] shrink-0 bg-[rgba(0,0,0,0.92)]',
);

export const devViewPanelTabVariants = cva(
  'cursor-pointer border-0 font-[inherit] transition-colors',
  {
    variants: {
      depth: {
        primary: cn(
          'flex-1 px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-[0.04em]',
          devViewPanelControlRadiusClassName,
        ),
        secondary: cn(
          'flex-1 px-2 py-1 text-2xs font-medium uppercase tracking-[0.03em]',
          devViewPanelControlRadiusClassName,
        ),
        tertiary: cn(
          'flex-1 border px-2 py-1 text-2xs font-semibold uppercase tracking-[0.03em]',
          devViewPanelControlRadiusClassName,
        ),
      },
      kind: {
        nav: '',
        naming: '',
        info: '',
        scene: '',
        client: '',
        tour: '',
        debug: '',
        manage: '',
        create: '',
      },
      active: { true: '', false: '' },
    },
    compoundVariants: [
      {
        depth: 'primary',
        active: false,
        class: 'bg-transparent text-[#94a3b8] hover:text-[#e2e8f0]',
      },
      {
        depth: 'secondary',
        active: false,
        class: 'bg-transparent text-[#64748b] hover:text-[#cbd5e1]',
      },
      {
        depth: 'tertiary',
        active: false,
        class:
          'border-[rgba(100,116,139,0.38)] bg-[rgba(0,0,0,0.28)] text-[#cbd5e1] hover:border-[rgba(148,163,184,0.55)] hover:text-[#f0fdf4]',
      },
      {
        depth: 'primary',
        kind: 'scene',
        active: true,
        class: 'bg-[rgba(74,222,128,0.22)] text-[#86efac]',
      },
      {
        depth: 'primary',
        kind: 'client',
        active: true,
        class: 'bg-[rgba(56,189,248,0.22)] text-[#7dd3fc]',
      },
      {
        depth: 'primary',
        kind: 'tour',
        active: true,
        class: 'bg-[rgba(167,139,250,0.22)] text-[#c4b5fd]',
      },
      {
        depth: 'primary',
        kind: 'debug',
        active: true,
        class: 'bg-[rgba(250,204,21,0.22)] text-[#fde047]',
      },
      {
        depth: 'secondary',
        kind: 'manage',
        active: true,
        class: 'bg-[rgba(100,116,139,0.35)] text-[#e2e8f0]',
      },
      {
        depth: 'secondary',
        kind: 'create',
        active: true,
        class: 'bg-[rgba(74,222,128,0.15)] text-[#86efac]',
      },
      {
        depth: 'tertiary',
        kind: 'nav',
        active: true,
        class:
          'border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#bae6fd] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]',
      },
      {
        depth: 'tertiary',
        kind: 'naming',
        active: true,
        class:
          'border-[#f472b6] bg-[rgba(244,114,182,0.28)] text-[#fbcfe8] shadow-[inset_0_0_0_1px_rgba(244,114,182,0.18)]',
      },
      {
        depth: 'tertiary',
        kind: 'info',
        active: true,
        class:
          'border-[#facc15] bg-[rgba(250,204,21,0.28)] text-[#fef08a] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)]',
      },
      {
        depth: 'tertiary',
        kind: 'tour',
        active: true,
        class:
          'border-[#a78bfa] bg-[rgba(167,139,250,0.28)] text-[#ddd6fe] shadow-[inset_0_0_0_1px_rgba(167,139,250,0.18)]',
      },
      {
        depth: 'tertiary',
        kind: 'scene',
        active: true,
        class:
          'border-[#4ade80] bg-[rgba(74,222,128,0.24)] text-[#bbf7d0] shadow-[inset_0_0_0_1px_rgba(74,222,128,0.18)]',
      },
    ],
    defaultVariants: { depth: 'secondary', active: false },
  },
);

export const devViewPanelToggleListClassName = cn(
  'm-0 flex flex-col gap-1 p-0',
);

/** Checkbox row — grid keeps the input column aligned with label text. */
export const devViewPanelToggleLabelClassName = cn(
  'grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0 px-0.5 py-0.5 text-2xs text-[#cbd5e1] hover:text-[#f0fdf4]',
  devViewPanelControlRadiusClassName,
);

/** Multi-line toggle copy (e.g. debug URL flags with hint suffix). */
export const devViewPanelToggleLabelMultilineClassName = cn(
  devViewPanelToggleLabelClassName,
  'items-start [&>input]:mt-0.5',
);

export const devViewPanelToggleInputClassName = cn(
  'size-3 shrink-0 cursor-pointer accent-[#4ade80]',
);

/** Checkbox row inside form grids — same layout as devViewPanelToggleLabelClassName. */
export const devViewPanelFormCheckboxLabelClassName =
  devViewPanelToggleLabelClassName;

export const devViewPanelFormCheckboxInputClassName =
  devViewPanelToggleInputClassName;

export const devViewPanelToggleTextClassName = cn('min-w-0 leading-[1.35]');

export const devViewPanelToggleNameClassName = cn(
  devViewPanelToggleTextClassName,
  'font-semibold text-[#fde047] [&_code]:text-[#fde047]',
);

export const devViewPanelToggleHintClassName = cn('text-[#64748b]');

export const devViewPanelHotspotListClassName = cn(
  'm-0 flex list-none flex-col gap-2 p-0',
);

/** Manage tab list inside a single card — items separated by dividers. */
export const devViewPanelManageListClassName = cn(
  'm-0 flex list-none flex-col p-0',
  '[&>li:not(:first-child)]:mt-4 [&>li:not(:first-child)]:border-t [&>li:not(:first-child)]:border-[rgba(100,116,139,0.22)] [&>li:not(:first-child)]:pt-4',
);

/** Add action row below a manage list or empty state. */
export const devViewPanelManageListFooterClassName = cn(
  devViewPanelActionsClassName,
  'border-t border-[rgba(100,116,139,0.22)] pt-4',
);

export const devViewPanelManageListItemClassName = cn('flex flex-col gap-2');

export const devViewPanelManageListItemActiveClassName = cn(
  'rounded-md border border-[rgba(56,189,248,0.55)] bg-[rgba(56,189,248,0.08)] px-2.5 py-2.5',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelManageListItemDescClassName = cn(
  devViewPanelSectionHintClassName,
  'line-clamp-2',
);

export type DevHotspotKindBadgeKind = 'nav' | 'naming' | 'info';

const devManageBadgeBaseClassName =
  'px-2 py-0.5 text-[0.5625rem] font-medium leading-[1.35]';

/** Matches dev hotspot tertiary tab colors (nav / naming / info). */
export const devHotspotKindBadgeVariants = cva(devManageBadgeBaseClassName, {
  variants: {
    kind: {
      nav: 'border border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#bae6fd] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]',
      naming:
        'border border-[#f472b6] bg-[rgba(244,114,182,0.28)] text-[#fbcfe8] shadow-[inset_0_0_0_1px_rgba(244,114,182,0.18)]',
      info: 'border border-[#facc15] bg-[rgba(250,204,21,0.28)] text-[#fef08a] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)]',
    },
  },
});

export const devViewPanelManageListItemHeadClassName = cn(
  'm-0 flex w-full items-center gap-2 text-2xs leading-[1.4]',
);

export const devViewPanelManageListItemHeadMainClassName = cn(
  'flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1',
);

export const devViewPanelManageListItemTitleClassName = cn(
  'font-medium text-[#e2e8f0]',
);

export const devViewPanelManageListItemBulletClassName = cn('text-[#64748b]');

export const devViewPanelManageListItemIdClassName = cn(
  'font-normal text-[#94a3b8]',
);

export type DevSceneManageBadgeKind = 'current' | 'first';

export const devSceneManageBadgeVariants = cva(devManageBadgeBaseClassName, {
  variants: {
    kind: {
      current:
        'border border-[#4ade80] bg-[rgba(74,222,128,0.22)] text-[#86efac] shadow-[inset_0_0_0_1px_rgba(74,222,128,0.15)]',
      first:
        'border border-[rgba(148,163,184,0.45)] bg-[rgba(100,116,139,0.22)] text-[#cbd5e1]',
    },
  },
});

export const devViewPanelManageListItemBadgesClassName = cn(
  'flex shrink-0 flex-wrap items-center justify-end gap-1',
);

export const devViewPanelHotspotRowClassName = cn(
  'flex flex-col gap-2 border border-[rgba(100,116,139,0.35)] bg-[rgba(0,0,0,0.25)] px-2.5 py-2',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelHotspotRowSelectedClassName = cn(
  'border-[rgba(56,189,248,0.55)] bg-[rgba(56,189,248,0.08)]',
);

/** @deprecated Prefer DevPanelSection + devViewPanelSectionClassName */
export const devViewPanelSectionVariants = cva(
  cn(
    'flex flex-col gap-1.5 border bg-[rgba(15,23,42,0.45)] px-2.5 pb-2 pt-2.5',
    devViewPanelControlRadiusClassName,
  ),
  {
    variants: {
      kind: {
        landing: 'border-[rgba(74,222,128,0.28)]',
        scene: 'border-[rgba(167,139,250,0.28)]',
        flags: 'border-[rgba(250,204,21,0.28)]',
        nav: 'border-[rgba(56,189,248,0.28)]',
        naming: 'border-[rgba(244,114,182,0.28)]',
        info: 'border-[rgba(250,204,21,0.28)]',
      },
    },
  },
);

/** @deprecated Prefer devViewPanelSectionTitleClassName */
export const devViewPanelSectionTitleVariants = cva(
  'm-0 text-2xs font-bold uppercase tracking-[0.06em]',
  {
    variants: {
      kind: {
        landing: 'text-[#86efac]',
        scene: 'text-[#c4b5fd]',
        flags: 'text-[#fde047]',
        hotspot: 'text-[#94a3b8]',
        nav: 'text-[#7dd3fc]',
        naming: 'text-[#f9a8d4]',
        info: 'text-[#fde047]',
      },
    },
  },
);
