import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import {
  TOUR_FIRST_VISIT_HINT_DRAG_REST,
  TOUR_FIRST_VISIT_HINT_DRAG_VERB,
  TOUR_FIRST_VISIT_HINT_TAP_REST,
  TOUR_FIRST_VISIT_HINT_TAP_VERB,
} from '../constants/tourFirstVisitHint';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from './ui/materialSymbolClasses';
import {
  TOUR_FIRST_VISIT_HINT_FADE_MS,
  tourFirstVisitHintIconClassName,
  tourFirstVisitHintPillClassName,
  tourFirstVisitHintPillHiddenClassName,
  tourFirstVisitHintPillVisibleClassName,
  tourFirstVisitHintRootClassName,
  tourFirstVisitHintSegmentClassName,
  tourFirstVisitHintSeparatorClassName,
  tourFirstVisitHintVerbClassName,
} from './tourFirstVisitHintVariants';

interface TourFirstVisitHintProps {
  visible: boolean;
}

export function TourFirstVisitHint({ visible }: TourFirstVisitHintProps) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      setShown(false);
      const enterFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShown(true));
      });
      return () => cancelAnimationFrame(enterFrame);
    }

    setShown(false);
    if (!mountedRef.current) return;

    const exitTimer = window.setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
    }, TOUR_FIRST_VISIT_HINT_FADE_MS);

    return () => window.clearTimeout(exitTimer);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div className={tourFirstVisitHintRootClassName}>
      <p
        className={cn(
          tourFirstVisitHintPillClassName,
          shown ?
            tourFirstVisitHintPillVisibleClassName
          : tourFirstVisitHintPillHiddenClassName,
        )}
        role='status'
        aria-live='polite'
      >
        <span className={tourFirstVisitHintSegmentClassName}>
          <MaterialSymbol
            name='open_with'
            sizePx={MATERIAL_SYMBOL_SIZE_20}
            className={tourFirstVisitHintIconClassName}
          />
          <span className={tourFirstVisitHintVerbClassName}>
            {TOUR_FIRST_VISIT_HINT_DRAG_VERB}
          </span>{' '}
          {TOUR_FIRST_VISIT_HINT_DRAG_REST}
        </span>
        <span
          className={tourFirstVisitHintSeparatorClassName}
          aria-hidden='true'
        >
          ·
        </span>
        <span className={tourFirstVisitHintSegmentClassName}>
          <span className={tourFirstVisitHintVerbClassName}>
            {TOUR_FIRST_VISIT_HINT_TAP_VERB}
          </span>{' '}
          {TOUR_FIRST_VISIT_HINT_TAP_REST}
          <MaterialSymbol
            name='touch_app'
            sizePx={MATERIAL_SYMBOL_SIZE_20}
            className={tourFirstVisitHintIconClassName}
          />
        </span>
      </p>
    </div>
  );
}
