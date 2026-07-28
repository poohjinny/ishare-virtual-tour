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
    'ai-fab group/fab relative box-border inline-flex h-[var(--tour-chrome-ai-fab-size)] min-h-[var(--tour-chrome-ai-fab-size)] min-w-[var(--tour-chrome-ai-fab-size)] w-auto max-w-[var(--tour-chrome-ai-fab-size)] cursor-pointer flex-row items-center justify-start overflow-hidden rounded-full border-none bg-[var(--ishare-float-glass-bg)] p-2 shadow-[var(--ishare-float-glass-shadow)]',
    'max-[480px]:h-16 max-[480px]:min-h-16 max-[480px]:min-w-16 max-[480px]:max-w-16 max-[480px]:self-end max-[480px]:p-2',
    'max-[480px]:hover:max-w-16 max-[480px]:focus-visible:max-w-16',
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
  // rem so the orb tracks the rem-based FAB pill under app ui-scale (60px @ scale 1).
  'inline-flex size-[3.75rem] shrink-0 items-center justify-center overflow-visible leading-none',
  'max-[480px]:size-12',
);

/** FAB orb — inset within the pill so outer shadow is not clipped by `overflow-hidden`. */
export const aiFabGuideMarkClassName = cn(
  // rem so the orb tracks the rem-based FAB pill under app ui-scale (52px @ scale 1).
  'size-[3.25rem] max-[480px]:size-11',
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
  'ai-fab__label shrink-0 whitespace-nowrap pl-2 pr-2.5 font-display text-lg font-medium text-foreground opacity-0 transition-opacity duration-[240ms] ease-out',
  'max-[480px]:hidden',
  'group-hover/fab:opacity-100 group-hover/fab:duration-[320ms] group-hover/fab:delay-150 group-hover/fab:ease-out',
  'group-focus-visible/fab:opacity-100 group-focus-visible/fab:duration-[320ms] group-focus-visible/fab:delay-150 group-focus-visible/fab:ease-out',
);

export const aiFabLabelAccentClassName = cn('font-semibold text-primary');

