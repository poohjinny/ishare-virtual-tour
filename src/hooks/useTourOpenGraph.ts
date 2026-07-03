import { useEffect } from 'react';

import {
  applyDocumentOpenGraph,
  type TourOpenGraphMeta,
} from '../utils/tourOpenGraph';

/** Sync document title + Open Graph / Twitter Card tags for share previews. */
export function useTourOpenGraph(meta: TourOpenGraphMeta | null): void {
  useEffect(() => {
    if (!meta) return;
    return applyDocumentOpenGraph(meta);
  }, [meta?.description, meta?.imageUrl, meta?.pageUrl, meta?.title]);
}
