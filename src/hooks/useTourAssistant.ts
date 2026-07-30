import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import type { ChatMessage, Tour } from '../types/tour';
import { askTourGuide, fetchAskGuideLiveStatus } from '../services/askGuide';
import {
  getLocationChangeNote,
  getNamingOpenNote,
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

export type GuideNavNoteKind = 'scene' | 'naming';

export type GuideNavNote = { kind: GuideNavNoteKind; namingName?: string };

type LastAutoNavNote =
  | { kind: 'scene'; sceneId: string }
  | { kind: 'naming'; hotspotId: string };

function isSameAutoNavNote(
  last: LastAutoNavNote | null,
  next: LastAutoNavNote,
): boolean {
  if (!last || last.kind !== next.kind) return false;
  if (next.kind === 'scene') {
    return last.kind === 'scene' && last.sceneId === next.sceneId;
  }
  return last.kind === 'naming' && last.hotspotId === next.hotspotId;
}

/** Place/NO context bubble — replaces the previous note of the same kind only. */
function navContextMessage(
  tour: Tour,
  sceneId: string,
  note: GuideNavNote | null | undefined,
): ChatMessage {
  const kind = note?.kind === 'naming' ? 'naming' : 'scene';
  const followUps = buildNavContextFollowUps({
    tour,
    sceneId,
    kind,
    namingName: note?.namingName,
  });
  const content =
    kind === 'naming' ?
      getNamingOpenNote(tour, sceneId, note?.namingName)
    : getLocationChangeNote(tour, sceneId);
  return {
    id: nextId(),
    role: 'assistant',
    source: kind === 'naming' ? 'nav-naming' : 'nav-scene',
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
};

export function useTourAssistant(
  tour: Tour,
  currentSceneId: string,
  liveContext?: TourAssistantLiveContext,
) {
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

  const locationTitle = getSceneTitle(tour, currentSceneId);
  const tourTitle = tour.title?.trim() || tour.id;
  const liveNamingHotspotId = liveContext?.namingHotspotId?.trim() || '';
  const liveNamingName = liveContext?.namingName?.trim() || undefined;

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
    if (!import.meta.env.DEV || !isOpen) return;
    void fetchAskGuideLiveStatus(true).then(setLiveMode);
  }, [isOpen]);

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
  }, [currentSceneId, isOpen, liveNamingHotspotId, liveNamingName, tour]);

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

  /** Skip the next automatic place-change note (e.g. navigating to open a NO). */
  const suppressNextLocationNote = useCallback(() => {
    suppressNextSceneNoteRef.current = true;
    pendingNavNoteRef.current = null;
  }, []);

  const applyGuideResult = useCallback(
    (result: Awaited<ReturnType<typeof askTourGuide>>) => {
      if (result.error) {
        setSendError(result.error);
        return;
      }
      setSendError(null);
      setLiveMode(result.live);
      if (!result.reply) return;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          content: result.reply,
          ...(result.guideLinks?.length ?
            { guideLinks: result.guideLinks }
          : {}),
          ...(result.guideCtas?.length ? { guideCtas: result.guideCtas } : {}),
          ...(result.followUps?.length ? { followUps: result.followUps } : {}),
        },
      ]);
    },
    [],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: trimmed,
      };
      const prior = messagesRef.current;
      setSendError(null);
      // Paint the user turn (and hide tip suggestions) before the request starts.
      flushSync(() => {
        setMessages((prev) => [...prev, userMsg]);
        setIsSending(true);
      });

      void askTourGuide(tour, currentSceneId, trimmed, prior)
        .then(applyGuideResult)
        .finally(() => {
          setIsSending(false);
        });
    },
    [applyGuideResult, currentSceneId, isSending, tour],
  );

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);
  const clearSendError = useCallback(() => setSendError(null), []);
  const resetChat = useCallback(() => {
    setMessages([]);
    setIsSending(false);
    setSendError(null);
    pendingNavNoteRef.current = null;
    suppressNextSceneNoteRef.current = false;
    lastAutoNavNoteRef.current = null;
    clearAskGuideSession(storageKeyRef.current);
  }, []);

  const openAndAskAboutScene = useCallback(
    (sceneId: string) => {
      const question = 'Tell me about this place';

      setIsOpen(true);
      if (isSending) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: question,
      };
      const prior = messagesRef.current;
      setSendError(null);
      flushSync(() => {
        setMessages((prev) => [...prev, userMsg]);
        setIsSending(true);
      });

      void askTourGuide(tour, sceneId, question, prior)
        .then(applyGuideResult)
        .finally(() => {
          setIsSending(false);
        });
    },
    [applyGuideResult, isSending, tour],
  );

  return {
    messages,
    isOpen,
    isSending,
    liveMode,
    sendError,
    toggle,
    close,
    resetChat,
    clearSendError,
    sendMessage,
    openAndAskAboutScene,
    prepareNavNote,
    noteNamingOpened,
    suppressNextLocationNote,
    locationTitle,
    tourTitle,
  };
}
