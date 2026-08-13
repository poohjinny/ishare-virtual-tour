import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ChatGuideCtaKind, TourClient } from '../../types/tour';
import type { useTourAssistant } from '../../hooks/useTourAssistant';
import {
  getGuideFabNamingBubble,
  getGuideFabNavPreviewBubble,
  getGuideFabOverviewBubble,
  getGuideFabSceneBubble,
} from '../../services/mockAssistant';
import { ANCHORED_PANEL_ENTER_MS } from '../../viewer-shared/anchoredPanelLayout';
import { AiAssistantFab } from './AiAssistantFab';
import { AiChatPanelFallback } from './AiChatPanelFallback';
import { AiChatPanelLazy, preloadAiChatPanel } from './aiChatPanelLazy';
import {
  AiGuideFabBubble,
  type AiGuideFabBubbleEmphasis,
} from './AiGuideFabBubble';
import { aiAssistantStackClassName } from './aiAssistantVariants';

const FAB_ANIM_MS = 140;
const PANEL_REVEAL_MS = 70;
const PANEL_EXIT_MS = 150;
const PANEL_ENTER_MS = 170;
/** How long the proximity bubble stays before fading out on its own. */
const FAB_BUBBLE_MS = 10_000;

type AssistantState = ReturnType<typeof useTourAssistant>;

interface AiAssistantProps {
  assistant: AssistantState;
  guideUiTest?: boolean;
  guideMock?: boolean;
  currentSceneId?: string;
  /** Tour entry scene — uses a welcome bubble instead of a place-arrival line. */
  firstSceneId?: string;
  /** Wait for load splash to finish before scheduling overview / place bubbles. */
  splashDone?: boolean;
  namingHotspotId?: string | null;
  namingName?: string | null;
  /** Open nav destination preview — FAB nudge like naming. */
  navPreviewHotspotId?: string | null;
  navPreviewTitle?: string | null;
  /** Anchored NO / nav preview panel is in the viewer (enter may still be running). */
  anchoredPanelOpen?: boolean;
  /** Top-right Explore/Help/Share dock — suppress FAB bubble while open. */
  chromeDockOpen?: boolean;
  /** Play Tour slideshow — close proximity bubbles; parent closes the panel. */
  playTourActive?: boolean;
  client?: TourClient;
  clientLogo?: string;
  logoAlt?: string;
  onNavigateScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  onChromeAction?: (kind: ChatGuideCtaKind) => void;
}

type AnimPhase = 'idle' | 'enter' | 'exit';

type FabBubble = {
  key: string;
  text: string;
  emphasis?: AiGuideFabBubbleEmphasis;
};

