import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface AppSearchParams {
  embed: boolean;
  /**
   * Client intro picker at `/` — `?intro=1|0`.
   * `null` = default routing (multi-tour shows intro; embed/single-tour skip).
   */
  intro: boolean | null;
  /** Dev panel — hotspot coords, landing JSON copy. */
  dev: boolean;
  chatTest: boolean;
  /** Force tour not-found (404) screen — `?notFoundTest=1`. */
  notFoundTest: boolean;
  /** Force panorama load-error overlay — `?panoramaErrorTest=1`. */
  panoramaErrorTest: boolean;
  /** Nav preview mini PSV hero — false when `navPreview=0` (debug). */
  navPreview: boolean;
  /** Skip landing zoom animation — start at scene `defaultView`. */
  skipLanding: boolean;
  /** Hold splash longer for loader UX testing. */
  splashHold: boolean;
  /** Force first-visit coach pill (dev QA — overrides embed/dev off). */
  firstVisitHint: boolean;
}

export function useAppSearchParams(): AppSearchParams {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const embed = searchParams.get('embed') === '1';
    return {
      embed,
      intro: parseTriStateFlag(searchParams.get('intro')),
      dev: searchParams.get('dev') === '1',
      chatTest: searchParams.get('chatTest') === '1',
      notFoundTest: searchParams.get('notFoundTest') === '1',
      panoramaErrorTest: searchParams.get('panoramaErrorTest') === '1',
      navPreview: searchParams.get('navPreview') !== '0',
      skipLanding: searchParams.get('skipLanding') === '1',
      splashHold: searchParams.get('splashHold') === '1',
      firstVisitHint: searchParams.get('firstVisitHint') === '1',
    };
  }, [searchParams]);
}

function parseTriStateFlag(raw: string | null): boolean | null {
  if (raw === '1') return true;
  if (raw === '0') return false;
  return null;
}
