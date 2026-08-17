import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useSegmentedTabPanelScroll } from '../../hooks/useSegmentedTabPanelScroll';
import { resolveSegmentedTabEnterOffsetPx } from '../../utils/segmentedTabSlideDirection';
import { segmentedTabPanelAnimateInClassName } from './segmentedTabsClasses';

interface SegmentedTabPanelContentProps {
  panelKey: string;
  children: ReactNode;
  className?: string;
  /** Ordered tab ids — enables directional slide on tab change. */
  tabOrder?: readonly string[];
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runDirectionalTabEnter(
  el: HTMLDivElement,
  tabOrder: readonly string[] | undefined,
  previousKey: string,
  nextKey: string,
) {
  const offsetPx =
    tabOrder ?
      resolveSegmentedTabEnterOffsetPx(tabOrder, previousKey, nextKey)
    : 16;

  el.style.setProperty('--tab-enter-x', `${offsetPx}px`);
  el.classList.remove(segmentedTabPanelAnimateInClassName);
  void el.offsetWidth;
  el.classList.add(segmentedTabPanelAnimateInClassName);
}

/** Directional tab enter animation (transform only — no opacity flash). */
export function SegmentedTabPanelContent({
  panelKey,
  children,
  className = '',
  tabOrder,
}: SegmentedTabPanelContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const prevPanelKeyRef = useRef(panelKey);

  useEffect(() => {
    if (prevPanelKeyRef.current === panelKey) return;

    const previousKey = prevPanelKeyRef.current;
    prevPanelKeyRef.current = panelKey;

    const node = contentRef.current;
    if (!node || prefersReducedMotion()) return;

    const frame = window.requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) return;

      runDirectionalTabEnter(el, tabOrder, previousKey, panelKey);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [panelKey, tabOrder]);

  return (
    <div ref={contentRef} className={className}>
      {children}
    </div>
  );
}

interface SegmentedTabPanelProps {
  panelKey: string;
  children: ReactNode;
  id?: string;
  'aria-labelledby'?: string;
  className?: string;
  scrollRef?: RefObject<HTMLElement | null>;
  tabOrder?: readonly string[];
}

export function SegmentedTabPanel({
  panelKey,
  children,
  id,
  'aria-labelledby': ariaLabelledBy,
  className = '',
  scrollRef,
  tabOrder,
}: SegmentedTabPanelProps) {
  const fallbackScrollRef = useRef<HTMLElement | null>(null);
  useSegmentedTabPanelScroll(panelKey, scrollRef ?? fallbackScrollRef);

  const content =
    tabOrder ?
      <SegmentedTabPanelContent panelKey={panelKey} tabOrder={tabOrder}>
        {children}
      </SegmentedTabPanelContent>
    : <div>{children}</div>;

  return (
    <div
      id={id}
      role='tabpanel'
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      {content}
    </div>
  );
}
