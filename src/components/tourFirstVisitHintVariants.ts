import { cn } from '../lib/cn';
import { materialSymbolLayoutClassName } from './ui/materialSymbolClasses';

export const TOUR_FIRST_VISIT_HINT_FADE_MS = 280;

export const tourFirstVisitHintRootClassName = cn(
  'pointer-events-none absolute inset-0 z-[85] flex items-center justify-center px-4',
);

export const tourFirstVisitHintPillClassName = cn(
  'inline-flex items-center gap-3 rounded-full border border-white/15',
  'bg-[rgba(15,23,42,0.58)] text-base font-normal tracking-[0.01em] text-white/70',
  'px-6 py-3',
  'shadow-[0_16px_40px_rgba(15,23,42,0.45),0_6px_16px_rgba(15,23,42,0.28)] backdrop-blur-[8px] backdrop-saturate-[120%]',
  'transition-opacity duration-[280ms] ease-out',
);

export const tourFirstVisitHintVerbClassName = cn(
  'font-semibold text-white/95',
);

export const tourFirstVisitHintSegmentClassName = cn(
  'inline-flex items-center gap-1.5',
);

export const tourFirstVisitHintSeparatorClassName = cn(
  'text-white/55 select-none',
);

export const tourFirstVisitHintIconClassName = cn(
  materialSymbolLayoutClassName,
  'text-white/50',
);

export const tourFirstVisitHintPillVisibleClassName = 'opacity-100';

export const tourFirstVisitHintPillHiddenClassName = 'opacity-0';
