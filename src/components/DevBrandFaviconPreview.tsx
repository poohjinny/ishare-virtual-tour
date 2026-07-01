import { useEffect, useMemo, useState } from 'react';
import { appendCacheBust, withBaseUrl } from '../utils/assetUrl';
import { clientBrandFaviconCandidates } from '../utils/resolveTourBranding';

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
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const path = candidates[candidateIndex];
  if (!path) return null;

  return (
    <img
      className={className}
      src={withBaseUrl(appendCacheBust(path, cacheKey))}
      alt={alt}
      onError={() => {
        setCandidateIndex((index) => index + 1);
      }}
    />
  );
}
