import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import type { Tour, ViewPosition } from '../types/tour';
import {
  hasPlayTour,
  prefersPlayTourReducedMotion,
  resolvePlayTourDwellOffsetPair,
  resolvePlayTourStopDwellMs,
  resolvePlayTourStopView,
} from '../utils/playTour';
import type { TourViewerHandle } from '../viewer/viewerHandle';

export type PlayTourPhase = 'idle' | 'playing' | 'paused';

interface UsePlayTourOptions {
  tour: Tour | null | undefined;
  currentSceneId: string;
  viewerRef: RefObject<TourViewerHandle | null>;
  /**
   * When set true, route→viewer sync must not call `navigateToScene`
   * (Play Tour owns hops).
   */
  suppressRouteViewerNavRef?: MutableRefObject<boolean>;
  /** Fired when Play starts (or resumes) — e.g. start immersive ambience. */
  onPlayStart?: () => void;
  /** Fired when Play pauses (button or manual nav) — e.g. pause ambience. */
  onPlayPause?: () => void;
  /** Clear naming/info chrome before a play hop (matches manual navigate). */
  prepareForPlayNav?: () => void;
  /**
   * Optional URL sync after leaving play (pause / finished). Skipped during
   * hops so route sync cannot abort the slideshow.
   */
  syncSceneToUrl?: (
    sceneId: string,
    options?: { clearNamingOpportunity?: boolean },
  ) => void;
}

export interface UsePlayTourResult {
  enabled: boolean;
  phase: PlayTourPhase;
  isActive: boolean;
  toggle: () => void;
  pause: () => void;
  /** Call from any user-driven navigation so Play yields without fighting. */
  pauseForManualNav: () => void;
}

function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Matterport-style Play Tour slideshow — hops stops with existing scene
 * transitions, ken-burns dwell, then advances (optionally loops).
 */
