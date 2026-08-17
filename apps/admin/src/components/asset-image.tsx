'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { useForceImageSkeleton } from '@/lib/admin-debug';
import { cn } from '@/lib/utils';

/**
 * Viewer-hosted media (scene thumbs, brand logos). Baked files can be missing
 * locally, so a failed load falls back to the caller's placeholder instead of a
 * broken image. Plain <img>: assets come from the viewer origin, not Next.
 *
 * Lazy by default. Viewer `preview-hero-skeleton` overlays until decode — the
 * img stays in the tree so `loading="lazy"` still fires. Debug "Image
 * skeletons" hides the bitmap and holds the overlay so the fixture is visible.
 */
export function AssetImage({
  src,
  fallbackSrc,
  alt,
  className,
  fallback = null,
  loading = 'lazy',
}: {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: 'lazy' | 'eager';
}) {
  return (
    <AssetImageFrame
      key={src ?? ''}
      src={src}
      fallbackSrc={fallbackSrc}
      alt={alt}
      className={className}
      fallback={fallback}
      loading={loading}
    />
  );
}

function AssetImageFrame({
  src,
  fallbackSrc,
  alt,
  className,
  fallback,
  loading,
}: {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
  loading: 'lazy' | 'eager';
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const { enabled: forceSkeleton } = useForceImageSkeleton();
  const [activeSrc, setActiveSrc] = useState(src);
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const image = imgRef.current;
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, [activeSrc]);

  if (failed || !activeSrc) return <>{fallback}</>;

  const showSkeleton = forceSkeleton || !loaded;

  return (
    <span
      className={cn(
        'admin-media-slot',
        showSkeleton && 'is-loading',
        forceSkeleton && 'is-forced',
      )}
    >
      <span className='preview-hero-skeleton' aria-hidden='true' />
      {/* eslint-disable-next-line @next/next/no-img-element -- viewer-origin asset */}
      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        loading={loading}
        decoding='async'
        className={cn('admin-media-img size-full', className)}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (fallbackSrc && activeSrc !== fallbackSrc) {
            setActiveSrc(fallbackSrc);
            setLoaded(false);
            return;
          }
          setFailed(true);
        }}
      />
    </span>
  );
}
