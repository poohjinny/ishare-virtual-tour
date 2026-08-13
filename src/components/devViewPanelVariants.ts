import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

/** Shared corner radius — text fields, selects, file inputs, action buttons, tab chips. */
export const devViewPanelControlRadiusClassName = 'rounded-md';

/**
 * FAB when the drawer is closed. Anchored over the tour.
 * z-index sits above splash (105) + chrome menus.
 */
export const devToolsFabAnchorClassName = cn(
  'pointer-events-none absolute left-[var(--tour-chrome-inset-left,1rem)] top-[var(--tour-chrome-inset-top,1rem)] z-[var(--tour-dev-z-index,300)]',
  '[&>*]:pointer-events-auto',
  'max-[1023px]:top-auto max-[1023px]:bottom-[var(--tour-chrome-inset-bottom,1rem)]',
);

/** Drawer / push-rail width. */
export const DEV_TOOLS_DRAWER_WIDTH = 'min(26rem, 100%)';

/** Set on presentation root when Push + panel open. */
export const DEV_TOOLS_PUSH_RAIL_VAR = '--dev-push-rail';

/**
 * `?dev=1` shell — stage right-anchored; drawer overlays left.
 * Push rail underpaint is the opposite of the panel glass so alphas read:
 * dark panel → white rail; light panel → black rail (`data-dev-theme` on root).
 */
export const devToolsPresentationRootClassName = cn(
  'relative h-dvh w-full overflow-hidden bg-white [--dev-push-rail:0px]',
  'data-[dev-theme=light]:bg-black',
);

/**
 * Tour stage — right-pinned; Push snaps `width` (no transition).
 * DevTools calls `syncLayoutSize()` in the same layout pass.
 */
export const devToolsTourStageClassName = cn(
  'absolute top-0 right-0 bottom-0 min-h-0 min-w-0 overflow-hidden bg-black',
  '[width:calc(100%_-_var(--dev-push-rail))]',
  '[&>*]:h-full [&>*]:min-h-0 [&>*]:w-full',
);

/** Device preview host — one continuous stage surface (no header/footer bands). */
export const devDevicePreviewHostClassName = cn(
  'relative z-[1] h-full min-h-0 w-full',
  'bg-[rgb(2,6,23)] data-[dev-theme=light]:bg-[rgb(241,245,249)]',
);

/**
 * Toolbar floats over the stage. Scale-to-fit reserves this band so the
 * measured viewport sits below the controls (no frame/toolbar overlap).
 */
export const devDevicePreviewToolbarClassName = cn(
  'pointer-events-none absolute inset-x-0 top-0 z-[2] flex max-w-full flex-wrap items-center justify-center gap-2',
  'bg-transparent px-3 pt-3 pb-2.5',
  'text-[0.6875rem] text-[color:rgba(226,232,240,0.88)]',
  '[[data-dev-theme=light]_&]:text-[color:rgba(15,23,42,0.78)]',
  '[&>*]:pointer-events-auto',
);

export const devDevicePreviewScaleViewportClassName = cn(
  'absolute inset-0 min-h-0 w-full overflow-hidden bg-transparent',
);

/** Shared pill chrome for device picker + action buttons. */
const devDevicePreviewToolbarPillClassName = cn(
  'inline-flex h-7 shrink-0 items-center justify-center gap-1.5',
  'rounded-full border border-[rgba(148,163,184,0.35)] bg-[rgba(15,23,42,0.55)]',
  'px-2.5 text-[0.6875rem] font-medium leading-none text-[rgba(226,232,240,0.92)]',
);

/** Custom-faced device picker — name | muted size | chevron. */
export const devDevicePreviewToolbarSelectWrapClassName = cn(
  'relative',
  devDevicePreviewToolbarPillClassName,
  'cursor-pointer pr-2',
  'hover:border-[rgba(148,163,184,0.55)] hover:bg-[rgba(30,41,59,0.8)]',
);

/** Non-interactive mode badge (e.g. Embed) — not a control. */
export const devDevicePreviewToolbarBadgeClassName = cn(
  devDevicePreviewToolbarPillClassName,
  'cursor-default border-[rgba(148,163,184,0.22)] bg-[rgba(15,23,42,0.4)]',
  'text-[rgba(226,232,240,0.78)]',
);

export const devDevicePreviewToolbarSelectFaceClassName = cn(
  'pointer-events-none inline-flex min-w-0 max-w-[16rem] items-center gap-1.5',
);

export const devDevicePreviewToolbarSelectNameClassName = cn(
  'min-w-0 truncate font-medium text-[rgba(226,232,240,0.92)]',
);

export const devDevicePreviewToolbarSelectMetaClassName = cn(
  'shrink-0 tabular-nums tracking-wide text-[rgba(148,163,184,0.78)]',
);

export const devDevicePreviewToolbarSelectClassName = cn(
  'absolute inset-0 z-[1] cursor-pointer opacity-0',
);

/** Custom device picker menu (native <select> popup can't take our dark styles). */
export const devDevicePreviewPickerMenuClassName = cn(
  'absolute left-1/2 top-[calc(100%+0.375rem)] z-[20] min-w-[13.5rem] -translate-x-1/2',
  'max-h-[min(70vh,28rem)] overflow-y-auto overflow-x-hidden',
  'rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(15,23,42,0.96)]',
  'px-1.5 py-1.5 text-[0.6875rem] text-[rgba(226,232,240,0.92)]',
  'shadow-[0_12px_32px_rgba(0,0,0,0.45)]',
  '[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent]',
);

export const devDevicePreviewPickerGroupClassName = cn(
  'flex flex-col gap-0.5 pt-2 first:pt-0',
);

export const devDevicePreviewPickerGroupLabelClassName = cn(
  'inline-flex items-center gap-1 px-2 pb-1 pt-0.5',
  'text-[0.5625rem] font-semibold uppercase tracking-[0.06em]',
  'text-[rgba(148,163,184,0.72)]',
);

export const devDevicePreviewPickerItemClassName = cn(
  'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left',
  'text-[rgba(226,232,240,0.92)] transition-colors',
  'hover:bg-[rgba(148,163,184,0.14)]',
  'focus-visible:bg-[rgba(148,163,184,0.14)] focus-visible:outline-none',
);

export const devDevicePreviewPickerItemActiveClassName = cn(
  'bg-[rgba(148,163,184,0.2)] text-white',
);

export const devDevicePreviewPickerItemMetaClassName = cn(
  'shrink-0 tabular-nums tracking-wide text-[rgba(148,163,184,0.72)]',
);

export const devDevicePreviewToolbarBtnClassName = cn(
  'cursor-pointer',
  devDevicePreviewToolbarPillClassName,
  'hover:border-[rgba(148,163,184,0.55)] hover:bg-[rgba(30,41,59,0.8)]',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(148,163,184,0.45)]',
);

export const devDevicePreviewToolbarBtnActiveClassName = cn(
  'border-[rgba(148,163,184,0.65)] bg-[rgba(51,65,85,0.9)] text-white',
);

/** Fixed optical slot so Material Symbol side-bearings don't skew icon↔label gap. */
export const devDevicePreviewToolbarIconClassName = cn(
  'inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden leading-none',
);

export const devDevicePreviewBezelClassName = cn(
  'box-border flex flex-col overflow-hidden rounded-[0.875rem]',
  'bg-[rgb(244,244,245)]',
  // Drop shadow + soft rounded-rect halo (follows the viewport, not a circle).
  'shadow-[0_22px_56px_rgba(0,0,0,0.6),0_0_400px_rgba(186,198,214,0.42),0_0_800px_rgba(148,163,184,0.36),0_0_1400px_rgba(71,85,105,0.3),0_0_2000px_rgba(51,65,85,0.24)]',
  '[[data-dev-theme=light]_&]:shadow-[0_18px_44px_rgba(15,23,42,0.12),0_0_360px_rgba(148,163,184,0.48),0_0_760px_rgba(186,198,214,0.52),0_0_1300px_rgba(203,213,225,0.58),0_0_1900px_rgba(226,232,240,0.62)]',
);

export const devDevicePreviewViewportClassName = cn(
  'relative shrink-0 overflow-hidden bg-black',
);

export const devDevicePreviewIframeClassName = cn(
  'block h-full w-full border-0 bg-black',
);

/** Shared browser chrome — outside the measured CSS-px viewport. */
export const devDeviceBrowserChromeClassName = cn(
  'flex shrink-0 items-center gap-2.5 px-3',
  'bg-[rgb(244,244,245)] text-[rgb(100,116,139)]',
);

export const devDeviceBrowserChromeTrafficClassName = cn(
  'flex shrink-0 items-center gap-1.5',
);

export const devDeviceBrowserChromeDotClassName = cn(
  'size-[0.625rem] rounded-full',
);

export const devDeviceBrowserChromeAddressClassName = cn(
  'min-w-0 flex-1 truncate rounded-full bg-[rgb(228,228,231)]',
  'px-3 py-1 text-center text-[0.6875rem] font-medium leading-none',
  'text-[rgb(113,113,122)]',
);

