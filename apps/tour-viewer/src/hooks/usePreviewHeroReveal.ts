import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Fade-in hero previews — handles browser-cached images where `onLoad` may not fire. */
export function usePreviewHeroReveal(src: string | null) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  const syncRevealed = useCallback(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setRevealed(true);
      return true;
    }
    return false;
  }, []);

  useLayoutEffect(() => {
    if (!src) {
      setRevealed(false);
      return;
    }

    if (syncRevealed()) return;

    setRevealed(false);

    let innerFrameId = 0;
    const frameId = window.requestAnimationFrame(() => {
      if (syncRevealed()) return;
      innerFrameId = window.requestAnimationFrame(syncRevealed);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(innerFrameId);
    };
  }, [src, syncRevealed]);

  const setImgRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (node && src && node.complete && node.naturalWidth > 0) {
        setRevealed(true);
      }
    },
    [src],
  );

  const onLoad = useCallback(() => {
    setRevealed(true);
  }, []);

  return { imgRef: setImgRef, revealed, onLoad };
}
