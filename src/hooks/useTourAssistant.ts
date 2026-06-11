import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, TourKnowledge } from '../types/tour';
import {
  askMockAssistant,
  getLocationChangeNote,
  getSceneTitle,
  getSuggestedQuestions,
} from '../services/mockAssistant';

let messageId = 0;
function nextId(): string {
  messageId += 1;
  return `msg-${messageId}`;
}

export function useTourAssistant(
  knowledge: TourKnowledge,
  currentSceneId: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const prevSceneRef = useRef(currentSceneId);

  const suggestedQuestions = getSuggestedQuestions(knowledge, currentSceneId);
  const locationTitle = getSceneTitle(knowledge, currentSceneId);

  useEffect(() => {
    if (prevSceneRef.current !== currentSceneId) {
      prevSceneRef.current = currentSceneId;
      if (isOpen) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content: getLocationChangeNote(knowledge, currentSceneId),
          },
        ]);
      }
    }
  }, [currentSceneId, isOpen, knowledge]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: trimmed,
      };
      const answer = askMockAssistant(knowledge, currentSceneId, trimmed);
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: answer,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    },
    [knowledge, currentSceneId],
  );

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);
  const resetChat = useCallback(() => setMessages([]), []);

  return {
    messages,
    isOpen,
    toggle,
    close,
    resetChat,
    sendMessage,
    suggestedQuestions,
    locationTitle,
  };
}
