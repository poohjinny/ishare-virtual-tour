import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  EXPLORE_DIRECTORY_BACK_ENTER_X_PX,
  exploreDirectoryBackAnimateInClassName,
  tourNavExploreDirectoryPanelClassName,
} from './tourNavFloatVariants';

interface ExploreDirectoryPanelProps {
  /** Increment after location detail back — retriggers directory enter animation. */
  enterToken: number;
  children: ReactNode;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Explore directory — slide in from left after location detail back. */
export function ExploreDirectoryPanel({
  enterToken,
  children,
  className = '',
}: ExploreDirectoryPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enterToken === 0) return;

    const node = contentRef.current;
    if (!node || prefersReducedMotion()) return;

    const frame = window.requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) return;

      el.style.setProperty(
        '--explore-directory-enter-x',
        `${EXPLORE_DIRECTORY_BACK_ENTER_X_PX}px`,
      );
      el.classList.remove(exploreDirectoryBackAnimateInClassName);
      void el.offsetWidth;
      el.classList.add(exploreDirectoryBackAnimateInClassName);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [enterToken]);

  return (
    <div
      ref={contentRef}
      className={cn(tourNavExploreDirectoryPanelClassName, className)}
    >
      {children}
    </div>
  );
}
