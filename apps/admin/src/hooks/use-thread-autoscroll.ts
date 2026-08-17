'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Chat thread follow-the-bottom tracking, ported from the viewer Tour Guide
 * (`AiChatPanel`): stay pinned while the reader is near the bottom, stop as soon
 * as they scroll up, and always follow a new user turn.
 */

/** Near-bottom window that still counts as "reading the latest". */
export const THREAD_NEAR_BOTTOM_PX = 96;

/**
 * Streaming grows a few dozen px; cards jump more. A large jump keeps tracking
 * but skips the pin so the reply text is not yanked away mid-read.
 */
const THREAD_CARD_GROWTH_PX = 88;

export function isNearThreadBottom(
  root: HTMLElement,
  thresholdPx = THREAD_NEAR_BOTTOM_PX,
) {
  return root.scrollHeight - root.scrollTop - root.clientHeight <= thresholdPx;
}

export function useThreadAutoscroll({
  outputKey,
  userTurnKey,
}: {
  /** Changes whenever the thread renders new output (message, pending, error). */
  outputKey: string;
  /** Identifies the newest user turn — a new one always re-pins. */
  userTurnKey: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Inner column: its height grows with streaming / cards even if the root's does not. */
  const contentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const lastScrollHeightRef = useRef(0);
  const lastOutputKeyRef = useRef('');

  const pinToBottom = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    programmaticScrollRef.current = true;
    root.scrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
    lastScrollHeightRef.current = root.scrollHeight;
    requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
    });
  }, []);

  /** Re-pin once layout settles; a big card jump defers to the scroll button. */
  const settleToBottom = useCallback(() => {
    if (!stickToBottomRef.current) return;
    const root = scrollRef.current;
    if (!root) return;

    const height = root.scrollHeight;
    const previous = lastScrollHeightRef.current;
    const growth = previous > 0 ? height - previous : 0;
    lastScrollHeightRef.current = height;
    if (growth >= THREAD_CARD_GROWTH_PX) return;

    pinToBottom();
    requestAnimationFrame(() => {
      if (!stickToBottomRef.current) return;
      pinToBottom();
    });
  }, [pinToBottom]);

  /** Always follow — used for a new user send. */
  const forceToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    pinToBottom();
    requestAnimationFrame(() => {
      if (!stickToBottomRef.current) return;
      pinToBottom();
    });
  }, [pinToBottom]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const onScroll = () => {
      if (isNearThreadBottom(root)) {
        stickToBottomRef.current = true;
        return;
      }
      // Mid programmatic pin the remaining px can look large — keep tracking.
      if (programmaticScrollRef.current) return;
      stickToBottomRef.current = false;
    };
    const onUserScrollIntent = () => {
      programmaticScrollRef.current = false;
      stickToBottomRef.current = isNearThreadBottom(root);
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
    const root = scrollRef.current;
    if (!root) return;
    if (outputKey === lastOutputKeyRef.current) return;

    const previousKey = lastOutputKeyRef.current;
    lastOutputKeyRef.current = outputKey;

    const isNewUserTurn =
      userTurnKey.length > 0 && !previousKey.startsWith(`${userTurnKey}|`);
    if (isNewUserTurn) {
      forceToBottom();
      return;
    }

    if (stickToBottomRef.current || isNearThreadBottom(root)) {
      stickToBottomRef.current = true;
      settleToBottom();
    }
  }, [forceToBottom, outputKey, settleToBottom, userTurnKey]);

  // Growth from streaming text, artifact cards, or a resized dock.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;

    lastScrollHeightRef.current = root.scrollHeight;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => settleToBottom());
    });
    observer.observe(root);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [settleToBottom]);

  return { scrollRef, contentRef, forceToBottom };
}