export const devDeviceBrowserChromeBadgeClassName = cn(
  'max-w-[10rem] shrink-0 truncate rounded-full bg-[rgb(228,228,231)]',
  'px-2 py-1 text-[0.625rem] font-medium leading-none',
  'text-[rgb(113,113,122)]',
);

/** Responsive drag handles — sit on the viewport edge (pre-scale). */
export const devDevicePreviewResizeHandleEClassName = cn(
  'absolute top-0 right-0 z-[3] h-full w-2 cursor-ew-resize',
  'touch-none',
);

export const devDevicePreviewResizeHandleSClassName = cn(
  'absolute bottom-0 left-0 z-[3] h-2 w-full cursor-ns-resize',
  'touch-none',
);

export const devDevicePreviewResizeHandleSeClassName = cn(
  'absolute bottom-0 right-0 z-[4] size-3.5 cursor-nwse-resize',
  'touch-none',
  'after:absolute after:bottom-0.5 after:right-0.5 after:size-2',
  'after:rounded-sm after:border-r-2 after:border-b-2 after:border-[rgba(226,232,240,0.7)]',
);

/** Embed toolbar — Messages dropdown anchor. */
export const devDeviceEmbedMessagesWrapClassName = cn('relative shrink-0');

/** postMessage log popover under the Messages toolbar control. */
export const devDeviceEmbedMessagesMenuClassName = cn(
  'absolute left-1/2 top-[calc(100%+0.375rem)] z-[20] w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2',
  'flex max-h-[min(50vh,18rem)] flex-col overflow-hidden',
  'rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(15,23,42,0.96)]',
  'text-[0.6875rem] text-[rgba(226,232,240,0.88)]',
  'shadow-[0_12px_32px_rgba(0,0,0,0.45)]',
  'pt-7', // room for corner Clear / Close
);

export const devDeviceEmbedMessagesActionsClassName = cn(
  'absolute right-1 top-1 z-[1] flex items-center gap-0.5',
);

export const devDeviceEmbedMessagesBodyClassName = cn(
  'min-h-0 flex-1 overflow-y-auto px-3 pb-1.5',
  '[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent]',
);

export const devDeviceEmbedMessagesEntryClassName = cn(
  'font-mono text-[0.625rem] leading-snug text-[rgba(148,163,184,0.92)]',
  'break-all',
);

export const devDeviceEmbedMessagesEmptyClassName = cn(
  'text-[0.625rem] text-[rgba(148,163,184,0.65)]',
);

export const devDeviceEmbedMessagesIconBtnClassName = cn(
  'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent',
  'text-[rgba(148,163,184,0.75)]',
  'hover:bg-[rgba(148,163,184,0.14)] hover:text-[rgba(226,232,240,0.95)]',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(148,163,184,0.45)]',
);

/** Dev drawer — absolute left; open/close motion via `.dev-tools-panel-host`. */
export const devToolsDrawerRootClassName = cn(
  'absolute inset-y-0 left-0 z-[var(--tour-dev-z-index,300)]',
  'flex w-[min(26rem,100%)] max-w-full flex-col',
);

/**
 * Floating layout — inset card over the tour (does not change stage width).
 * Same chrome insets as the Dev FAB.
 */
export const devToolsFloatingRootClassName = cn(
  'absolute left-[var(--tour-chrome-inset-left,1rem)] top-[var(--tour-chrome-inset-top,1rem)] z-[var(--tour-dev-z-index,300)]',
  'flex w-[min(26rem,calc(100%-var(--tour-chrome-inset-left,1rem)-var(--tour-chrome-inset-right,1rem)))] flex-col',
  'max-[1023px]:top-auto max-[1023px]:bottom-[var(--tour-chrome-inset-bottom,1rem)]',
);

/** @deprecated Prefer {@link devToolsFloatingRootClassName}. */
export const devToolsStackClassName = devToolsFloatingRootClassName;

/**
 * Single host for Floating / Overlay / Push so `DevViewPanel` stays mounted
 * across layout changes. Motion: `.dev-tools-panel-host` in components-layer.
 */
export const devToolsPanelHostVariants = cva(
  cn('dev-tools-panel-host', 'min-h-0'),
  {
    variants: {
      layout: {
        floating: devToolsFloatingRootClassName,
        overlay: cn(
          devToolsDrawerRootClassName,
          'shadow-[8px_0_32px_rgba(0,0,0,0.45)]',
        ),
        push: devToolsDrawerRootClassName,
      },
    },
    defaultVariants: { layout: 'push' },
  },
);

