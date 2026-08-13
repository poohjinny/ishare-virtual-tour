import { useCallback, useRef, useState } from 'react';
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

/** First-visit look-around hint — once per device, dismiss on drag/tap. */
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

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    if (!forceShow) {
      writeFirstVisitHintSeen();
    }
  }, [forceShow]);

  const onInitialTourReveal = useCallback(() => {
    if (!enabled || dismissedRef.current) return;
    setVisible(true);
  }, [enabled]);

  const onFirstPanoramaInteract = useCallback(() => {
    dismiss();
  }, [dismiss]);

  return {
    hintVisible: visible,
    onInitialTourReveal: enabled ? onInitialTourReveal : undefined,
    onFirstPanoramaInteract: enabled ? onFirstPanoramaInteract : undefined,
  };
}
