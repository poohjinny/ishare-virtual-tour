import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  SEGMENTED_TAB_ACTIVE_CLASS,
  SEGMENTED_TAB_CLASS,
} from '../components/ui/segmentedTabsClasses';

export interface SegmentedTabIndicatorRect {
  left: number;
  width: number;
}

interface UseSegmentedTabIndicatorOptions {
  scrollable?: boolean;
  /** When active key matches, scroll tab list back to the start. */
  scrollToStartKey?: string;
  /** Re-measure when tab count or layout changes. */
  observeKey?: string | number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useSegmentedTabIndicator(
  activeKey: string,
  {
    scrollable = false,
    scrollToStartKey,
    observeKey = 0,
  }: UseSegmentedTabIndicatorOptions = {},
) {
  const tablistRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<SegmentedTabIndicatorRect>({
    left: 0,
    width: 0,
  });
  const [indicatorReady, setIndicatorReady] = useState(false);

  const updateIndicator = useCallback(() => {
    const tablist = tablistRef.current;
    if (!tablist) return;

    const activeTab = tablist.querySelector<HTMLElement>(
      `.${SEGMENTED_TAB_ACTIVE_CLASS}`,
    );
    if (!activeTab) return;

    setIndicator({ left: activeTab.offsetLeft, width: activeTab.offsetWidth });
  }, []);

  useLayoutEffect(() => {
    updateIndicator();
    const frame = window.requestAnimationFrame(() => {
      setIndicatorReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeKey, updateIndicator]);

  useLayoutEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) return;

    const observer = new ResizeObserver(() => {
      updateIndicator();
    });
    observer.observe(tablist);

    tablist.querySelectorAll(`.${SEGMENTED_TAB_CLASS}`).forEach((tab) => {
      observer.observe(tab);
    });

    return () => observer.disconnect();
  }, [observeKey, updateIndicator]);

  useEffect(() => {
    if (!scrollable) return;

    const tablist = tablistRef.current;
    if (!tablist) return;

    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';

    if (scrollToStartKey && activeKey === scrollToStartKey) {
      tablist.scrollTo({ left: 0, behavior });
      return;
    }

    const activeTab = tablist.querySelector<HTMLElement>(
      `.${SEGMENTED_TAB_ACTIVE_CLASS}`,
    );
    activeTab?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior,
    });
  }, [activeKey, scrollable, scrollToStartKey]);

  return { tablistRef, indicator, indicatorReady };
}
