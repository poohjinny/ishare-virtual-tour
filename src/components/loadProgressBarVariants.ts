import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const loadProgressVariants = cva(
  'pointer-events-none absolute inset-x-0 top-0 z-[110] h-[5px] overflow-hidden bg-[rgba(15,23,42,0.08)] opacity-100 transition-opacity duration-[220ms] ease-out',
  {
    variants: { phase: { idle: '', exit: 'opacity-0' } },
    defaultVariants: { phase: 'idle' },
  },
);

export const loadProgressBarClassName = cn(
  'h-full bg-gradient-to-r from-primary-dark to-primary-light shadow-[0_0_8px_rgba(var(--ishare-primary-rgb),0.5)] transition-[width] duration-200 ease-out',
);
