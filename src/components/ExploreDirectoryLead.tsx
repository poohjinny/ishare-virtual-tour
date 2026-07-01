import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type TransitionEvent,
} from 'react';
import {
  EXPLORE_DIRECTORY_LEAD_CLAMP_LINES,
  TOUR_DIRECTORY_LEAD_SHOW_LESS,
  TOUR_DIRECTORY_LEAD_SHOW_MORE,
} from '../constants/tourDirectory';
import { cn } from '../lib/cn';
import {
  tourNavDirectoryLeadBodyAnimateClassName,
  tourNavDirectoryLeadBodyClampedClassName,
  tourNavDirectoryLeadMeasureClassName,
  tourNavDirectoryLeadRootClassName,
  tourNavDirectoryLeadToggleClassName,
} from './tourNavFloatVariants';

/** 3 lines at text-md / leading 1.55 — matches clamp preview height. */
const EXPLORE_DIRECTORY_LEAD_COLLAPSED_MAX_HEIGHT = `${EXPLORE_DIRECTORY_LEAD_CLAMP_LINES * 1.55}em`;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface ExploreDirectoryLeadProps {
  text: string;
}

export function ExploreDirectoryLead({ text }: ExploreDirectoryLeadProps) {
  const bodyId = useId();
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [lineClampActive, setLineClampActive] = useState(true);
  const [overflows, setOverflows] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);

  const measureFullHeight = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;
    setFullHeight(el.scrollHeight);
  }, []);

  const measureOverflow = useCallback(() => {
    const el = bodyRef.current;
    if (!el || expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  useEffect(() => {
    setExpanded(false);
    setLineClampActive(true);
  }, [text]);

  useLayoutEffect(() => {
    measureFullHeight();
  }, [measureFullHeight, text]);

  useEffect(() => {
    measureOverflow();

    const el = bodyRef.current;
    const measureEl = measureRef.current;
    if (!el && !measureEl) return;

    const observer = new ResizeObserver(() => {
      measureFullHeight();
      measureOverflow();
    });

    if (el) observer.observe(el);
    if (measureEl) observer.observe(measureEl);

    return () => observer.disconnect();
  }, [measureFullHeight, measureOverflow, text]);

  const showToggle = expanded || overflows;
  const collapsedMaxHeight = EXPLORE_DIRECTORY_LEAD_COLLAPSED_MAX_HEIGHT;
  const expandedMaxHeight =
    fullHeight != null ? `${fullHeight}px` : collapsedMaxHeight;

  const handleToggle = () => {
    const nextExpanded = !expanded;

    if (prefersReducedMotion()) {
      setExpanded(nextExpanded);
      setLineClampActive(!nextExpanded);
      return;
    }

    if (nextExpanded) {
      setLineClampActive(false);
      window.requestAnimationFrame(() => {
        setExpanded(true);
      });
      return;
    }

    setExpanded(false);
  };

  const handleBodyTransitionEnd = (event: TransitionEvent<HTMLParagraphElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'max-height') return;

    setLineClampActive(!expanded);
  };

  return (
    <div className={tourNavDirectoryLeadRootClassName}>
      <p
        ref={measureRef}
        aria-hidden='true'
        className={tourNavDirectoryLeadMeasureClassName}
      >
        {text}
      </p>
      <p
        ref={bodyRef}
        id={bodyId}
        className={cn(
          tourNavDirectoryLeadBodyAnimateClassName,
          lineClampActive && tourNavDirectoryLeadBodyClampedClassName,
        )}
        style={{ maxHeight: expanded ? expandedMaxHeight : collapsedMaxHeight }}
        onTransitionEnd={handleBodyTransitionEnd}
      >
        {text}
      </p>
      {showToggle ?
        <button
          type='button'
          className={tourNavDirectoryLeadToggleClassName}
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={handleToggle}
        >
          {expanded ?
            TOUR_DIRECTORY_LEAD_SHOW_LESS
          : TOUR_DIRECTORY_LEAD_SHOW_MORE}
        </button>
      : null}
    </div>
  );
}