/** Floating card chrome — overrides drawer edge-to-edge root. */
export const devViewPanelRootFloatingClassName = cn(
  // Grow with content up to the chrome safe-inset band (top → bottom).
  'h-auto max-h-[calc(100dvh-var(--tour-chrome-inset-top,1rem)-var(--tour-chrome-inset-bottom,1rem))]',
  'rounded-lg border border-[var(--dev-panel-border)] shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
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

/** Primary tab theme — panel chrome + header/tab-track borders. */
export type DevViewPanelChromeTab =
  | 'scene'
  | 'scenes'
  | 'naming'
  | 'tour'
  | 'client'
  | 'debug';

const DEV_PANEL_CHROME_BORDER = {
  scene: 'border-[rgba(74,222,128,0.4)]',
  scenes: 'border-[rgba(45,212,191,0.4)]',
  naming: 'border-[rgba(244,114,182,0.4)]',
  tour: 'border-[rgba(167,139,250,0.4)]',
  client: 'border-[rgba(56,189,248,0.4)]',
  debug: 'border-[rgba(250,204,21,0.4)]',
} as const satisfies Record<DevViewPanelChromeTab, string>;

const DEV_PANEL_CHROME_BORDER_MUTED = {
  scene: 'border-[rgba(74,222,128,0.22)]',
  scenes: 'border-[rgba(45,212,191,0.22)]',
  naming: 'border-[rgba(244,114,182,0.22)]',
  tour: 'border-[rgba(167,139,250,0.22)]',
  client: 'border-[rgba(56,189,248,0.22)]',
  debug: 'border-[rgba(250,204,21,0.22)]',
} as const satisfies Record<DevViewPanelChromeTab, string>;

/** Border + CSS vars for tab-panel primary accents (buttons, focus, checkboxes). */
const DEV_PANEL_ROOT_THEME = {
  scene: cn(
    DEV_PANEL_CHROME_BORDER.scene,
    '[--dev-panel-primary:#4ade80] [--dev-panel-primary-rgb:74,222,128] [--dev-panel-primary-deep:#166534] [--dev-panel-primary-deep-hover:#15803d]',
  ),
  scenes: cn(
    DEV_PANEL_CHROME_BORDER.scenes,
    '[--dev-panel-primary:#2dd4bf] [--dev-panel-primary-rgb:45,212,191] [--dev-panel-primary-deep:#0f766e] [--dev-panel-primary-deep-hover:#0d9488]',
  ),
  naming: cn(
    DEV_PANEL_CHROME_BORDER.naming,
    '[--dev-panel-primary:#f472b6] [--dev-panel-primary-rgb:244,114,182] [--dev-panel-primary-deep:#9d174d] [--dev-panel-primary-deep-hover:#be185d]',
  ),
  tour: cn(
    DEV_PANEL_CHROME_BORDER.tour,
    '[--dev-panel-primary:#a78bfa] [--dev-panel-primary-rgb:167,139,250] [--dev-panel-primary-deep:#5b21b6] [--dev-panel-primary-deep-hover:#6d28d9]',
  ),
  client: cn(
    DEV_PANEL_CHROME_BORDER.client,
    '[--dev-panel-primary:#38bdf8] [--dev-panel-primary-rgb:56,189,248] [--dev-panel-primary-deep:#0369a1] [--dev-panel-primary-deep-hover:#0284c7]',
  ),
  debug: cn(
    DEV_PANEL_CHROME_BORDER.debug,
    '[--dev-panel-primary:#facc15] [--dev-panel-primary-rgb:250,204,21] [--dev-panel-primary-deep:#a16207] [--dev-panel-primary-deep-hover:#ca8a04]',
  ),
} as const satisfies Record<DevViewPanelChromeTab, string>;

/**
 * Theme tokens for Dev panel + portaled menus (`data-dev-theme` on the host).
 * Kept shareable so body-portaled popovers keep the same fills/borders.
 */
export const devViewPanelThemeTokensClassName = cn(
  /*
   * Same paint model as tour glass: root/shell = continuous base (`--dev-panel-bg`),
   * body region clear, header = thin overlay on the shell.
   * Dark: black + shared --ishare-glass-*-alpha / chrome-overlay-alpha.
   * Light: white shell 0.94 + header wash ~0.333 → effective ~0.96.
   *
   * `--dev-panel-surface` elevates cards/tabs/groups above the body:
   * dark → black wash (darker); light → denser white (brighter / less bleed).
   */
  '[--dev-panel-bg:rgba(0,0,0,var(--ishare-glass-body-alpha,0.9))] [--dev-panel-body-bg:transparent] [--dev-panel-header-bg:rgba(0,0,0,var(--ishare-glass-chrome-overlay-alpha,0.5))]',
  '[--dev-panel-fg:#e2e8f0] [--dev-panel-muted:#94a3b8]',
  '[--dev-panel-input-bg:rgba(15,23,42,0.75)] [--dev-panel-input-fg:#f0fdf4]',
  '[--dev-panel-surface:rgba(0,0,0,0.35)]',
  '[--dev-panel-border:rgba(100,116,139,0.55)] [--dev-panel-divider:rgba(100,116,139,0.28)] [--dev-panel-title:#f0fdf4]',
  /* Client/tour logo plates — white well on dark; transparent fill on light; ring always. */
  '[--dev-panel-logo-plate:#ffffff] [--dev-panel-logo-plate-ring:rgba(148,163,184,0.45)]',
  /* Header chrome (Debug/Settings/Close) — fixed Dev green, not tab accent. */
  '[--dev-chrome-accent:#4ade80]',
  /* Light — denser white shell; thin header wash to keep ~0.96 effective. */
  'data-[dev-theme=light]:[--dev-panel-bg:rgba(255,255,255,0.94)] data-[dev-theme=light]:[--dev-panel-body-bg:transparent] data-[dev-theme=light]:[--dev-panel-header-bg:rgba(255,255,255,0.333)]',
  'data-[dev-theme=light]:[--dev-panel-fg:#0f172a]',
  'data-[dev-theme=light]:[--dev-panel-muted:#475569] data-[dev-theme=light]:[--dev-panel-input-bg:#ffffff]',
  'data-[dev-theme=light]:[--dev-panel-input-fg:#0f172a] data-[dev-theme=light]:[--dev-panel-surface:rgba(255,255,255,0.72)]',
  'data-[dev-theme=light]:[--dev-panel-border:rgba(15,23,42,0.18)] data-[dev-theme=light]:[--dev-panel-divider:rgba(15,23,42,0.09)] data-[dev-theme=light]:[--dev-panel-title:#0f172a]',
  'data-[dev-theme=light]:[--dev-panel-logo-plate:transparent] data-[dev-theme=light]:[--dev-panel-logo-plate-ring:rgba(15,23,42,0.16)]',
);

export const devViewPanelRootVariants = cva(
  cn(
    // Continuous base glass on the root — body region stays clear; header overlays.
    // Theme tokens: --dev-panel-* set via data-dev-theme on the root.
    'flex h-full min-h-0 w-full flex-col overflow-hidden border-y-0 border-l-0 border-r bg-[var(--dev-panel-bg)] font-mono text-xs text-[var(--dev-panel-fg)]',
    'transition-[border-color,background-color,color] duration-200 ease-out motion-reduce:transition-none',
    devViewPanelThemeTokensClassName,
  ),
  {
    variants: { tab: DEV_PANEL_ROOT_THEME },
    defaultVariants: { tab: 'scene' },
  },
);

/** @deprecated Prefer {@link devViewPanelRootVariants}. */
export const devViewPanelRootClassName = devViewPanelRootVariants({
  tab: 'scene',
});

export const devViewPanelStickyHeaderVariants = cva(
  'sticky top-0 z-[2] shrink-0 flex flex-col gap-2.5 border-b bg-[var(--dev-panel-header-bg)] px-3.5 pb-3.5 pt-3.5 transition-[border-color,background-color] duration-200 ease-out motion-reduce:transition-none',
  {
    variants: { tab: DEV_PANEL_CHROME_BORDER_MUTED },
    defaultVariants: { tab: 'scene' },
  },
);

/** Ghost icon control in the sticky tour row (Debug / Settings / Close). */
export const devViewPanelHeaderIconBtnClassName = cn(
  'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent',
  'text-[var(--dev-panel-muted,#94a3b8)]',
  'transition-colors duration-150 ease-out',
  'hover:text-[var(--dev-panel-fg)]',
  'focus-visible:outline-none focus-visible:text-[color:var(--dev-chrome-accent,#4ade80)]',
  'motion-reduce:transition-none',
  devViewPanelControlRadiusClassName,
);

/** Open icon state — Dev chrome green, no outline box. */
export const devViewPanelHeaderIconBtnActiveClassName = cn(
  'text-[color:var(--dev-chrome-accent,#4ade80)]',
  'hover:text-[color:var(--dev-chrome-accent,#4ade80)]',
);

/** @deprecated Prefer {@link devViewPanelHeaderIconBtnActiveClassName}. */
export const devViewPanelHeaderIconBtnOpenClassName =
  devViewPanelHeaderIconBtnActiveClassName;

/** Shared anchor for Debug / Settings — menus align to this cluster’s right edge. */
export const devViewPanelHeaderPopoversClassName = cn(
  'relative ml-auto flex shrink-0 items-center gap-0.5',
);

/**
 * Base shell for header popovers — portaled + `fixed` (position via inline style)
 * so floating panel `overflow-hidden` / radius clip cannot cut them off.
 */
const devViewPanelPopoverShellClassName = cn(
  'fixed z-[var(--tour-dev-menu-z-index,310)] font-mono text-xs text-[var(--dev-panel-fg)]',
  'border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-bg)] shadow-[0_10px_24px_rgba(15,23,42,0.35)]',
  'flex flex-col',
  devViewPanelThemeTokensClassName,
  devViewPanelControlRadiusClassName,
);

/** Corner close control for header popovers (no title bar). */
export const devViewPanelPopoverCloseBtnClassName = cn(
  'absolute right-1 top-1 z-[1] inline-flex size-6 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent',
  'text-[var(--dev-panel-muted,#94a3b8)]',
  'transition-[color,background-color] duration-150 ease-out',
  'hover:bg-[var(--dev-panel-surface)] hover:text-[var(--dev-panel-fg)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--dev-chrome-accent,#4ade80)]',
  'motion-reduce:transition-none',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelThemeMenuClassName = cn(
  devViewPanelPopoverShellClassName,
  'w-max min-w-[9.5rem] max-w-[min(100vw-1.5rem,14rem)] gap-2 px-1.5 pb-1.5 pt-1.5 pr-7',
  'max-h-[min(85vh,36rem)] overflow-y-auto overflow-x-hidden',
);

/** Debug tools popover — wider; body scrolls under a fixed corner close. */
export const devViewPanelDebugMenuClassName = cn(
  devViewPanelPopoverShellClassName,
  // Keep accents on Dev green — debug chrome tab would otherwise tint these yellow.
  '[--dev-panel-primary:var(--dev-chrome-accent,#4ade80)]',
  'w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(85vh,42rem)] overflow-hidden',
  'gap-2 px-2 pb-2 pt-1.5',
);

export const devViewPanelDebugMenuBodyClassName = cn(
  // Thin bar via global `.ishare-scrollbar` (avoid scrollbar-width on Chromium — classic OS bar).
  'ishare-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden',
  'pr-4', // room for corner close + thin bar
  // Theme-aware thumb (default ishare colors are for light glass)
  '[&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--dev-panel-muted)_65%,transparent)]',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--dev-panel-fg)_50%,transparent)]',
  // Section dividers between URL flags / lights / Ask Guide
  '[&>*:not(:first-child)]:mt-3.5 [&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-[color:var(--dev-panel-border)] [&>*:not(:first-child)]:pt-3.5',
);

export const devViewPanelSettingsGroupClassName = cn('flex flex-col gap-0.5');

export const devViewPanelSettingsGroupLabelClassName = cn(
  'px-1.5 pb-1 text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-[var(--dev-panel-muted)]',
);

/** Compact range row — label | slider | value. */
export const devViewPanelRangeFieldClassName = cn(
  'grid min-w-0 grid-cols-[4.25rem_minmax(0,1fr)_3rem] items-center gap-x-2 px-0.5',
  'text-[0.625rem] leading-none',
);

export const devViewPanelRangeLabelClassName = cn(
  'truncate font-medium text-[var(--dev-panel-muted)]',
);

export const devViewPanelRangeValueClassName = cn(
  'truncate text-right tabular-nums text-[var(--dev-panel-muted)]',
);

export const devViewPanelRangeValueActiveClassName = cn(
  'text-[color:var(--dev-panel-primary,#4ade80)]',
);

/**
 * Idle range — fixed hit box so Intensity / Tone stay the same height.
 * Track 4px (`h-1`), thumb 12px (`size-3`), thumb mt -4px to center on track.
 */
export const devViewPanelRangeInputClassName = cn(
  'block h-3.5 w-full cursor-pointer appearance-none bg-transparent accent-transparent',
  // WebKit track / thumb
  '[&::-webkit-slider-runnable-track]:block [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full',
  '[&::-webkit-slider-runnable-track]:bg-[color-mix(in_srgb,var(--dev-panel-muted)_32%,transparent)]',
  '[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:box-border [&::-webkit-slider-thumb]:size-3',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[var(--dev-panel-muted)]',
  // Firefox
  '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full',
  '[&::-moz-range-track]:bg-[color-mix(in_srgb,var(--dev-panel-muted)_32%,transparent)]',
  '[&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--dev-panel-muted)]',
);

