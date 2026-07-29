import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { materialSymbolCompactClassName } from '../ui/materialSymbolClasses';

export const aiAssistantStackClassName = cn(
  'pointer-events-none absolute z-[var(--tour-chrome-z-index)] flex flex-col items-end gap-2.5',
  'right-[var(--tour-chrome-inset-right)] bottom-[var(--tour-chrome-inset-bottom)]',
  'max-[480px]:left-[var(--tour-chrome-inset-left)] max-[480px]:items-stretch',
  '[&>*]:pointer-events-auto',
);

const aiFabHoverClassName = cn(
  'hover:max-w-[160px] hover:bg-[var(--ishare-float-glass-bg-hover)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.22),0_0_28px_rgba(var(--ishare-primary-rgb),0.38)]',
  'focus-visible:max-w-[160px] focus-visible:bg-[var(--ishare-float-glass-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light focus-visible:shadow-[0_12px_28px_rgba(15,23,42,0.22),0_0_28px_rgba(var(--ishare-primary-rgb),0.38)]',
);

export const aiFabVariants = cva(
  cn(
    'ai-fab group/fab relative box-border inline-flex h-[var(--tour-chrome-ai-fab-size)] min-h-[var(--tour-chrome-ai-fab-size)] min-w-[var(--tour-chrome-ai-fab-size)] w-auto max-w-[var(--tour-chrome-ai-fab-size)] cursor-pointer flex-row items-center justify-center overflow-hidden rounded-full border-none bg-[var(--ishare-float-glass-bg)] p-1.5 shadow-[var(--ishare-float-glass-shadow)]',
    'hover:justify-start focus-visible:justify-start',
    'max-[480px]:self-end',
    'max-[480px]:hover:max-w-[var(--tour-chrome-ai-fab-size)] max-[480px]:focus-visible:max-w-[var(--tour-chrome-ai-fab-size)]',
  ),
  {
    variants: {
      phase: {
        idle: aiFabHoverClassName,
        enter: cn(aiFabHoverClassName, 'animate-ai-fab-in'),
        exit: 'pointer-events-none animate-ai-fab-out',
      },
    },
    defaultVariants: { phase: 'idle' },
  },
);

export const aiFabAvatarClassName = cn(
  // Tracks the rem-based FAB pill under app ui-scale (padding 0.375rem × 2).
  'inline-flex size-[calc(var(--tour-chrome-ai-fab-size)-0.75rem)] shrink-0 items-center justify-center overflow-visible leading-none',
);

/** FAB orb — inset within the pill so outer shadow is not clipped by `overflow-hidden`. */
export const aiFabGuideMarkClassName = cn(
  'size-[calc(var(--tour-chrome-ai-fab-size)-1.25rem)]',
  'origin-center animate-guide-avatar-orb motion-reduce:animate-none',
  'shadow-[inset_0_-2px_8px_rgba(var(--ishare-primary-rgb),0.2),0_0_0_1px_rgba(var(--ishare-primary-rgb),0.22),0_2px_6px_rgba(var(--ishare-primary-rgb),0.28)]',
);

/** Default Ask Guide avatar — primary-tinted orb when no per-tour image override. */
export const guideAvatarMarkClassName = cn(
  'block size-full shrink-0 rounded-full',
  'bg-[radial-gradient(circle_at_36%_30%,rgba(255,255,255,0.94)_0%,rgba(var(--ishare-primary-rgb),0.9)_30%,rgba(var(--ishare-primary-rgb),0.52)_58%,rgba(var(--ishare-primary-rgb),0.14)_100%)]',
  'shadow-[inset_0_-3px_10px_rgba(var(--ishare-primary-rgb),0.22),0_0_0_1px_rgba(var(--ishare-primary-rgb),0.24),0_4px_14px_rgba(var(--ishare-primary-rgb),0.3)]',
);

