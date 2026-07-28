import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CHAT_SCROLL_TEST_MESSAGES } from '../../data/chatScrollTestMessages';
import {
  VIRTUAL_TOUR_GUIDE_NAME,
  VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE,
} from '../../constants/branding';
import type { ChatGuideLink, ChatMessage } from '../../types/tour';
import { cn } from '../../lib/cn';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { GlassPanelCloseIcon, TourGlassPanel } from '../TourGlassPanel';
import { IconTooltip } from '../ui/IconTooltip';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_22 } from '../ui/materialSymbolClasses';
import { PlatformBrandLink } from '../PlatformBrandLink';
import { LocationBadge } from './LocationBadge';
import { GuideAvatar } from './GuideAvatar';
import { GuideCtaRow } from './GuideCtaRow';
import { GuideSceneLinkCards } from './GuideSceneLinkCards';
import { SuggestedQuestions } from './SuggestedQuestions';
import { AiThinkingIndicator } from './AiThinkingIndicator';
import {
  aiComposerActionsClassName,
  aiComposerClassName,
  aiComposerIconClassName,
  aiComposerInputClassName,
  aiComposerPillClassName,
  aiComposerPillExpandedClassName,
  aiComposerSendClassName,
  aiComposerSendIconClassName,
  aiComposerVoiceClassName,
  aiComposerVoiceListeningClassName,
  aiComposerVoiceRingClassName,
  aiMessageFollowUpsClassName,
  aiMessageGapSameClassName,
  aiMessageGapTurnClassName,
  aiMessageVariants,
  aiPanelErrorClassName,
  aiPanelErrorDismissClassName,
  aiPanelErrorRowClassName,
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
  aiPanelSuggestionsSlotClassName,
  aiPanelSymbolClassName,
  aiPanelThreadClassName,
  aiPanelTitleClassName,
  aiPanelVariants,
} from './aiAssistantVariants';

interface AiChatPanelProps {
  panelPhase: 'idle' | 'enter' | 'exit';
  guideUiTest?: boolean;
  /** `?guideMock=1` — show demo body lead; hide when live. */
  guideMock?: boolean;
  messages: ChatMessage[];
  locationTitle: string;
  tourTitle: string;
  suggestedQuestions: string[];
  currentSceneId?: string;
  isSending?: boolean;
  liveMode?: boolean;
  sendError?: string | null;
  onClose: () => void;
  onReset: () => void;
  onDismissError?: () => void;
  onSend: (text: string) => void;
  onNavigateScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  onVisitNaming?: (sceneId: string, hotspotId: string) => void;
  onCopyGuideLink?: (link: ChatGuideLink) => Promise<boolean> | boolean;
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
      className={cn(aiComposerIconClassName, 'relative z-[1]')}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

/** Soft volume pulse — only while there is audible input. */
function MicVolumePulse({ level }: { level: number }) {
  if (level < 0.1) return null;
  const scale = 1 + level * 0.55;
  const opacity = 0.16 + level * 0.22;

  return (
    <span
      className={aiComposerVoiceRingClassName}
      aria-hidden='true'
      style={{
        transform: `scale(${scale})`,
        opacity,
        transition: 'transform 90ms linear, opacity 120ms ease-out',
      }}
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

/** Same-role stays tight; user↔assistant turns open up. */
function threadItemSpacingClass(
  previousRole: ChatMessage['role'] | null,
  role: ChatMessage['role'] | 'assistant',
): string | undefined {
  if (!previousRole) return undefined;
  return previousRole === role ?
      aiMessageGapSameClassName
    : aiMessageGapTurnClassName;
}

export function AiChatPanel({
  panelPhase,
  guideUiTest = false,
  guideMock = false,
  messages,
  locationTitle,
  tourTitle,
  suggestedQuestions,
  currentSceneId,
  isSending = false,
  liveMode = false,
  sendError = null,
  onClose,
  onReset,
  onDismissError,
  onSend,
  onNavigateScene,
  onSelectNaming,
  onVisitNaming,
  onCopyGuideLink,
}: AiChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const threadSpacerRef = useRef<HTMLDivElement>(null);
  const lastAnchoredUserIdRef = useRef<string | null>(null);
  const hasInput = input.trim().length > 0;
  const canReset = !guideUiTest && messages.length > 0 && !isSending;
  const canCompose = !guideUiTest && !isSending;
  const displayMessages = useMemo(
    () => (guideUiTest ? CHAT_SCROLL_TEST_MESSAGES : messages),
    [guideUiTest, messages],
  );
  const showMockNotice = guideMock && !liveMode;
  const latestAssistantFollowUps = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const msg = displayMessages[i];
      if (msg?.role === 'assistant' && msg.followUps?.length) {
        return msg.followUps;
      }
    }
    return null;
  }, [displayMessages]);
  const showBottomSuggestions =
    !guideUiTest && !isSending && !latestAssistantFollowUps;
  const greeting = useMemo(() => {
    const place = locationTitle.trim();
    const tour = tourTitle.trim();
    if (tour && place && tour !== place) {
      return `Welcome to ${tour} — so glad you're here. I'm your ${VIRTUAL_TOUR_GUIDE_NAME}, and I'd love to help you explore. You're in ${place} right now; ask me about this place, naming opportunities, or where to go next.`;
    }
    if (place) {
      return `Welcome — so glad you're here. I'm your ${VIRTUAL_TOUR_GUIDE_NAME}, and I'd love to help you explore ${place}. Ask me about this place, naming opportunities, or where to go next.`;
    }
    return `Welcome — so glad you're here. I'm your ${VIRTUAL_TOUR_GUIDE_NAME}, and I'd love to help you explore. Ask me about this place, naming opportunities, or where to go next.`;
  }, [locationTitle, tourTitle]);

