import { useEffect, useRef, type RefObject } from 'react';

/** Reset panel scroll when the active tab changes — not on first mount/remount. */
export function useSegmentedTabPanelScroll(
  panelKey: string,
  scrollRef: RefObject<HTMLElement | null>,
) {
  const prevKeyRef = useRef(panelKey);

  useEffect(() => {
    if (prevKeyRef.current === panelKey) return;
    prevKeyRef.current = panelKey;

    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    scrollRoot.scrollTo({ top: 0, behavior: 'auto' });
  }, [panelKey, scrollRef]);
}