export const aiFabLabelClassName = cn(
  // Collapsed: take no flex width so the orb stays optically centered in the circle.
  'ai-fab__label shrink-0 whitespace-nowrap overflow-hidden font-display text-lg font-medium text-foreground',
  'max-w-0 opacity-0 pl-0 pr-0',
  'transition-[max-width,opacity,padding] duration-[240ms] ease-out',
  'max-[480px]:hidden',
  'group-hover/fab:max-w-[7rem] group-hover/fab:opacity-100 group-hover/fab:pl-2 group-hover/fab:pr-2.5 group-hover/fab:duration-[320ms] group-hover/fab:delay-150 group-hover/fab:ease-out',
  'group-focus-visible/fab:max-w-[7rem] group-focus-visible/fab:opacity-100 group-focus-visible/fab:pl-2 group-focus-visible/fab:pr-2.5 group-focus-visible/fab:duration-[320ms] group-focus-visible/fab:delay-150 group-focus-visible/fab:ease-out',
);

export const aiFabLabelAccentClassName = cn('font-semibold text-primary');

export const aiPanelVariants = cva(
  cn(
    // Height follows content; cap taller than the old fixed 640px panel.
    'tour-glass-panel--ai h-auto max-h-[min(900px,calc(100vh-72px))] w-[480px] [transform-origin:bottom_right]',
    '[--ai-panel-avatar-size:48px] [--ai-panel-header-gap:14px] [--ai-panel-inline-padding:24px]',
    '[&_.tour-glass-panel__shell]:h-auto [&_.tour-glass-panel__shell]:max-h-full [&_.tour-glass-panel__shell]:min-h-0',
    '[&_.tour-glass-panel__header]:flex-row [&_.tour-glass-panel__header]:items-center [&_.tour-glass-panel__header]:justify-between [&_.tour-glass-panel__header]:gap-3 [&_.tour-glass-panel__header]:px-[var(--ai-panel-inline-padding)]',
    'max-[480px]:max-h-[min(840px,calc(100vh-56px))] max-[480px]:w-full',
  ),
  {
    variants: {
      phase: {
        idle: '',
        enter: 'animate-ai-panel-in',
        exit: 'animate-ai-panel-out',
      },
    },
    defaultVariants: { phase: 'idle' },
  },
);

export const aiPanelFallbackClassName = cn(
  'tour-glass-panel--ai box-border h-auto max-h-[min(900px,calc(100vh-72px))] w-[480px] animate-ai-panel-in rounded-xl bg-[var(--ishare-glass-shell-bg)] shadow-[var(--ishare-glass-dock-shadow)] [transform-origin:bottom_right]',
  'max-[480px]:max-h-[min(840px,calc(100vh-56px))] max-[480px]:w-full',
);

export const aiPanelHeaderMainClassName = cn(
  'flex min-w-0 items-center gap-[var(--ai-panel-header-gap)]',
);

export const aiPanelSymbolClassName = cn(
  'size-[var(--ai-panel-avatar-size)] shrink-0 object-contain object-center',
);

export const aiPanelHeaderTextClassName = cn('flex min-w-0 flex-col gap-1.5');

export const aiPanelTitleClassName = cn(
  'm-0 font-display text-lg-plus font-semibold leading-[1.2] text-foreground',
);

export const aiPanelPoweredByClassName = cn(
  'm-0 max-w-full self-start font-body text-xs leading-snug text-muted',
);

export const aiPanelHeaderActionsClassName = cn(
  'flex shrink-0 items-center gap-1',
);

export const aiPanelHeaderBtnClassName = cn(
  'flex size-8 shrink-0 cursor-pointer items-center justify-center p-0 transition-[background,color,opacity] duration-150',
);

export const aiPanelHeaderIconClassName = materialSymbolCompactClassName;

export const aiPanelMessagesClassName = cn(
  'ishare-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-x-clip overflow-y-scroll p-[var(--ai-panel-inline-padding)]',
);

/** Chat turns — spacing is role-aware (same vs user↔assistant). */
export const aiPanelThreadClassName = cn('flex flex-col self-stretch');

