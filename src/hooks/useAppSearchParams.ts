import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isLoadErrorTestEnabled } from '../utils/loadErrorTestParam';
export interface AppSearchParams {
  embed: boolean;
  /**
   * Client intro picker at `/` — `?intro=1|0`.
   * `null` = default routing (multi-tour shows intro; embed/single-tour skip).
   */
  intro: boolean | null;
  /** Dev panel — hotspot coords, landing JSON copy. */
  dev: boolean;
  /**
   * Ask Guide frozen UI fixtures (scroll + thinking).
   * URL: `guideUiTest=1` (legacy alias: `chatTest=1`).
   */
  guideUiTest: boolean;
  /** Force tour not-found (404) screen — `?notFoundTest=1`. */
  notFoundTest: boolean;
  /** Force viewer load-error overlay — `?loadErrorTest=1` (legacy: `panoramaErrorTest`). */
  loadErrorTest: boolean;
  /** Disable nav preview mini PSV hero — `?disableNavPreview=1` (debug). */
  disableNavPreview: boolean;
  /** Skip landing zoom animation — start at scene `defaultView`. */
  skipLanding: boolean;
  /** Hold splash longer for loader UX testing. */
  splashHold: boolean;
  /** Force first-visit coach pill (dev QA — overrides embed/dev off). */
  firstVisitHint: boolean;
  /** Force Ask Guide FAB + panel (dev QA — overrides product default off). */
  askGuide: boolean;
  /**
   * Force scripted Ask Guide replies (no OpenAI).
   * URL: `guideMock=1` (legacy alias: `askGuideMock=1`).
   */
  guideMock: boolean;
}

export function useAppSearchParams(): AppSearchParams {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const embed = searchParams.get('embed') === '1';
    return {
      embed,
      intro: parseTriStateFlag(searchParams.get('intro')),
      dev: searchParams.get('dev') === '1',
      guideUiTest:
        searchParams.get('guideUiTest') === '1' ||
        searchParams.get('chatTest') === '1',
      notFoundTest: searchParams.get('notFoundTest') === '1',
      loadErrorTest: isLoadErrorTestEnabled(searchParams),
      disableNavPreview: searchParams.get('disableNavPreview') === '1',
      skipLanding: searchParams.get('skipLanding') === '1',
      splashHold: searchParams.get('splashHold') === '1',
      firstVisitHint: searchParams.get('firstVisitHint') === '1',
      askGuide: searchParams.get('askGuide') === '1',
      guideMock:
        searchParams.get('guideMock') === '1' ||
        searchParams.get('askGuideMock') === '1',
    };
  }, [searchParams]);
}

function parseTriStateFlag(raw: string | null): boolean | null {
  if (raw === '1') return true;
  if (raw === '0') return false;
  return null;
}
