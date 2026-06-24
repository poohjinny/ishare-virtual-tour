import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { ExploreDirectoryLayout } from '../../constants/tourNavActions';
import {
  segmentedTabLayoutPanelAnimateInClassName,
  segmentedTabPanelContentClassName,
} from './segmentedTabsClasses';

interface ExploreLayoutPanelProps {
  layout: ExploreDirectoryLayout;
  children: ReactNode;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Gallery ↔ list only — vertical translate enter, not tied to directory tabs. */
export function ExploreLayoutPanel({
  layout,
  children,
  className = '',
}: ExploreLayoutPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const prevLayoutRef = useRef(layout);

  useEffect(() => {
    if (prevLayoutRef.current === layout) return;
    prevLayoutRef.current = layout;

    const node = contentRef.current;
    if (!node || prefersReducedMotion()) return;

    const frame = window.requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) return;

      el.style.setProperty(
        '--layout-enter-y',
        layout === 'list' ? '-8px' : '8px',
      );

      el.classList.remove(segmentedTabLayoutPanelAnimateInClassName);
      void el.offsetWidth;
      el.classList.add(segmentedTabLayoutPanelAnimateInClassName);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [layout]);

  return (
    <div
      ref={contentRef}
      className={cn(segmentedTabPanelContentClassName, className)}
    >
      {children}
    </div>
  );
}
