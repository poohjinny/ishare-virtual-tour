import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import {
  segmentedTabActiveSelector,
  segmentedTabSelector,
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

function readActiveTabIndicator(
  activeTab: HTMLElement,
): SegmentedTabIndicatorRect {
  return { left: activeTab.offsetLeft, width: activeTab.offsetWidth };
}

function isTabFullyVisible(
  scrollEl: HTMLElement,
  track: HTMLElement,
  activeTab: HTMLElement,
): boolean {
  const tabStart =
    track.offsetLeft + activeTab.offsetLeft - scrollEl.scrollLeft;
  const tabEnd = tabStart + activeTab.offsetWidth;

  return tabStart >= -1 && tabEnd <= scrollEl.clientWidth + 1;
}

function scrollActiveTabIntoView(
  scrollEl: HTMLElement,
  track: HTMLElement,
  activeTab: HTMLElement,
  behavior: ScrollBehavior,
) {
  if (isTabFullyVisible(scrollEl, track, activeTab)) return;

  const maxScroll = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
  const tabLeft = track.offsetLeft + activeTab.offsetLeft;
  const target = tabLeft - (scrollEl.clientWidth - activeTab.offsetWidth) / 2;

  scrollEl.scrollTo({
    left: Math.min(maxScroll, Math.max(0, target)),
    behavior,
  });
}

export function useSegmentedTabIndicator(
  activeKey: string,
  {
    scrollable = false,
    scrollToStartKey,
    observeKey = 0,
  }: UseSegmentedTabIndicatorOptions = {},
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<SegmentedTabIndicatorRect>({
    left: 0,
    width: 0,
  });
  const [indicatorReady, setIndicatorReady] = useState(false);

  const updateIndicator = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const activeTab = track.querySelector<HTMLElement>(
      segmentedTabActiveSelector,
    );
    if (!activeTab) return;

    setIndicator(readActiveTabIndicator(activeTab));
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const activeTab = track.querySelector<HTMLElement>(
      segmentedTabActiveSelector,
    );
    if (!activeTab) return;

    setIndicatorReady(false);

    if (scrollable) {
      const scrollEl = scrollRef.current;
      const behavior: ScrollBehavior =
        prefersReducedMotion() ? 'auto' : 'smooth';

      if (scrollEl) {
        if (scrollToStartKey && activeKey === scrollToStartKey) {
          scrollEl.scrollTo({ left: 0, behavior });
        } else {
          scrollActiveTabIntoView(scrollEl, track, activeTab, behavior);
        }
      }
    }

    updateIndicator();

    const frame = window.requestAnimationFrame(() => {
      updateIndicator();
      setIndicatorReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeKey, scrollable, scrollToStartKey, updateIndicator]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(() => {
      updateIndicator();
    });
    observer.observe(track);

    track.querySelectorAll(segmentedTabSelector).forEach((tab) => {
      observer.observe(tab);
    });

    return () => observer.disconnect();
  }, [observeKey, updateIndicator]);

  return { trackRef, scrollRef, indicator, indicatorReady };
}
