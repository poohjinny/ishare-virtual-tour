import {
  Fragment,
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
  VIRTUAL_TOUR_GUIDE_PRIVACY_NOTICE,
} from '../../constants/branding';
import type {
  ChatGuideCtaKind,
  ChatMessage,
  TourClient,
} from '../../types/tour';
import { cn } from '../../lib/cn';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useTourChromeLayout } from '../../hooks/useTourChromeLayout';
import {
  stripMarkdownForSpeech,
  useSpeechSynthesis,
} from '../../hooks/useSpeechSynthesis';
import { GlassPanelCloseIcon, TourGlassPanel } from '../TourGlassPanel';
import { IconTooltip } from '../ui/IconTooltip';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_14,
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_22,
  MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
} from '../ui/materialSymbolClasses';
import { PlatformBrandLink } from '../PlatformBrandLink';
import { GuideAvatar } from './GuideAvatar';
import { GuideCtaRow } from './GuideCtaRow';
import { GuideSceneLinkCards } from './GuideSceneLinkCards';
import { FollowUpQuestions } from './FollowUpQuestions';
import { GuideChatMarkdown } from '../../utils/guideChatMarkdown';
import { formatAssistantReplyPlainText } from '../../utils/guideReplyPlainText';
import { AiThinkingIndicator } from './AiThinkingIndicator';
import { AiThreadScrollToBottom } from './AiThreadScrollToBottom';
import {
  aiComposerActionsClassName,
  aiComposerClassName,
  aiComposerIconClassName,
  aiComposerInputClassName,
  aiComposerPrivacyClassName,
  aiComposerSendClassName,
  aiComposerSendHiddenClassName,
  aiComposerSendIconClassName,
  aiComposerSendSlotClassName,
  aiComposerSendSlotClosedClassName,
  aiComposerSendSlotInnerClassName,
  aiComposerSendSlotOpenClassName,
  aiComposerSendVisibleClassName,
  aiComposerShellClassName,
  aiComposerShellCollapsedClassName,
  aiComposerShellExpandedClassName,
  aiComposerStopClassName,
  aiComposerVoiceClassName,
  aiComposerVoiceListeningClassName,
  aiComposerVoiceRingClassName,
  aiComposerVoiceRingIdleClassName,
  aiFollowUpUserBubbleClassName,
  aiMessageGapSameClassName,
  aiMessageGapTurnClassName,
  aiMessageProseClassName,
  aiMessageActionsClassName,
  aiMessageSpeakClassName,
  aiMessageVariants,
  aiPanelBannerBodyClassName,
  aiPanelBannerDismissClassName,
  aiPanelBannerRetryClassName,
  aiPanelBannerTopClassName,
  aiPanelErrorClassName,
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
  aiPanelThreadScrollStackClassName,
  aiPanelTitleClassName,
  aiPanelTitleRowClassName,
  aiPanelConnectionStatusClassName,
  aiPanelConnectionStatusDotClassName,
  aiPanelConnectionStatusLiveClassName,
  aiPanelConnectionStatusLiveDotClassName,
  aiPanelConnectionStatusMutedClassName,
  aiPanelConnectionStatusMutedDotClassName,
  aiPanelVariants,
} from './aiAssistantVariants';

function AiPanelBanner({
  variant,
  children,
  onDismiss,
  onRetry,
}: {
  variant: 'notice' | 'error';
  children: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}) {
  return (
    <div
      className={
        variant === 'notice' ? aiPanelNoticeClassName : aiPanelErrorClassName
      }
      role={variant === 'error' ? 'alert' : 'note'}
    >
      <div className={aiPanelBannerTopClassName}>
        <p className={aiPanelBannerBodyClassName}>{children}</p>
        {onDismiss ?
          <button
            type='button'
            className={aiPanelBannerDismissClassName}
            onClick={onDismiss}
            aria-label={
              variant === 'error' ? 'Dismiss error' : 'Dismiss notice'
            }
          >
            <MaterialSymbol
              name='close'
              sizePx={MATERIAL_SYMBOL_SIZE_14}
              aria-hidden
            />
          </button>
        : null}
      </div>
      {onRetry ?
        <button
          type='button'
          className={aiPanelBannerRetryClassName}
          onClick={onRetry}
        >
          Retry
        </button>
      : null}
    </div>
  );
}

