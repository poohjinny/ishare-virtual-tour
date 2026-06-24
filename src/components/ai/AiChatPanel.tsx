import { useEffect, useMemo, useRef, useState } from 'react';
import { CHAT_SCROLL_TEST_MESSAGES } from '../../data/chatScrollTestMessages';
import {
  VIRTUAL_TOUR_GUIDE_NAME,
  VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE,
} from '../../constants/branding';
import type { ChatMessage } from '../../types/tour';
import { GlassPanelCloseIcon, TourGlassPanel } from '../TourGlassPanel';
import { IconTooltip } from '../ui/IconTooltip';
import { PlatformBrandLink } from '../PlatformBrandLink';
import { LocationBadge } from './LocationBadge';
import { GuideAvatarImage } from './GuideAvatarImage';
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
  guideAvatarUrl: string;
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
    <svg
      className={aiPanelHeaderIconClassName}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <polyline points='23 4 23 10 17 10' />
      <polyline points='1 20 1 14 7 14' />
      <path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10' />
      <path d='M20.49 15a9 9 0 0 1-14.85 3.36L1 14' />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      className={aiComposerIconClassName}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
      <path d='M19 10v2a7 7 0 0 1-14 0v-2' />
      <line x1='12' y1='19' x2='12' y2='23' />
      <line x1='8' y1='23' x2='16' y2='23' />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      className={`${aiComposerIconClassName} ${aiComposerSendIconClassName}`}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <line x1='12' y1='19' x2='12' y2='5' />
      <polyline points='5 12 12 5 19 12' />
    </svg>
  );
}

export function AiChatPanel({
  panelPhase,
  guideAvatarUrl,
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
      `Hi! I'm ${VIRTUAL_TOUR_GUIDE_NAME}. You're on ${locationTitle} — ask me anything you'd like to know about this area.`,
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
            <GuideAvatarImage
              className={aiPanelSymbolClassName}
              src={guideAvatarUrl}
              alt=''
              draggable={false}
            />
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
