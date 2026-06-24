import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

/** Same row as tour nav breadcrumb (`top-6`). */
export const devToolsStackClassName = cn(
  'pointer-events-none absolute top-6 left-6 z-[100] flex w-[min(380px,calc(100vw-48px))] flex-col gap-2',
  'max-[480px]:left-3 max-[480px]:w-[min(380px,calc(100vw-24px))]',
  '[&>*]:pointer-events-auto',
);

export const devFabVariants = cva(
  cn(
    'inline-flex h-9 shrink-0 items-center justify-center self-start rounded-full border px-3',
    'font-mono text-2xs font-bold uppercase tracking-[0.08em]',
    'shadow-[0_8px_20px_rgba(15,23,42,0.28)] backdrop-blur-[4px]',
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
  'flex max-h-[min(calc(100vh-120px),720px)] flex-col gap-2.5 overflow-y-auto rounded-lg border border-[rgba(0,255,128,0.35)] bg-[rgba(0,0,0,0.85)] p-3.5 font-mono text-xs text-[#e2e8f0]',
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
);

export const devViewPanelTitleClassName = cn(
  'm-0 font-bold uppercase tracking-[0.05em] text-[#4ade80]',
);

export const devViewPanelSceneIdClassName = cn(
  'font-medium normal-case tracking-normal text-[#86efac]',
);

export const devViewPanelSectionVariants = cva(
  'flex flex-col gap-1.5 rounded-md border bg-[rgba(15,23,42,0.45)] px-2.5 pb-2 pt-2.5',
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

export const devViewPanelSectionLeadClassName = cn(
  'm-0 text-2xs leading-[1.35] text-[#64748b] [&_code]:text-[#86efac]',
);

export const devViewPanelCoordsClassName = cn(
  'm-0 break-all rounded bg-[rgba(0,0,0,0.35)] px-2 py-1.5 text-2xs leading-[1.4] text-[#f0fdf4]',
);

export const devViewPanelFieldClassName = cn('mt-0.5 flex flex-col gap-1');

export const devViewPanelFieldLabelClassName = cn('text-2xs text-[#94a3b8]');

export const devViewPanelInputClassName = cn(
  'box-border w-full rounded border border-[rgba(100,116,139,0.55)] bg-[rgba(15,23,42,0.75)] px-2 py-[5px] font-[inherit] text-2xs text-[#f0fdf4] placeholder:text-[#64748b] focus:border-[#38bdf8] focus:outline-none',
);

export const devViewPanelFileInputClassName = cn(
  devViewPanelInputClassName,
  'cursor-pointer py-1.5 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-[rgba(74,222,128,0.18)] file:px-2 file:py-1 file:font-[inherit] file:text-2xs file:text-[#86efac] hover:file:bg-[rgba(74,222,128,0.28)]',
);

export const devViewPanelSelectClassName = cn(
  devViewPanelInputClassName,
  'cursor-pointer appearance-none pr-7 [background-image:linear-gradient(45deg,transparent_50%,#94a3b8_50%),linear-gradient(135deg,#94a3b8_50%,transparent_50%)] [background-position:calc(100%-14px)_calc(50%+2px),calc(100%-9px)_calc(50%+2px)] [background-size:5px_5px,5px_5px] [background-repeat:no-repeat]',
);

export const devViewPanelTextareaClassName = cn(
  devViewPanelInputClassName,
  'min-h-[56px] resize-y leading-[1.4]',
);

export const devViewPanelSlugPreviewClassName = cn(
  'm-0 text-2xs leading-[1.4] text-[#94a3b8] [&_code]:text-[#86efac]',
);

export const devViewPanelActionsClassName = cn('mt-0.5 flex flex-wrap gap-1.5');

export const devViewPanelBrandPreviewWrapClassName = cn(
  'mt-2 flex h-12 max-w-[220px] items-center justify-start rounded border border-[rgba(100,116,139,0.35)] bg-[rgba(15,23,42,0.55)] px-2 py-1',
);

export const devViewPanelBrandLogoClassName = cn(
  'block max-h-10 max-w-full w-auto shrink-0 object-contain object-left',
);

export const devViewPanelBrandFaviconWrapClassName = cn(
  'mt-2 flex h-8 w-8 items-center justify-center rounded border border-[rgba(100,116,139,0.35)] bg-[rgba(15,23,42,0.55)] p-0.5',
);

export const devViewPanelBrandFaviconClassName = cn(
  'block h-full w-full object-contain object-center',
);

export const devViewPanelBtnVariants = cva(
  'cursor-pointer rounded border px-2.5 py-[5px] font-[inherit] text-2xs text-[#f0fdf4] disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      tone: {
        primary: 'border-[#4ade80] bg-[#166534] hover:enabled:bg-[#15803d]',
        secondary: 'border-[#64748b] bg-[#1e293b] hover:enabled:bg-[#334155]',
        danger: 'border-[#f87171] bg-[#7f1d1d] hover:enabled:bg-[#991b1b]',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

export const devViewPanelSectionHintClassName = cn(
  'm-0 text-2xs leading-[1.35] text-[#64748b]',
);

export const devViewPanelHotspotSectionClassName = cn(
  'flex flex-col gap-1.5 rounded-md border border-[rgba(100,116,139,0.35)] bg-[rgba(15,23,42,0.45)] px-2.5 pb-2 pt-2',
);

export const devViewPanelTabsClassName = cn(
  'flex gap-1 rounded border border-[rgba(100,116,139,0.4)] bg-[rgba(0,0,0,0.35)] p-0.5',
);

export const devViewPanelTabVariants = cva(
  'flex-1 cursor-pointer rounded border-0 px-2 py-1 font-[inherit] text-2xs font-semibold uppercase tracking-[0.04em] transition-colors',
  {
    variants: {
      kind: { nav: '', naming: '', info: '', scene: '', tour: '', debug: '' },
      active: {
        true: '',
        false: 'bg-transparent text-[#94a3b8] hover:text-[#e2e8f0]',
      },
    },
    compoundVariants: [
      {
        kind: 'nav',
        active: true,
        class: 'bg-[rgba(56,189,248,0.22)] text-[#7dd3fc]',
      },
      {
        kind: 'naming',
        active: true,
        class: 'bg-[rgba(244,114,182,0.22)] text-[#f9a8d4]',
      },
      {
        kind: 'info',
        active: true,
        class: 'bg-[rgba(250,204,21,0.22)] text-[#fde047]',
      },
      {
        kind: 'scene',
        active: true,
        class: 'bg-[rgba(74,222,128,0.22)] text-[#86efac]',
      },
      {
        kind: 'tour',
        active: true,
        class: 'bg-[rgba(167,139,250,0.22)] text-[#c4b5fd]',
      },
      {
        kind: 'debug',
        active: true,
        class: 'bg-[rgba(250,204,21,0.22)] text-[#fde047]',
      },
    ],
    defaultVariants: { active: false },
  },
);

export const devViewPanelToggleListClassName = cn(
  'm-0 flex flex-col gap-1 p-0',
);

export const devViewPanelToggleLabelClassName = cn(
  'flex cursor-pointer items-start gap-2 rounded px-0.5 py-0.5 text-2xs leading-[1.35] text-[#cbd5e1] hover:text-[#f0fdf4]',
);

export const devViewPanelToggleInputClassName = cn(
  'mt-0.5 size-3 shrink-0 cursor-pointer accent-[#4ade80]',
);

export const devViewPanelToggleNameClassName = cn(
  'font-semibold text-[#fde047] [&_code]:text-[#fde047]',
);

export const devViewPanelToggleHintClassName = cn('text-[#64748b]');

export const devViewPanelHotspotListClassName = cn(
  'm-0 flex list-none flex-col gap-1 p-0',
);

export const devViewPanelHotspotRowClassName = cn(
  'flex flex-col gap-1 rounded border border-[rgba(100,116,139,0.35)] bg-[rgba(0,0,0,0.25)] px-2 py-1.5',
);

export const devViewPanelHotspotRowSelectedClassName = cn(
  'border-[rgba(56,189,248,0.55)] bg-[rgba(56,189,248,0.08)]',
);