/** Consecutive same-role bubbles. */
export const aiMessageGapSameClassName = 'mt-5';

/** User ↔ assistant turn change. */
export const aiMessageGapTurnClassName = 'mt-7';

export const aiPanelIntroClassName = cn('flex flex-col gap-3 self-stretch');

export const aiPanelNoticeClassName = cn(
  'max-w-full self-stretch rounded-lg border border-[#e8c878] bg-[#fdf4e3] px-3.5 py-2.5 text-sm leading-normal text-muted',
);

export const aiPanelErrorClassName = cn(
  'max-w-full self-stretch rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3.5 py-2.5 text-sm leading-normal text-danger',
);

export const aiPanelErrorRowClassName = cn(
  'flex max-w-full items-start gap-2 self-stretch',
);

export const aiPanelErrorDismissClassName = cn(
  'mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-danger/80 transition-[background,color] duration-150 hover:bg-[rgba(239,68,68,0.12)] hover:text-danger',
);

export const aiThinkingRowClassName = cn(
  'flex max-w-full items-center gap-2.5 self-start text-muted',
);

export const aiThinkingDotsClassName = cn('inline-flex items-center gap-1');

export const aiThinkingDotClassName = cn(
  'size-1.5 rounded-full bg-primary/70',
  'animate-ai-thinking-dot motion-reduce:animate-none motion-reduce:opacity-70',
);

export const aiThinkingLabelClassName = cn(
  'font-body text-sm leading-none text-muted',
  'animate-ai-thinking-label motion-reduce:animate-none',
);

export const aiMessageVariants = cva('text-md leading-[1.75] shadow-none', {
  variants: {
    role: {
      user: 'max-w-[82%] self-end rounded-lg border border-[#e7eaef] bg-white px-[15px] py-[11px] text-body',
      assistant: 'max-w-full self-start px-0 py-0 text-body',
    },
  },
});

/** Single place/naming card width — CTA buttons align to this. */
export const aiGuideCardWidthClassName = 'w-[17rem] max-w-full';

export const aiSceneLinkListVariants = cva('mt-2 max-w-full self-start', {
  variants: {
    layout: { single: 'flex', multi: 'grid w-full grid-cols-2 gap-2' },
  },
  defaultVariants: { layout: 'single' },
});

export const aiSceneLinkLeadClassName = cn(
  'mt-3 max-w-full self-stretch font-body text-sm leading-snug text-muted',
);

export const aiSceneLinkCardVariants = cva(
  cn(
    'flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white/85 p-0 text-left shadow-none transition-[border-color,background,box-shadow] duration-200',
    'hover:bg-white hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white/85 disabled:hover:shadow-none',
  ),
  {
    variants: {
      layout: { single: aiGuideCardWidthClassName, multi: 'min-w-0 w-full' },
      kind: {
        scene:
          'border-[rgba(15,23,42,0.12)] hover:border-primary/40 disabled:hover:border-[rgba(15,23,42,0.12)]',
        naming:
          'border-[rgba(15,23,42,0.12)] bg-primary/[0.04] hover:border-primary/40 disabled:hover:border-[rgba(15,23,42,0.12)]',
      },
      current: {
        false: '',
        true: 'border-[3px] border-primary hover:border-primary disabled:hover:border-primary',
      },
    },
    defaultVariants: { layout: 'single', kind: 'scene', current: false },
  },
);

export const aiSceneLinkCardMediaWrapClassName = cn(
  'relative block w-full overflow-hidden',
);

export const aiSceneLinkCardMediaClassName = cn(
  'pointer-events-none block aspect-[2/1] w-full bg-[rgba(15,23,42,0.06)] object-cover object-center',
);

export const aiSceneLinkCardBodyClassName = cn(
  'flex min-w-0 flex-col gap-1 px-2.5 pt-2 pb-3',
);

export const aiSceneLinkCardKindClassName = cn(
  'font-body text-2xs font-medium uppercase tracking-wide text-muted',
);

export const aiSceneLinkCardKindNamingClassName = cn(
  'font-body text-2xs font-medium tracking-wide text-primary',
);

