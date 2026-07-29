import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import { CHAT_SCROLL_TEST_MESSAGES } from '../../data/chatScrollTestMessages';
import {
  VIRTUAL_TOUR_GUIDE_NAME,
  VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE,
} from '../../constants/branding';
import type { ChatMessage, TourClient } from '../../types/tour';
import { cn } from '../../lib/cn';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { GlassPanelCloseIcon, TourGlassPanel } from '../TourGlassPanel';
import { IconTooltip } from '../ui/IconTooltip';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_22 } from '../ui/materialSymbolClasses';
import { PlatformBrandLink } from '../PlatformBrandLink';
import { GuideAvatar } from './GuideAvatar';
import { GuideCtaRow } from './GuideCtaRow';
import { GuideSceneLinkCards } from './GuideSceneLinkCards';
import { FollowUpQuestions } from './FollowUpQuestions';
import { AiThinkingIndicator } from './AiThinkingIndicator';
import {
  aiComposerActionsClassName,
  aiComposerClassName,
  aiComposerFollowUpsRevealClassName,
  aiComposerFollowUpsRevealClosedClassName,
  aiComposerFollowUpsRevealInnerClassName,
  aiComposerFollowUpsRevealOpenClassName,
  aiComposerIconClassName,
  aiComposerInputClassName,
  aiComposerSendClassName,
  aiComposerSendIconClassName,
  aiComposerShellClassName,
  aiComposerShellCollapsedClassName,
  aiComposerShellDividerClassName,
  aiComposerShellExpandedClassName,
  aiComposerShellFieldClassName,
  aiComposerShellFollowUpsClassName,
  aiComposerVoiceClassName,
  aiComposerVoiceListeningClassName,
  aiComposerVoiceRingClassName,
  aiMessageGapSameClassName,
  aiMessageGapTurnClassName,
  aiMessageVariants,
  aiPanelErrorClassName,
  aiPanelErrorDismissClassName,
  aiPanelErrorRowClassName,
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
  /** Catalog client — shown when a reply includes contact / website CTAs. */
  client?: TourClient;
  clientLogo?: string;
  logoAlt?: string;
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

/** Same-role opens a bit; user↔assistant turns open more. */
function threadItemSpacingClass(
  previousRole: ChatMessage['role'] | null,
  role: ChatMessage['role'] | 'assistant',
): string | undefined {
  if (!previousRole) return undefined;
  return previousRole === role ?
      aiMessageGapSameClassName
    : aiMessageGapTurnClassName;
}

interface ComposerFieldProps {
  value: string;
  canCompose: boolean;
  hasInput: boolean;
  listening: boolean;
  speechSupported: boolean;
  speechError: string | null;
  speechLevel: number;
  voiceLabel: string;
  onChange: (value: string) => void;
  onToggleSpeech: () => void;
  /** Keep caret in the field on Enter — avoid focusing the submit control. */
  onSubmitRequest?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

function ComposerField({
  value,
  canCompose,
  hasInput,
  listening,
  speechSupported,
  speechError,
  speechLevel,
  voiceLabel,
  onChange,
  onToggleSpeech,
  onSubmitRequest,
  onFocus,
  onBlur,
  className,
  autoFocus = false,
  inputRef,
}: ComposerFieldProps) {
  const canSend = hasInput && canCompose && !listening;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        className={aiComposerInputClassName}
        type='text'
        placeholder={
          listening ? 'Listening…' : `Ask ${VIRTUAL_TOUR_GUIDE_NAME}...`
        }
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          if (listening || !canCompose) return;
          onChange(e.target.value);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          // Prevent the browser from moving focus to the submit control (then
          // disabling/hiding it dumps focus out of the composer).
          event.preventDefault();
          if (!canSend) return;
          onSubmitRequest?.();
        }}
        aria-label='Your question'
        // readOnly (not disabled) while sending — disabled inputs drop focus on Enter.
        readOnly={listening || !canCompose}
      />
      <div className={aiComposerActionsClassName}>
        {speechSupported ?
          <IconTooltip label={voiceLabel} placement='top'>
            <button
              type='button'
              className={
                listening ?
                  aiComposerVoiceListeningClassName
                : aiComposerVoiceClassName
              }
              aria-label={voiceLabel}
              aria-pressed={listening}
              disabled={!canCompose}
              onPointerDown={(event) => {
                // Avoid focusing the mic (pill expand) and losing the click to layout shift.
                event.preventDefault();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleSpeech();
              }}
            >
              {listening ?
                <MicVolumePulse level={speechLevel} />
              : null}
              <MicIcon />
            </button>
          </IconTooltip>
        : null}
        {speechError ?
          <span className='sr-only' role='status'>
            {speechError}
          </span>
        : null}
        {/* Keep mounted; collapse from layout when idle so the mic sits on the trailing edge.
            Enter is handled on the input, so hiding the control no longer dumps focus. */}
        <button
          type='submit'
          className={aiComposerSendClassName}
          aria-label='Send message'
          tabIndex={-1}
          aria-hidden={!canSend}
          disabled={!canSend}
          hidden={!canSend}
        >
          <ArrowUpIcon />
        </button>
      </div>
    </div>
  );
}

