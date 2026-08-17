import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
  type TransitionEvent,
} from 'react';
import {
  TOUR_NAV_ACTION_SCROLL_TO_TOP,
  tourNavIconButtonA11y,
} from '../../constants/tourNavActions';
import {
  tourNavDirectoryScrollToTopBtnClassName,
  tourNavDirectoryScrollToTopClassName,
  tourNavDirectoryScrollToTopEnteredClassName,
  tourNavDirectoryScrollToTopExitedClassName,
  tourNavDirectoryScrollToTopHostClassName,
} from '../tourNavFloatVariants';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_22 } from '../ui/materialSymbolClasses';
import { IconTooltip } from '../ui/IconTooltip';
import { cn } from '../../lib/cn';

/** Show once the scroller has left the top (avoids subpixel flicker). */
const SCROLL_TO_TOP_SHOW_EPS_PX = 48;

interface ExploreDirectoryScrollToTopProps {
  scrollRef: RefObject<HTMLElement | null>;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Floating control — Explore directory / search body, bottom-right. */
export function ExploreDirectoryScrollToTop({
  scrollRef,
}: ExploreDirectoryScrollToTopProps) {
  const [wantVisible, setWantVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const sync = () => {
      setWantVisible(root.scrollTop > SCROLL_TO_TOP_SHOW_EPS_PX);
    };

    sync();
    root.addEventListener('scroll', sync, { passive: true });
    return () => {
      root.removeEventListener('scroll', sync);
    };
  }, [scrollRef]);

  useLayoutEffect(() => {
    if (wantVisible) {
      setMounted(true);
      if (prefersReducedMotion()) {
        setEntered(true);
        return;
      }
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    setEntered(false);
    if (prefersReducedMotion()) {
      setMounted(false);
    }
  }, [wantVisible]);

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (
        event.propertyName !== 'translate' &&
        event.propertyName !== 'opacity' &&
        event.propertyName !== 'scale'
      ) {
        return;
      }
      if (!wantVisible) setMounted(false);
    },
    [wantVisible],
  );

  const handleClick = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    root.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [scrollRef]);

  if (!mounted) return null;

  return (
    <div className={tourNavDirectoryScrollToTopHostClassName}>
      <div
        className={cn(
          tourNavDirectoryScrollToTopClassName,
          entered ?
            tourNavDirectoryScrollToTopEnteredClassName
          : tourNavDirectoryScrollToTopExitedClassName,
        )}
        onTransitionEnd={handleTransitionEnd}
      >
        <IconTooltip label={TOUR_NAV_ACTION_SCROLL_TO_TOP} placement='left'>
          <button
            type='button'
            className={tourNavDirectoryScrollToTopBtnClassName}
            {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SCROLL_TO_TOP)}
            onClick={handleClick}
            tabIndex={entered ? 0 : -1}
          >
            <MaterialSymbol
              name='keyboard_arrow_up'
              sizePx={MATERIAL_SYMBOL_SIZE_22}
            />
          </button>
        </IconTooltip>
      </div>
    </div>
  );
}
