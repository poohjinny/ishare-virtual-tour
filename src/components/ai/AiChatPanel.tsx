import { useEffect, useMemo, useRef, useState } from 'react';
import { CHAT_SCROLL_TEST_MESSAGES } from '../../data/chatScrollTestMessages';
import {
  VIRTUAL_TOUR_GUIDE_NAME,
  VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE,
} from '../../constants/branding';
import type { ChatMessage } from '../../types/tour';
import { cn } from '../../lib/cn';
import { GlassPanelCloseIcon, TourGlassPanel } from '../TourGlassPanel';
import { IconTooltip } from '../ui/IconTooltip';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_22 } from '../ui/materialSymbolClasses';
import { PlatformBrandLink } from '../PlatformBrandLink';
import { LocationBadge } from './LocationBadge';
import { GuideAvatar } from './GuideAvatar';
import { SuggestedQuestions } from './SuggestedQuestions';
import {
  aiComposerActionsClassName,
  aiComposerClassName,
  aiComposerIconClassName,
  aiComposerInputClassName,
  aiComposerPillClassName,
  aiComposerSendClassName,
  aiComposerSendIconClassName,
  aiComposerVoiceClassName,
  aiMessageVariants,
  aiPanelFooterClassName,
  aiPanelHeaderActionsClassName,
  aiPanelHeaderBtnClassName,
  aiPanelHeaderIconClassName,
  aiPanelHeaderMainClassName,
  aiPanelHeaderTextClassName,
  aiPanelIntroClassName,
  aiPanelMessagesClassName,
  aiPanelNoticeClassName,
  aiPanelPoweredByClassName,
  aiPanelSymbolClassName,
  aiPanelTitleClassName,
  aiPanelVariants,
} from './aiAssistantVariants';

interface AiChatPanelProps {
  panelPhase: 'idle' | 'enter' | 'exit';
  chatTest?: boolean;
  messages: ChatMessage[];
  locationTitle: string;
  suggestedQuestions: string[];
  onClose: () => void;
  onReset: () => void;
  onSend: (text: string) => void;
}

function ResetIcon() {
  return (
    <MaterialSymbol
      name='refresh'
      className={aiPanelHeaderIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function MicIcon() {
  return (
    <MaterialSymbol
      name='mic'
      className={aiComposerIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function ArrowUpIcon() {
  return (
    <MaterialSymbol
      name='arrow_upward'
      className={cn(aiComposerIconClassName, aiComposerSendIconClassName)}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

export function AiChatPanel({
  panelPhase,
  chatTest = false,
  messages,
  locationTitle,
  suggestedQuestions,
  onClose,
  onReset,
  onSend,
}: AiChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const hasInput = input.trim().length > 0;
  const canReset = !chatTest && messages.length > 0;
  const displayMessages = useMemo(
    () => (chatTest ? CHAT_SCROLL_TEST_MESSAGES : messages),
    [chatTest, messages],
  );
  const greeting = useMemo(
    () =>
      `Hi! I'm ${VIRTUAL_TOUR_GUIDE_NAME}. What would you like to know about ${locationTitle}?`,
    [locationTitle],
  );

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      if (displayMessages.length === 0) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }, [displayMessages]);

  const panelClass = aiPanelVariants({ phase: panelPhase });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const handleReset = () => {
    if (!canReset) return;
    onReset();
    setInput('');
  };

  return (
    <TourGlassPanel
      variant='dock'
      className={panelClass}
      titleId='ai-guide-panel-title'
      animation='none'
      bodyClassName='tour-glass-panel__body--ai'
      header={
        <>
          <div className={aiPanelHeaderMainClassName}>
            <GuideAvatar className={aiPanelSymbolClassName} />
            <div className={aiPanelHeaderTextClassName}>
              <p id='ai-guide-panel-title' className={aiPanelTitleClassName}>
                Virtual Tour Guide
              </p>
              <LocationBadge title={locationTitle} />
            </div>
          </div>
          <div className={aiPanelHeaderActionsClassName}>
            {canReset && (
              <IconTooltip label='Reset conversation' placement='bottom'>
                <button
                  type='button'
                  className={`tour-glass-panel__close ${aiPanelHeaderBtnClassName}`}
                  onClick={handleReset}
                  aria-label='Reset conversation'
                >
                  <ResetIcon />
                </button>
              </IconTooltip>
            )}
            <button
              type='button'
              className={`tour-glass-panel__close ${aiPanelHeaderBtnClassName}`}
              onClick={onClose}
              aria-label='Close'
            >
              <GlassPanelCloseIcon />
            </button>
          </div>
        </>
      }
      footer={
        <footer
          className={`tour-glass-panel__footer ${aiPanelFooterClassName}`}
        >
          <p className={aiPanelPoweredByClassName}>
            Powered by <PlatformBrandLink brandId='fundingMattersAiSuite' />
          </p>
        </footer>
      }
    >
      <div className={aiPanelMessagesClassName} ref={messagesRef}>
        {!chatTest && (
          <div className={aiPanelIntroClassName}>
            <p className={aiPanelNoticeClassName} role='note'>
              {VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE}
            </p>
            <p className={aiMessageVariants({ role: 'assistant' })}>
              {greeting}
            </p>
            <SuggestedQuestions
              questions={suggestedQuestions}
              onSelect={onSend}
            />
          </div>
        )}
        {displayMessages.map((msg) => (
          <div key={msg.id} className={aiMessageVariants({ role: msg.role })}>
            {msg.content}
          </div>
        ))}
      </div>

      <form className={aiComposerClassName} onSubmit={handleSubmit}>
        <div className={aiComposerPillClassName}>
          <input
            className={aiComposerInputClassName}
            type='text'
            placeholder={`Ask ${VIRTUAL_TOUR_GUIDE_NAME}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label='Your question'
          />
          <div className={aiComposerActionsClassName}>
            <IconTooltip label='Voice input (coming soon)' placement='top'>
              <button
                type='button'
                className={aiComposerVoiceClassName}
                aria-label='Voice input (coming soon)'
              >
                <MicIcon />
              </button>
            </IconTooltip>
            {hasInput && (
              <button
                type='submit'
                className={aiComposerSendClassName}
                aria-label='Send message'
              >
                <ArrowUpIcon />
              </button>
            )}
          </div>
        </div>
      </form>
    </TourGlassPanel>
  );
}
