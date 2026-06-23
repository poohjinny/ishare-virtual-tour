import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const floorPlanMinimapRootClassName = cn(
  'pointer-events-none absolute bottom-6 left-6 z-[85] max-[480px]:bottom-4 max-[480px]:left-3',
);

export const floorPlanMinimapFrameClassName = cn(
  'relative w-fit overflow-hidden rounded-[10px] bg-[var(--ishare-float-glass-bg)] p-1.5 leading-none shadow-[var(--ishare-float-glass-shadow)] backdrop-blur-[4px] backdrop-saturate-[110%] max-[480px]:rounded-lg max-[480px]:p-2',
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
  'pointer-events-auto cursor-default fill-white stroke-[#64748b] [stroke-width:2.5] transition-[fill,stroke] duration-150',
  {
    variants: {
      current: {
        true: 'cursor-default fill-primary stroke-white [stroke-width:3.5]',
        false: 'cursor-pointer hover:fill-page hover:stroke-primary',
      },
    },
    defaultVariants: { current: false },
  },
);
