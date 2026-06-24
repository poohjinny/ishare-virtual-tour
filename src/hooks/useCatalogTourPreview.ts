import { useEffect, useState } from 'react';
import { getCatalogTourPreviewSource } from '../data/loadTour';
import { CATALOG_PREVIEW_WIDTH } from '../utils/equirectPreviewRender';
import {
  getCachedEquirectPreview,
  requestEquirectPreview,
} from '../utils/equirectPreviewQueue';

export function useCatalogTourPreview(tourId: string) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const hasPreviewSource = getCatalogTourPreviewSource(tourId) !== null;
  const loading = hasPreviewSource && src === null && !failed;

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    setSrc(null);
    setFailed(false);

    const source = getCatalogTourPreviewSource(tourId);
    if (!source) {
      setFailed(true);
      return;
    }

    if (source.thumbnail) {
      setSrc(source.thumbnail);
      return;
    }

    const cacheKey = `catalog:${tourId}`;
    const cached = getCachedEquirectPreview(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    void requestEquirectPreview({
      cacheKey,
      panoramaUrl: source.panorama,
      view: source.view,
      width: CATALOG_PREVIEW_WIDTH,
    })
      .then((objectUrl) => {
        if (cancelled) {
          if (!getCachedEquirectPreview(cacheKey)) {
            URL.revokeObjectURL(objectUrl);
          }
          return;
        }
        createdUrl = objectUrl;
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (createdUrl && !getCachedEquirectPreview(cacheKey)) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [tourId]);

  return { src, failed, loading };
}
