import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import type { ChatMessage, Tour } from '../types/tour';
import { askTourGuide, fetchAskGuideLiveStatus } from '../services/askGuide';
import {
  getLocationChangeNote,
  getNamingOpenNote,
  getNavPreviewOpenNote,
  getSceneTitle,
} from '../services/mockAssistant';
import {
  askGuideSessionKey,
  clearAskGuideSession,
  maxAskGuideMessageSeq,
  readAskGuideSession,
  writeAskGuideSession,
} from '../utils/askGuideSession';
import { buildNavContextFollowUps } from '../utils/guideMessageExtras';

let messageId = 0;
function nextId(): string {
  messageId += 1;
  return `msg-${messageId}`;
}

function bumpMessageIdCounter(messages: ChatMessage[]): void {
  messageId = Math.max(messageId, maxAskGuideMessageSeq(messages));
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

export type GuideNavNoteKind = 'scene' | 'naming' | 'preview';

export type GuideNavNote = {
  kind: GuideNavNoteKind;
  namingName?: string;
  previewTitle?: string;
};

type LastAutoNavNote =
  | { kind: 'scene'; sceneId: string }
  | { kind: 'naming'; hotspotId: string }
  | { kind: 'preview'; hotspotId: string };

function isSameAutoNavNote(
  last: LastAutoNavNote | null,
  next: LastAutoNavNote,
): boolean {
  if (!last || last.kind !== next.kind) return false;
  if (next.kind === 'scene') {
    return last.kind === 'scene' && last.sceneId === next.sceneId;
  }
  if (next.kind === 'naming') {
    return last.kind === 'naming' && last.hotspotId === next.hotspotId;
  }
  return last.kind === 'preview' && last.hotspotId === next.hotspotId;
}

/** Place/NO/preview context bubble — replaces the previous note of the same kind only. */
function navContextMessage(
  tour: Tour,
  sceneId: string,
  note: GuideNavNote | null | undefined,
): ChatMessage {
  const kind =
    note?.kind === 'naming' ? 'naming'
    : note?.kind === 'preview' ? 'preview'
    : 'scene';
  const followUps = buildNavContextFollowUps({
    tour,
    sceneId,
    kind,
    namingName: note?.namingName,
    previewTitle: note?.previewTitle,
  });
  const content =
    kind === 'naming' ? getNamingOpenNote(tour, sceneId, note?.namingName)
    : kind === 'preview' ?
      getNavPreviewOpenNote(tour, sceneId, note?.previewTitle)
    : getLocationChangeNote(tour, sceneId);
  return {
    id: nextId(),
    role: 'assistant',
    source:
      kind === 'naming' ? 'nav-naming'
      : kind === 'preview' ? 'nav-preview'
      : 'nav-scene',
    content,
    ...(followUps.length ? { followUps } : {}),
  };
}

function upsertNavContextMessage(
  prev: ChatMessage[],
  next: ChatMessage,
): ChatMessage[] {
  const withoutOld = prev.filter((msg) => msg.source !== next.source);
  return [...withoutOld, next];
}

export type TourAssistantLiveContext = {
  /** Open naming pin, if any — used to sync Ask Guide when the panel reopens. */
  namingHotspotId?: string | null;
  namingName?: string | null;
  /** Open nav preview destination — sync Ask Guide when the panel reopens. */
  navPreviewHotspotId?: string | null;
  navPreviewTargetSceneId?: string | null;
  navPreviewTitle?: string | null;
};

export function useTourAssistant(
  tour: Tour,
  currentSceneId: string,
  liveContext?: TourAssistantLiveContext,
  options?: { guideMock?: boolean },
) {
  const guideMock = options?.guideMock === true;
  const storageKey = askGuideSessionKey(tour);
  const storageKeyRef = useRef(storageKey);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = readAskGuideSession(storageKey);
    bumpMessageIdCounter(saved.messages);
    return saved.messages;
  });
  const [isOpen, setIsOpen] = useState(
    () => readAskGuideSession(storageKey).isOpen,
  );
  const [isSending, setIsSending] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const prevSceneRef = useRef(currentSceneId);
  /**
   * Chat was closed (or stayed closed) while the visitor moved — next time it
   * opens, force-refresh place/NO context even if the last note key matches.
   */
  const pendingOpenSyncRef = useRef(true);
  /** Next scene sync should use this note (scene Visit). */
  const pendingNavNoteRef = useRef<GuideNavNote | null>(null);
  /** Naming open already posted / will post a note — skip the automatic place note. */
  const suppressNextSceneNoteRef = useRef(false);
  /** Last auto place/NO note — skip consecutive duplicates while the panel stays open. */
  const lastAutoNavNoteRef = useRef<LastAutoNavNote | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  /** Skip the first persist after hydrate / tour switch (already on disk). */
  const skipNextPersistRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const lastFailedUserTextRef = useRef<string | null>(null);

  const locationTitle = getSceneTitle(tour, currentSceneId);
  const tourTitle = tour.title?.trim() || tour.id;
  const liveNamingHotspotId = liveContext?.namingHotspotId?.trim() || '';
  const liveNamingName = liveContext?.namingName?.trim() || undefined;
  const liveNavPreviewHotspotId =
    liveContext?.navPreviewHotspotId?.trim() || '';
  const liveNavPreviewTargetSceneId =
    liveContext?.navPreviewTargetSceneId?.trim() || '';
  const liveNavPreviewTitle = liveContext?.navPreviewTitle?.trim() || undefined;

  // Tour switch — load that tour’s tab session (same-tab refresh uses lazy init).
  useLayoutEffect(() => {
    if (storageKeyRef.current === storageKey) return;
    storageKeyRef.current = storageKey;
    const saved = readAskGuideSession(storageKey);
    bumpMessageIdCounter(saved.messages);
    skipNextPersistRef.current = true;
    setMessages(saved.messages);
    setIsOpen(saved.isOpen);
    setIsSending(false);
    setSendError(null);
    setCanRetry(false);
    lastFailedUserTextRef.current = null;
    pendingNavNoteRef.current = null;
    suppressNextSceneNoteRef.current = false;
    lastAutoNavNoteRef.current = null;
    prevSceneRef.current = currentSceneId;
    pendingOpenSyncRef.current = true;
  }, [storageKey, currentSceneId]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    writeAskGuideSession(storageKey, { messages, isOpen });
  }, [storageKey, messages, isOpen]);

  useEffect(() => {
    // Debug `guideMock` wins over a stale live probe — badge / notice flip immediately.
    if (guideMock) {
      setLiveMode(false);
      return;
    }
    if (!isOpen) return;
    void fetchAskGuideLiveStatus(true).then(setLiveMode);
  }, [isOpen, guideMock]);

  /**
   * Keep Ask Guide place/NO context aligned with the live tour while the panel
   * is open. After a closed stretch, always rewrite context on the next open so
   * guidance + follow-ups match where the visitor is now (layout so the panel
   * does not flash the stale note).
   */
  useLayoutEffect(() => {
    if (!isOpen) {
      pendingOpenSyncRef.current = true;
      pendingNavNoteRef.current = null;
      return;
    }

    const force = pendingOpenSyncRef.current;
    if (force) {
      pendingOpenSyncRef.current = false;
      suppressNextSceneNoteRef.current = false;
      lastAutoNavNoteRef.current = null;
    }

    if (liveNamingHotspotId) {
      const key: LastAutoNavNote = {
        kind: 'naming',
        hotspotId: liveNamingHotspotId,
      };
      if (!force && isSameAutoNavNote(lastAutoNavNoteRef.current, key)) return;
      lastAutoNavNoteRef.current = key;
      prevSceneRef.current = currentSceneId;
      setMessages((prev) =>
        upsertNavContextMessage(
          prev,
          navContextMessage(tour, currentSceneId, {
            kind: 'naming',
            namingName: liveNamingName,
          }),
        ),
      );
      return;
    }

    if (liveNavPreviewHotspotId && liveNavPreviewTargetSceneId) {
      const key: LastAutoNavNote = {
        kind: 'preview',
        hotspotId: liveNavPreviewHotspotId,
      };
      if (!force && isSameAutoNavNote(lastAutoNavNoteRef.current, key)) return;
      lastAutoNavNoteRef.current = key;
      prevSceneRef.current = currentSceneId;
      setMessages((prev) =>
        upsertNavContextMessage(
          prev,
          navContextMessage(tour, liveNavPreviewTargetSceneId, {
            kind: 'preview',
            previewTitle: liveNavPreviewTitle,
          }),
        ),
      );
      return;
    }

    if (!force && suppressNextSceneNoteRef.current) {
      suppressNextSceneNoteRef.current = false;
      pendingNavNoteRef.current = null;
      prevSceneRef.current = currentSceneId;
      return;
    }

    const key: LastAutoNavNote = { kind: 'scene', sceneId: currentSceneId };
    if (!force && isSameAutoNavNote(lastAutoNavNoteRef.current, key)) return;

    const pending = pendingNavNoteRef.current;
    pendingNavNoteRef.current = null;
    lastAutoNavNoteRef.current = key;
    prevSceneRef.current = currentSceneId;
    setMessages((prev) => {
      const withoutNaming = prev.filter((msg) => msg.source !== 'nav-naming');
      return upsertNavContextMessage(
        withoutNaming,
        navContextMessage(tour, currentSceneId, pending ?? { kind: 'scene' }),
      );
    });
  }, [
    currentSceneId,
    isOpen,
    liveNamingHotspotId,
    liveNamingName,
    liveNavPreviewHotspotId,
    liveNavPreviewTargetSceneId,
    liveNavPreviewTitle,
    tour,
  ]);

  /** Next scene change uses this note kind (default: place visit). */
  const prepareNavNote = useCallback((note: GuideNavNote) => {
    pendingNavNoteRef.current = note;
  }, []);

  /**
   * Naming opportunity opened while Ask Guide is open — replace context message.
   * Skips when the same hotspot was the last auto note (chat / panorama / Explore).
   */
  const noteNamingOpened = useCallback(
    (sceneId: string, namingName?: string, hotspotId?: string) => {
      if (!isOpenRef.current) return;

      const namingKey = hotspotId?.trim();
      if (namingKey) {
        const key: LastAutoNavNote = { kind: 'naming', hotspotId: namingKey };
        if (isSameAutoNavNote(lastAutoNavNoteRef.current, key)) return;
        lastAutoNavNoteRef.current = key;
      }

      setMessages((prev) =>
        upsertNavContextMessage(
          prev,
          navContextMessage(tour, sceneId, { kind: 'naming', namingName }),
        ),
      );
    },
    [tour],
  );

  /**
   * Nav destination preview opened while Ask Guide is open — context for that place.
   */
  const noteNavPreviewOpened = useCallback(
    (targetSceneId: string, previewTitle?: string, hotspotId?: string) => {
      if (!isOpenRef.current) return;

      const previewKey = hotspotId?.trim();
      if (previewKey) {
        const key: LastAutoNavNote = { kind: 'preview', hotspotId: previewKey };
        if (isSameAutoNavNote(lastAutoNavNoteRef.current, key)) return;
        lastAutoNavNoteRef.current = key;
      }

      setMessages((prev) =>
        upsertNavContextMessage(
          prev,
          navContextMessage(tour, targetSceneId, {
            kind: 'preview',
            previewTitle,
          }),
        ),
      );
    },
    [tour],
  );

  /** Skip the next automatic place-change note (e.g. navigating to open a NO). */
  const suppressNextLocationNote = useCallback(() => {
    suppressNextSceneNoteRef.current = true;
    pendingNavNoteRef.current = null;
  }, []);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
  }, []);

  const runSend = useCallback(
    async (
      text: string,
      prior: ChatMessage[],
      sceneId: string,
      options?: { appendUser?: boolean },
    ) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const appendUser = options?.appendUser !== false;
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;
      const assistantId = nextId();
      lastFailedUserTextRef.current = null;
      setCanRetry(false);
      setSendError(null);

      flushSync(() => {
        if (appendUser) {
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'user', content: trimmed },
          ]);
        }
        setIsSending(true);
      });

      let sawDelta = false;

      try {
        const result = await askTourGuide(tour, sceneId, trimmed, prior, {
          signal: controller.signal,
          onDelta: (deltaText) => {
            sawDelta = true;
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === assistantId);
              if (!exists) {
                return [
                  ...prev,
                  { id: assistantId, role: 'assistant', content: deltaText },
                ];
              }
              return prev.map((msg) =>
                msg.id === assistantId ? { ...msg, content: deltaText } : msg,
              );
            });
          },
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          lastFailedUserTextRef.current = trimmed;
          setCanRetry(true);
          setSendError(result.error);
          if (sawDelta) {
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
          }
          return;
        }

        setSendError(null);
        setLiveMode(result.live);
        if (!result.reply) return;

        setMessages((prev) => {
          const nextMsg: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: result.reply,
            ...(result.guideLinks?.length ?
              { guideLinks: result.guideLinks }
            : {}),
            ...(result.guideCtas?.length ?
              { guideCtas: result.guideCtas }
            : {}),
            ...(result.followUps?.length ?
              { followUps: result.followUps }
            : {}),
          };
          const exists = prev.some((msg) => msg.id === assistantId);
          if (!exists) return [...prev, nextMsg];
          return prev.map((msg) => (msg.id === assistantId ? nextMsg : msg));
        });
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) {
          if (!sawDelta) {
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
          }
          return;
        }
        lastFailedUserTextRef.current = trimmed;
        setCanRetry(true);
        setSendError(
          error instanceof Error ? error.message : 'Ask Guide failed',
        );
        if (sawDelta) {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsSending(false);
      }
    },
    [isSending, tour],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;
      void runSend(trimmed, messagesRef.current, currentSceneId, {
        appendUser: true,
      });
    },
    [currentSceneId, isSending, runSend],
  );

  const retryLastSend = useCallback(() => {
    const text = lastFailedUserTextRef.current?.trim();
    if (!text || isSending) return;
    const msgs = messagesRef.current;
    const last = msgs.at(-1);
    const prior =
      last?.role === 'user' && last.content === text ? msgs.slice(0, -1) : msgs;
    void runSend(text, prior, currentSceneId, { appendUser: false });
  }, [currentSceneId, isSending, runSend]);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    stopGenerating();
    setIsOpen(false);
  }, [stopGenerating]);
  const clearSendError = useCallback(() => {
    setSendError(null);
    setCanRetry(false);
    lastFailedUserTextRef.current = null;
  }, []);
  const resetChat = useCallback(() => {
    stopGenerating();
    setMessages([]);
    setIsSending(false);
    setSendError(null);
    setCanRetry(false);
    lastFailedUserTextRef.current = null;
    pendingNavNoteRef.current = null;
    suppressNextSceneNoteRef.current = false;
    lastAutoNavNoteRef.current = null;
    clearAskGuideSession(storageKeyRef.current);
  }, [stopGenerating]);

  const openAndAskAboutScene = useCallback(
    (sceneId: string) => {
      const question = 'Tell me about this place';
      setIsOpen(true);
      if (isSending) return;
      void runSend(question, messagesRef.current, sceneId, {
        appendUser: true,
      });
    },
    [isSending, runSend],
  );

  const openAndAskAboutNaming = useCallback(
    (sceneId: string, namingName?: string) => {
      const name = namingName?.trim();
      const question =
        name ?
          `Tell me about ${name}`
        : 'Tell me about this naming opportunity';
      setIsOpen(true);
      if (isSending) return;
      void runSend(question, messagesRef.current, sceneId, {
        appendUser: true,
      });
    },
    [isSending, runSend],
  );

  const starterQuestions = useMemo(
    () =>
      buildNavContextFollowUps({
        tour,
        sceneId: liveNavPreviewTargetSceneId || currentSceneId,
        kind:
          liveNamingHotspotId ? 'naming'
          : liveNavPreviewHotspotId ? 'preview'
          : 'scene',
        namingName: liveNamingName,
        previewTitle: liveNavPreviewTitle,
      }),
    [
      currentSceneId,
      liveNamingHotspotId,
      liveNamingName,
      liveNavPreviewHotspotId,
      liveNavPreviewTargetSceneId,
      liveNavPreviewTitle,
      tour,
    ],
  );

  return {
    messages,
    isOpen,
    isSending,
    liveMode,
    sendError,
    canRetry,
    starterQuestions,
    toggle,
    open,
    close,
    resetChat,
    clearSendError,
    sendMessage,
    retryLastSend,
    stopGenerating,
    openAndAskAboutScene,
    openAndAskAboutNaming,
    prepareNavNote,
    noteNamingOpened,
    noteNavPreviewOpened,
    suppressNextLocationNote,
    locationTitle,
    tourTitle,
  };
}
