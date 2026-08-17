'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

import { useForceNavProgress } from '@/lib/admin-debug';
import { LOADING_REVEAL_DELAY_MS } from '@/lib/loading-timing';
import { cn } from '@/lib/utils';

const NavigationPendingContext = createContext(false);

/** Never leave the bar up when a navigation is cancelled or never lands. */
const NAV_PENDING_TIMEOUT_MS = 8000;

/**
 * Arrival fills the bar and fades it, so a bar that appears is always on screen
 * for this long afterwards — no separate minimum hold is needed.
 */
const NAV_EXIT_MS = 260;

/*
 * A route transition has no measurable progress, so the bar trickles: it starts
 * with a visible head, then covers a share of the remaining distance each tick
 * so it slows as it approaches the ceiling and never claims to be done. Arrival
 * fills it to 100% and fades it out.
 */
const NAV_START_PERCENT = 8;
const NAV_CEILING_PERCENT = 90;
const NAV_TICK_MS = 140;
/** Share of the distance left to the ceiling covered per tick. */
const NAV_TICK_APPROACH = 0.14;

/** Debug fixture: how long each replayed run trickles, then rests. */
const NAV_DEMO_RUN_MS = 1800;
const NAV_DEMO_GAP_MS = 700;

export function useNavigationPending() {
  return useContext(NavigationPendingContext);
}

/** Tracks in-app link clicks until the destination pathname is current. */
export function NavigationPendingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<{
    fromPath: string;
    href: string;
  } | null>(null);
  const active =
    pendingNavigation !== null &&
    pendingNavigation.fromPath === pathname &&
    pendingNavigation.href !== pathname;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
      if (anchor.target === '_blank' || /^(https?:)?\/\//.test(href)) return;
      const nextPath = href.split('?')[0];
      if (!nextPath || nextPath === pathname) return;
      setPendingNavigation({ fromPath: pathname, href: nextPath });
    }

    /**
     * A traversal abandons the click it interrupted — including query-only ones
     * where the pathname never changes.
     */
    function onHistoryMove() {
      setPendingNavigation(null);
    }

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onHistoryMove);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onHistoryMove);
    };
  }, [pathname]);

  /**
   * A crumb must not outlive its navigation: the route change consumes it, and
   * one that never lands expires. Otherwise a leftover crumb re-arms the bar
   * once history returns to `fromPath` — it reads as the debug progress loop.
   */
  useEffect(() => {
    if (!pendingNavigation) return;
    const landed = pendingNavigation.fromPath !== pathname;
    const timer = window.setTimeout(
      () => setPendingNavigation(null),
      landed ? 0 : NAV_PENDING_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pathname, pendingNavigation]);

  return (
    <NavigationPendingContext.Provider value={active}>
      {children}
    </NavigationPendingContext.Provider>
  );
}

/**
 * Thin top bar while an in-app link navigation is in flight. Height and width
 * easing match the viewer's `LoadProgressBar` so Admin and preview read as one
 * loading language.
 */
export function NavigationProgress() {
  const pending = useNavigationPending();
  const forceProgress = useForceNavProgress();
  const [demoRunning, setDemoRunning] = useState(false);
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const demoOn = forceProgress.ready && forceProgress.enabled;
  /** Fixture is visual only — it never feeds `useNavigationPending`. */
  const active = pending || (demoOn && demoRunning);

  useEffect(() => {
    if (!demoOn) return;

    /*
     * Replay whole runs instead of parking at the ceiling: a fixture that never
     * arrives reads as a stuck bar. Each pass trickles, fills, fades, repeats.
     */
    let timer = 0;

    function schedule(running: boolean, delayMs: number) {
      timer = window.setTimeout(() => {
        setDemoRunning(running);
        schedule(!running, running ? NAV_DEMO_RUN_MS : NAV_DEMO_GAP_MS);
      }, delayMs);
    }

    schedule(true, 0);

    return () => window.clearTimeout(timer);
  }, [demoOn]);

  /*
   * Nothing is drawn until the navigation outlives the shared reveal delay, so
   * a transition that lands quickly never shows a bar to flash. The trickle
   * starts with the bar, not with the click, so it enters at its own start.
   */
  useEffect(() => {
    if (!active) return;

    let trickle = 0;
    const reveal = window.setTimeout(() => {
      setVisible(true);
      setPercent(NAV_START_PERCENT);
      trickle = window.setInterval(() => {
        setPercent(
          (current) =>
            current + (NAV_CEILING_PERCENT - current) * NAV_TICK_APPROACH,
        );
      }, NAV_TICK_MS);
    }, LOADING_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(reveal);
      window.clearInterval(trickle);
    };
  }, [active]);

  useEffect(() => {
    if (active || !visible) return;

    const fill = window.setTimeout(() => setPercent(100), 0);
    const hide = window.setTimeout(() => {
      setVisible(false);
      setPercent(0);
    }, NAV_EXIT_MS);

    return () => {
      window.clearTimeout(fill);
      window.clearTimeout(hide);
    };
  }, [active, visible]);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 h-[0.3125rem] overflow-hidden bg-transparent transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden='true'
    >
      <div
        className='h-full bg-primary transition-[width] duration-200 ease-out'
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
