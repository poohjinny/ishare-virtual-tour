import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { materialSymbolCompactClassName } from '../ui/materialSymbolClasses';

export const aiAssistantStackClassName = cn(
  'pointer-events-none absolute z-[var(--tour-chrome-z-index)] flex flex-col items-end gap-2.5',
  'right-[var(--tour-chrome-inset-right)] bottom-[var(--tour-chrome-inset-bottom)]',
  'max-[480px]:left-[var(--tour-chrome-inset-left)] max-[480px]:items-stretch',
  '[&>*]:pointer-events-auto',
);

/** Speech bubble above the Ask Guide FAB (panel closed). */
export const aiFabBubbleClassName = cn(
  'relative mb-1 max-w-[min(17.5rem,calc(100vw-5.5rem))] rounded-2xl border-none',
  'group/fab-bubble bg-[var(--ishare-float-glass-bg)] text-left shadow-[var(--ishare-float-glass-shadow)]',
  '[--fab-bubble-fill:var(--ishare-float-glass-bg)]',
  '[--fab-bubble-tail-right:calc(var(--tour-chrome-ai-fab-size)/2-0.5rem)]',
  'motion-reduce:animate-none',
  'transition-[background,box-shadow] duration-150',
  'hover:bg-[var(--ishare-float-glass-bg-hover)] hover:shadow-[0_10px_26px_rgba(15,23,42,0.14)]',
  'hover:[--fab-bubble-fill:var(--ishare-float-glass-bg-hover)]',
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
  'max-[480px]:max-w-none max-[480px]:self-end',
);

export const aiFabBubbleEnterClassName = cn('animate-ai-fab-bubble-in');

export const aiFabBubbleExitClassName = cn('animate-ai-fab-bubble-out');

/** Main hit target — opens Ask Guide. */
export const aiFabBubbleOpenClassName = cn(
  'm-0 w-full cursor-pointer rounded-2xl border-none bg-transparent px-3.5 py-2.5 pe-8 text-left',
  'focus-visible:outline-none',
);

export const aiFabBubbleTextClassName = cn(
  // Design scale `text-sm` (0.75rem) — readable speech; chrome captions often use 2xs/xs.
  'm-0 font-body text-sm leading-relaxed text-foreground',
);

/** Corner dismiss — hybrid with auto-hide. */
export const aiFabBubbleDismissClassName = cn(
  'absolute top-1 right-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center',
  'rounded-full border-none bg-transparent p-0 text-muted',
  'transition-[background,color] duration-150',
  'hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground',
  'focus-visible:outline-none',
);

/** Place / naming name inside the FAB proximity line (icon/dot + name as one unit). */
export const aiFabBubbleEmphasisClassName = cn(
  'ms-1.5 inline-flex items-center gap-1 align-middle font-semibold leading-none text-foreground',
);

/** Theme place marker before a location name in the FAB bubble. */
export const aiFabBubblePlaceDotClassName = cn(
  'size-1.5 shrink-0 rounded-full bg-primary',
);

/** Theme naming heart before an NO name in the FAB bubble. */
export const aiFabBubbleNamingHeartClassName = cn(
  'shrink-0 leading-none text-primary',
);

/** Tip centered on the FAB; slight tuck so fill meets the bubble edge. */
export const aiFabBubbleTailClassName = cn(
  'pointer-events-none absolute top-full h-2 w-4',
  'right-[var(--fab-bubble-tail-right)]',
);

const aiFabHoverClassName = cn(
  'hover:max-w-[160px] hover:bg-[var(--ishare-float-glass-bg-hover)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.22),0_0_28px_rgba(var(--ishare-primary-rgb),0.38)]',
  'focus-visible:max-w-[160px] focus-visible:bg-[var(--ishare-float-glass-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light focus-visible:shadow-[0_12px_28px_rgba(15,23,42,0.22),0_0_28px_rgba(var(--ishare-primary-rgb),0.38)]',
);

