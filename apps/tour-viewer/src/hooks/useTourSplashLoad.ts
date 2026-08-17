import { useCallback, useEffect, useRef, useState } from 'react';
import { getTourLoadSplashFadeMs } from '../components/TourLoadSplash';
import { HOTSPOT_ENTER_DELAY_MS } from '../viewer-shared/hotspotEnterAnimation';
import { resetLandingTransitionState } from '../viewer-shared/landingTransitionState';

export type TourSplashPhase = 'active' | 'exit' | 'done';

/** Fallback if transitionend does not fire (e.g. reduced motion). */
const SPLASH_UNMOUNT_FALLBACK_PADDING_MS = 150;
/** Extra splash hold for loader UX testing — only when `?splashHold=1` */
const DEV_SPLASH_HOLD_MS = 2000;

export function useTourSplashLoad({
  tourId,
  embed,
  skipLanding,
  splashHold,
  loadErrorTest,
  onTourReset,
  onInitialTourReveal,
  onLoadStart,
}: {
  tourId: string;
  embed: boolean;
  skipLanding: boolean;
  splashHold: boolean;
  loadErrorTest: boolean;
  onTourReset?: () => void;
  onInitialTourReveal?: () => void;
  onLoadStart?: () => void;
}) {
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadBarVisible, setLoadBarVisible] = useState(true);
  const [splashPhase, setSplashPhase] = useState<TourSplashPhase>('active');
  const [splashRevealReady, setSplashRevealReady] = useState(false);
  const [splashOverlayFade, setSplashOverlayFade] = useState(false);
  /**
   * `?no=` panel open — after landing camera + hotspot enter delay, not full
   * splash curtain unmount (~4.2s), so the panel tracks hotspot stamp-in.
   */
  const [namingDeepLinkReady, setNamingDeepLinkReady] = useState(false);
  const namingDeepLinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hideBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitiallyLoadedRef = useRef(false);
  const pendingLoadsRef = useRef(0);

  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    pendingLoadsRef.current = 0;
    setLoadProgress(0);
    setLoadBarVisible(true);
    setSplashPhase('active');
    setSplashRevealReady(false);
    setSplashOverlayFade(false);
    setNamingDeepLinkReady(false);
    resetLandingTransitionState();
    onTourReset?.();
    if (hideBarTimerRef.current) {
      clearTimeout(hideBarTimerRef.current);
      hideBarTimerRef.current = null;
    }
    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
      hideSplashTimerRef.current = null;
    }
    if (namingDeepLinkTimerRef.current) {
      clearTimeout(namingDeepLinkTimerRef.current);
      namingDeepLinkTimerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tour boundary
  }, [tourId, loadErrorTest, skipLanding]);

  const handleInitialTourReveal = useCallback(() => {
    onInitialTourReveal?.();
    if (namingDeepLinkTimerRef.current) {
      clearTimeout(namingDeepLinkTimerRef.current);
    }
    namingDeepLinkTimerRef.current = setTimeout(() => {
      namingDeepLinkTimerRef.current = null;
      setNamingDeepLinkReady(true);
    }, HOTSPOT_ENTER_DELAY_MS);
  }, [onInitialTourReveal]);

  const handleLoadStart = useCallback(() => {
    pendingLoadsRef.current += 1;
    if (hideBarTimerRef.current) {
      clearTimeout(hideBarTimerRef.current);
      hideBarTimerRef.current = null;
    }
    setLoadBarVisible(true);
    setLoadProgress(0);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadProgress = useCallback((progress: number) => {
    setLoadBarVisible(true);
    setLoadProgress(progress);
  }, []);

  const handleLandingStart = useCallback(() => {
    setSplashOverlayFade(true);
  }, []);

  const handleSplashExitComplete = useCallback(() => {
    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
      hideSplashTimerRef.current = null;
    }
    setSplashPhase('done');
  }, []);

  const handleLoadComplete = useCallback(() => {
    pendingLoadsRef.current = Math.max(0, pendingLoadsRef.current - 1);
    if (pendingLoadsRef.current > 0) return;

    const splashUnmountFallbackMs =
      getTourLoadSplashFadeMs(embed) + SPLASH_UNMOUNT_FALLBACK_PADDING_MS;

    const finishSplash = () => {
      setSplashPhase('exit');
      setSplashRevealReady(true);
      hideSplashTimerRef.current = setTimeout(() => {
        setSplashPhase((phase) => (phase === 'exit' ? 'done' : phase));
      }, splashUnmountFallbackMs);

      if (skipLanding) {
        requestAnimationFrame(() => setSplashOverlayFade(true));
      }
    };

    if (hasInitiallyLoadedRef.current) {
      setLoadProgress(100);
      hideBarTimerRef.current = setTimeout(() => {
        setLoadBarVisible(false);
      }, 280);
      return;
    }

    hasInitiallyLoadedRef.current = true;
    setLoadProgress(100);
    setLoadBarVisible(false);

    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
    }

    if (splashHold) {
      hideSplashTimerRef.current = setTimeout(finishSplash, DEV_SPLASH_HOLD_MS);
    } else {
      finishSplash();
    }
  }, [embed, skipLanding, splashHold]);

  return {
    loadProgress,
    loadBarVisible,
    splashPhase,
    splashRevealReady,
    splashOverlayFade,
    namingDeepLinkReady,
    handleLoadStart,
    handleLoadProgress,
    handleLoadComplete,
    handleLandingStart,
    handleSplashExitComplete,
    handleInitialTourReveal,
  };
}
