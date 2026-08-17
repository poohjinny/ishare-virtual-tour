import { useCallback, useRef, useState } from 'react';

export function useTourState(initialSceneId: string) {
  const [currentSceneId, setCurrentSceneId] = useState(initialSceneId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [history, setHistory] = useState<string[]>([initialSceneId]);
  const skipHistoryRef = useRef(false);

  const onSceneChange = useCallback((sceneId: string) => {
    setCurrentSceneId(sceneId);
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    setHistory((prev) => {
      if (prev[prev.length - 1] === sceneId) return prev;
      const existingIndex = prev.indexOf(sceneId);
      if (existingIndex >= 0) {
        return prev.slice(0, existingIndex + 1);
      }
      return [...prev, sceneId];
    });
  }, []);

  const goBack = useCallback(() => {
    let previousSceneId: string | null = null;
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      previousSceneId = newHistory[newHistory.length - 1];
      return newHistory;
    });
    if (previousSceneId) {
      skipHistoryRef.current = true;
      setCurrentSceneId(previousSceneId);
    }
    return previousSceneId;
  }, []);

  const jumpToScene = useCallback((sceneId: string) => {
    setHistory((prev) => {
      const idx = prev.indexOf(sceneId);
      if (idx < 0) return prev;
      skipHistoryRef.current = true;
      setCurrentSceneId(sceneId);
      return prev.slice(0, idx + 1);
    });
  }, []);

  const jumpToRoot = useCallback((firstSceneId: string) => {
    skipHistoryRef.current = true;
    setCurrentSceneId(firstSceneId);
    setHistory([firstSceneId]);
  }, []);

  /** Browser back/forward or path deep link — avoids duplicating history. */
  const syncSceneFromRoute = useCallback((sceneId: string) => {
    skipHistoryRef.current = true;
    setCurrentSceneId(sceneId);
    setHistory((prev) => {
      const idx = prev.indexOf(sceneId);
      if (idx >= 0) {
        return prev.slice(0, idx + 1);
      }
      return [sceneId];
    });
  }, []);

  return {
    currentSceneId,
    isTransitioning,
    setIsTransitioning,
    onSceneChange,
    goBack,
    jumpToScene,
    jumpToRoot,
    syncSceneFromRoute,
    history,
  };
}
