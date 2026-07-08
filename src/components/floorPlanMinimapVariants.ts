import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { materialSymbolCompactClassName } from './ui/materialSymbolClasses';

export const floorPlanMinimapRootClassName = cn(
  'pointer-events-none absolute z-[85]',
  'bottom-[var(--tour-chrome-inset-bottom)] left-[var(--tour-chrome-inset-left)]',
);

export const floorPlanMinimapCollapsedRootClassName = cn(
  'pointer-events-auto absolute z-[85]',
  'bottom-[var(--tour-chrome-inset-bottom)] left-[var(--tour-chrome-inset-left)]',
);

export const floorPlanMinimapChipBtnClassName = cn(
  'flex size-11 cursor-pointer items-center justify-center rounded-full border-none',
  'bg-[var(--ishare-float-glass-bg)] text-foreground shadow-[var(--ishare-float-glass-shadow)]',
  'transition-[background,transform] duration-150',
  'hover:bg-[var(--ishare-float-glass-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light',
);

export const floorPlanMinimapChipIconClassName = materialSymbolCompactClassName;

export const floorPlanMinimapFrameClassName = cn(
  'pointer-events-auto relative w-fit overflow-hidden rounded-[10px] bg-[var(--ishare-float-glass-bg)] p-1.5 leading-none shadow-[var(--ishare-float-glass-shadow)] max-[480px]:rounded-lg max-[480px]:p-2',
);

export const floorPlanMinimapCloseBtnClassName = cn(
  'absolute top-1 right-1 z-[2] flex size-7 cursor-pointer items-center justify-center rounded-full border-none',
  'bg-white/88 text-muted shadow-sm',
  'hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-light',
);

export const floorPlanMinimapMapClassName = cn(
  'relative w-[108px] overflow-hidden rounded-md max-[480px]:w-20 max-[480px]:rounded-[5px]',
);

export const floorPlanMinimapImageClassName = cn(
  'block w-full select-none [-webkit-user-drag:none]',
);

export const floorPlanMinimapOverlayClassName = cn(
  'pointer-events-none absolute inset-0 h-full w-full',
);

export const floorPlanMinimapFovClassName = cn(
  'fill-primary/28 stroke-primary/55 [stroke-linejoin:round] [stroke-width:2]',
);

export const floorPlanMinimapPulseClassName = cn(
  'animate-floor-plan-pulse fill-primary/18 motion-reduce:animate-none motion-reduce:opacity-35',
);

export const floorPlanMinimapDotVariants = cva(
  'pointer-events-auto [stroke-width:2.5] transition-[fill,stroke] duration-150',
  {
    variants: {
      current: {
        true: 'cursor-default fill-primary stroke-white [stroke-width:3.5]',
        false:
          'cursor-pointer fill-white stroke-[#64748b] hover:fill-page hover:stroke-primary',
      },
    },
    defaultVariants: { current: false },
  },
);