/** Non-default range — primary accent on track + thumb (colors only; same geometry). */
export const devViewPanelRangeInputActiveClassName = cn(
  '[&::-webkit-slider-runnable-track]:bg-[color-mix(in_srgb,var(--dev-panel-primary)_45%,transparent)]',
  '[&::-webkit-slider-thumb]:bg-[var(--dev-panel-primary)]',
  '[&::-moz-range-track]:bg-[color-mix(in_srgb,var(--dev-panel-primary)_45%,transparent)]',
  '[&::-moz-range-thumb]:bg-[var(--dev-panel-primary)]',
);

export const devViewPanelSettingsRadioListClassName = cn('flex flex-col');

export const devViewPanelSettingsRadioOptionClassName = cn(
  'flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1.5 py-1.5 text-left text-2xs text-[var(--dev-panel-muted)]',
  'hover:bg-[var(--dev-panel-surface)] hover:text-[var(--dev-panel-fg)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--dev-panel-primary,#38bdf8)]',
);

export const devViewPanelSettingsRadioOptionActiveClassName = cn(
  'bg-[var(--dev-panel-surface)] font-semibold text-[var(--dev-panel-fg)]',
);

export const devViewPanelSettingsRadioMarkClassName = cn(
  'inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border border-[color:var(--dev-panel-border)]',
);

export const devViewPanelSettingsRadioMarkCheckedClassName = cn(
  'border-[color:var(--dev-chrome-accent,#4ade80)]',
  'after:block after:size-1.5 after:rounded-full after:bg-[color:var(--dev-chrome-accent,#4ade80)]',
);

/** @deprecated Prefer {@link devViewPanelStickyHeaderVariants}. */
export const devViewPanelStickyHeaderClassName =
  devViewPanelStickyHeaderVariants({ tab: 'scene' });

export const devViewPanelBodyClassName = cn(
  'flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-[var(--dev-panel-body-bg)] px-3.5 pb-0 pt-2.5',
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
);

export const DEV_PANEL_TITLE_TEXT = {
  scene: 'text-[#4ade80]',
  scenes: 'text-[#2dd4bf]',
  naming: 'text-[#f472b6]',
  tour: 'text-[#a78bfa]',
  client: 'text-[#38bdf8]',
  debug: 'text-[#facc15]',
} as const satisfies Record<DevViewPanelChromeTab, string>;

export const devViewPanelTitleVariants = cva(
  'm-0 font-bold uppercase tracking-[0.05em]',
  {
    variants: { tab: DEV_PANEL_TITLE_TEXT },
    defaultVariants: { tab: 'scene' },
  },
);

/** @deprecated Prefer {@link devViewPanelTitleVariants}. */
export const devViewPanelTitleClassName = devViewPanelTitleVariants({
  tab: 'scene',
});

export const devViewPanelStickyTourTitleClassName = cn(
  'm-0 text-xs font-semibold leading-snug text-[var(--dev-panel-title,#f0fdf4)]',
);

export const devViewPanelStickyTourClientClassName = cn(
  'font-normal text-[var(--dev-panel-muted,#94a3b8)]',
);

export const devViewPanelTourSwitcherClassName = cn(
  'flex min-w-0 items-center gap-2.5',
);

export const devViewPanelStickyTourLogoWrapClassName = cn(
  'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full p-1',
  'bg-[var(--dev-panel-logo-plate,#ffffff)]',
  'shadow-[inset_0_0_0_1px_var(--dev-panel-logo-plate-ring,transparent)]',
);

export const devViewPanelStickyTourLogoClassName = cn(
  'block max-h-full max-w-full object-contain object-center',
);

export const devViewPanelTourSwitchAnchorClassName = cn(
  'relative min-w-0 max-w-full',
);

export const devViewPanelTourSwitchTriggerClassName = cn(
  'inline-flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 border border-transparent px-2 py-0.5 text-left',
  devViewPanelControlRadiusClassName,
  'text-xs font-semibold leading-snug text-[var(--dev-panel-title,#f0fdf4)]',
  'hover:border-[color:var(--dev-panel-border)] hover:bg-[var(--dev-panel-surface)]',
  'focus-visible:border-[color:var(--dev-panel-primary,#38bdf8)] focus-visible:outline-none',
);

export const devViewPanelTourSwitchChevronClassName = cn(
  'h-5 w-5 shrink-0 text-[var(--dev-panel-muted)]',
);

export const devViewPanelTourSwitchMenuClassName = cn(
  'fixed z-[var(--tour-dev-menu-z-index,310)] w-max max-w-[min(100vw-1rem,22rem)] max-h-[min(60vh,420px)] overflow-y-auto border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-bg)] px-1.5 py-1.5 text-[var(--dev-panel-fg)] shadow-[0_10px_24px_rgba(15,23,42,0.35)]',
  devViewPanelThemeTokensClassName,
  devViewPanelControlRadiusClassName,
  '[scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,var(--dev-panel-muted)_55%,transparent)_transparent]',
);

/** Client name row — non-interactive group label above its tours. */
export const devViewPanelTourSwitchGroupHeadingClassName = cn(
  'block px-2 pb-1 pt-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.06em]',
  'text-[color-mix(in_srgb,var(--dev-panel-muted)_72%,transparent)]',
);

/** One client block in the tour switcher (heading + tours). */
export const devViewPanelTourSwitchGroupClassName = cn(
  'flex flex-col gap-0.5 pt-3 first:pt-1.5',
);

export const devViewPanelTourSwitchMenuItemClassName = cn(
  'flex w-full cursor-pointer items-center rounded-full px-2.5 py-1.5 text-left text-2xs',
  'text-[var(--dev-panel-fg)] transition-colors',
  'hover:bg-[color-mix(in_srgb,var(--dev-panel-fg)_8%,transparent)] hover:text-[var(--dev-panel-title)]',
  'focus-visible:bg-[color-mix(in_srgb,var(--dev-panel-fg)_8%,transparent)] focus-visible:outline-none',
);

/** Top action in the tour switcher (e.g. Intro gallery). */
export const devViewPanelTourSwitchActionItemClassName = cn(
  'flex w-full cursor-pointer items-center gap-2 rounded-full px-2.5 py-1.5 text-left text-2xs',
  'text-[var(--dev-panel-fg)] transition-colors',
  'hover:bg-[color-mix(in_srgb,var(--dev-panel-fg)_8%,transparent)] hover:text-[var(--dev-panel-title)]',
  'focus-visible:bg-[color-mix(in_srgb,var(--dev-panel-fg)_8%,transparent)] focus-visible:outline-none',
);

export const devViewPanelTourSwitchMenuRuleClassName = cn(
  'my-1.5 border-0 border-t border-[color:var(--dev-panel-border)]',
);

export const devViewPanelTourSwitchMenuItemActiveClassName = cn(
  'bg-[color-mix(in_srgb,var(--dev-panel-primary,#4ade80)_20%,transparent)]',
  'font-medium text-[color:var(--dev-panel-primary,#4ade80)]',
  'hover:bg-[color-mix(in_srgb,var(--dev-panel-primary,#4ade80)_28%,transparent)]',
  'hover:text-[color:var(--dev-panel-primary,#4ade80)]',
  'focus-visible:bg-[color-mix(in_srgb,var(--dev-panel-primary,#4ade80)_28%,transparent)]',
);

export const devViewPanelSceneIdClassName = cn(
  'font-medium normal-case tracking-normal text-[color:var(--dev-panel-primary,#4ade80)]',
);

export const devViewPanelSectionClassName = cn('flex flex-col');

/**
 * Stacked accordion root — children are `section`s that carry their own pad
 * via {@link devViewPanelSectionStackItemClassName} (applied by the accordion).
 */
export const devViewPanelSectionStackClassName = cn('flex flex-col');

/** Nested manage-group accordion root. */
export const devViewPanelNestedSectionStackClassName = cn(
  'flex flex-col',
  '[&_h3]:normal-case [&_h3]:tracking-normal',
);

/**
 * Same `py` on every section — divider sits between equal top/bottom pads
 * (no first/last `pt-0`/`pb-0` special cases).
 */
export const devViewPanelSectionStackItemClassName = cn('py-5');
export const devViewPanelSectionStackItemNestedClassName = cn('py-2.5');
export const devViewPanelSectionStackItemRuleClassName = cn(
  'border-t border-[color:var(--dev-panel-divider,var(--dev-panel-border))]',
);

/** Tab panels host the accordion; stack padding is on each section item. */
export const devViewPanelTabPanelClassName = cn('flex flex-col');

export const devViewPanelSubsectionClassName = cn(
  'mt-5 border-t border-[color:var(--dev-panel-border)] pt-5',
);

