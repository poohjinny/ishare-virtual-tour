'use client';

import {
  ArrowUp,
  Mic,
  PanelRightClose,
  RotateCcw,
  Sparkles,
  Square,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { Button } from '@/components/ui/button';
import { GuideMessageArtifact } from '@/components/guide-message-artifact';
import { GuideThinkingIndicator } from '@/components/guide-thinking-indicator';
import { ThreadScrollToBottom } from '@/components/thread-scroll-to-bottom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GuideMessageBody } from '@/components/guide-message-body';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useThreadAutoscroll } from '@/hooks/use-thread-autoscroll';
import {
  GUIDE_DOCK_WIDTH_DEFAULT,
  GUIDE_DOCK_WIDTH_MAX,
  GUIDE_DOCK_WIDTH_MIN,
  useAdminGuideDock,
  useAdminGuideDockWidth,
} from '@/lib/admin-debug';
import {
  syncGuideDockBootState,
  syncGuideDockBootWidth,
} from '@/lib/admin-guide-dock';
import {
  ADMIN_GUIDE_SCENARIO_EVENT,
  ADMIN_GUIDE_STARTERS,
  getAdminGuideScenario,
  matchAdminGuideReply,
  type AdminGuideScenarioId,
  type AdminGuideScenarioMessage,
} from '@/lib/admin-guide-scenarios';
import { ADMIN_GUIDE_COPY } from '@/lib/authoring-copy';
import { cn } from '@/lib/utils';

type GuideMessage = AdminGuideScenarioMessage & { streaming?: boolean };

function nextMessageId() {
  return `guide-${crypto.randomUUID()}`;
}

/** Mock latency + reveal pacing so the shell reads like a real assistant. */
const THINKING_MS = 620;
const STREAM_TICK_MS = 26;
const STREAM_WORDS_PER_TICK = 2;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Header toggle — shows or hides the persistent Guide dock. Plain ghost icon
 * button like Debug; `buttonVariants` owns the muted idle and the
 * `aria-pressed` accent, so the call site sets no tone or chrome of its own.
 */
export function AdminGuideTrigger() {
  const dock = useAdminGuideDock();
  const label = dock.enabled ? ADMIN_GUIDE_COPY.close : ADMIN_GUIDE_COPY.open;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='shrink-0'
          aria-label={label}
          aria-pressed={dock.enabled}
          onClick={() => dock.setEnabled(!dock.enabled)}
        >
          <Sparkles aria-hidden='true' />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Right-rail Guide dock — sits beside page content (not a modal Sheet).
 * Open state and width persist. See ADMIN_GUIDE.md.
 */
export function AdminGuideDock() {
  const dock = useAdminGuideDock();
  const { width, setWidth } = useAdminGuideDockWidth();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<GuideMessage[]>(() => [
    ...getAdminGuideScenario('welcome').messages,
  ]);
  const [dragging, setDragging] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [followUps, setFollowUps] = useState<readonly string[]>([]);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const timersRef = useRef<number[]>([]);
  const inputId = useId();
  // Dictation fills the field; sending stays an explicit action.
  const speech = useSpeechToText({ onFinal: setDraft });
  const voiceLabel =
    !speech.supported ? ADMIN_GUIDE_COPY.voiceUnsupported
    : speech.listening ? ADMIN_GUIDE_COPY.voiceStop
    : ADMIN_GUIDE_COPY.voice;

  const lastUser = messages.filter((message) => message.role === 'user').at(-1);
  const streamingMessage = messages.find((message) => message.streaming);
  const busy = thinking || Boolean(streamingMessage);
  // Opening chips until the first question; afterwards the turn's follow-ups.
  const suggestions = lastUser ? followUps : ADMIN_GUIDE_STARTERS;
  const { scrollRef, contentRef } = useThreadAutoscroll({
    outputKey: [
      lastUser?.id ?? '',
      messages.at(-1)?.id ?? '',
      streamingMessage?.text.length ?? 0,
      thinking ? 'thinking' : 'idle',
    ].join('|'),
    userTurnKey: lastUser?.id ?? '',
  });

  function clearTimers() {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }

  function laterOn(run: () => void, delayMs: number) {
    timersRef.current.push(window.setTimeout(run, delayMs));
  }

  useEffect(() => clearTimers, []);

  // Toggling / resizing sync the boot mirror inline; this covers another tab.
  useEffect(() => {
    syncGuideDockBootState(dock.enabled);
  }, [dock.enabled]);

  useEffect(() => {
    syncGuideDockBootWidth(width);
  }, [width]);

  useEffect(() => {
    const loadScenario = (event: Event) => {
      const scenarioId = (event as CustomEvent<AdminGuideScenarioId>).detail;
      const scenario = getAdminGuideScenario(scenarioId);
      clearTimers();
      setDraft('');
      setThinking(false);
      setFollowUps([]);
      setMessages([...scenario.messages]);
    };

    window.addEventListener(ADMIN_GUIDE_SCENARIO_EVENT, loadScenario);
    return () =>
      window.removeEventListener(ADMIN_GUIDE_SCENARIO_EVENT, loadScenario);
  }, []);

  function onResizeStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startWidth: width };
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onResizeMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setWidth(drag.startWidth + (drag.startX - event.clientX));
  }

  function onResizeEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  /** Reveal the fixture answer word by word, then attach its artifact card. */
  function streamReply(prompt: string) {
    const reply = matchAdminGuideReply(prompt);
    const replyId = nextMessageId();

    setThinking(false);
    setMessages((prev) => [
      ...prev,
      { id: replyId, role: 'assistant', text: '', streaming: true },
    ]);

    const finish = () => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === replyId ?
            {
              ...message,
              text: reply.text,
              artifact: reply.artifact,
              streaming: false,
            }
          : message,
        ),
      );
      setFollowUps(reply.followUps);
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    const words = reply.text.split(/(\s+)/);
    let cursor = 0;
    const tick = () => {
      cursor += STREAM_WORDS_PER_TICK * 2;
      if (cursor >= words.length) {
        finish();
        return;
      }
      const partial = words.slice(0, cursor).join('');
      setMessages((prev) =>
        prev.map((message) =>
          message.id === replyId ? { ...message, text: partial } : message,
        ),
      );
      laterOn(tick, STREAM_TICK_MS);
    };
    laterOn(tick, STREAM_TICK_MS);
  }

  function ask(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;

    clearTimers();
    setDraft('');
    setFollowUps([]);
    setThinking(true);
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: 'user', text: prompt },
    ]);
    laterOn(() => streamReply(prompt), THINKING_MS);
  }

  /** Stop generating — keep whatever text already streamed in. */
  function stop() {
    clearTimers();
    setThinking(false);
    setMessages((prev) =>
      prev.map((message) =>
        message.streaming ? { ...message, streaming: false } : message,
      ),
    );
  }

  function resetConversation() {
    clearTimers();
    setDraft('');
    setThinking(false);
    setFollowUps([]);
    setMessages([...getAdminGuideScenario('welcome').messages]);
  }

  return (
    /*
      The rail animates its width on toggle. Inside it, the panel keeps its own
      width and is pinned to the clip's left edge, so it slides out past the
      viewport instead of being squeezed and its content never reflows. The drag
      handle sits outside the clip so it can straddle the border.
    */
    <div
      data-slot='admin-guide-rail'
      data-state={dock.enabled ? 'expanded' : 'collapsed'}
      data-resizing={dragging}
      className={cn(
        'relative h-full min-h-0 w-full shrink-0 md:w-(--guide-dock-width)',
        'transition-[width] duration-200 ease-out motion-reduce:transition-none',
        'data-[state=collapsed]:w-0',
        // A drag must track the pointer, so only the toggle animates.
        'data-[resizing=true]:transition-none',
      )}
    >
      {/*
        Left-edge drag, centred on the border. Hidden on small screens where the
        dock goes full width. Dragging left widens the panel (startX - clientX).
      */}
      {dock.enabled ?
        <div
          role='separator'
          aria-orientation='vertical'
          aria-label={ADMIN_GUIDE_COPY.resize}
          aria-valuemin={GUIDE_DOCK_WIDTH_MIN}
          aria-valuemax={GUIDE_DOCK_WIDTH_MAX}
          aria-valuenow={width}
          tabIndex={0}
          className={cn(
            'absolute inset-y-0 left-0 z-20 hidden w-1.5 -translate-x-1/2 cursor-col-resize touch-none md:block',
            // `left-0` is the panel border and the handle is pulled out by half
            // its width, so its midline lands there: the hairline starts at the
            // midline and covers the border pixel whole. Centring it on the
            // midline instead would straddle two pixels and smear on hover.
            'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent',
            'hover:after:bg-primary/40',
            dragging && 'after:bg-primary/50',
          )}
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          onDoubleClick={() => setWidth(GUIDE_DOCK_WIDTH_DEFAULT)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 32 : 16;
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setWidth(width + step);
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              setWidth(width - step);
            } else if (event.key === 'Home') {
              event.preventDefault();
              setWidth(GUIDE_DOCK_WIDTH_MAX);
            } else if (event.key === 'End') {
              event.preventDefault();
              setWidth(GUIDE_DOCK_WIDTH_MIN);
            }
          }}
        />
      : null}

      <div className='relative h-full min-h-0 w-full overflow-hidden'>
        <aside
          data-slot='admin-guide-dock'
          aria-label={ADMIN_GUIDE_COPY.title}
          inert={!dock.enabled}
          className='absolute inset-y-0 left-0 flex h-full min-h-0 w-full flex-col border-l bg-background md:w-(--guide-dock-width)'
        >
          <div className='flex items-start gap-3 border-b px-4 py-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
              <Sparkles aria-hidden='true' className='size-5' />
            </span>
            <div className='min-w-0 flex-1'>
              <h2 className='type-title'>{ADMIN_GUIDE_COPY.title}</h2>
              <p className='type-body -mt-0.5 text-muted-foreground'>
                {ADMIN_GUIDE_COPY.description}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-0.5'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    className='shrink-0'
                    aria-label={ADMIN_GUIDE_COPY.reset}
                    onClick={resetConversation}
                  >
                    <RotateCcw aria-hidden='true' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{ADMIN_GUIDE_COPY.reset}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    className='shrink-0'
                    aria-label={ADMIN_GUIDE_COPY.close}
                    onClick={() => dock.setEnabled(false)}
                  >
                    <PanelRightClose aria-hidden='true' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{ADMIN_GUIDE_COPY.close}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className='relative flex min-h-0 flex-1 flex-col'>
            <div
              ref={scrollRef}
              className='ishare-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4'
              role='log'
              aria-live='polite'
              aria-relevant='additions'
              aria-busy={busy}
            >
              <div ref={contentRef} className='flex flex-col gap-3'>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed',
                      message.artifact && 'max-w-full',
                      message.role === 'user' ?
                        'ml-auto bg-primary text-primary-foreground'
                      : 'mr-auto bg-muted text-foreground',
                    )}
                  >
                    <GuideMessageBody text={message.text} tone={message.role} />
                    {message.streaming ?
                      <span
                        aria-hidden='true'
                        className='ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-xs bg-current align-baseline motion-reduce:animate-none'
                      />
                    : null}
                    {message.artifact ?
                      <GuideMessageArtifact artifact={message.artifact} />
                    : null}
                  </div>
                ))}

                {thinking ?
                  <GuideThinkingIndicator />
                : null}

                {!busy && suggestions.length > 0 ?
                  <div className='mr-auto grid gap-1.5'>
                    <p className='type-meta'>{ADMIN_GUIDE_COPY.emptyHint}</p>
                    <div className='flex flex-wrap gap-1.5'>
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type='button'
                          variant='outline'
                          size='xs'
                          // `shrink-0` from the button base keeps long chips from
                          // wrapping — allow shrink and cap at the row width.
                          className='h-auto max-w-full min-w-0 shrink whitespace-normal py-1 text-left leading-snug font-normal text-muted-foreground hover:text-foreground'
                          onClick={() => ask(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                : null}
              </div>
            </div>
            <ThreadScrollToBottom scrollRef={scrollRef} />
          </div>

          <div className='bg-background p-4'>
            {/*
              Same field as the viewer Tour Guide composer (AiChatPanel
              ComposerField): one-line input, mic + send inside the field, no
              separator border above. Admin radius and button chrome, not the
              viewer's glass capsule.
            */}
            <form
              className='w-full'
              onSubmit={(event) => {
                event.preventDefault();
                ask(draft);
              }}
            >
              <label htmlFor={inputId} className='sr-only'>
                {ADMIN_GUIDE_COPY.placeholder}
              </label>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-lg border border-input bg-transparent py-1.5 pl-3 pr-1.5 transition-colors',
                  'hover:border-ring/40',
                  'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30',
                  'dark:bg-input/30',
                )}
              >
                <input
                  id={inputId}
                  type='text'
                  value={
                    speech.listening && speech.interim ? speech.interim : draft
                  }
                  readOnly={speech.listening}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key !== 'Enter' ||
                      event.nativeEvent.isComposing
                    ) {
                      return;
                    }
                    event.preventDefault();
                    ask(draft);
                  }}
                  placeholder={
                    speech.listening ?
                      ADMIN_GUIDE_COPY.listeningPlaceholder
                    : ADMIN_GUIDE_COPY.placeholder
                  }
                  className='h-8 min-w-0 flex-1 bg-transparent text-sm leading-8 text-foreground outline-none placeholder:text-muted-foreground/50 read-only:cursor-default'
                />
                {speech.supported ?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='shrink-0'
                        aria-label={voiceLabel}
                        aria-pressed={speech.listening}
                        onClick={speech.toggle}
                      >
                        {speech.listening ?
                          <Square aria-hidden='true' />
                        : <Mic aria-hidden='true' />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{voiceLabel}</TooltipContent>
                  </Tooltip>
                : null}
                {speech.error ?
                  <span className='sr-only' role='status'>
                    {speech.error}
                  </span>
                : null}
                <Tooltip>
                  <TooltipTrigger asChild>
                    {busy ?
                      <Button
                        type='button'
                        size='icon'
                        variant='secondary'
                        aria-label={ADMIN_GUIDE_COPY.stop}
                        className='shrink-0'
                        onClick={stop}
                      >
                        <Square aria-hidden='true' />
                      </Button>
                    : <Button
                        type='submit'
                        size='icon'
                        disabled={!draft.trim() || speech.listening}
                        aria-label={ADMIN_GUIDE_COPY.send}
                        className='shrink-0'
                      >
                        <ArrowUp aria-hidden='true' />
                      </Button>
                    }
                  </TooltipTrigger>
                  <TooltipContent>
                    {busy ? ADMIN_GUIDE_COPY.stop : ADMIN_GUIDE_COPY.send}
                  </TooltipContent>
                </Tooltip>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