export const aiPanelVariants = cva(
  cn(
    'tour-glass-panel--ai h-[min(640px,calc(100vh-112px))] max-h-[640px] w-[440px] [transform-origin:bottom_right]',
    '[--ai-panel-avatar-size:48px] [--ai-panel-header-gap:14px] [--ai-panel-inline-padding:20px]',
    '[&_.tour-glass-panel__shell]:h-full [&_.tour-glass-panel__shell]:max-h-none',
    '[&_.tour-glass-panel__header]:flex-row [&_.tour-glass-panel__header]:items-center [&_.tour-glass-panel__header]:justify-between [&_.tour-glass-panel__header]:gap-3 [&_.tour-glass-panel__header]:px-[var(--ai-panel-inline-padding)]',
    'max-[480px]:h-[min(580px,calc(100vh-72px))] max-[480px]:max-h-[580px] max-[480px]:w-full',
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
  'tour-glass-panel--ai box-border h-[min(640px,calc(100vh-112px))] max-h-[640px] w-[440px] animate-ai-panel-in rounded-xl bg-[var(--ishare-glass-shell-bg)] shadow-[var(--ishare-glass-dock-shadow)] [transform-origin:bottom_right]',
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

export const aiPanelLocationBadgeClassName = cn(
  'm-0 flex max-w-full min-w-0 items-center self-start font-body text-xs leading-snug',
);

export const aiPanelLocationBadgeTitleClassName = cn(
  'min-w-0 truncate font-medium text-muted',
);

export const aiPanelHeaderActionsClassName = cn(
  'flex shrink-0 items-center gap-1',
);

export const aiPanelHeaderBtnClassName = cn(
  'flex size-8 shrink-0 cursor-pointer items-center justify-center p-0 transition-[background,color,opacity] duration-150',
);

export const aiPanelHeaderIconClassName = materialSymbolCompactClassName;

export const aiPanelFooterClassName = cn(
  'px-[var(--ai-panel-inline-padding)] pt-2.5 pb-3',
);

export const aiPanelPoweredByClassName = cn(
  'm-0 text-center text-2xs leading-[1.4] text-muted',
);

export const aiPanelMessagesClassName = cn(
  'ishare-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-x-clip overflow-y-scroll p-[var(--ai-panel-inline-padding)] pb-[88px]',
);

/** Chat turns — spacing is role-aware (same vs user↔assistant). */
export const aiPanelThreadClassName = cn('flex flex-col self-stretch');

/** Consecutive same-role bubbles. */
export const aiMessageGapSameClassName = 'mt-3';

/** User ↔ assistant turn change. */
export const aiMessageGapTurnClassName = 'mt-5';

/** Suggested question chips under the latest turn / scene note. */
export const aiPanelSuggestionsSlotClassName = cn('flex flex-col self-stretch');

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

export const aiPanelSuggestionsClassName = cn(
  'flex max-w-full flex-wrap gap-1.5 self-start',
);

export const aiSceneLinkListClassName = cn(
  'mt-3 flex max-w-full flex-wrap gap-2.5 self-start',
);

export const aiSceneLinkCardClassName = cn(
  'flex w-[13.5rem] flex-col overflow-hidden rounded-xl border border-[rgba(15,23,42,0.12)] bg-white/85 text-left shadow-none',
);

export const aiSceneLinkCardMediaClassName = cn(
  'block aspect-[3/2] w-full bg-[rgba(15,23,42,0.06)] object-cover object-center',
);

export const aiSceneLinkCardBodyClassName = cn(
  'flex min-w-0 flex-col gap-1.5 px-3 py-2.5',
);

export const aiSceneLinkCardTitleClassName = cn(
  'line-clamp-2 font-display text-md font-semibold leading-snug text-foreground',
);

export const aiSceneLinkCardDescClassName = cn(
  'line-clamp-2 font-body text-xs leading-snug text-muted',
);

export const aiSceneLinkCardActionsClassName = cn(
  'mt-0.5 flex flex-wrap gap-1.5',
);

export const aiSceneLinkCardActionClassName = cn(
  'cursor-pointer rounded-full border border-[rgba(15,23,42,0.12)] bg-white/70 px-3.5 py-1.5 font-body text-xs font-medium leading-none text-muted transition-[background,color,border-color] duration-200',
  'hover:border-primary hover:bg-primary hover:text-white',
  'disabled:cursor-default disabled:opacity-50 disabled:hover:border-[rgba(15,23,42,0.12)] disabled:hover:bg-white/70 disabled:hover:text-muted',
);

export const aiSceneLinkCardActionPrimaryClassName = cn(
  aiSceneLinkCardActionClassName,
  'border-primary/35 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-white',
);

export const aiGuideCtaRowClassName = cn(
  'mt-3 flex max-w-full flex-wrap gap-1.5 self-start',
);

export const aiGuideCtaClassName = cn(
  'cursor-pointer rounded-full border border-[rgba(15,23,42,0.12)] bg-white/70 px-3.5 py-1.5 font-body text-xs font-medium leading-none text-muted no-underline transition-[background,color,border-color] duration-200',
  'hover:border-primary hover:bg-primary hover:text-white',
);

export const aiGuideCtaPrimaryClassName = cn(
  aiGuideCtaClassName,
  'border-primary/35 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-white',
);

export const aiMessageFollowUpsClassName = cn(
  'mt-3 flex max-w-full flex-wrap gap-1.5 self-start',
);

export const aiSuggestionClassName = cn(
  'cursor-pointer rounded-[20px] border border-[rgba(15,23,42,0.12)] bg-white/55 px-3 py-[7px] text-sm text-muted transition-[background,color,border-color] duration-200 hover:border-primary hover:bg-primary hover:text-white',
);

export const aiComposerClassName = cn(
  'pointer-events-none absolute right-[var(--ai-panel-inline-padding)] bottom-3.5 left-[var(--ai-panel-inline-padding)] z-[2] flex justify-center border-none bg-transparent p-0',
);

export const aiComposerPillClassName = cn(
  'group/composer pointer-events-auto flex w-[60%] max-w-full min-h-[46px] items-center gap-0.5 rounded-full border-[1.5px] border-[rgba(15,23,42,0.12)] bg-[var(--ishare-glass-shell-bg)] px-2.5 py-2 pl-5 shadow-[0_8px_24px_rgba(15,23,42,0.14)] transition-[width,border-color,box-shadow,background] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.90] hover:shadow-[0_12px_28px_rgba(15,23,42,0.18)]',
  // Expand only for the text field (not mic/send focus) so the first mic click isn't lost to layout shift.
  'has-[input:focus]:w-full has-[input:focus]:border-primary',
);

export const aiComposerPillExpandedClassName = cn('w-full border-primary');

export const aiComposerInputClassName = cn(
  'min-w-0 flex-1 border-none bg-transparent py-2 font-display text-md leading-normal text-body outline-none placeholder:font-display placeholder:text-muted',
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