export function usePlayTour({
  tour,
  currentSceneId,
  viewerRef,
  suppressRouteViewerNavRef,
  onPlayStart,
  onPlayPause,
  prepareForPlayNav,
  syncSceneToUrl,
}: UsePlayTourOptions): UsePlayTourResult {
  const enabled = Boolean(tour && hasPlayTour(tour));

  const [phase, setPhase] = useState<PlayTourPhase>('idle');
  const phaseRef = useRef<PlayTourPhase>('idle');
  const stopIndexRef = useRef(0);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runTokenRef = useRef(0);
  const currentSceneIdRef = useRef(currentSceneId);
  const tourRef = useRef(tour);
  const prepareForPlayNavRef = useRef(prepareForPlayNav);
  const syncSceneToUrlRef = useRef(syncSceneToUrl);
  const onPlayStartRef = useRef(onPlayStart);
  const onPlayPauseRef = useRef(onPlayPause);
  const suppressRouteViewerNavRefStable = suppressRouteViewerNavRef;

  if (phaseRef.current !== 'playing') {
    currentSceneIdRef.current = currentSceneId;
  }
  tourRef.current = tour;
  prepareForPlayNavRef.current = prepareForPlayNav;
  syncSceneToUrlRef.current = syncSceneToUrl;
  onPlayStartRef.current = onPlayStart;
  onPlayPauseRef.current = onPlayPause;

  const setSuppressRouteNav = useCallback(
    (active: boolean) => {
      if (suppressRouteViewerNavRefStable) {
        suppressRouteViewerNavRefStable.current = active;
      }
    },
    [suppressRouteViewerNavRefStable],
  );

  const clearDwellTimer = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, []);

  const setPhaseSafe = useCallback(
    (next: PlayTourPhase) => {
      phaseRef.current = next;
      setPhase(next);
      setSuppressRouteNav(next === 'playing');
    },
    [setSuppressRouteNav],
  );

  const syncUrlToCurrentStop = useCallback(() => {
    syncSceneToUrlRef.current?.(currentSceneIdRef.current, {
      clearNamingOpportunity: true,
    });
  }, []);

  const pause = useCallback(() => {
    runTokenRef.current += 1;
    clearDwellTimer();
    void viewerRef.current?.stopViewAnimation();
    if (phaseRef.current === 'idle') return;
    setPhaseSafe('paused');
    onPlayPauseRef.current?.();
    syncUrlToCurrentStop();
  }, [clearDwellTimer, setPhaseSafe, syncUrlToCurrentStop, viewerRef]);

  const pauseForManualNav = useCallback(() => {
    if (phaseRef.current === 'playing') {
      pause();
    }
  }, [pause]);

  useEffect(() => {
    if (!enabled && phaseRef.current !== 'idle') {
      runTokenRef.current += 1;
      clearDwellTimer();
      void viewerRef.current?.stopViewAnimation();
      stopIndexRef.current = 0;
      setPhaseSafe('idle');
    }
  }, [clearDwellTimer, enabled, setPhaseSafe, viewerRef]);

  useEffect(() => {
    return () => {
      runTokenRef.current += 1;
      clearDwellTimer();
      setSuppressRouteNav(false);
    };
  }, [clearDwellTimer, setSuppressRouteNav]);

  const stopCameraMotion = useCallback(async () => {
    const stop = viewerRef.current?.stopViewAnimation;
    if (!stop) return;
    try {
      await Promise.resolve(stop.call(viewerRef.current));
    } catch {
      /* idle */
    }
    await waitFrames(2);
  }, [viewerRef]);

  const warmNextPlayStop = useCallback(
    (sequence: NonNullable<Tour['playTour']>, index: number) => {
      const nextIndex = index + 1;
      const nextStop =
        nextIndex < sequence.stops.length ? sequence.stops[nextIndex]
        : sequence.loop ? sequence.stops[0]
        : undefined;
      const nextSceneId = nextStop?.sceneId;
      if (!nextSceneId || nextSceneId === sequence.stops[index]?.sceneId) {
        return;
      }
      void viewerRef.current?.preloadScene(nextSceneId);
    },
    [viewerRef],
  );

  const navigateToStopScene = useCallback(
    async (sceneId: string, view: ViewPosition) => {
      const viewer = viewerRef.current;
      if (!viewer) return false;

      const onSameScene = sceneId === currentSceneIdRef.current;
      if (onSameScene) {
        await viewer.animateToView(view);
        return true;
      }

      // Quiet hop — `view` is the fade land pose (random offset for Play Tour).
      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (phaseRef.current !== 'playing') return false;
        const ok =
          (await viewer.navigateToScene(sceneId, view, { quiet: true })) !==
          false;
        if (ok) return true;
        await waitFrames(3);
        await waitMs(50 * (attempt + 1));
      }
      return false;
    },
    [viewerRef],
  );

  const dwellAtStop = useCallback(
    (dwellMs: number, token: number) =>
      new Promise<void>((resolve) => {
        clearDwellTimer();

        dwellTimerRef.current = setTimeout(() => {
          dwellTimerRef.current = null;
          if (token !== runTokenRef.current || phaseRef.current !== 'playing') {
            resolve();
            return;
          }
          resolve();
        }, dwellMs);
      }),
    [clearDwellTimer],
  );

  const runPlayLoop = useCallback(
    async (startIndex: number, token: number) => {
      stopIndexRef.current = startIndex;

      while (token === runTokenRef.current && phaseRef.current === 'playing') {
        const activeTour = tourRef.current;
        const sequence = activeTour?.playTour;
        if (!activeTour || !sequence) {
          setPhaseSafe('idle');
          return;
        }

        const stops = sequence.stops;
        if (stops.length === 0) {
          stopIndexRef.current = 0;
          setPhaseSafe('idle');
          return;
        }

        let index = stopIndexRef.current;
        if (index < 0 || index >= stops.length) {
          if (sequence.loop) {
            index = 0;
            stopIndexRef.current = 0;
          } else {
            stopIndexRef.current = 0;
            setPhaseSafe('idle');
            syncUrlToCurrentStop();
            return;
          }
        }

        const stop = stops[index];
        if (!stop) {
          stopIndexRef.current = 0;
          setPhaseSafe('idle');
          return;
        }

        try {
          prepareForPlayNavRef.current?.();

          const view = resolvePlayTourStopView(activeTour, stop);
          if (!viewerRef.current) {
            await waitMs(100);
            if (
              token !== runTokenRef.current ||
              phaseRef.current !== 'playing'
            ) {
              return;
            }
            if (!viewerRef.current) {
              pause();
              return;
            }
          }

          const framedView = view;
          const reduceMotion = prefersPlayTourReducedMotion();
          // Arrive / exit are opposite offsets so defaultView sits in the middle.
          const { arrive: arriveView, exit: exitView } =
            reduceMotion ?
              { arrive: framedView, exit: framedView }
            : resolvePlayTourDwellOffsetPair(framedView);

          const arrivingSameScene = stop.sceneId === currentSceneIdRef.current;
          if (arrivingSameScene) {
            // Settle ken-burns / prior animate before reframing this stop.
            await stopCameraMotion();
          }
          // Cross-scene: fade lands on arriveView (offset before defaultView).

          if (token !== runTokenRef.current || phaseRef.current !== 'playing') {
            return;
          }

          const ok = await navigateToStopScene(stop.sceneId, arriveView);

          if (token !== runTokenRef.current || phaseRef.current !== 'playing') {
            return;
          }

          if (!ok) {
            // Skip a broken hop instead of killing the whole Play run.
            const nextIndex = index + 1;
            if (nextIndex >= stops.length) {
              if (sequence.loop) {
                stopIndexRef.current = 0;
                continue;
              }
              stopIndexRef.current = 0;
              setPhaseSafe('idle');
              syncUrlToCurrentStop();
              return;
            }
            stopIndexRef.current = nextIndex;
            continue;
          }

          currentSceneIdRef.current = stop.sceneId;
          // Warm next only AFTER setPanorama — PSV abortLoading() cancels any
          // in-flight preload started before the hop (Network: cancelled .webp).
          warmNextPlayStop(sequence, index);

          const dwellMs = resolvePlayTourStopDwellMs(sequence, stop);
          const nextIndex = index + 1;
          const legMs = Math.max(1200, Math.round(dwellMs / 2));

          // arrive → defaultView → exit → crossfade (no mid hold; full path = dwellMs)
          if (!reduceMotion) {
            await viewerRef.current?.animateToView(framedView, {
              durationMs: legMs,
            });
          } else {
            await dwellAtStop(legMs, token);
          }

          if (token !== runTokenRef.current || phaseRef.current !== 'playing') {
            return;
          }

          if (!reduceMotion) {
            await viewerRef.current?.animateToView(exitView, {
              durationMs: legMs,
            });
          }

          if (token !== runTokenRef.current || phaseRef.current !== 'playing') {
            return;
          }

          if (nextIndex >= stops.length) {
            if (sequence.loop) {
              stopIndexRef.current = 0;
              continue;
            }
            stopIndexRef.current = 0;
            setPhaseSafe('idle');
            syncUrlToCurrentStop();
            return;
          }

          stopIndexRef.current = nextIndex;
        } catch (err) {
          console.error('[usePlayTour] stop failed', stop.sceneId, err);
          if (token !== runTokenRef.current || phaseRef.current !== 'playing') {
            return;
          }
          // Advance past a throwing hop so one bad stop cannot freeze Play.
          const nextIndex = index + 1;
          if (nextIndex >= stops.length) {
            if (sequence.loop) {
              stopIndexRef.current = 0;
              continue;
            }
            stopIndexRef.current = 0;
            setPhaseSafe('idle');
            syncUrlToCurrentStop();
            return;
          }
          stopIndexRef.current = nextIndex;
        }
      }
    },
    [
      dwellAtStop,
      navigateToStopScene,
      pause,
      setPhaseSafe,
      stopCameraMotion,
      syncUrlToCurrentStop,
      viewerRef,
      warmNextPlayStop,
    ],
  );

  const play = useCallback(() => {
    if (!enabled || !tourRef.current?.playTour) return;

    clearDwellTimer();
    void viewerRef.current?.stopViewAnimation();
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;

    const resumeFrom = phaseRef.current === 'paused' ? stopIndexRef.current : 0;
    currentSceneIdRef.current = currentSceneId;
    setPhaseSafe('playing');
    onPlayStartRef.current?.();
    void runPlayLoop(resumeFrom, token);
  }, [
    clearDwellTimer,
    currentSceneId,
    enabled,
    runPlayLoop,
    setPhaseSafe,
    viewerRef,
  ]);

  const toggle = useCallback(() => {
    if (!enabled) return;
    if (phaseRef.current === 'playing') {
      pause();
      return;
    }
    play();
  }, [enabled, pause, play]);

  return {
    enabled,
    phase,
    isActive: phase === 'playing',
    toggle,
    pause,
    pauseForManualNav,
  };
}