export const aiSceneLinkCardTitleRowClassName = cn(
  'flex min-w-0 items-start justify-between gap-2',
);

export const aiSceneLinkCardTitleClassName = cn(
  'min-w-0 flex-1 line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground',
);

export const aiSceneLinkCardPriceClassName = cn(
  'shrink-0 pt-0.5 font-display text-sm font-semibold tabular-nums leading-snug text-muted',
);

export const aiSceneLinkCardMetaClassName = cn(
  'font-body text-2xs leading-snug text-muted',
);

export const aiSceneLinkCardDescClassName = cn(
  'line-clamp-3 font-body text-2xs leading-snug text-muted',
);

export const aiSceneLinkShowMoreClassName = cn(
  'mt-0.5 cursor-pointer self-start rounded-md border-none bg-transparent px-0 py-1 font-body text-sm font-medium text-primary underline-offset-2 transition-[color,opacity] duration-150',
  'hover:underline',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline',
);

/** Contact / donate action block under an assistant reply (not pills, not cards). */
export const aiGuideCtaRowClassName = cn(
  'mt-3 flex max-w-full flex-col items-stretch gap-2.5 self-start',
);

export const aiGuideContactInfoClassName = cn(
  'm-0 flex max-w-full flex-col gap-2.5 self-stretch rounded-xl border border-[rgba(15,23,42,0.12)] bg-white/80 px-3.5 py-3',
);

export const aiGuideContactLogoClassName = cn(
  'mb-0.5 max-h-10 max-w-[11rem] object-contain object-left',
);

export const aiGuideContactItemClassName = cn('m-0 grid gap-0.5');

export const aiGuideContactLabelClassName = cn(
  'm-0 font-body text-2xs font-medium tracking-wide text-muted',
);

export const aiGuideContactValueClassName = cn(
  'm-0 break-words font-body text-sm leading-snug text-foreground',
);

export const aiGuideContactLinkClassName = cn(
  'text-primary no-underline hover:underline focus-visible:underline focus-visible:outline-none',
);

export const aiGuideCtaClassName = cn(
  'flex min-w-0 cursor-pointer items-center justify-center rounded-lg border border-[rgba(15,23,42,0.12)] bg-white/80 px-2.5 py-2.5 text-center font-body text-sm font-medium leading-snug text-muted no-underline transition-[background,color,border-color] duration-200',
  'hover:border-primary hover:bg-primary hover:text-white',
);

export const aiGuideCtaPrimaryClassName = cn(
  aiGuideCtaClassName,
  'border-primary/35 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-white',
);

/** CTA button group under a reply — 1 col (card width) or equal 2–3 cols. */
export function aiGuideCtaActionsColsClassName(count: number): string {
  if (count >= 3) return 'grid-cols-3 w-full max-w-full self-stretch';
  if (count === 2) return 'grid-cols-2 w-full max-w-full self-stretch';
  return cn('grid-cols-1', aiGuideCardWidthClassName);
}

export const aiFollowUpListClassName = cn(
  'flex max-w-full flex-wrap items-center gap-1.5 self-stretch',
);

export const aiFollowUpButtonClassName = cn(
  'max-w-full cursor-pointer rounded-lg border border-[rgba(15,23,42,0.12)] bg-white/80 px-2.5 py-1.5 text-left font-body text-sm leading-snug text-foreground transition-[background,border-color,color] duration-150',
  'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:cursor-default disabled:opacity-50 disabled:hover:border-[rgba(15,23,42,0.12)] disabled:hover:bg-white/80 disabled:hover:text-foreground',
);

export const aiFollowUpShowMoreClassName = cn(
  'cursor-pointer rounded-lg border-none bg-transparent px-1.5 py-1.5 font-body text-sm font-medium text-primary underline-offset-2 transition-[opacity,color] duration-150',
  'hover:underline',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline',
);