export function AiAssistant({
  assistant,
  guideUiTest = false,
  guideMock = false,
  currentSceneId,
  firstSceneId,
  splashDone = true,
  namingHotspotId = null,
  namingName = null,
  navPreviewHotspotId = null,
  navPreviewTitle = null,
  anchoredPanelOpen = false,
  chromeDockOpen = false,
  playTourActive = false,
  client,
  clientLogo,
  logoAlt,
  onNavigateScene,
  onSelectNaming,
  onChromeAction,
}: AiAssistantProps) {
  const {
    isOpen,
    toggle,
    close,
    resetChat,
    clearSendError,
    messages,
    locationTitle,
    tourTitle,
    sendMessage,
    retryLastSend,
    stopGenerating,
    isSending,
    liveMode,
    sendError,
    canRetry,
    starterQuestions,
  } = assistant;

  const [fabShown, setFabShown] = useState(true);
  const [fabPhase, setFabPhase] = useState<AnimPhase>('idle');
  const [panelShown, setPanelShown] = useState(false);
  const [panelPhase, setPanelPhase] = useState<AnimPhase>('idle');
  const [fabBubble, setFabBubble] = useState<FabBubble | null>(null);
  const [bubbleView, setBubbleView] = useState<FabBubble | null>(null);
  const [bubblePhase, setBubblePhase] = useState<'enter' | 'exit'>('enter');

  const seenBubbleKeysRef = useRef(new Set<string>());
  const skipInitialNamingRef = useRef(true);
  const skipInitialNavPreviewRef = useRef(true);
  const wasGuideUiTestRef = useRef(guideUiTest);

  useEffect(() => {
    if (fabBubble) {
      setBubbleView(fabBubble);
      setBubblePhase('enter');
      return;
    }
    setBubbleView((current) => {
      if (current) setBubblePhase('exit');
      return current;
    });
  }, [fabBubble]);

  useEffect(() => {
    if (isOpen) {
      if (panelShown) return;

      setFabBubble(null);
      setBubbleView(null);
      setBubblePhase('enter');
      setFabPhase('exit');
      const timer = window.setTimeout(() => {
        setFabShown(false);
        setFabPhase('idle');
        setPanelShown(true);
        setPanelPhase('enter');
      }, PANEL_REVEAL_MS);

      return () => window.clearTimeout(timer);
    }

    if (!panelShown) return;

    setPanelPhase('exit');
    const timer = window.setTimeout(() => {
      setPanelShown(false);
      setPanelPhase('idle');
      setFabShown(true);
      setFabPhase('enter');
    }, PANEL_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, panelShown]);

  useEffect(() => {
    if (fabPhase !== 'enter') return;
    const timer = window.setTimeout(() => setFabPhase('idle'), FAB_ANIM_MS);
    return () => window.clearTimeout(timer);
  }, [fabPhase]);

  useEffect(() => {
    if (panelPhase !== 'enter') return;
    const timer = window.setTimeout(
      () => setPanelPhase('idle'),
      PANEL_ENTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [panelPhase]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const idleId = window.requestIdleCallback?.(() => preloadAiChatPanel(), {
      timeout: 4000,
    });

    return () => {
      if (idleId !== undefined) {
        window.cancelIdleCallback?.(idleId);
      }
    };
  }, []);

  // Leaving guideUiTest — drop fixture bubble and don't treat it as a real arrival.
  useEffect(() => {
    const was = wasGuideUiTestRef.current;
    wasGuideUiTestRef.current = guideUiTest;
    if (!was || guideUiTest) return;

    setFabBubble(null);
    if (currentSceneId) {
      seenBubbleKeysRef.current.add(`scene:${currentSceneId}`);
    }
    const hotspotId = namingHotspotId?.trim();
    if (hotspotId) {
      seenBubbleKeysRef.current.add(`naming:${hotspotId}`);
    }
  }, [currentSceneId, guideUiTest, namingHotspotId]);

  // Top-right dock chrome overlaps the FAB bubble rail — clear while open.
  useEffect(() => {
    if (!chromeDockOpen) return;
    setFabBubble(null);
  }, [chromeDockOpen]);

  // Play Tour owns attention — drop proximity bubbles for the slideshow.
  useEffect(() => {
    if (!playTourActive) return;
    setFabBubble(null);
  }, [playTourActive]);

  // Place move / overview welcome — soft hello from the guide (FAB only).
  useEffect(() => {
    if (guideUiTest) return;
    if (!currentSceneId) return;
    if (!splashDone) return;
    if (playTourActive) return;
    if (!fabShown || isOpen || chromeDockOpen) return;
    // Naming / nav preview owns the nudge while open — schedule place after it closes.
    if (namingHotspotId?.trim()) return;
    if (navPreviewHotspotId?.trim()) return;

    const key = `scene:${currentSceneId}`;
    if (seenBubbleKeysRef.current.has(key)) return;
    seenBubbleKeysRef.current.add(key);

    const isOverview = Boolean(firstSceneId) && currentSceneId === firstSceneId;
    const tour = tourTitle?.trim();
    const place = locationTitle?.trim() || 'this spot';

    if (isOverview) {
      startTransition(() => {
        setFabBubble({
          key,
          text: getGuideFabOverviewBubble(tour || undefined),
          emphasis: tour ? 'place' : undefined,
        });
      });
      return;
    }

    startTransition(() => {
      setFabBubble({
        key,
        text: getGuideFabSceneBubble(place),
        emphasis: 'place',
      });
    });
  }, [
    chromeDockOpen,
    currentSceneId,
    fabShown,
    firstSceneId,
    guideUiTest,
    isOpen,
    locationTitle,
    namingHotspotId,
    navPreviewHotspotId,
    playTourActive,
    splashDone,
    tourTitle,
  ]);

  // Naming opportunity opened — after panel enter, not on the click frame.
  useEffect(() => {
    if (guideUiTest) return;
    const hotspotId = namingHotspotId?.trim() || '';
    if (!hotspotId) {
      skipInitialNamingRef.current = false;
      return;
    }
    if (skipInitialNamingRef.current) {
      skipInitialNamingRef.current = false;
      return;
    }
    if (!anchoredPanelOpen) return;
    if (playTourActive) return;
    if (!fabShown || isOpen || chromeDockOpen) return;

    const key = `naming:${hotspotId}`;
    if (seenBubbleKeysRef.current.has(key)) return;

    const name = namingName?.trim() || undefined;
    const timer = window.setTimeout(() => {
      if (seenBubbleKeysRef.current.has(key)) return;
      seenBubbleKeysRef.current.add(key);
      startTransition(() => {
        setFabBubble({
          key,
          text: getGuideFabNamingBubble(name),
          emphasis: 'naming',
        });
      });
    }, ANCHORED_PANEL_ENTER_MS);

    return () => window.clearTimeout(timer);
  }, [
    anchoredPanelOpen,
    chromeDockOpen,
    fabShown,
    guideUiTest,
    isOpen,
    namingHotspotId,
    namingName,
    playTourActive,
  ]);

  // Nav destination preview — invite like naming; place bubble yields while open.
  useEffect(() => {
    if (guideUiTest) return;
    const hotspotId = navPreviewHotspotId?.trim() || '';
    if (!hotspotId) {
      skipInitialNavPreviewRef.current = false;
      return;
    }
    if (skipInitialNavPreviewRef.current) {
      skipInitialNavPreviewRef.current = false;
      return;
    }
    // Naming panel wins if both somehow open.
    if (namingHotspotId?.trim()) return;
    if (!anchoredPanelOpen) return;
    if (playTourActive) return;
    if (!fabShown || isOpen || chromeDockOpen) return;

    const key = `nav-preview:${hotspotId}`;
    if (seenBubbleKeysRef.current.has(key)) return;

    const place = navPreviewTitle?.trim() || 'that spot';
    const timer = window.setTimeout(() => {
      if (seenBubbleKeysRef.current.has(key)) return;
      seenBubbleKeysRef.current.add(key);
      startTransition(() => {
        setFabBubble({
          key,
          text: getGuideFabNavPreviewBubble(place),
          emphasis: 'place',
        });
      });
    }, ANCHORED_PANEL_ENTER_MS);

    return () => window.clearTimeout(timer);
  }, [
    anchoredPanelOpen,
    chromeDockOpen,
    fabShown,
    guideUiTest,
    isOpen,
    namingHotspotId,
    navPreviewHotspotId,
    navPreviewTitle,
    playTourActive,
  ]);

  // guideUiTest — sticky fixture bubbles on the FAB (scene ↔ naming samples).
  useEffect(() => {
    if (!guideUiTest || !fabShown || isOpen || chromeDockOpen) return;

    const place = locationTitle?.trim() || 'Suite B';
    const samples: FabBubble[] = [
      {
        key: 'guideUiTest:overview',
        text: getGuideFabOverviewBubble(tourTitle?.trim() || 'Sample Tour'),
        emphasis: 'place',
      },
      {
        key: 'guideUiTest:scene',
        text: getGuideFabSceneBubble(place),
        emphasis: 'place',
      },
      {
        key: 'guideUiTest:naming',
        text: getGuideFabNamingBubble('Large A3 Suite'),
        emphasis: 'naming',
      },
    ];
    let index = 0;
    setFabBubble(samples[0]);
    const timer = window.setInterval(() => {
      index = (index + 1) % samples.length;
      setFabBubble(samples[index]);
    }, 4500);
    return () => {
      window.clearInterval(timer);
      setFabBubble((current) =>
        current?.key.startsWith('guideUiTest:') ? null : current,
      );
    };
  }, [chromeDockOpen, fabShown, guideUiTest, isOpen, locationTitle, tourTitle]);

  useEffect(() => {
    if (!fabBubble || guideUiTest) return;
    if (fabBubble.key.startsWith('guideUiTest:')) return;
    const timer = window.setTimeout(() => {
      setFabBubble((current) =>
        current?.key === fabBubble.key ? null : current,
      );
    }, FAB_BUBBLE_MS);
    return () => window.clearTimeout(timer);
  }, [fabBubble, guideUiTest]);

  const handleFabClick = () => {
    if (!isOpen && fabPhase === 'idle' && panelPhase === 'idle') {
      setFabBubble(null);
      preloadAiChatPanel();
      toggle();
    }
  };

  const handleBubbleExitComplete = useCallback(() => {
    setBubbleView(null);
    setBubblePhase('enter');
  }, []);

  const handleBubbleDismiss = useCallback(() => {
    setFabBubble(null);
  }, []);

  const handleClose = () => {
    if (isOpen && panelPhase !== 'exit') {
      close();
    }
  };

  return (
    <div className={aiAssistantStackClassName}>
      {fabShown && (
        <>
          {bubbleView ?
            <AiGuideFabBubble
              text={bubbleView.text}
              emphasis={bubbleView.emphasis}
              phase={bubblePhase}
              onOpen={handleFabClick}
              onDismiss={handleBubbleDismiss}
              onExitComplete={handleBubbleExitComplete}
            />
          : null}
          <AiAssistantFab
            phase={fabPhase}
            speaking={Boolean(bubbleView) && bubblePhase === 'enter'}
            onClick={handleFabClick}
            onWarmup={preloadAiChatPanel}
          />
        </>
      )}
      {panelShown && (
        <Suspense fallback={<AiChatPanelFallback />}>
          <AiChatPanelLazy
            panelPhase={panelPhase}
            guideUiTest={guideUiTest}
            guideMock={guideMock}
            messages={messages}
            locationTitle={locationTitle}
            tourTitle={tourTitle}
            currentSceneId={currentSceneId}
            isSending={isSending}
            liveMode={liveMode}
            sendError={sendError}
            canRetry={canRetry}
            starterQuestions={starterQuestions}
            onClose={handleClose}
            onReset={resetChat}
            onDismissError={clearSendError}
            onRetryError={retryLastSend}
            onStop={stopGenerating}
            onSend={sendMessage}
            onNavigateScene={onNavigateScene}
            onSelectNaming={onSelectNaming}
            onChromeAction={onChromeAction}
            client={client}
            clientLogo={clientLogo}
            logoAlt={logoAlt}
          />
        </Suspense>
      )}
    </div>
  );
}