/** Fixture copy mirrors the live failure banner so wrap + Retry layout can be QA’d. */
const GUIDE_UI_TEST_ERROR_MESSAGE =
  'Live Tour Guide could not answer just now. Check the browser console for details, then try again.';

/** Streaming grows a few dozen px; cards/images usually jump more — offer FAB. */
const THREAD_CARD_GROWTH_PX = 88;

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
  canRetry?: boolean;
  /** First-turn starters when the visitor has not sent a user message yet. */
  starterQuestions?: string[];
  onClose: () => void;
  onReset: () => void;
  onDismissError?: () => void;
  onRetryError?: () => void;
  onStop?: () => void;
  onSend: (text: string) => void;
  onNavigateScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  /** In-app chrome CTAs from a guide reply (e.g. Open Help). */
  onChromeAction?: (kind: ChatGuideCtaKind) => void;
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
      sizePx={MATERIAL_SYMBOL_SIZE_CHROME_HEADER}
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

function StopIcon() {
  return (
    <MaterialSymbol
      name='stop'
      className={cn(aiComposerIconClassName, 'relative z-[1]')}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
      filled
    />
  );
}

/**
 * Listening feedback — steady breathe ring (session is live) + louder fill
 * when the mic hears speech (ChatGPT-style stop + pulse).
 */
