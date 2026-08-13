import { cn } from '../lib/cn';
import { materialSymbolLayoutClassName } from './ui/materialSymbolClasses';

export const TOUR_FIRST_VISIT_HINT_FADE_MS = 280;

export const tourFirstVisitHintRootClassName = cn(
  'pointer-events-none absolute inset-0 z-[85] flex items-center justify-center px-4',
  'max-[480px]:items-end max-[480px]:pb-[calc(var(--tour-chrome-inset-bottom)+var(--tour-chrome-ai-fab-size)+0.75rem)]',
);

export const tourFirstVisitHintPillClassName = cn(
  'inline-flex items-center gap-2 rounded-full border border-white/15',
  'bg-[var(--ishare-first-visit-hint-overlay)] text-sm font-normal tracking-[0.01em] text-white/80',
  'px-4 py-2',
  'shadow-[0_16px_40px_rgba(15,23,42,0.45),0_6px_16px_rgba(15,23,42,0.28)]',
  'transition-opacity duration-[280ms] ease-out',
);

export const tourFirstVisitHintVerbClassName = cn(
  'font-semibold text-white/95',
);

export const tourFirstVisitHintSegmentClassName = cn(
  'inline-flex items-center gap-1.5',
);

export const tourFirstVisitHintSeparatorClassName = cn(
  'text-white/65 select-none',
);

export const tourFirstVisitHintIconClassName = cn(
  materialSymbolLayoutClassName,
  'text-white/60',
);

export const tourFirstVisitHintPillVisibleClassName = 'opacity-100';

export const tourFirstVisitHintPillHiddenClassName = 'opacity-0';