export const devViewPanelFormSectionClassName = cn('flex flex-col gap-3');

export const devViewPanelFormSectionBodyClassName = cn('flex flex-col gap-3');

/** Save / error block below stacked form subsections (owns the submit divider). */
export const devViewPanelStackedFormFooterClassName = cn(
  'mt-5 flex flex-col gap-3 border-t border-[color:var(--dev-panel-border)] pt-4',
);

/**
 * Manage-tab inline edit — flows inside active list row (no nested card).
 * Top rule separates preview from fields; submit rows use
 * {@link devViewPanelActionsClassName} (divider above Cancel/Save).
 */
export const devViewPanelManageEditFormClassName = cn(
  'mt-3 flex flex-col gap-3 border-t border-[color:var(--dev-panel-border)] pt-4',
);

export const devViewPanelSectionHeaderClassName = cn('flex flex-col gap-1.5');

export const devViewPanelSectionHeaderCollapsibleClassName = cn(
  'group flex flex-row items-center justify-between gap-2.5',
  /* Chevron color already signals focus — a browser outline hugs the header and
   * makes the gap above the next divider look smaller than the matching pt below. */
  'outline-none focus-visible:outline-none',
);

/** Collapsible section header — whole row toggles expand/collapse. */
export const devViewPanelSectionChevronClassName = cn(
  'shrink-0 text-[var(--dev-panel-muted)] transition-[transform,color] duration-200',
  'group-hover:text-[color:var(--dev-panel-primary,#4ade80)] group-focus-visible:text-[color:var(--dev-panel-primary,#4ade80)]',
);

export const devViewPanelSectionChevronOpenClassName = cn(
  'rotate-180 text-[color:var(--dev-panel-primary,#4ade80)]',
);

export const devViewPanelSectionDescriptionClassName = cn('space-y-1');

export const devViewPanelSectionContentClassName = cn(
  'mt-3 flex flex-col gap-3',
);

export const devViewPanelFormGroupClassName = cn(
  'flex flex-col gap-3 border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] p-3',
  devViewPanelControlRadiusClassName,
);

/** Form group whose children (subsections) supply their own vertical rhythm. */
export const devViewPanelFormGroupStackedClassName = cn(
  devViewPanelFormGroupClassName,
  'gap-0',
);

