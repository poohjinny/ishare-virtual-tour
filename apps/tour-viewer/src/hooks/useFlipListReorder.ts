import { type RefObject, useLayoutEffect, useRef } from 'react';

export const FLIP_LIST_KEY_ATTR = 'data-flip-key';

const FLIP_DURATION_MS = 300;
const FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function flipListItems(list: HTMLElement): HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>(`[${FLIP_LIST_KEY_ATTR}]`)];
}

function recordFlipRects(list: HTMLElement): Map<string, DOMRect> {
  const next = new Map<string, DOMRect>();
  for (const item of flipListItems(list)) {
    const key = item.getAttribute(FLIP_LIST_KEY_ATTR);
    if (key) next.set(key, item.getBoundingClientRect());
  }
  return next;
}

/** FLIP reorder animation when `orderKey` changes (Explore sort / filter). */
export function useFlipListReorder(
  listRef: RefObject<HTMLElement | null>,
  orderKey: string,
  enabled: boolean,
): void {
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const skipNextRef = useRef(true);
  const prevEnabledRef = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || list.hidden) return;

    if (enabled && !prevEnabledRef.current) {
      skipNextRef.current = true;
    }
    prevEnabledRef.current = enabled;

    if (!enabled) return;

    const items = flipListItems(list);
    const shouldAnimate =
      !skipNextRef.current && !prefersReducedMotion() && items.length > 0;

    if (shouldAnimate) {
      for (const item of items) {
        const key = item.getAttribute(FLIP_LIST_KEY_ATTR);
        if (!key) continue;

        const first = prevRectsRef.current.get(key);
        if (!first) continue;

        const last = item.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (dx === 0 && dy === 0) continue;

        item.style.transform = `translate(${dx}px, ${dy}px)`;
        item.style.transition = 'none';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const handleEnd = (event: TransitionEvent) => {
              if (event.propertyName !== 'transform') return;
              item.removeEventListener('transitionend', handleEnd);
              item.style.transition = '';
              item.style.transform = '';
            };

            item.addEventListener('transitionend', handleEnd);
            item.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`;
            item.style.transform = '';
          });
        });
      }
    }

    skipNextRef.current = false;
    prevRectsRef.current = recordFlipRects(list);
  }, [enabled, listRef, orderKey]);
}