/** Input zone in panel footer — separate from the scrolling chat body. */
export const aiComposerClassName = cn(
  'tour-glass-panel__footer flex w-full flex-col items-stretch gap-0 overflow-visible px-[var(--ai-panel-inline-padding)] py-3',
);

/** Composer surface — width + radius + follow-ups height animate together.
 *  Nearby px radii (not rounded-full) so border-radius interpolates cleanly. */
export const aiComposerShellClassName = cn(
  // overflow-visible so mic/send tooltips aren’t clipped at idle (follow-ups clip themselves).
  'flex w-full max-w-full flex-col overflow-visible border border-[rgba(15,23,42,0.12)] bg-white/90',
  'transition-[width,border-radius,border-color,background-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  'motion-reduce:transition-none',
);

/** ~half of field height → capsule ends; interpolates to expanded 16px. */
export const aiComposerShellCollapsedClassName = cn(
  'w-[60%] self-center rounded-[22px]',
);

export const aiComposerShellExpandedClassName = cn(
  'w-full self-stretch rounded-[16px] border-primary/35',
);

/** Height/opacity reveal for follow-up questions above the field. */
export const aiComposerFollowUpsRevealClassName = cn(
  'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  'motion-reduce:transition-none',
);

export const aiComposerFollowUpsRevealOpenClassName = cn(
  'grid-rows-[1fr] opacity-100',
);

export const aiComposerFollowUpsRevealClosedClassName = cn(
  'pointer-events-none grid-rows-[0fr] opacity-0',
);

export const aiComposerFollowUpsRevealInnerClassName = cn(
  'min-h-0 overflow-hidden',
);

export const aiComposerShellFollowUpsClassName = cn('px-3.5 pt-2.5 pb-1.5');

export const aiComposerShellDividerClassName = cn(
  'mx-3.5 border-0 border-t border-[rgba(15,23,42,0.08)]',
);

export const aiComposerShellFieldClassName = cn(
  'relative z-[1] flex min-h-[44px] w-full items-center gap-0.5 overflow-visible px-2 py-1.5 pl-4',
);

/** Standalone pill when there are no follow-ups at all. */
export const aiComposerPillClassName = cn(
  'group/composer flex w-[60%] max-w-full min-h-[44px] items-center gap-0.5 self-center rounded-full border-[1.5px] border-[rgba(15,23,42,0.12)] bg-white/90 px-2 py-1.5 pl-4 transition-[width,border-color,background,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  'hover:bg-white focus-within:w-full focus-within:border-primary focus-within:bg-white',
  'motion-reduce:transition-none',
);

export const aiComposerPillExpandedClassName = cn('w-full border-primary');

export const aiComposerInputClassName = cn(
  // Stretch to the field/pill height so the caret isn’t a tiny beam in empty focus.
  // Explicit rem line-height gives the caret a stable strut (Chromium uses font metrics;
  // a short content box inside a tall flex row makes it look undersized).
  'min-h-[1.25rem] min-w-0 flex-1 self-stretch border-none bg-transparent py-0 font-display text-md leading-[1.25rem] text-body caret-foreground outline-none',
  'placeholder:font-display placeholder:text-muted',
);

export const aiComposerActionsClassName = cn(
  'flex shrink-0 items-center gap-1 pr-0.5',
);

export const aiComposerVoiceClassName = cn(
  'relative flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted transition-[background,color,transform] duration-200 hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground',
);

export const aiComposerVoiceListeningClassName = cn(
  aiComposerVoiceClassName,
  'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
);

/** Soft volume halo behind the mic — shown only when speech energy is present. */
export const aiComposerVoiceRingClassName = cn(
  'pointer-events-none absolute inset-0 rounded-full bg-primary will-change-transform motion-reduce:hidden',
);

export const aiComposerSendClassName = cn(
  'flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-primary text-white transition-[background,color,transform] duration-200 hover:bg-primary-dark active:scale-95',
);

export const aiComposerIconClassName = materialSymbolCompactClassName;

export const aiComposerSendIconClassName = materialSymbolCompactClassName;