function ListeningPulse({ level }: { level: number }) {
  const speaking = level >= 0.08;
  const scale = speaking ? 1.06 + level * 0.5 : 1;
  const opacity = speaking ? 0.14 + level * 0.28 : 0;

  return (
    <>
      <span className={aiComposerVoiceRingIdleClassName} aria-hidden='true' />
      {speaking ?
        <span
          className={aiComposerVoiceRingClassName}
          aria-hidden='true'
          style={{
            transform: `scale(${scale})`,
            opacity,
            transition: 'transform 90ms linear, opacity 120ms ease-out',
          }}
        />
      : null}
    </>
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
  isSending?: boolean;
  listening: boolean;
  speechSupported: boolean;
  speechError: string | null;
  speechLevel: number;
  voiceLabel: string;
  onChange: (value: string) => void;
  onToggleSpeech: () => void;
  onStop?: () => void;
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
  isSending = false,
  listening,
  speechSupported,
  speechError,
  speechLevel,
  voiceLabel,
  onChange,
  onToggleSpeech,
  onStop,
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
          event.preventDefault();
          if (!canSend) return;
          onSubmitRequest?.();
        }}
        aria-label='Your question'
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
                event.preventDefault();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleSpeech();
              }}
            >
              {listening ?
                <ListeningPulse level={speechLevel} />
              : null}
              {listening ?
                <StopIcon />
              : <MicIcon />}
            </button>
          </IconTooltip>
        : null}
        {speechError ?
          <span className='sr-only' role='status'>
            {speechError}
          </span>
        : null}
        {isSending && onStop ?
          <IconTooltip label='Stop generating' placement='top'>
            <button
              type='button'
              className={aiComposerStopClassName}
              aria-label='Stop generating'
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onClick={(event) => {
                event.preventDefault();
                onStop();
              }}
            >
              <StopIcon />
            </button>
          </IconTooltip>
        : <div
            className={cn(
              aiComposerSendSlotClassName,
              hasInput ?
                aiComposerSendSlotOpenClassName
              : aiComposerSendSlotClosedClassName,
            )}
            aria-hidden={!hasInput}
          >
            <div className={aiComposerSendSlotInnerClassName}>
              <IconTooltip
                label='Send message'
                placement='top'
                disabled={!canSend}
              >
                <button
                  type='submit'
                  className={cn(
                    aiComposerSendClassName,
                    hasInput ?
                      aiComposerSendVisibleClassName
                    : aiComposerSendHiddenClassName,
                  )}
                  aria-label='Send message'
                  disabled={!canSend}
                  tabIndex={-1}
                  onPointerDown={(event) => {
                    event.preventDefault();
                  }}
                >
                  <ArrowUpIcon />
                </button>
              </IconTooltip>
            </div>
          </div>
        }
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
  canRetry = false,
  starterQuestions = [],
  onClose,
  onReset,
  onDismissError,
  onRetryError,
  onStop,
  onSend,
  onNavigateScene,
  onSelectNaming,
  onChromeAction,
  client,
  clientLogo,
  logoAlt,
}: AiChatPanelProps) {
  const { isCoarsePointer } = useTourChromeLayout();
  const [input, setInput] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  /** Inner column whose height grows with streaming / cards (scroll root size may not). */
  const threadContentRef = useRef<HTMLDivElement>(null);
  const threadSpacerRef = useRef<HTMLDivElement>(null);
  const composerFormRef = useRef<HTMLFormElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  /** ChatGPT-style: follow new output while near the bottom; stop if user scrolls up. */
  const stickToBottomRef = useRef(true);
  const lastScrollOutputKeyRef = useRef<string>('');
  /** Track scrollHeight so ResizeObserver can tell streaming vs card-size jumps. */
  const lastThreadScrollHeightRef = useRef(0);
  const programmaticScrollRef = useRef(false);
  const hasInput = input.trim().length > 0;
  const readAloud = useSpeechSynthesis();
  const canReset = !guideUiTest && messages.length > 0 && !isSending;
  const canCompose = !guideUiTest && !isSending;
  const displayMessages = useMemo(
    () => (guideUiTest ? CHAT_SCROLL_TEST_MESSAGES : messages),
    [guideUiTest, messages],
  );
  const showMockNotice = guideMock && !liveMode;
  // Debug mock flag wins — don't keep showing Live after guideMock=1.
  const connectionStatus =
    guideMock ?
      {
        label: 'Preview',
        aria: 'AI preview mode',
        textClass: aiPanelConnectionStatusMutedClassName,
        dotClass: aiPanelConnectionStatusMutedDotClassName,
      }
    : liveMode ?
      {
        label: 'Live',
        aria: 'AI connected',
        textClass: aiPanelConnectionStatusLiveClassName,
        dotClass: aiPanelConnectionStatusLiveDotClassName,
      }
    : null;
  const showUiTestNotice = guideUiTest && !noticeDismissed;
  const showUiTestError = guideUiTest && !errorDismissed;
  const showSendError = Boolean(sendError) && !guideUiTest && !errorDismissed;

  useEffect(() => {
    setErrorDismissed(false);
  }, [sendError]);

  useEffect(() => {
    if (guideUiTest) {
      setNoticeDismissed(false);
      setErrorDismissed(false);
    }
  }, [guideUiTest]);
  /**
   * Follow-ups only while that assistant turn is still the thread tip.
   * Once the user sends (incl. tapping a suggestion), hide so the pick
   * appears as a normal user bubble before the reply starts.
   */
  const tipFollowUps = useMemo(() => {
    if (guideUiTest) return null;
    const last = displayMessages.at(-1);
    if (!last || last.role !== 'assistant' || !last.followUps?.length) {
      return null;
    }
    return { messageId: last.id, questions: last.followUps };
  }, [displayMessages, guideUiTest]);
  const hasUserTurn = useMemo(
    () => displayMessages.some((msg) => msg.role === 'user'),
    [displayMessages],
  );
  const showStarters =
    !guideUiTest &&
    !hasUserTurn &&
    !isSending &&
    starterQuestions.length > 0 &&
    !tipFollowUps;
  const showThinking =
    guideUiTest || (isSending && displayMessages.at(-1)?.role !== 'assistant');

  useEffect(() => {
    if (!isSending) return;
    readAloud.stop();
  }, [isSending, readAloud]);

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

  const scrollThreadToBottom = () => {
    const root = messagesRef.current;
    if (!root) return;
    const top = Math.max(0, root.scrollHeight - root.clientHeight);
    programmaticScrollRef.current = true;
    // Instant pin for streaming / small layout settle.
    root.scrollTop = top;
    lastThreadScrollHeightRef.current = root.scrollHeight;
    requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
    });
  };

  /**
   * Re-pin after layout catches up while stick-to-bottom.
   * Small growth (streaming) → instant pin.
   * Large sudden growth (cards / CTAs / images) → leave reading position;
   * scroll-to-bottom FAB covers the rest.
   */
  const settleThreadToBottom = () => {
    if (!stickToBottomRef.current) return;
    const root = messagesRef.current;
    if (!root) return;

    const height = root.scrollHeight;
    const prevHeight = lastThreadScrollHeightRef.current;
    const growth = prevHeight > 0 ? height - prevHeight : 0;
    lastThreadScrollHeightRef.current = height;

    if (growth >= THREAD_CARD_GROWTH_PX) {
      if (!isNearBottom(root)) {
        stickToBottomRef.current = false;
      }
      return;
    }

    scrollThreadToBottom();
    requestAnimationFrame(() => {
      if (!stickToBottomRef.current) return;
      scrollThreadToBottom();
      const next = messagesRef.current;
      if (next) lastThreadScrollHeightRef.current = next.scrollHeight;
    });
  };

  useEffect(() => {
    const root = messagesRef.current;
    if (!root) return;

    const onScroll = () => {
      if (isNearBottom(root)) {
        stickToBottomRef.current = true;
        return;
      }
      // Mid programmatic pin: remaining can briefly look large — don’t drop stick.
      if (programmaticScrollRef.current) return;
      stickToBottomRef.current = false;
    };
    const onUserScrollIntent = () => {
      programmaticScrollRef.current = false;
      stickToBottomRef.current = isNearBottom(root);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('wheel', onUserScrollIntent, { passive: true });
    root.addEventListener('touchmove', onUserScrollIntent, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('wheel', onUserScrollIntent);
      root.removeEventListener('touchmove', onUserScrollIntent);
    };
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
      // Bottom so greeting/starters aren’t clipped under a growing composer.
      scrollThreadToBottom();
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
      settleThreadToBottom();
      return;
    }

    // Thinking / assistant reply / error — follow only if still stuck to bottom.
    if (stickToBottomRef.current || isNearBottom(root)) {
      stickToBottomRef.current = true;
      settleThreadToBottom();
    }
  }, [
    displayMessages,
    isSending,
    sendError,
    latestUserMessageId,
    latestAssistantMessageId,
  ]);

  // Thread content height (streaming / cards) + chrome resize — follow if sticking.
  useEffect(() => {
    const root = messagesRef.current;
    const content = threadContentRef.current;
    const form = composerFormRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    lastThreadScrollHeightRef.current = root.scrollHeight;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        // Small growth pins while sticking; large card jumps defer to FAB.
        settleThreadToBottom();
      });
    });
    ro.observe(root);
    if (content) ro.observe(content);
    if (form) ro.observe(form);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  // Card thumbnails can settle after first layout — re-pin if still sticking.
  useEffect(() => {
    const content = threadContentRef.current;
    if (!content) return;
    const onLoadCapture = (event: Event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      settleThreadToBottom();
    };
    content.addEventListener('load', onLoadCapture, true);
    return () => content.removeEventListener('load', onLoadCapture, true);
  }, []);

  const panelClass = aiPanelVariants({ phase: panelPhase });

  const canComposeRef = useRef(canCompose);
  canComposeRef.current = canCompose;

  const focusComposerInput = () => {
    const inputEl = composerInputRef.current;
    if (!inputEl) return;
    inputEl.focus({ preventScroll: true });
  };

  // Desktop / fine pointer — ready to type on open. Skip coarse (phone keyboard).
  useEffect(() => {
    if (panelPhase !== 'enter') return;
    if (!canCompose || isCoarsePointer) return;
    setComposerFocused(true);
    queueMicrotask(focusComposerInput);
    requestAnimationFrame(() => {
      focusComposerInput();
      // Focus expands the composer and shortens the thread — re-pin after that.
      stickToBottomRef.current = true;
      settleThreadToBottom();
    });
  }, [canCompose, isCoarsePointer, panelPhase]);

  // Panel enter (incl. touch) — settle once the glass panel finishes growing.
  useEffect(() => {
    if (panelPhase !== 'enter') return;
    stickToBottomRef.current = true;
    settleThreadToBottom();
    const timer = window.setTimeout(() => settleThreadToBottom(), 200);
    return () => window.clearTimeout(timer);
  }, [panelPhase]);

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
  const shellExpanded = composerFocused || speech.listening || hasInput;

  useEffect(() => {
    if (!canCompose && speech.listening) speech.stop();
  }, [canCompose, speech.listening, speech.stop]);

  // After send starts, keep caret if the user was composing.
  useLayoutEffect(() => {
    if (!composerFocused) return;
    focusComposerInput();
  }, [canCompose, composerFocused]);

  const handleComposerFocus = () => {
    setComposerFocused(true);
  };

  const handleComposerBlur = () => {
    // Defer so mic/send clicks inside the form still count as "in composer".
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active && composerFormRef.current?.contains(active)) {
        return;
      }
      setComposerFocused(false);
    }, 0);
  };

  const handleFollowUpSelect = (question: string) => {
    if (!canCompose) return;
    setComposerFocused(true);
    handleSend(question);
    queueMicrotask(focusComposerInput);
    requestAnimationFrame(focusComposerInput);
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    const plain = stripMarkdownForSpeech(content);
    if (!plain || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(plain).then(() => {
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === messageId ? null : current,
        );
      }, 1600);
    });
  };

  const assistantShareText = (msg: ChatMessage) =>
    formatAssistantReplyPlainText(msg, { client });

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
              <div className={aiPanelTitleRowClassName}>
                <p id='ai-guide-panel-title' className={aiPanelTitleClassName}>
                  Tour Guide
                </p>
                {connectionStatus ?
                  <span
                    className={cn(
                      aiPanelConnectionStatusClassName,
                      connectionStatus.textClass,
                    )}
                    aria-label={connectionStatus.aria}
                  >
                    <span
                      className={cn(
                        aiPanelConnectionStatusDotClassName,
                        connectionStatus.dotClass,
                      )}
                      aria-hidden='true'
                    />
                    {connectionStatus.label}
                  </span>
                : null}
              </div>
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
              <GlassPanelCloseIcon
                sizePx={MATERIAL_SYMBOL_SIZE_CHROME_HEADER}
              />
            </button>
          </div>
        </>
      }
    >
      <div className={aiPanelThreadScrollStackClassName}>
        <div className={aiPanelMessagesClassName} ref={messagesRef}>
          <div ref={threadContentRef} className='flex w-full flex-col gap-3'>
            {!guideUiTest && (
              <div className={aiPanelIntroClassName}>
                {showMockNotice && !noticeDismissed ?
                  <AiPanelBanner
                    variant='notice'
                    onDismiss={() => setNoticeDismissed(true)}
                  >
                    {VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE}
                  </AiPanelBanner>
                : null}
                <div className={aiMessageVariants({ role: 'assistant' })}>
                  <GuideChatMarkdown
                    text={greeting}
                    className={aiMessageProseClassName}
                  />
                </div>
                {showStarters ?
                  <div
                    className={cn(
                      aiMessageVariants({ role: 'user' }),
                      aiFollowUpUserBubbleClassName,
                    )}
                  >
                    <FollowUpQuestions
                      questions={starterQuestions}
                      onSelect={handleFollowUpSelect}
                      disabled={!canCompose}
                    />
                  </div>
                : null}
              </div>
            )}
            <div className={aiPanelThreadClassName}>
              {displayMessages.map((msg, index) => {
                const previousRole =
                  index > 0 ? (displayMessages[index - 1]?.role ?? null) : null;
                const showTipFollowUps = tipFollowUps?.messageId === msg.id;
                const speaking = readAloud.speakingId === msg.id;
                const shareText =
                  msg.role === 'assistant' ? assistantShareText(msg) : '';
                return (
                  <Fragment key={msg.id}>
                    <div
                      data-msg-id={msg.id}
                      className={cn(
                        aiMessageVariants({ role: msg.role }),
                        threadItemSpacingClass(previousRole, msg.role),
                      )}
                    >
                      {msg.role === 'assistant' ?
                        <>
                          <GuideChatMarkdown
                            text={msg.content}
                            className={aiMessageProseClassName}
                          />
                          {(
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
                            msg.guideCtas?.length &&
                            !(msg.guideLinks && msg.guideLinks.length > 0)
                          ) ?
                            <GuideCtaRow
                              ctas={msg.guideCtas}
                              client={client}
                              clientLogo={clientLogo}
                              logoAlt={logoAlt}
                              onChromeAction={onChromeAction}
                            />
                          : null}
                          {shareText ?
                            <div className={aiMessageActionsClassName}>
                              <IconTooltip
                                label={
                                  copiedMessageId === msg.id ? 'Copied' : 'Copy'
                                }
                                placement='top'
                              >
                                <button
                                  type='button'
                                  className={aiMessageSpeakClassName}
                                  aria-label={
                                    copiedMessageId === msg.id ?
                                      'Copied'
                                    : 'Copy reply'
                                  }
                                  onClick={() =>
                                    handleCopyMessage(msg.id, shareText)
                                  }
                                >
                                  <MaterialSymbol
                                    name={
                                      copiedMessageId === msg.id ?
                                        'check'
                                      : 'content_copy'
                                    }
                                    sizePx={MATERIAL_SYMBOL_SIZE_18}
                                    aria-hidden
                                  />
                                </button>
                              </IconTooltip>
                              {readAloud.supported ?
                                <IconTooltip
                                  label={
                                    speaking ? 'Stop reading aloud' : (
                                      'Read aloud'
                                    )
                                  }
                                  placement='top'
                                >
                                  <button
                                    type='button'
                                    className={aiMessageSpeakClassName}
                                    aria-label={
                                      speaking ? 'Stop reading aloud' : (
                                        'Read aloud'
                                      )
                                    }
                                    aria-pressed={speaking}
                                    onClick={() =>
                                      readAloud.toggle(msg.id, shareText)
                                    }
                                  >
                                    <MaterialSymbol
                                      name={speaking ? 'stop' : 'graphic_eq'}
                                      sizePx={MATERIAL_SYMBOL_SIZE_18}
                                      filled={speaking}
                                      aria-hidden
                                    />
                                  </button>
                                </IconTooltip>
                              : null}
                            </div>
                          : null}
                        </>
                      : msg.content}
                    </div>
                    {showTipFollowUps ?
                      <div
                        className={cn(
                          aiMessageVariants({ role: 'user' }),
                          aiFollowUpUserBubbleClassName,
                          threadItemSpacingClass(msg.role, 'user'),
                        )}
                      >
                        <FollowUpQuestions
                          questions={tipFollowUps.questions}
                          onSelect={handleFollowUpSelect}
                          disabled={!canCompose}
                        />
                      </div>
                    : null}
                  </Fragment>
                );
              })}
              {showThinking ?
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
            {showUiTestNotice ?
              <AiPanelBanner
                variant='notice'
                onDismiss={() => setNoticeDismissed(true)}
              >
                Preview notice — scripted replies only (guideUiTest).
              </AiPanelBanner>
            : null}
            {showSendError ?
              <AiPanelBanner
                variant='error'
                onRetry={canRetry && onRetryError ? onRetryError : undefined}
                onDismiss={() => {
                  setErrorDismissed(true);
                  onDismissError?.();
                }}
              >
                {sendError!}
              </AiPanelBanner>
            : null}
            {showUiTestError ?
              <AiPanelBanner
                variant='error'
                onRetry={() => {
                  /* Preview only — same Retry chrome as a live send failure. */
                }}
                onDismiss={() => setErrorDismissed(true)}
              >
                {GUIDE_UI_TEST_ERROR_MESSAGE}
              </AiPanelBanner>
            : null}
          </div>
        </div>
        <AiThreadScrollToBottom scrollRef={messagesRef} />
      </div>
      <form
        ref={composerFormRef}
        className={aiComposerClassName}
        onSubmit={handleSubmit}
        onFocus={handleComposerFocus}
        onBlur={handleComposerBlur}
      >
        <ComposerField
          className={cn(
            aiComposerShellClassName,
            shellExpanded ?
              aiComposerShellExpandedClassName
            : aiComposerShellCollapsedClassName,
          )}
          value={composerValue}
          canCompose={canCompose}
          hasInput={hasInput}
          isSending={isSending}
          listening={speech.listening}
          speechSupported={speech.supported}
          speechError={speech.error}
          speechLevel={speech.level}
          voiceLabel={voiceLabel}
          onChange={setInput}
          onToggleSpeech={speech.toggle}
          onStop={onStop}
          onSubmitRequest={commitComposerText}
          inputRef={composerInputRef}
        />
        <p className={aiComposerPrivacyClassName}>
          {VIRTUAL_TOUR_GUIDE_PRIVACY_NOTICE}
        </p>
      </form>
    </TourGlassPanel>
  );
}
