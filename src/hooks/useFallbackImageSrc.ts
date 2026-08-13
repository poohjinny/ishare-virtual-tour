import { useCallback, useEffect, useMemo, useState } from 'react';

/** Try image URLs in order; `onError` advances to the next candidate. */
export function useFallbackImageSrc(
  candidates: ReadonlyArray<string | null | undefined>,
): { src: string | null; onError: () => void } {
  const key = candidates
    .map((candidate) => candidate?.trim() || '')
    .filter(Boolean)
    .join('\0');
  const paths = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const part of key.split('\0')) {
      if (!part || seen.has(part)) continue;
      seen.add(part);
      out.push(part);
    }
    return out;
  }, [key]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [key]);

  const onError = useCallback(() => {
    setIndex((current) => current + 1);
  }, []);

  return { src: paths[index] ?? null, onError };
}
