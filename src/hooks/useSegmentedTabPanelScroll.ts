import { useEffect, type RefObject } from 'react';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useSegmentedTabPanelScroll(
  panelKey: string,
  scrollRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    scrollRoot.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [panelKey, scrollRef]);
}
