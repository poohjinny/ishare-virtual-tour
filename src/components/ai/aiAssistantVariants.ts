import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { materialSymbolCompactClassName } from '../ui/materialSymbolClasses';

export const aiAssistantStackClassName = cn(
  'pointer-events-none absolute z-[95] flex flex-col items-end gap-2.5',
  'right-[var(--tour-chrome-inset-right)] bottom-[var(--tour-chrome-inset-bottom)]',
  'max-[480px]:left-[var(--tour-chrome-inset-left)] max-[480px]:items-stretch',
  '[&>*]:pointer-events-auto',
);

const aiFabHoverClassName = cn(
  'hover:max-w-[160px] hover:bg-white/86 hover:shadow-[0_12px_28px_rgba(15,23,42,0.22),0_0_28px_rgba(var(--ishare-primary-rgb),0.38)]',
  'focus-visible:max-w-[160px] focus-visible:bg-white/86 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light focus-visible:shadow-[0_12px_28px_rgba(15,23,42,0.22),0_0_28px_rgba(var(--ishare-primary-rgb),0.38)]',
);

export const aiFabVariants = cva(
  cn(
    'ai-fab group/fab relative box-border inline-flex h-[76px] min-h-[76px] min-w-[76px] w-auto max-w-[76px] cursor-pointer flex-row items-center justify-start overflow-hidden rounded-full border-none bg-[var(--ishare-float-glass-bg)] p-2 shadow-[var(--ishare-float-glass-shadow)] backdrop-blur-[4px] backdrop-saturate-[110%]',
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
  'inline-flex size-[60px] shrink-0 items-center justify-center overflow-visible leading-none',
  'max-[480px]:size-12',
);

/** FAB orb — inset within the pill so outer shadow is not clipped by `overflow-hidden`. */
export const aiFabGuideMarkClassName = cn(
  'size-[52px] max-[480px]:size-11',
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
    'tour-glass-panel--ai h-[min(560px,calc(100vh-112px))] max-h-[560px] w-[380px] [transform-origin:bottom_right]',
    '[--ai-panel-avatar-size:48px] [--ai-panel-header-gap:14px] [--ai-panel-inline-padding:20px]',
    '[&_.tour-glass-panel__shell]:h-full [&_.tour-glass-panel__shell]:max-h-none',
    '[&_.tour-glass-panel__header]:flex-row [&_.tour-glass-panel__header]:items-center [&_.tour-glass-panel__header]:justify-between [&_.tour-glass-panel__header]:gap-3 [&_.tour-glass-panel__header]:px-[var(--ai-panel-inline-padding)]',
    'max-[480px]:h-[min(520px,calc(100vh-72px))] max-[480px]:max-h-[520px] max-[480px]:w-full',
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
  'tour-glass-panel--ai box-border h-[min(560px,calc(100vh-112px))] max-h-[560px] w-[380px] animate-ai-panel-in rounded-xl bg-white/72 shadow-[var(--ishare-glass-dock-shadow)] backdrop-blur-[8px] backdrop-saturate-[120%] [transform-origin:bottom_right]',
);

export const aiPanelHeaderMainClassName = cn(
  'flex min-w-0 items-center gap-[var(--ai-panel-header-gap)]',
);

export const aiPanelSymbolClassName = cn(
  'size-[var(--ai-panel-avatar-size)] shrink-0 object-contain object-center',
);

export const aiPanelHeaderTextClassName = cn('flex min-w-0 flex-col gap-1.5');

export const aiPanelTitleClassName = cn(
  'm-0 font-display text-xl font-semibold leading-[1.2] text-foreground',
);

export const aiPanelLocationBadgeClassName = cn(
  'm-0 flex max-w-full min-w-0 items-center gap-1.5 self-start font-body text-xs leading-snug',
);

export const aiPanelLocationDotClassName = cn(
  'size-1.5 shrink-0 rounded-full bg-primary',
  'animate-hotspot-nav-dot-glow motion-reduce:animate-none',
);

export const aiPanelLocationBadgeLabelClassName = cn('shrink-0 text-muted');

export const aiPanelLocationBadgeSeparatorClassName = cn(
  'shrink-0 text-muted/70',
);

export const aiPanelLocationBadgeTitleClassName = cn(
  'min-w-0 truncate font-medium text-foreground',
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
  'ishare-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-[var(--ai-panel-inline-padding)] pb-[88px]',
);

export const aiPanelIntroClassName = cn('flex flex-col gap-5 self-stretch');

export const aiPanelNoticeClassName = cn(
  'max-w-full self-stretch rounded-lg border border-[#e8c878] bg-[#fdf4e3] px-3.5 py-2.5 text-sm leading-normal text-muted',
);

export const aiMessageVariants = cva(
  'max-w-[90%] text-lg leading-[1.55] shadow-none',
  {
    variants: {
      role: {
        user: 'self-end rounded-lg border border-[#e7eaef] bg-white px-[15px] py-[11px] text-body',
        assistant: 'max-w-full self-start px-0 py-0 text-body',
      },
    },
  },
);

export const aiPanelSuggestionsClassName = cn(
  'flex max-w-full flex-wrap gap-1.5 self-start',
);

export const aiSuggestionClassName = cn(
  'cursor-pointer rounded-[20px] border border-[rgba(15,23,42,0.12)] bg-white/55 px-3 py-[7px] text-sm text-muted transition-[background,color,border-color] duration-200 hover:border-primary hover:bg-primary hover:text-white',
);

export const aiComposerClassName = cn(
  'pointer-events-none absolute right-[var(--ai-panel-inline-padding)] bottom-3.5 left-[var(--ai-panel-inline-padding)] z-[2] flex justify-center border-none bg-transparent p-0',
);

export const aiComposerPillClassName = cn(
  'group/composer pointer-events-auto flex w-[60%] max-w-full min-h-[46px] items-center gap-0.5 rounded-full border-[1.5px] border-[rgba(15,23,42,0.12)] bg-white/72 px-2.5 py-2 pl-5 shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-[8px] backdrop-saturate-[120%] transition-[width,border-color,box-shadow,background] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/86 hover:shadow-[0_12px_28px_rgba(15,23,42,0.18)] focus-within:w-full focus-within:border-primary',
);

export const aiComposerInputClassName = cn(
  'min-w-0 flex-1 border-none bg-transparent py-2 font-display text-lg leading-normal text-body outline-none placeholder:font-display placeholder:text-muted',
);

export const aiComposerActionsClassName = cn(
  'flex shrink-0 items-center gap-1 pr-0.5',
);

export const aiComposerVoiceClassName = cn(
  'flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted transition-[background,color,transform] duration-200 hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground',
);

export const aiComposerSendClassName = cn(
  'flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-primary text-white transition-[background,color,transform] duration-200 hover:bg-primary-dark active:scale-95',
);

export const aiComposerIconClassName = materialSymbolCompactClassName;

export const aiComposerSendIconClassName = materialSymbolCompactClassName;