export const aiFabVariants = cva(
  cn(
    // overflow-visible so mild ring glow / specular aren’t clipped by the glass pill.
    // Label collapse still clips via aiFabLabelClassName’s own overflow-hidden.
    'ai-fab group/fab relative box-border inline-flex h-[var(--tour-chrome-ai-fab-size)] min-h-[var(--tour-chrome-ai-fab-size)] min-w-[var(--tour-chrome-ai-fab-size)] w-auto max-w-[var(--tour-chrome-ai-fab-size)] cursor-pointer flex-row items-center justify-center overflow-visible rounded-full border-none bg-[var(--ishare-float-glass-bg)] p-1.5 shadow-[var(--ishare-float-glass-shadow)]',
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

/** FAB avatar — slightly inset so breathe scale sits clear of the pill edge. */
export const aiFabGuideMarkClassName = cn(
  'size-[calc(var(--tour-chrome-ai-fab-size)-1rem)]',
  'origin-center',
);

/** Slow breathe while the FAB is idle (ring). */
export const aiFabGuideMarkIdleClassName = cn(
  'animate-guide-avatar-orb motion-reduce:animate-none',
);

/** Faster breathe — while the proximity bubble is visible (orb). */
export const aiFabGuideMarkPulseClassName = cn(
  'animate-guide-avatar-orb-pulse motion-reduce:animate-none',
);

/**
 * Guide mark shell — ring↔orb presence morphs via layered children (same footprint).
 * Default `orb` for panel header; FAB passes `ring` when idle.
 */
export const guideAvatarShellClassName = cn(
  'guide-avatar-mark relative block size-full shrink-0',
);

/** Morph timing — slower than the bubble so the fill reads as intentional. */
const guideAvatarMorphTransitionClassName = cn(
  'transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
  'motion-reduce:transition-none',
);

export const guideAvatarLayerClassName = cn(
  'pointer-events-none absolute inset-0 rounded-full',
  guideAvatarMorphTransitionClassName,
);

/** Idle ring — thick stroke + soft static bloom (not the punchy bloom). */
export const guideAvatarRingLayerClassName = cn(
  guideAvatarLayerClassName,
  'border-[6px] border-[rgba(var(--ishare-primary-rgb),0.72)] bg-[rgba(var(--ishare-primary-rgb),0.08)]',
  'shadow-[0_0_16px_rgba(var(--ishare-primary-rgb),0.3),inset_0_0_12px_rgba(var(--ishare-primary-rgb),0.12)]',
);

export const guideAvatarRingLayerActiveClassName = cn('scale-100 opacity-100');

export const guideAvatarRingLayerInactiveClassName = cn(
  'scale-[1.08] opacity-0 motion-reduce:scale-100',
);

/**
 * Fixed specular catch-light on the ring rim (glass/metal reflection) — not a
 * spinning loader sheen. Masked to the stroke; soft opacity breathe only.
 */
export const guideAvatarRingSpecularClassName = cn(
  'pointer-events-none absolute inset-0 rounded-full',
  'transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
  'motion-reduce:transition-none',
  'bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.55)_14%,rgba(255,255,255,0.12)_28%,transparent_46%)]',
  '[mask:radial-gradient(farthest-side,transparent_calc(100%-7px),#000_calc(100%-6px),#000_calc(100%-1px),transparent_100%)]',
  '[-webkit-mask:radial-gradient(farthest-side,transparent_calc(100%-7px),#000_calc(100%-6px),#000_calc(100%-1px),transparent_100%)]',
);

export const guideAvatarRingSpecularActiveClassName = cn(
  'animate-guide-avatar-ring-specular motion-reduce:animate-none motion-reduce:opacity-80',
);

export const guideAvatarRingSpecularInactiveClassName = cn(
  'opacity-0 animate-none',
);

/** Active filled orb — used in panel + when proximity bubble is up. */
export const guideAvatarOrbLayerClassName = cn(
  guideAvatarLayerClassName,
  'bg-[radial-gradient(circle_at_36%_30%,rgba(255,255,255,0.94)_0%,rgba(var(--ishare-primary-rgb),0.9)_30%,rgba(var(--ishare-primary-rgb),0.52)_58%,rgba(var(--ishare-primary-rgb),0.14)_100%)]',
  'shadow-[inset_0_-3px_10px_rgba(var(--ishare-primary-rgb),0.22),0_0_0_1px_rgba(var(--ishare-primary-rgb),0.24),0_4px_14px_rgba(var(--ishare-primary-rgb),0.3)]',
);

export const guideAvatarOrbLayerActiveClassName = cn('scale-100 opacity-100');

export const guideAvatarOrbLayerInactiveClassName = cn(
  'scale-[0.78] opacity-0 motion-reduce:scale-100',
);

/** @deprecated Use {@link GuideAvatar} (layered shell). */
export const guideAvatarMarkClassName = cn(
  guideAvatarShellClassName,
  'rounded-full',
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
  'flex max-w-full items-start gap-1.5 self-stretch rounded-lg border border-[#e8c878] bg-[#fdf4e3] px-3 py-2 text-sm leading-normal text-muted',
);

export const aiPanelErrorClassName = cn(
  'flex max-w-full items-start gap-1.5 self-stretch rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm leading-normal text-danger',
);

/** Close control inside notice / error banners. */
export const aiPanelBannerDismissClassName = cn(
  'mt-px flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 transition-[background,color] duration-150',
  'text-current/70 hover:bg-black/5 hover:text-current',
);

export const aiPanelBannerRetryClassName = cn(
  'mt-px shrink-0 cursor-pointer rounded-md border-none bg-transparent px-1.5 py-0.5 font-display text-xs font-semibold text-current underline-offset-2 transition-[background,opacity] duration-150',
  'hover:bg-black/5 hover:underline',
);

export const aiPanelBannerBodyClassName = cn('m-0 min-w-0 flex-1');

export const aiMessageSpeakClassName = cn(
  'inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted transition-[background,color] duration-150',
  'hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground',
  'aria-pressed:bg-primary/12 aria-pressed:text-primary',
);

export const aiMessageActionsClassName = cn('mt-1 flex items-center gap-0');

export const aiComposerStopClassName = cn(
  'flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[rgba(15,23,42,0.08)] text-foreground transition-[background,transform] duration-150',
  'hover:bg-[rgba(15,23,42,0.14)] active:scale-95',
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

/** Light markdown inside assistant replies (bold, lists, links, quotes). */
export const aiMessageProseClassName = cn(
  'min-w-0',
  '[&_p]:m-0 [&_p+p]:mt-2.5',
  '[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
  '[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5',
  // Nested bullets / numbers so levels read as distinct.
  '[&_ul_ul]:my-1.5 [&_ul_ul]:list-[circle]',
  '[&_ul_ul_ul]:list-[square]',
  '[&_ol_ol]:my-1.5 [&_ol_ol]:list-[lower-alpha]',
  '[&_ol_ol_ol]:list-[lower-roman]',
  '[&_ul_ol]:my-1.5 [&_ol_ul]:my-1.5',
  '[&_li]:leading-[1.65]',
  '[&_blockquote]:my-2.5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/35 [&_blockquote]:pl-3 [&_blockquote]:text-muted',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
  '[&_em]:italic',
  '[&_del]:text-muted [&_del]:line-through',
  '[&_code]:rounded-sm [&_code]:bg-[rgba(15,23,42,0.06)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em]',
  '[&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-primary-dark',
);

/** Single place/naming card width — CTA buttons align to this. */
export const aiGuideCardWidthClassName = 'w-[17rem] max-w-full';

export const aiSceneLinkListVariants = cva('mt-0 max-w-full self-start', {
  variants: {
    layout: { single: 'flex', multi: 'grid w-full grid-cols-2 gap-2' },
  },
  defaultVariants: { layout: 'single' },
});

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

/** Compact status chip — Explore gallery badge is oversized on 17rem AI cards. */
export const aiSceneLinkCardBadgeGroupClassName = cn(
  'pointer-events-none absolute top-1.5 right-1.5 z-[2] max-w-[calc(100%-12px)]',
  'flex flex-row flex-wrap items-center justify-end gap-1',
);

export const aiSceneLinkCardStatusBadgeClassName = cn(
  'px-1.5 py-1 text-[0.5625rem] font-medium leading-none tracking-[0.03em]',
);

export const aiSceneLinkCardBodyClassName = cn(
  'flex min-w-0 flex-col gap-1 px-2.5 pt-2 pb-3',
);

/** Shared place / naming eyebrow above the card title. */
export const aiSceneLinkCardKindClassName = cn(
  'font-body text-2xs font-medium uppercase tracking-wide text-muted',
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
  // Reserve full clamp height so short copy matches ellipsed rows in a grid.
  'line-clamp-3 min-h-[3lh] font-body text-2xs leading-snug text-muted',
);

export const aiSceneLinkShowMoreClassName = cn(
  'mt-0.5 cursor-pointer self-center rounded-md border-none bg-transparent px-0 py-1 font-body text-sm font-medium text-primary underline-offset-2 transition-[color,opacity] duration-150',
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
  'flex min-w-0 cursor-pointer items-center justify-center rounded-lg border border-[rgba(15,23,42,0.12)] bg-white/80 px-2 py-1.5 text-center font-body text-sm font-medium leading-snug text-muted no-underline transition-[background,color,border-color] duration-200',
  'hover:border-primary hover:bg-primary hover:text-white',
);

export const aiGuideCtaPrimaryClassName = cn(
  aiGuideCtaClassName,
  'border-primary/35 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-white',
);

/** Compact CTAs under naming cards — quieter than reply-level actions. */
export const aiGuideCtaCompactClassName = cn(
  'flex min-w-0 cursor-pointer items-center justify-center rounded-md border border-[rgba(15,23,42,0.12)] bg-white/80 px-2 py-1.5 text-center font-body text-2xs font-medium leading-snug text-muted no-underline transition-[background,color,border-color] duration-200',
  'hover:border-[rgba(15,23,42,0.22)] hover:bg-white hover:text-foreground',
);

export const aiGuideCtaCompactPrimaryClassName = cn(
  aiGuideCtaCompactClassName,
  'border-primary/30 bg-primary/8 text-primary hover:border-primary/45 hover:bg-primary/12 hover:text-primary',
);

/** CTA button group under a reply or naming card. */
export function aiGuideCtaActionsColsClassName(
  count: number,
  align: 'card' | 'stretch' = 'card',
  stack = false,
): string {
  if (stack || align === 'stretch') {
    return 'grid-cols-1 w-full max-w-full self-stretch';
  }
  if (count >= 3) return 'grid-cols-3 w-full max-w-full self-stretch';
  if (count === 2) return 'grid-cols-2 w-full max-w-full self-stretch';
  return cn('grid-cols-1', aiGuideCardWidthClassName);
}

export const aiFollowUpListClassName = cn(
  'flex w-full max-w-full flex-col items-start gap-1.5',
);

export const aiFollowUpButtonClassName = cn(
  'relative max-w-full cursor-pointer border-none bg-transparent py-0 pr-0 pl-3 text-left font-body text-md leading-[1.75] text-body transition-[color] duration-150',
  "before:absolute before:top-[0.55em] before:left-0 before:size-1 before:rounded-full before:bg-muted/40 before:content-['']",
  'hover:text-primary hover:underline hover:before:bg-primary/50',
  'focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:cursor-default disabled:opacity-50 disabled:hover:text-body disabled:hover:no-underline disabled:hover:before:bg-muted/40',
);

export const aiFollowUpShowMoreClassName = cn(
  'mt-1 cursor-pointer border-none bg-transparent py-0 pr-0 pl-3 font-body text-sm font-medium leading-[1.75] text-primary underline-offset-2 transition-[opacity,color] duration-150',
  'hover:underline',
  'focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline',
);

/** Suggested questions as one user-aligned bubble (tap sends as a user turn). */
export const aiFollowUpUserBubbleClassName = cn('flex flex-col gap-2');

/** Pinned under the scroll thread — outer inset only; shell owns the surface. */
export const aiComposerClassName = cn(
  'flex w-full shrink-0 flex-col items-stretch overflow-visible p-[calc(var(--ai-panel-inline-padding)/1.25)]',
);

/**
 * Composer surface (input + actions). Capsule ends stay round; width grows when
 * active; primary border only while focused (`focus-within`).
 * `overflow-visible` keeps the mic listening ring from clipping.
 */
export const aiComposerShellClassName = cn(
  'relative z-[1] mx-auto flex min-h-[44px] max-w-full items-center gap-0.5 overflow-visible rounded-full border border-[rgba(15,23,42,0.12)] bg-white/90 py-1.5 pl-4 pr-1.5',
  'transition-[width,border-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  'focus-within:border-primary',
  'motion-reduce:transition-none',
);

export const aiComposerShellCollapsedClassName = cn('w-[60%]');

export const aiComposerShellExpandedClassName = cn('w-full');

/**
 * Class `ai-composer-input` → `border-radius: 0` in psv-layer.css (overrides the
 * global pill input radius that clipped caret/selection). Height matches mic/send.
 */
export const aiComposerInputClassName = cn(
  'ai-composer-input h-[30px] min-w-0 flex-1 border-none bg-transparent py-0 font-display text-md leading-[30px] text-body caret-foreground outline-none',
  'placeholder:text-muted',
);

export const aiComposerActionsClassName = cn(
  'flex shrink-0 items-center gap-1',
);

export const aiComposerVoiceClassName = cn(
  'relative flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted transition-[background,color,transform] duration-200 hover:bg-[rgba(15,23,42,0.06)] hover:text-foreground',
);

export const aiComposerVoiceListeningClassName = cn(
  aiComposerVoiceClassName,
  'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
);

/** Idle listening halo — soft breathe so the control reads as “live”. */
export const aiComposerVoiceRingIdleClassName = cn(
  'pointer-events-none absolute inset-[-3px] rounded-full border-2 border-primary/45 motion-reduce:hidden',
  'animate-ai-voice-listen',
);

/** Level-reactive fill behind the stop control while speech energy is present. */
export const aiComposerVoiceRingClassName = cn(
  'pointer-events-none absolute inset-0 rounded-full bg-primary will-change-transform motion-reduce:hidden',
);

/** Collapses send width so mic spacing eases in/out with the control. */
export const aiComposerSendSlotClassName = cn(
  'grid transition-[grid-template-columns,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
);

export const aiComposerSendSlotOpenClassName = cn(
  'ml-0 grid-cols-[minmax(0,max-content)]',
);

export const aiComposerSendSlotClosedClassName = cn(
  'pointer-events-none -ml-1 grid-cols-[0fr]',
);

export const aiComposerSendSlotInnerClassName = cn('min-w-0 overflow-hidden');

export const aiComposerSendClassName = cn(
  'flex size-[30px] shrink-0 origin-center cursor-pointer items-center justify-center rounded-full border-none bg-primary text-white transition-[background,color,transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:bg-primary-dark active:scale-95',
  'disabled:cursor-default disabled:bg-primary/35 disabled:text-white/80 disabled:hover:bg-primary/35 disabled:active:scale-100',
  'motion-reduce:transition-none',
);

export const aiComposerSendVisibleClassName = cn('scale-100 opacity-100');

export const aiComposerSendHiddenClassName = cn('scale-75 opacity-0');

export const aiComposerIconClassName = materialSymbolCompactClassName;

export const aiComposerSendIconClassName = cn(
  materialSymbolCompactClassName,
  'text-current',
);