export const devViewPanelInlineFormGroupClassName = cn(
  'mt-2 flex flex-col gap-3 border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] p-2.5',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFormRowClassName = cn(
  'grid grid-cols-2 gap-x-3 gap-y-3',
);

export const devViewPanelFormRow3ClassName = cn(
  'grid grid-cols-3 gap-x-2 gap-y-3',
);

export const devViewPanelTabPanelBodyClassName = cn('flex flex-col gap-2.5');

export const devViewPanelSectionTitleClassName = cn(
  'm-0 text-2xs font-bold uppercase tracking-[0.06em] text-[var(--dev-panel-title,#f0fdf4)]',
);

export const devViewPanelFormGroupTitleClassName = cn(
  'm-0 text-2xs font-bold uppercase tracking-[0.06em] text-[var(--dev-panel-title,#f0fdf4)]',
);

/** In-section group heading (e.g. Experience, Organization inside Tour). */
export const devViewPanelSubsectionTitleClassName = cn(
  devViewPanelSectionTitleClassName,
  'mt-5 border-t border-[color:var(--dev-panel-border)] pt-5',
);

export const devViewPanelSectionLeadClassName = cn(
  'm-0 text-2xs leading-[1.35] text-[var(--dev-panel-muted,#64748b)] [&_code]:text-[color:var(--dev-panel-primary,#86efac)]',
);

/** Tab-panel intro under the primary tab strip. */
export const devViewPanelTabLeadClassName = cn(
  devViewPanelSectionLeadClassName,
);

export const devViewPanelCoordsClassName = cn(
  'm-0 break-all bg-[var(--dev-panel-surface)] px-2 py-1.5 text-2xs leading-[1.4] text-[var(--dev-panel-input-fg)]',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFieldClassName = cn('flex flex-col gap-1.5');

export const devViewPanelFieldLabelClassName = cn(
  'text-2xs text-[var(--dev-panel-muted,#94a3b8)]',
);

export const devViewPanelInputClassName = cn(
  'box-border w-full border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-input-bg)] px-2.5 py-1.5 font-[inherit] text-2xs text-[var(--dev-panel-input-fg)] placeholder:text-[var(--dev-panel-muted,#64748b)] focus:border-[color:var(--dev-panel-primary,#38bdf8)] focus:outline-none',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFileFieldClassName = cn(
  'flex flex-col overflow-hidden border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-input-bg)]',
  devViewPanelControlRadiusClassName,
  'focus-within:border-[color:var(--dev-panel-primary,#38bdf8)]',
);

export const devViewPanelFileFieldPreviewClassName = cn(
  'border-t border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] px-2.5 py-2',
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
  'shrink-0 cursor-pointer border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-input-bg)] px-1.5 py-0.5 font-[inherit] text-[0.625rem] text-[var(--dev-panel-input-fg)] hover:bg-[var(--dev-panel-surface)]',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFileInputRowClassName = cn(
  'flex min-w-0 items-center gap-2 px-2.5 py-1.5',
);

export const devViewPanelFileChooseBtnClassName = cn(
  'shrink-0 cursor-pointer border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-input-bg)] px-2 py-1 font-[inherit] text-2xs text-[var(--dev-panel-input-fg)] hover:enabled:bg-[var(--dev-panel-surface)]',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelFileNameClassName = cn(
  'min-w-0 flex-1 truncate font-[inherit] text-2xs text-[var(--dev-panel-input-fg)]',
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
  'cursor-pointer appearance-none pr-7 [background-image:linear-gradient(45deg,transparent_50%,var(--dev-panel-muted)_50%),linear-gradient(135deg,var(--dev-panel-muted)_50%,transparent_50%)] [background-position:calc(100%-14px)_calc(50%+2px),calc(100%-9px)_calc(50%+2px)] [background-size:5px_5px,5px_5px] [background-repeat:no-repeat]',
);

export const devViewPanelScrollbarClassName = cn(
  '[scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,var(--dev-panel-muted)_55%,transparent)_transparent]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--dev-panel-muted)_55%,transparent)]',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--dev-panel-fg)_45%,transparent)]',
  '[&::-webkit-scrollbar-corner]:bg-[var(--dev-panel-input-bg)]',
);

export const devViewPanelTextareaClassName = cn(
  devViewPanelInputClassName,
  devViewPanelScrollbarClassName,
  // Default for plain textareas. Auto-grow description fields override
  // resize/overflow in DevPanelDescriptionTextarea.
  'min-h-[56px] resize-y overflow-y-auto leading-[1.4]',
);

export const devViewPanelSlugPreviewClassName = cn(
  'm-0 text-2xs leading-[1.4] text-[var(--dev-panel-muted)] [&_code]:text-[color:var(--dev-panel-primary,#4ade80)]',
);

/** Plain button row — Suggest, list CTAs, nested inside a stacked footer. */
export const devViewPanelInlineActionsClassName = cn('flex flex-wrap gap-2');

/**
 * Form action row (all forms) — top divider above Cancel/Save · Create · Apply.
 * Use {@link devViewPanelInlineActionsClassName} when a divider would be wrong
 * (Suggest, Open/Edit list rows, or buttons already inside
 * {@link devViewPanelStackedFormFooterClassName}).
 */
export const devViewPanelActionsClassName = cn(
  'flex flex-wrap gap-2 border-t border-[color:var(--dev-panel-border)] pt-4',
);

export const devViewPanelColorFieldClassName = cn(
  'flex items-center gap-1.5 py-1.5 pl-1.5 pr-2 overflow-hidden border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-input-bg)]',
  devViewPanelControlRadiusClassName,
  'focus-within:border-[color:var(--dev-panel-primary,#38bdf8)]',
);

export const devViewPanelColorInputInnerClassName = cn(
  'min-w-0 flex-1 border-none bg-transparent px-0.5 py-0.5 font-[inherit] text-2xs text-[var(--dev-panel-input-fg)] placeholder:text-[var(--dev-panel-muted)] outline-none',
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
    'cursor-pointer whitespace-nowrap border px-2.5 py-1.5 font-[inherit] text-2xs leading-[1.35] disabled:cursor-not-allowed disabled:opacity-40',
    devViewPanelControlRadiusClassName,
  ),
  {
    variants: {
      tone: {
        primary:
          'border-[color:var(--dev-panel-primary,#4ade80)] bg-[color:var(--dev-panel-primary,#4ade80)] text-[#0f172a] hover:enabled:border-[color:var(--dev-panel-primary-deep-hover,#15803d)] hover:enabled:bg-[color:var(--dev-panel-primary-deep-hover,#15803d)] hover:enabled:text-[#f0fdf4]',
        secondary:
          'border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-input-bg)] text-[var(--dev-panel-input-fg)] hover:enabled:bg-[var(--dev-panel-surface)]',
        danger:
          'border-[#f87171] bg-[#7f1d1d] text-[#f0fdf4] hover:enabled:bg-[#991b1b]',
        /** Scene tab (current view) — green */
        scene:
          'border-[#4ade80] bg-[rgba(74,222,128,0.28)] text-[#166534] hover:enabled:bg-[rgba(74,222,128,0.38)] [[data-dev-theme=dark]_&]:text-[#bbf7d0]',
        /** Scenes catalog tab — teal */
        scenes:
          'border-[#2dd4bf] bg-[rgba(45,212,191,0.28)] text-[#0f766e] hover:enabled:bg-[rgba(45,212,191,0.38)] [[data-dev-theme=dark]_&]:text-[#99f6e4]',
        nav: 'border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#0369a1] hover:enabled:bg-[rgba(56,189,248,0.38)] [[data-dev-theme=dark]_&]:text-[#bae6fd]',
        /** Client tab — sky (same family as nav) */
        client:
          'border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#0369a1] hover:enabled:bg-[rgba(56,189,248,0.38)] [[data-dev-theme=dark]_&]:text-[#bae6fd]',
        /** Tour tab — violet */
        tour: 'border-[#a78bfa] bg-[rgba(167,139,250,0.28)] text-[#5b21b6] hover:enabled:bg-[rgba(167,139,250,0.38)] [[data-dev-theme=dark]_&]:text-[#ddd6fe]',
        naming:
          'border-[#f472b6] bg-[rgba(244,114,182,0.28)] text-[#9d174d] hover:enabled:bg-[rgba(244,114,182,0.38)] [[data-dev-theme=dark]_&]:text-[#fbcfe8]',
        info: 'border-[#facc15] bg-[rgba(250,204,21,0.28)] text-[#a16207] hover:enabled:bg-[rgba(250,204,21,0.38)] [[data-dev-theme=dark]_&]:text-[#fef08a]',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

export const devViewPanelSectionHintClassName = cn(
  'm-0 text-2xs leading-[1.35] text-[var(--dev-panel-muted)]',
);

/** Hint below Manage / Create or tertiary tabs — centered with tab row. */
export const devViewPanelTabHintClassName = cn(
  devViewPanelSectionHintClassName,
  'text-center',
);

export const devViewPanelHotspotSectionClassName = cn('flex flex-col gap-1.5');

export const devViewPanelPrimaryTabsVariants = cva(
  cn(
    'flex gap-1 border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] p-1 transition-[border-color] duration-150',
    devViewPanelControlRadiusClassName,
  ),
  {
    variants: { tab: DEV_PANEL_CHROME_BORDER },
    defaultVariants: { tab: 'scene' },
  },
);

/** @deprecated Prefer {@link devViewPanelPrimaryTabsVariants}. */
export const devViewPanelPrimaryTabsClassName = devViewPanelPrimaryTabsVariants(
  { tab: 'scene' },
);

/** Section mode tabs — Manage / Create, Existing / New client. */
export const devViewPanelSecondaryTabsClassName = cn(
  'flex gap-0.5 border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] p-0.5',
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
  'relative inline-flex w-auto items-stretch rounded-full bg-[var(--dev-panel-surface)] p-0.5 ring-1 ring-[color:var(--dev-panel-border)]',
);

export const devViewPanelTertiaryTabIndicatorClassName = cn(
  'pointer-events-none absolute top-0.5 bottom-0.5 left-0 z-0 rounded-full bg-[color-mix(in_srgb,var(--dev-panel-muted)_28%,transparent)] opacity-0 motion-reduce:transition-none',
);

export const devViewPanelTertiaryTabIndicatorReadyClassName = cn(
  'opacity-100 transition-[left,width,opacity] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
);

export const devViewPanelTertiaryTabButtonVariants = cva(
  'relative z-[1] shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 bg-transparent px-5 py-1 font-[inherit] text-2xs font-medium uppercase tracking-[0.03em] transition-colors',
  {
    variants: {
      active: {
        true: 'text-[var(--dev-panel-fg)]',
        false: 'text-[var(--dev-panel-muted)] hover:text-[var(--dev-panel-fg)]',
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
  'sticky top-0 z-[1] shrink-0 bg-[var(--dev-panel-header-bg)]',
);

export const devViewPanelTabVariants = cva(
  'cursor-pointer border-0 font-[inherit] transition-colors',
  {
    variants: {
      depth: {
        primary: cn(
          'flex-1 border px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-[0.04em]',
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
        scenes: '',
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
        class:
          'border-transparent bg-transparent text-[var(--dev-panel-muted)] hover:text-[var(--dev-panel-fg)]',
      },
      {
        depth: 'secondary',
        active: false,
        class:
          'bg-transparent text-[var(--dev-panel-muted)] hover:text-[var(--dev-panel-fg)]',
      },
      {
        depth: 'tertiary',
        active: false,
        class:
          'border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] text-[var(--dev-panel-muted)] hover:text-[var(--dev-panel-fg)]',
      },
      {
        depth: 'primary',
        kind: 'client',
        active: true,
        class:
          'border-[rgba(56,189,248,0.55)] bg-[rgba(56,189,248,0.22)] text-[#0369a1] [[data-dev-theme=dark]_&]:text-[#7dd3fc]',
      },
      {
        depth: 'primary',
        kind: 'tour',
        active: true,
        class:
          'border-[rgba(167,139,250,0.55)] bg-[rgba(167,139,250,0.22)] text-[#5b21b6] [[data-dev-theme=dark]_&]:text-[#c4b5fd]',
      },
      {
        depth: 'primary',
        kind: 'scenes',
        active: true,
        class:
          'border-[rgba(45,212,191,0.55)] bg-[rgba(45,212,191,0.22)] text-[#0f766e] [[data-dev-theme=dark]_&]:text-[#5eead4]',
      },
      {
        depth: 'primary',
        kind: 'naming',
        active: true,
        class:
          'border-[rgba(244,114,182,0.55)] bg-[rgba(244,114,182,0.22)] text-[#9d174d] [[data-dev-theme=dark]_&]:text-[#f9a8d4]',
      },
      {
        depth: 'primary',
        kind: 'scene',
        active: true,
        class:
          'border-[rgba(74,222,128,0.55)] bg-[rgba(74,222,128,0.22)] text-[#166534] [[data-dev-theme=dark]_&]:text-[#86efac]',
      },
      {
        depth: 'primary',
        kind: 'debug',
        active: true,
        class:
          'border-[rgba(250,204,21,0.55)] bg-[rgba(250,204,21,0.22)] text-[#a16207] [[data-dev-theme=dark]_&]:text-[#fde047]',
      },
      {
        depth: 'secondary',
        kind: 'manage',
        active: true,
        class:
          'bg-[color-mix(in_srgb,var(--dev-panel-muted)_22%,transparent)] text-[var(--dev-panel-fg)]',
      },
      {
        depth: 'secondary',
        kind: 'create',
        active: true,
        class:
          'bg-[rgba(74,222,128,0.15)] text-[#166534] [[data-dev-theme=dark]_&]:text-[#86efac]',
      },
      {
        depth: 'tertiary',
        kind: 'nav',
        active: true,
        class:
          'border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#0369a1] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)] [[data-dev-theme=dark]_&]:text-[#bae6fd]',
      },
      {
        depth: 'tertiary',
        kind: 'naming',
        active: true,
        class:
          'border-[#f472b6] bg-[rgba(244,114,182,0.28)] text-[#9d174d] shadow-[inset_0_0_0_1px_rgba(244,114,182,0.18)] [[data-dev-theme=dark]_&]:text-[#fbcfe8]',
      },
      {
        depth: 'tertiary',
        kind: 'info',
        active: true,
        class:
          'border-[#facc15] bg-[rgba(250,204,21,0.28)] text-[#a16207] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)] [[data-dev-theme=dark]_&]:text-[#fef08a]',
      },
      {
        depth: 'tertiary',
        kind: 'tour',
        active: true,
        class:
          'border-[#a78bfa] bg-[rgba(167,139,250,0.28)] text-[#5b21b6] shadow-[inset_0_0_0_1px_rgba(167,139,250,0.18)] [[data-dev-theme=dark]_&]:text-[#ddd6fe]',
      },
      {
        depth: 'tertiary',
        kind: 'scene',
        active: true,
        class:
          'border-[#4ade80] bg-[rgba(74,222,128,0.24)] text-[#166534] shadow-[inset_0_0_0_1px_rgba(74,222,128,0.18)] [[data-dev-theme=dark]_&]:text-[#bbf7d0]',
      },
    ],
    defaultVariants: { depth: 'secondary', active: false },
  },
);

export const devViewPanelToggleListClassName = cn(
  'm-0 flex flex-col gap-1 p-0',
);

/** Checkbox row — grid; box optically aligned to the first text line. */
export const devViewPanelToggleLabelClassName = cn(
  'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 gap-y-0 px-0.5 py-0',
  'text-2xs leading-[1.35]',
  // Idle label → panel fg; checked → tab primary (matches checkbox fill)
  'text-[var(--dev-panel-fg,#f1f5f9)]',
  'has-[:checked]:text-[color:var(--dev-panel-primary,#4ade80)]',
  'hover:opacity-90',
  devViewPanelControlRadiusClassName,
);

/** Multi-line toggle copy (e.g. debug URL flags with hint suffix). */
export const devViewPanelToggleLabelMultilineClassName =
  devViewPanelToggleLabelClassName;

/**
 * Custom checkbox — styles in `components-layer.css` (`.dev-panel-checkbox`)
 * so the checked tick isn’t lost to Tailwind bg utility clashes.
 */
export const devViewPanelToggleInputClassName = cn(
  'dev-panel-checkbox',
  // mt nudges the 12px box to the cap-height of text-2xs / leading 1.35
  'mt-[0.12em] size-3 shrink-0 cursor-pointer',
);

/** Checkbox row inside form grids — same layout as devViewPanelToggleLabelClassName. */
export const devViewPanelFormCheckboxLabelClassName =
  devViewPanelToggleLabelClassName;

export const devViewPanelFormCheckboxInputClassName =
  devViewPanelToggleInputClassName;

/** Exclusive choice row — same layout as checkbox toggle; circular control. */
export const devViewPanelFormRadioLabelClassName =
  devViewPanelToggleLabelClassName;

export const devViewPanelFormRadioInputClassName = cn(
  'dev-panel-radio',
  'mt-[0.12em] size-3 shrink-0 cursor-pointer',
);

/**
 * Stack of checkbox(+hint) fields inside one form row.
 * Tighter than section `gap-3` so related toggles read as one cluster.
 */
export const devViewPanelFormCheckboxStackClassName = cn(
  'col-span-2 flex flex-col gap-2',
);

/**
 * Copy column beside the checkbox (title + optional desc).
 * Keeps desc left-aligned with the label text, not under the box.
 */
export const devViewPanelFormCheckboxFieldClassName = cn(
  'flex min-w-0 flex-col gap-0.5 leading-[1.35]',
);

export const devViewPanelToggleTextClassName = cn('min-w-0 leading-[1.35]');

export const devViewPanelToggleNameClassName = cn(
  devViewPanelToggleTextClassName,
  'font-semibold',
);

/** Param / technical id after a title (`Title · key`). */
export const devViewPanelToggleParamClassName = cn(
  'font-normal text-[var(--dev-panel-muted,#94a3b8)] [&_code]:text-inherit',
);

export const devViewPanelToggleHintClassName = cn(
  'text-[var(--dev-panel-muted,#94a3b8)]',
);

export const devViewPanelHotspotListClassName = cn(
  'm-0 flex list-none flex-col gap-2 p-0',
);

/** Manage tab list inside a single card — items separated by dividers. */
export const devViewPanelManageListClassName = cn(
  'm-0 flex list-none flex-col p-0',
  '[&>li:not(:first-child)]:mt-4 [&>li:not(:first-child)]:border-t [&>li:not(:first-child)]:border-[rgba(100,116,139,0.22)] [&>li:not(:first-child)]:pt-4',
);

/** Add action row below a manage list or empty state. */
export const devViewPanelManageListFooterClassName =
  devViewPanelActionsClassName;

export const devViewPanelManageListItemClassName = cn(
  'flex flex-col gap-1',
  /* Title + desc stay a tight cluster; action rows sit a step lower. */
  '[&>div.flex-wrap]:mt-1.5',
);

/** Scene manage row with a leading drag grip. */
export const devViewPanelManageListItemReorderRowClassName = cn(
  'flex items-start gap-2.5',
);

/** Main column beside a leading reorder grip. */
export const devViewPanelManageListItemBodyClassName = cn(
  'flex min-w-0 flex-1 flex-col gap-3',
);

/** Title/badges column + trailing icon CTAs. */
export const devViewPanelManageListItemMainRowClassName = cn(
  'flex min-w-0 w-full items-center gap-2',
);

/** Tours / Clients — a bit more air between logo and copy; vertically centered. */
export const devViewPanelManageListItemMainRowWithLogoClassName = cn(
  'flex min-w-0 w-full items-center gap-3',
);

export const devViewPanelManageListItemContentClassName = cn(
  'flex min-w-0 flex-1 flex-col gap-1.5',
);

/** Icon CTAs pinned to the right of a manage row. */
export const devViewPanelManageListItemIconActionsClassName = cn(
  'flex shrink-0 items-center gap-1.5',
);

/**
 * Compact icon-only manage action — 18px hit box matches the Material
 * symbol size so rows don’t read as an empty band under the title.
 */
export const devViewPanelIconBtnVariants = cva(
  cn(
    'inline-flex size-[1.125rem] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 leading-none',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ),
  {
    variants: {
      tone: {
        secondary: cn(
          'text-[var(--dev-panel-muted)] hover:text-[var(--dev-panel-fg)]',
          'disabled:hover:text-[var(--dev-panel-muted)]',
          'hover:[&_.material-symbols-rounded]:text-[var(--dev-panel-fg)]',
          'disabled:hover:[&_.material-symbols-rounded]:text-[var(--dev-panel-muted)]',
        ),
        danger: cn(
          'text-[var(--dev-panel-muted)] hover:text-danger',
          'disabled:hover:text-[var(--dev-panel-muted)]',
          'hover:[&_.material-symbols-rounded]:text-danger',
          'disabled:hover:[&_.material-symbols-rounded]:text-[var(--dev-panel-muted)]',
        ),
      },
    },
    defaultVariants: { tone: 'secondary' },
  },
);

/** Ghost grip — no chrome; icon bbox is the hit target. */
export const devViewPanelReorderHandleClassName = cn(
  'm-0 inline-flex shrink-0 cursor-grab appearance-none items-center justify-center',
  'border-0 bg-transparent p-0 leading-none text-[var(--dev-panel-muted)]',
  'hover:text-[var(--dev-panel-fg)] active:cursor-grabbing',
  'disabled:cursor-not-allowed disabled:opacity-40',
);

/** Drop target highlight while dragging a manage row/group. */
export const devViewPanelReorderDropTargetClassName = cn(
  'rounded-md shadow-[inset_0_0_0_1px_rgba(56,189,248,0.7)]',
  'bg-[rgba(56,189,248,0.1)]',
);

/**
 * Active/current manage row highlight — soft tab primary tint.
 * Inset shadow (not `border`) keeps list `border-t` dividers visible.
 * `!py-2.5` beats the list’s `pt-4` so the tint doesn’t fill the gap above
 * the rule and merge with the previous row.
 */
export const devViewPanelManageListItemActiveClassName = cn(
  'rounded-md bg-[rgba(var(--dev-panel-primary-rgb,56,189,248),0.08)] px-2.5 !py-2.5',
  'shadow-[inset_0_0_0_1px_rgba(var(--dev-panel-primary-rgb,56,189,248),0.45)]',
  devViewPanelControlRadiusClassName,
);

/** Compact circular client/tour logo in manage-list row heads. */
export const devViewPanelManageListItemLogoWrapClassName = cn(
  'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full p-1',
  'bg-[var(--dev-panel-logo-plate,#ffffff)]',
  'shadow-[inset_0_0_0_1px_var(--dev-panel-logo-plate-ring,transparent)]',
);

export const devViewPanelManageListItemLogoClassName = cn(
  'block max-h-full max-w-full object-contain object-center',
);

/** Title + meta stack beside a list logo. */
export const devViewPanelManageListItemTextStackClassName = cn(
  'flex min-w-0 flex-1 flex-col',
);

/** Title + muted cluster (tight). */
export const devViewPanelManageListItemCopyClassName = cn(
  'flex min-w-0 flex-col gap-0.5',
);

/**
 * Actions under muted meta inside a logo text-stack.
 * Matches manage-list rows: item `gap-1` + action `mt-1.5` (Scenes pattern).
 */
export const devViewPanelManageListItemStackActionsClassName = cn(
  devViewPanelInlineActionsClassName,
  'mt-2.5',
);

export const devViewPanelManageListItemDescClassName = cn(
  devViewPanelSectionHintClassName,
  'line-clamp-2',
);

export type DevHotspotKindBadgeKind = 'nav' | 'naming' | 'info';

/** Shared chip size for Dev manage-list badges (Scenes / Hotspots / Namings). */
export const devManageListBadgeClassName =
  'px-2 py-0.5 text-[0.5625rem] font-medium leading-[1.35]';

/** Matches dev hotspot tertiary tab colors (nav / naming / info). */
export const devHotspotKindBadgeVariants = cva(devManageListBadgeClassName, {
  variants: {
    kind: {
      nav: 'border border-[#38bdf8] bg-[rgba(56,189,248,0.28)] text-[#0369a1] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)] [[data-dev-theme=dark]_&]:text-[#bae6fd]',
      naming:
        'border border-[#f472b6] bg-[rgba(244,114,182,0.28)] text-[#9d174d] shadow-[inset_0_0_0_1px_rgba(244,114,182,0.18)] [[data-dev-theme=dark]_&]:text-[#fbcfe8]',
      info: 'border border-[#facc15] bg-[rgba(250,204,21,0.28)] text-[#a16207] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)] [[data-dev-theme=dark]_&]:text-[#fef08a]',
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
  'font-semibold text-[var(--dev-panel-title,#f0fdf4)]',
);

export const devViewPanelManageListItemBulletClassName = cn(
  'text-[var(--dev-panel-muted)]',
);

export const devViewPanelManageListItemIdClassName = cn(
  'font-normal text-[var(--dev-panel-muted)]',
);

export type DevManageListItemIdCategory =
  | 'scene'
  | 'naming'
  | 'hotspot'
  | 'tour'
  | 'client';

const DEV_MANAGE_LIST_ITEM_ID_LABEL: Record<
  DevManageListItemIdCategory,
  string
> = {
  scene: 'Scene id',
  naming: 'Naming id',
  hotspot: 'Hotspot id',
  tour: 'Tour id',
  client: 'Client id',
};

/** Manage-list id line — `Scene id: s_dtv27wfrbi`, `Tour id: t_l01wnq8eh6`, … */
export function formatManageListItemId(
  category: DevManageListItemIdCategory,
  id: string,
): string {
  return `${DEV_MANAGE_LIST_ITEM_ID_LABEL[category]}: ${id}`;
}

/** Desc block under manage rows — id/meta bullets + copy stacked. */
export const devViewPanelManageListItemDescStackClassName = cn(
  devViewPanelSectionHintClassName,
  'flex flex-col gap-1.5',
);

/** Discrete meta under manage rows (id, price, position, contact). */
export const devViewPanelManageListItemDescBulletListClassName = cn(
  'm-0 flex list-none flex-col gap-0.75 pl-0.5',
);

export const devViewPanelManageListItemDescBulletItemClassName = cn(
  'm-0 flex min-w-0 items-start gap-1.25',
  'before:mt-[0.55em] before:block before:size-1 before:shrink-0 before:rounded-full before:bg-[var(--dev-panel-muted)]',
);

/** Floor / department secondary — still a human label, not a technical id. */
export const devViewPanelManageListItemMetaClassName = cn(
  'font-normal text-[var(--dev-panel-muted)]',
);

export type DevSceneManageBadgeKind =
  | 'current'
  | 'first'
  | 'featured'
  | 'public'
  | 'unlisted'
  | 'internal'
  | 'instant';

export const devSceneManageBadgeVariants = cva(devManageListBadgeClassName, {
  variants: {
    kind: {
      current:
        'border border-[color:var(--dev-panel-primary,#4ade80)] bg-[rgba(var(--dev-panel-primary-rgb,74,222,128),0.22)] text-[color:var(--dev-panel-primary-deep,#166534)] shadow-[inset_0_0_0_1px_rgba(var(--dev-panel-primary-rgb,74,222,128),0.15)] [[data-dev-theme=dark]_&]:text-[color:var(--dev-panel-primary,#4ade80)]',
      /** Tour start — same weight as Current, follows active tab primary. */
      first:
        'border border-[color:var(--dev-panel-primary,#4ade80)] bg-[rgba(var(--dev-panel-primary-rgb,74,222,128),0.22)] text-[color:var(--dev-panel-primary-deep,#166534)] shadow-[inset_0_0_0_1px_rgba(var(--dev-panel-primary-rgb,74,222,128),0.15)] [[data-dev-theme=dark]_&]:text-[color:var(--dev-panel-primary,#4ade80)]',
      /** Gallery featured — gold. */
      featured:
        'border border-[#fbbf24] bg-[rgba(251,191,36,0.22)] text-[#92400e] shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)] [[data-dev-theme=dark]_&]:text-[#fde68a]',
      public:
        'border border-[#38bdf8] bg-[rgba(56,189,248,0.22)] text-[#0369a1] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)] [[data-dev-theme=dark]_&]:text-[#bae6fd]',
      /** Link/share — slate chip (same weight as Public, not a faint surface wash). */
      unlisted:
        'border border-[#94a3b8] bg-[rgba(148,163,184,0.22)] text-[#334155] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.15)] [[data-dev-theme=dark]_&]:text-[#e2e8f0]',
      /** Dev-only — quieter than Unlisted, still a readable bordered chip. */
      internal:
        'border border-[#64748b] bg-[rgba(100,116,139,0.18)] text-[#475569] shadow-[inset_0_0_0_1px_rgba(100,116,139,0.12)] [[data-dev-theme=dark]_&]:text-[#94a3b8]',
      /** Nav skip-transition — amber. */
      instant:
        'border border-[#fb923c] bg-[rgba(251,146,60,0.22)] text-[#9a3412] shadow-[inset_0_0_0_1px_rgba(251,146,60,0.15)] [[data-dev-theme=dark]_&]:text-[#fdba74]',
    },
  },
});

export const devViewPanelManageListItemBadgesClassName = cn(
  'flex shrink-0 flex-wrap items-center justify-end gap-1',
);

/**
 * Manage badges under the title (Scenes / Namings / Hotspots / Tours / Clients).
 */
export const devViewPanelManageListItemSceneBadgesClassName = cn(
  'flex flex-wrap items-center gap-1',
);

/**
 * Naming status chips in Dev manage lists — same chrome as Public/Unlisted
 * (border + tint), not the visitor `statusModifier` fill style.
 */
export const devNamingManageStatusBadgeVariants = cva(
  devManageListBadgeClassName,
  {
    variants: {
      kind: {
        open: 'border border-[#4ade80] bg-[rgba(74,222,128,0.22)] text-[#166534] shadow-[inset_0_0_0_1px_rgba(74,222,128,0.15)] [[data-dev-theme=dark]_&]:text-[#86efac]',
        reserved:
          'border border-[#fb923c] bg-[rgba(251,146,60,0.22)] text-[#9a3412] shadow-[inset_0_0_0_1px_rgba(251,146,60,0.15)] [[data-dev-theme=dark]_&]:text-[#fdba74]',
        soon: 'border border-[#38bdf8] bg-[rgba(56,189,248,0.22)] text-[#0369a1] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)] [[data-dev-theme=dark]_&]:text-[#bae6fd]',
        sold: 'border border-[#f472b6] bg-[rgba(244,114,182,0.22)] text-[#9d174d] shadow-[inset_0_0_0_1px_rgba(244,114,182,0.15)] [[data-dev-theme=dark]_&]:text-[#fbcfe8]',
      },
    },
  },
);

/** @deprecated Prefer {@link devNamingManageStatusBadgeVariants}. */
export const devNamingManageStatusBadgeClassName = cn(
  'shrink-0',
  devManageListBadgeClassName,
);

/** Vertical badge column for logo + text-stack rows (Tours / Clients). */
export const devViewPanelManageListItemBadgesStackClassName = cn(
  'flex shrink-0 flex-col items-end gap-1.5',
);

/**
 * Tours manage row — equal-width badges (column sized to longest label).
 */
export const devViewPanelManageListItemTourBadgesStackClassName = cn(
  'flex w-max shrink-0 flex-col items-stretch gap-1.5',
  '[&>*]:w-full [&>*]:justify-center',
);

export const devViewPanelHotspotRowClassName = cn(
  'flex flex-col gap-2 border border-[color:var(--dev-panel-border)] bg-[var(--dev-panel-surface)] px-2.5 py-2',
  devViewPanelControlRadiusClassName,
);

export const devViewPanelHotspotRowSelectedClassName = cn(
  'border-[rgba(56,189,248,0.55)] bg-[rgba(56,189,248,0.08)]',
);

/** @deprecated Prefer DevPanelSection + devViewPanelSectionClassName */
export const devViewPanelSectionVariants = cva(
  cn(
    'flex flex-col gap-1.5 border bg-[var(--dev-panel-surface)] px-2.5 pb-2 pt-2.5',
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
  'm-0 text-2xs font-bold uppercase tracking-[0.06em] text-[var(--dev-panel-title)]',
  {
    variants: {
      kind: {
        landing: 'text-[color:var(--dev-panel-primary,#4ade80)]',
        scene: 'text-[#5b21b6] [[data-dev-theme=dark]_&]:text-[#c4b5fd]',
        flags: 'text-[#a16207] [[data-dev-theme=dark]_&]:text-[#fde047]',
        hotspot: 'text-[var(--dev-panel-muted)]',
        nav: 'text-[#0369a1] [[data-dev-theme=dark]_&]:text-[#7dd3fc]',
        naming: 'text-[#9d174d] [[data-dev-theme=dark]_&]:text-[#f9a8d4]',
        info: 'text-[#a16207] [[data-dev-theme=dark]_&]:text-[#fde047]',
      },
    },
  },
);
