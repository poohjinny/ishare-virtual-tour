import { useEffect, useState } from 'react';
import type { Scene, ViewPosition } from '../types/tour';
import { EXPLORE_PREVIEW_WIDTH } from '../utils/equirectPreviewRender';
import {
  getCachedEquirectPreview,
  requestEquirectPreview,
} from '../utils/equirectPreviewQueue';

export interface UseScenePreviewOptions {
  view?: ViewPosition;
  cacheKeySuffix?: string;
}

function usesBakedSceneThumbnail(
  scene: Pick<Scene, 'thumbnail'>,
  options?: UseScenePreviewOptions,
): boolean {
  return Boolean(scene.thumbnail) && !options?.cacheKeySuffix && !options?.view;
}

export function useScenePreview(
  tourId: string,
  scene: Pick<Scene, 'id' | 'panorama' | 'defaultView' | 'thumbnail'>,
  enabled = true,
  options?: UseScenePreviewOptions,
) {
  const bakedThumbnail = usesBakedSceneThumbnail(scene, options);
  const [src, setSrc] = useState<string | null>(
    enabled && bakedThumbnail ? (scene.thumbnail ?? null) : null,
  );
  const [failed, setFailed] = useState(false);
  const previewView = options?.view ?? scene.defaultView;
  const cacheKey = `${tourId}:${scene.id}${options?.cacheKeySuffix ? `:${options.cacheKeySuffix}` : ''}`;
  const loading =
    enabled && !bakedThumbnail && scene.panorama && src === null && !failed;

  useEffect(() => {
    if (!enabled) {
      setSrc(null);
      setFailed(false);
      return;
    }

    if (bakedThumbnail && scene.thumbnail) {
      setSrc(scene.thumbnail);
      setFailed(false);
      return;
    }

    if (!scene.panorama) {
      setSrc(null);
      setFailed(true);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    setSrc(null);
    setFailed(false);

    const cached = getCachedEquirectPreview(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    void requestEquirectPreview({
      cacheKey,
      panoramaUrl: scene.panorama,
      view: previewView,
      width: EXPLORE_PREVIEW_WIDTH,
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
  }, [
    bakedThumbnail,
    cacheKey,
    enabled,
    previewView,
    scene.panorama,
    scene.thumbnail,
  ]);

  return { src, failed, loading };
}
