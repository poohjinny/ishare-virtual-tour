import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const devViewPanelRootClassName = cn(
  'pointer-events-auto absolute bottom-14 left-4 z-[100] flex max-w-[380px] flex-col gap-2.5 rounded-lg border border-[rgba(0,255,128,0.35)] bg-[rgba(0,0,0,0.85)] p-3.5 font-mono text-xs text-[#e2e8f0]',
);

export const devViewPanelAboveMinimapClassName = cn(
  'bottom-[142px] left-6 max-[480px]:bottom-[116px] max-[480px]:left-3',
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
        flags: 'border-[rgba(250,204,21,0.28)]',
        nav: 'border-[rgba(56,189,248,0.28)]',
        naming: 'border-[rgba(244,114,182,0.28)]',
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
        flags: 'text-[#fde047]',
        hotspot: 'text-[#94a3b8]',
        nav: 'text-[#7dd3fc]',
        naming: 'text-[#f9a8d4]',
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

export const devViewPanelBtnVariants = cva(
  'cursor-pointer rounded border px-2.5 py-[5px] font-[inherit] text-2xs text-[#f0fdf4] disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      tone: {
        primary: 'border-[#4ade80] bg-[#166534] hover:enabled:bg-[#15803d]',
        secondary: 'border-[#64748b] bg-[#1e293b] hover:enabled:bg-[#334155]',
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
      kind: { nav: '', naming: '' },
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
