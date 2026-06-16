import { useEffect, useState } from 'react';
import { getCatalogTourPreviewSource } from '../data/loadTour';
import { renderEquirectPreview } from '../utils/equirectPreviewRender';

const previewCache = new Map<string, string>();

export function useCatalogTourPreview(tourId: string) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

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

    const cached = previewCache.get(tourId);
    if (cached) {
      setSrc(cached);
      return;
    }

    void renderEquirectPreview(source.panorama, source.view)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        previewCache.set(tourId, objectUrl);
        createdUrl = objectUrl;
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (createdUrl && !previewCache.has(tourId)) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [tourId]);

  return { src, failed };
}
