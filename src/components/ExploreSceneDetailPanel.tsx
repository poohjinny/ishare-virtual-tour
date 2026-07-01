import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  EXPLORE_SCENE_DETAIL_ENTER_X_PX,
  EXPLORE_SCENE_DETAIL_EXIT_X_PX,
  exploreSceneDetailAnimateInClassName,
  exploreSceneDetailAnimateOutClassName,
  tourNavSceneDetailPanelClassName,
} from './tourNavFloatVariants';
import { segmentedTabPanelContentClassName } from './ui/segmentedTabsClasses';

interface ExploreSceneDetailPanelProps {
  sceneId: string;
  children: ReactNode;
  className?: string;
  exiting?: boolean;
  onExitComplete?: () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const EXPLORE_SCENE_DETAIL_EXIT_MS = 220;

/** Location detail drill-in — horizontal slide + fade on enter and back. */
export function ExploreSceneDetailPanel({
  sceneId,
  children,
  className = '',
  exiting = false,
  onExitComplete,
}: ExploreSceneDetailPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

  useEffect(() => {
    if (exiting) return;

    const node = contentRef.current;
    if (!node || prefersReducedMotion()) return;

    const frame = window.requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) return;

      el.style.setProperty(
        '--explore-detail-enter-x',
        `${EXPLORE_SCENE_DETAIL_ENTER_X_PX}px`,
      );
      el.classList.remove(
        exploreSceneDetailAnimateInClassName,
        exploreSceneDetailAnimateOutClassName,
      );
      void el.offsetWidth;
      el.classList.add(exploreSceneDetailAnimateInClassName);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [sceneId, exiting]);

  useEffect(() => {
    if (!exiting) return;

    if (prefersReducedMotion()) {
      onExitCompleteRef.current?.();
      return;
    }

    let cancelled = false;
    let el: HTMLDivElement | null = null;
    let onAnimationEnd: ((event: AnimationEvent) => void) | null = null;
    let fallbackTimer: number | null = null;

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      if (el && onAnimationEnd) {
        el.removeEventListener('animationend', onAnimationEnd);
      }
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      onExitCompleteRef.current?.();
    };

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;

      el = contentRef.current;
      if (!el) {
        finish();
        return;
      }

      el.style.setProperty(
        '--explore-detail-exit-x',
        `${EXPLORE_SCENE_DETAIL_EXIT_X_PX}px`,
      );
      el.classList.remove(exploreSceneDetailAnimateInClassName);
      void el.offsetWidth;
      el.classList.add(exploreSceneDetailAnimateOutClassName);

      onAnimationEnd = (event: AnimationEvent) => {
        if (event.target !== el) return;
        if (event.animationName !== 'explore-scene-detail-out') return;
        finish();
      };
      el.addEventListener('animationend', onAnimationEnd);
      fallbackTimer = window.setTimeout(finish, EXPLORE_SCENE_DETAIL_EXIT_MS);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (el && onAnimationEnd) {
        el.removeEventListener('animationend', onAnimationEnd);
      }
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    };
  }, [exiting]);

  return (
    <div
      ref={contentRef}
      className={cn(
        segmentedTabPanelContentClassName,
        tourNavSceneDetailPanelClassName,
        className,
      )}
    >
      {children}
    </div>
  );
}
