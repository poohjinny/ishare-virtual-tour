import { useMemo } from 'react';
import { useFallbackImageSrc } from '../../hooks/useFallbackImageSrc';
import { appendCacheBust, withBaseUrl } from '../../utils/assetUrl';
import { clientBrandFaviconCandidates } from '../../utils/resolveTourBranding';

type DevBrandFaviconPreviewProps = {
  alt: string;
  cacheKey: number | string;
  catalogFavicon?: string | null;
  className: string;
  clientId: string;
};

/** Tries client favicon paths in order — catalog, .png, then .ico. */
export function DevBrandFaviconPreview({
  alt,
  cacheKey,
  catalogFavicon,
  className,
  clientId,
}: DevBrandFaviconPreviewProps) {
  const candidates = useMemo(
    () => clientBrandFaviconCandidates(clientId, catalogFavicon),
    [catalogFavicon, clientId],
  );
  const { src, onError } = useFallbackImageSrc(candidates);
  if (!src) return null;

  return (
    <img
      className={className}
      src={withBaseUrl(appendCacheBust(src, cacheKey))}
      alt={alt}
      onError={onError}
    />
  );
}
