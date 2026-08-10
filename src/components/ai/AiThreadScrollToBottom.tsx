import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
  type TransitionEvent,
} from 'react';
import { tourNavIconButtonA11y } from '../../constants/tourNavActions';
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

/** Match AiChatPanel near-bottom sticky threshold. */
const SCROLL_TO_BOTTOM_SHOW_EPS_PX = 96;

const SCROLL_TO_BOTTOM_LABEL = 'Scroll to bottom';

interface AiThreadScrollToBottomProps {
  scrollRef: RefObject<HTMLElement | null>;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Floating control — Guide thread, bottom-right above the composer. */
export function AiThreadScrollToBottom({
  scrollRef,
}: AiThreadScrollToBottomProps) {
  const [wantVisible, setWantVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const sync = () => {
      const remaining = root.scrollHeight - root.scrollTop - root.clientHeight;
      setWantVisible(remaining > SCROLL_TO_BOTTOM_SHOW_EPS_PX);
    };

    sync();
    root.addEventListener('scroll', sync, { passive: true });

    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    ro?.observe(root);
    // scrollHeight can grow from cards without the scroller’s border box changing.
    const content = root.firstElementChild;
    if (content) ro?.observe(content);

    return () => {
      root.removeEventListener('scroll', sync);
      ro?.disconnect();
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
      top: Math.max(0, root.scrollHeight - root.clientHeight),
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
        <IconTooltip label={SCROLL_TO_BOTTOM_LABEL} placement='left'>
          <button
            type='button'
            className={tourNavDirectoryScrollToTopBtnClassName}
            {...tourNavIconButtonA11y(SCROLL_TO_BOTTOM_LABEL)}
            onClick={handleClick}
            tabIndex={entered ? 0 : -1}
          >
            <MaterialSymbol
              name='keyboard_arrow_down'
              sizePx={MATERIAL_SYMBOL_SIZE_22}
            />
          </button>
        </IconTooltip>
      </div>
    </div>
  );
}
