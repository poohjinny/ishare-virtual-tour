'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';

const FLIP_MS = 320;
const FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * FLIP-sort rows (and drag reorder) by element id. First paint is a capture
 * only — no intro animation.
 */
export function useFlipList(ids: readonly string[]) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const prevRects = useRef(new Map<string, DOMRect>());
  const primed = useRef(false);
  const signature = ids.join('\0');

  const refFor = useCallback((id: string) => {
    return (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    };
  }, []);

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    for (const [id, node] of nodes.current) {
      nextRects.set(id, node.getBoundingClientRect());
    }

    if (!primed.current) {
      primed.current = true;
      prevRects.current = nextRects;
      return;
    }

    if (!prefersReducedMotion()) {
      for (const [id, node] of nodes.current) {
        const first = prevRects.current.get(id);
        const last = nextRects.get(id);
        if (!first || !last) continue;
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
        node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: FLIP_MS, easing: FLIP_EASING },
        );
      }
    }

    prevRects.current = nextRects;
  }, [signature]);

  return refFor;
}
