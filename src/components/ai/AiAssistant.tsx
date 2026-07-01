import { Suspense, useEffect, useState } from 'react';
import type { useTourAssistant } from '../../hooks/useTourAssistant';
import { AiAssistantFab } from './AiAssistantFab';
import { AiChatPanelFallback } from './AiChatPanelFallback';
import { AiChatPanelLazy, preloadAiChatPanel } from './aiChatPanelLazy';
import { aiAssistantStackClassName } from './aiAssistantVariants';

const FAB_ANIM_MS = 140;
const PANEL_REVEAL_MS = 70;
const PANEL_EXIT_MS = 150;
const PANEL_ENTER_MS = 170;

type AssistantState = ReturnType<typeof useTourAssistant>;

interface AiAssistantProps {
  assistant: AssistantState;
  chatTest?: boolean;
}

type AnimPhase = 'idle' | 'enter' | 'exit';

export function AiAssistant({ assistant, chatTest = false }: AiAssistantProps) {
  const {
    isOpen,
    toggle,
    close,
    resetChat,
    messages,
    locationTitle,
    suggestedQuestions,
    sendMessage,
  } = assistant;

  const [fabShown, setFabShown] = useState(true);
  const [fabPhase, setFabPhase] = useState<AnimPhase>('idle');
  const [panelShown, setPanelShown] = useState(false);
  const [panelPhase, setPanelPhase] = useState<AnimPhase>('idle');

  useEffect(() => {
    if (isOpen) {
      if (panelShown) return;

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

  const handleFabClick = () => {
    if (!isOpen && fabPhase === 'idle' && panelPhase === 'idle') {
      preloadAiChatPanel();
      toggle();
    }
  };

  const handleClose = () => {
    if (isOpen && panelPhase !== 'exit') {
      close();
    }
  };

  return (
    <div className={aiAssistantStackClassName}>
      {fabShown && (
        <AiAssistantFab
          phase={fabPhase}
          onClick={handleFabClick}
          onWarmup={preloadAiChatPanel}
        />
      )}
      {panelShown && (
        <Suspense fallback={<AiChatPanelFallback />}>
          <AiChatPanelLazy
            panelPhase={panelPhase}
            chatTest={chatTest}
            messages={messages}
            locationTitle={locationTitle}
            suggestedQuestions={suggestedQuestions}
            onClose={handleClose}
            onReset={resetChat}
            onSend={sendMessage}
          />
        </Suspense>
      )}
    </div>
  );
}