  const latestUserMessageId = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const msg = displayMessages[i];
      if (msg?.role === 'user') return msg.id;
    }
    return null;
  }, [displayMessages]);

  useLayoutEffect(() => {
    const root = messagesRef.current;
    const spacer = threadSpacerRef.current;
    if (!root || !spacer) return;

    if (!latestUserMessageId) {
      lastAnchoredUserIdRef.current = null;
      spacer.style.height = '0px';
      if (displayMessages.length === 0 && !isSending && !sendError) {
        root.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const msgEl = root.querySelector(
      `[data-msg-id="${CSS.escape(latestUserMessageId)}"]`,
    );
    if (!(msgEl instanceof HTMLElement)) return;

    const shouldAnchor = latestUserMessageId !== lastAnchoredUserIdRef.current;

    const prevSpacer = spacer.offsetHeight;
    const rootRect = root.getBoundingClientRect();
    const msgRect = msgEl.getBoundingClientRect();
    const msgTop = root.scrollTop + (msgRect.top - rootRect.top);
    const fromMsgToEnd = root.scrollHeight - prevSpacer - msgTop;
    spacer.style.height = `${Math.max(0, root.clientHeight - fromMsgToEnd)}px`;

    if (!shouldAnchor) return;
    lastAnchoredUserIdRef.current = latestUserMessageId;

    const delta =
      msgEl.getBoundingClientRect().top - root.getBoundingClientRect().top;
    root.scrollTo({
      top: Math.max(0, root.scrollTop + delta - 4),
      behavior: 'smooth',
    });
  }, [displayMessages, isSending, sendError, latestUserMessageId]);

  const panelClass = aiPanelVariants({ phase: panelPhase });

  const canComposeRef = useRef(canCompose);
  canComposeRef.current = canCompose;

  const handleSend = (text: string) => {
    onSend(text);
  };

  const speech = useSpeechToText({
    onFinal: (transcript) => {
      const text = transcript.trim();
      if (!text || !canComposeRef.current) return;
      setInput('');
      handleSend(text);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCompose || !input.trim()) return;
    handleSend(input);
    setInput('');
  };

  const composerValue =
    speech.listening && speech.interim ? speech.interim : input;
  const voiceLabel =
    !speech.supported ? 'Voice input unavailable in this browser'
    : speech.listening ? 'Stop listening'
    : 'Voice input';

  useEffect(() => {
    if (!canCompose && speech.listening) speech.stop();
  }, [canCompose, speech.listening, speech.stop]);

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
                Tour Guide
              </p>
              <LocationBadge title={tourTitle} />
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
        {!guideUiTest && (
          <div className={aiPanelIntroClassName}>
            {showMockNotice ?
              <p className={aiPanelNoticeClassName} role='note'>
                {VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE}
              </p>
            : null}
            <p className={aiMessageVariants({ role: 'assistant' })}>
              {greeting}
            </p>
          </div>
        )}
        <div className={aiPanelThreadClassName}>
          {displayMessages.map((msg, index) => {
            const previousRole =
              index > 0 ? (displayMessages[index - 1]?.role ?? null) : null;
            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className={cn(
                  aiMessageVariants({ role: msg.role }),
                  threadItemSpacingClass(previousRole, msg.role),
                )}
              >
                {msg.content}
                {(
                  msg.role === 'assistant' &&
                  msg.guideLinks &&
                  msg.guideLinks.length > 0 &&
                  (onNavigateScene ||
                    onSelectNaming ||
                    onVisitNaming ||
                    onCopyGuideLink)
                ) ?
                  <GuideSceneLinkCards
                    links={msg.guideLinks}
                    currentSceneId={currentSceneId}
                    onSelectScene={onNavigateScene}
                    onSelectNaming={onSelectNaming}
                    onVisitNaming={onVisitNaming}
                    onCopyLink={onCopyGuideLink}
                    disabled={!canCompose}
                  />
                : null}
                {msg.role === 'assistant' && msg.guideCtas?.length ?
                  <GuideCtaRow ctas={msg.guideCtas} />
                : null}
                {(
                  msg.role === 'assistant' &&
                  msg.followUps &&
                  msg.followUps.length > 0 &&
                  !guideUiTest &&
                  !isSending
                ) ?
                  <SuggestedQuestions
                    className={aiMessageFollowUpsClassName}
                    questions={msg.followUps}
                    onSelect={handleSend}
                    disabled={!canCompose}
                  />
                : null}
              </div>
            );
          })}
          {isSending || guideUiTest ?
            <div
              className={threadItemSpacingClass(
                displayMessages.at(-1)?.role ?? null,
                'assistant',
              )}
            >
              <AiThinkingIndicator />
            </div>
          : null}
          {showBottomSuggestions ?
            <div
              key={suggestedQuestions.join('|')}
              className={cn(
                aiPanelSuggestionsSlotClassName,
                threadItemSpacingClass(
                  displayMessages.at(-1)?.role ?? null,
                  'assistant',
                ),
              )}
            >
              <SuggestedQuestions
                questions={suggestedQuestions}
                onSelect={handleSend}
                disabled={!canCompose}
              />
            </div>
          : null}
          {/* Lets the latest user question sit near the top while the reply grows below. */}
          <div
            ref={threadSpacerRef}
            aria-hidden='true'
            className='pointer-events-none shrink-0'
          />
        </div>
        {sendError && !guideUiTest ?
          <div className={aiPanelErrorRowClassName} role='alert'>
            <p className={cn(aiPanelErrorClassName, 'min-w-0 flex-1')}>
              {sendError}
            </p>
            {onDismissError ?
              <button
                type='button'
                className={aiPanelErrorDismissClassName}
                onClick={onDismissError}
                aria-label='Dismiss error'
              >
                <MaterialSymbol
                  name='close'
                  className={aiPanelHeaderIconClassName}
                  sizePx={MATERIAL_SYMBOL_SIZE_22}
                />
              </button>
            : null}
          </div>
        : null}
      </div>

      <form className={aiComposerClassName} onSubmit={handleSubmit}>
        <div
          className={cn(
            aiComposerPillClassName,
            speech.listening && aiComposerPillExpandedClassName,
          )}
        >
          <input
            className={aiComposerInputClassName}
            type='text'
            placeholder={
              speech.listening ? 'Listening…' : (
                `Ask ${VIRTUAL_TOUR_GUIDE_NAME}...`
              )
            }
            value={composerValue}
            onChange={(e) => {
              if (speech.listening) return;
              setInput(e.target.value);
            }}
            aria-label='Your question'
            disabled={!canCompose}
            readOnly={speech.listening}
          />
          <div className={aiComposerActionsClassName}>
            {speech.supported ?
              <IconTooltip label={voiceLabel} placement='top'>
                <button
                  type='button'
                  className={
                    speech.listening ?
                      aiComposerVoiceListeningClassName
                    : aiComposerVoiceClassName
                  }
                  aria-label={voiceLabel}
                  aria-pressed={speech.listening}
                  disabled={!canCompose}
                  onPointerDown={(event) => {
                    // Avoid focusing the mic (pill expand) and losing the click to layout shift.
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    speech.toggle();
                  }}
                >
                  {speech.listening ?
                    <MicVolumePulse level={speech.level} />
                  : null}
                  <MicIcon />
                </button>
              </IconTooltip>
            : null}
            {speech.error ?
              <span className='sr-only' role='status'>
                {speech.error}
              </span>
            : null}
            {hasInput && canCompose && !speech.listening ?
              <button
                type='submit'
                className={aiComposerSendClassName}
                aria-label='Send message'
              >
                <ArrowUpIcon />
              </button>
            : null}
          </div>
        </div>
      </form>
    </TourGlassPanel>
  );
}
