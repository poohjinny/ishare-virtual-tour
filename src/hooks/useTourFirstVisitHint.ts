import { useCallback, useEffect, useRef, useState } from 'react';
import { TOUR_FIRST_VISIT_HINT_REVEAL_DELAY_MS } from '../constants/tourFirstVisitHint';
import {
  readFirstVisitHintSeen,
  writeFirstVisitHintSeen,
} from '../utils/firstVisitHintPreference';

interface UseTourFirstVisitHintOptions {
  embed: boolean;
  dev: boolean;
  /** Dev QA — force coach pill even in embed/dev; ignores localStorage seen. */
  firstVisitHint: boolean;
}

export function useTourFirstVisitHint({
  embed,
  dev,
  firstVisitHint,
}: UseTourFirstVisitHintOptions) {
  const forceShow = firstVisitHint;
  const eligibleRef = useRef(forceShow || !readFirstVisitHintSeen());
  const enabled = forceShow || (eligibleRef.current && !embed && !dev);

  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearRevealTimer();
    setVisible(false);
    if (!forceShow) {
      writeFirstVisitHintSeen();
    }
  }, [clearRevealTimer, forceShow]);

  const onInitialTourReveal = useCallback(() => {
    if (!enabled || dismissedRef.current) return;

    clearRevealTimer();
    revealTimerRef.current = setTimeout(() => {
      if (dismissedRef.current) return;
      setVisible(true);
    }, TOUR_FIRST_VISIT_HINT_REVEAL_DELAY_MS);
  }, [clearRevealTimer, enabled]);

  const onFirstPanoramaInteract = useCallback(() => {
    dismiss();
  }, [dismiss]);

  useEffect(
    () => () => {
      clearRevealTimer();
    },
    [clearRevealTimer],
  );

  return {
    hintVisible: visible,
    onInitialTourReveal: enabled ? onInitialTourReveal : undefined,
    onFirstPanoramaInteract: enabled ? onFirstPanoramaInteract : undefined,
  };
}