export function AiChatPanel({
  panelPhase,
  guideUiTest = false,
  guideMock = false,
  messages,
  locationTitle,
  tourTitle,
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
  client,
  clientLogo,
  logoAlt,
}: AiChatPanelProps) {
  const [input, setInput] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const threadSpacerRef = useRef<HTMLDivElement>(null);
  const composerFormRef = useRef<HTMLFormElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  /** ChatGPT-style: follow new output while near the bottom; stop if user scrolls up. */
  const stickToBottomRef = useRef(true);
  const lastScrollOutputKeyRef = useRef<string>('');
  const hasInput = input.trim().length > 0;
  const canReset = !guideUiTest && messages.length > 0 && !isSending;
  const canCompose = !guideUiTest && !isSending;
  const displayMessages = useMemo(
    () => (guideUiTest ? CHAT_SCROLL_TEST_MESSAGES : messages),
    [guideUiTest, messages],
  );
  const showMockNotice = guideMock && !liveMode;
  const latestFollowUps = useMemo(() => {
    if (guideUiTest) return null;
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const msg = displayMessages[i];
      if (msg?.role === 'assistant' && msg.followUps?.length) {
        return msg.followUps;
      }
    }
    return null;
  }, [displayMessages, guideUiTest]);
  const greeting = useMemo(() => {
    const place = locationTitle.trim();
    const tour = tourTitle.trim();
    if (tour && place && tour !== place) {
      return `Welcome to ${tour} — so glad you're here. I'm your ${VIRTUAL_TOUR_GUIDE_NAME}, and I'd love to help you explore. You're in ${place} right now — what would you like to know about this place, naming opportunities, or where to go next?`;
    }
    if (place) {
      return `Welcome — so glad you're here. I'm your ${VIRTUAL_TOUR_GUIDE_NAME}, and I'd love to help you explore ${place}. What would you like to know about this place, naming opportunities, or where to go next?`;
    }
    return `Welcome — so glad you're here. I'm your ${VIRTUAL_TOUR_GUIDE_NAME}, and I'd love to help you explore. What would you like to know about this place, naming opportunities, or where to go next?`;
  }, [locationTitle, tourTitle]);

  const latestUserMessageId = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const msg = displayMessages[i];
      if (msg?.role === 'user') return msg.id;
    }
    return null;
  }, [displayMessages]);

  const latestAssistantMessageId = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const msg = displayMessages[i];
      if (msg?.role === 'assistant') return msg.id;
    }
    return null;
  }, [displayMessages]);

  const isNearBottom = (root: HTMLElement, thresholdPx = 96) => {
    const remaining = root.scrollHeight - root.scrollTop - root.clientHeight;
    return remaining <= thresholdPx;
  };

  const scrollThreadToBottom = (behavior: ScrollBehavior) => {
    const root = messagesRef.current;
    if (!root) return;
    root.scrollTo({
      top: Math.max(0, root.scrollHeight - root.clientHeight),
      behavior,
    });
  };

  useEffect(() => {
    const root = messagesRef.current;
    if (!root) return;

    const onScroll = () => {
      stickToBottomRef.current = isNearBottom(root);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const root = messagesRef.current;
    const spacer = threadSpacerRef.current;
    if (!root) return;
    // Spacer was for pin-user-to-top; ChatGPT follows the bottom instead.
    if (spacer) spacer.style.height = '0px';

    if (displayMessages.length === 0 && !isSending && !sendError) {
      stickToBottomRef.current = true;
      lastScrollOutputKeyRef.current = '';
      root.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const outputKey = [
      latestUserMessageId ?? '',
      latestAssistantMessageId ?? '',
      isSending ? 'sending' : 'idle',
      sendError ? 'error' : '',
    ].join('|');

    const isNewOutput = outputKey !== lastScrollOutputKeyRef.current;
    if (!isNewOutput) return;

    const previousKey = lastScrollOutputKeyRef.current;
    lastScrollOutputKeyRef.current = outputKey;

    // New user turn → always follow (like sending in ChatGPT).
    const isNewUserTurn =
      Boolean(latestUserMessageId) &&
      !previousKey.startsWith(`${latestUserMessageId}|`);

    if (isNewUserTurn) {
      stickToBottomRef.current = true;
      scrollThreadToBottom('smooth');
      return;
    }

    // Thinking / assistant reply / error — follow only if still stuck to bottom.
    if (stickToBottomRef.current || isNearBottom(root)) {
      stickToBottomRef.current = true;
      scrollThreadToBottom('smooth');
    }
  }, [
    displayMessages,
    isSending,
    sendError,
    latestUserMessageId,
    latestAssistantMessageId,
  ]);

  // Composer / follow-up chrome can shrink the viewport — keep bottom if sticking.
  useEffect(() => {
    const root = messagesRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!stickToBottomRef.current) return;
        scrollThreadToBottom('auto');
      });
    });
    ro.observe(root);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  const panelClass = aiPanelVariants({ phase: panelPhase });

  const canComposeRef = useRef(canCompose);
  canComposeRef.current = canCompose;

  const focusComposerInput = () => {
    const input = composerInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
  };

  const handleSend = (text: string) => {
    onSend(text);
  };

  const speech = useSpeechToText({
    onFinal: (transcript) => {
      const text = transcript.trim();
      if (!text || !canComposeRef.current) return;
      setInput('');
      handleSend(text);
      setComposerFocused(true);
      queueMicrotask(focusComposerInput);
    },
  });

  const commitComposerText = () => {
    const text = input.trim();
    if (!canCompose || !text) return;
    handleSend(text);
    setInput('');
    setComposerFocused(true);
    // Restore after React applies readOnly / clears value (Enter used to focus submit).
    queueMicrotask(focusComposerInput);
    requestAnimationFrame(focusComposerInput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitComposerText();
  };

  const composerValue =
    speech.listening && speech.interim ? speech.interim : input;
  const voiceLabel =
    !speech.supported ? 'Voice input unavailable in this browser'
    : speech.listening ? 'Stop listening'
    : 'Voice input';
  const showFollowUps =
    Boolean(latestFollowUps) && (composerFocused || speech.listening);
  // Keep one composer mount path — switching pill ↔ shell remounted the input and dropped focus.
  const shellExpanded =
    showFollowUps || composerFocused || speech.listening || hasInput;

  useEffect(() => {
    if (!canCompose && speech.listening) speech.stop();
  }, [canCompose, speech.listening, speech.stop]);

  // After send starts / reply brings follow-ups, keep caret if the user was composing.
  useLayoutEffect(() => {
    if (!composerFocused) return;
    focusComposerInput();
  }, [canCompose, latestFollowUps, composerFocused]);

  const handleComposerFocus = () => {
    setComposerFocused(true);
  };

  const handleComposerBlur = () => {
    // Defer so follow-up / mic clicks inside the form still count as "in composer".
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active && composerFormRef.current?.contains(active)) {
        return;
      }
      setComposerFocused(false);
    }, 0);
  };

  const handleReset = () => {
    if (!canReset) return;
    onReset();
    setInput('');
    setComposerFocused(false);
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
              <p className={aiPanelPoweredByClassName}>
                Powered by <PlatformBrandLink brandId='fundingMattersAiSuite' />
              </p>
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
        <form
          ref={composerFormRef}
          className={aiComposerClassName}
          onSubmit={handleSubmit}
          onFocus={handleComposerFocus}
          onBlur={handleComposerBlur}
        >
          <div
            className={cn(
              aiComposerShellClassName,
              shellExpanded ?
                aiComposerShellExpandedClassName
              : aiComposerShellCollapsedClassName,
            )}
          >
            <div
              className={cn(
                aiComposerFollowUpsRevealClassName,
                showFollowUps ?
                  aiComposerFollowUpsRevealOpenClassName
                : aiComposerFollowUpsRevealClosedClassName,
              )}
              aria-hidden={!showFollowUps}
            >
              <div className={aiComposerFollowUpsRevealInnerClassName}>
                {latestFollowUps ?
                  <FollowUpQuestions
                    className={aiComposerShellFollowUpsClassName}
                    questions={latestFollowUps}
                    onSelect={(question) => {
                      setComposerFocused(true);
                      handleSend(question);
                      queueMicrotask(focusComposerInput);
                      requestAnimationFrame(focusComposerInput);
                    }}
                    disabled={!canCompose || !showFollowUps}
                  />
                : null}
                <div
                  className={aiComposerShellDividerClassName}
                  aria-hidden='true'
                />
              </div>
            </div>
            <ComposerField
              className={aiComposerShellFieldClassName}
              value={composerValue}
              canCompose={canCompose}
              hasInput={hasInput}
              listening={speech.listening}
              speechSupported={speech.supported}
              speechError={speech.error}
              speechLevel={speech.level}
              voiceLabel={voiceLabel}
              onChange={setInput}
              onToggleSpeech={speech.toggle}
              onSubmitRequest={commitComposerText}
              inputRef={composerInputRef}
            />
          </div>
        </form>
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
                  (onNavigateScene || onSelectNaming)
                ) ?
                  <GuideSceneLinkCards
                    links={msg.guideLinks}
                    currentSceneId={currentSceneId}
                    onSelectScene={onNavigateScene}
                    onSelectNaming={onSelectNaming}
                  />
                : null}
                {(
                  msg.role === 'assistant' &&
                  msg.guideCtas?.length &&
                  !(msg.guideLinks && msg.guideLinks.length > 0)
                ) ?
                  <GuideCtaRow
                    ctas={msg.guideCtas}
                    client={client}
                    clientLogo={clientLogo}
                    logoAlt={logoAlt}
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
    </TourGlassPanel>
  );
}
