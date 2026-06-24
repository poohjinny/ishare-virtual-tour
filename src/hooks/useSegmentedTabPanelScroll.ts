import { useEffect, type RefObject } from 'react';

export function useSegmentedTabPanelScroll(
  panelKey: string,
  scrollRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    scrollRoot.scrollTo({ top: 0, behavior: 'auto' });
  }, [panelKey, scrollRef]);
}
