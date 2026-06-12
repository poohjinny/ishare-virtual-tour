import { useEffect, useRef, useState } from 'react';
import {
  NavigationType,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom';

interface HistoryEntry {
  key: string;
  href: string;
}

function locationHref(pathname: string, search: string): string {
  return pathname + search;
}

/**
 * Tracks in-app history stack so back/forward buttons can be shown only when
 * navigation is possible (hidden entirely otherwise — no disabled state).
 */
export function useHistoryNavControls() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [showBack, setShowBack] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const stackRef = useRef<HistoryEntry[]>([]);
  const indexRef = useRef(0);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    const href = locationHref(location.pathname, location.search);
    const entry: HistoryEntry = { key: location.key, href };

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      stackRef.current = [entry];
      indexRef.current = 0;
      setShowBack(false);
      setShowForward(false);
      return;
    }

    if (navigationType === NavigationType.Push) {
      stackRef.current = stackRef.current.slice(0, indexRef.current + 1);
      stackRef.current.push(entry);
      indexRef.current = stackRef.current.length - 1;
    } else if (navigationType === NavigationType.Replace) {
      stackRef.current[indexRef.current] = entry;
    } else {
      const knownIndex = stackRef.current.findIndex(
        (item) => item.key === entry.key,
      );
      if (knownIndex >= 0) {
        indexRef.current = knownIndex;
      } else {
        stackRef.current = stackRef.current.slice(0, indexRef.current + 1);
        stackRef.current.push(entry);
        indexRef.current = stackRef.current.length - 1;
      }
    }

    setShowBack(indexRef.current > 0);
    setShowForward(indexRef.current < stackRef.current.length - 1);
  }, [location.key, location.pathname, location.search, navigationType]);

  const goBack = () => navigate(-1);
  const goForward = () => navigate(1);

  return { showBack, showForward, goBack, goForward };
}
