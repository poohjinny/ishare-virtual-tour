import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '../lib/cn';
import { PLATFORM_PRODUCT_LOGO } from '../constants/branding';

/** White overlay fade — applied via `--tour-load-splash-fade-ms` on the splash root */
export const TOUR_LOAD_SPLASH_OVERLAY_FADE_MS = 4200;

/** Shorter curtain for iframe embed — parent page already provides context. */
export const TOUR_LOAD_SPLASH_EMBED_OVERLAY_FADE_MS = 1600;

export const TOUR_LOAD_SPLASH_FADE_MS = TOUR_LOAD_SPLASH_OVERLAY_FADE_MS + 120;

export const TOUR_LOAD_SPLASH_EMBED_FADE_MS =
  TOUR_LOAD_SPLASH_EMBED_OVERLAY_FADE_MS + 120;

export function getTourLoadSplashFadeMs(embed = false): number {
  return embed ? TOUR_LOAD_SPLASH_EMBED_FADE_MS : TOUR_LOAD_SPLASH_FADE_MS;
}

interface TourLoadSplashProps {
  exiting?: boolean;
  /** Begin overlay fade — synced to landing camera motion start. */
  fadeOverlay?: boolean;
  /** `?embed=1` — faster logo + curtain timing. */
  embed?: boolean;
  onExitComplete?: () => void;
  logo?: string;
  logoAlt?: string;
  productName?: string;
}

/** Centered client logo — first panorama load only. */
export function TourLoadSplash({
  exiting = false,
  fadeOverlay = false,
  embed = false,
  onExitComplete,
  logo,
  logoAlt,
  productName,
}: TourLoadSplashProps) {
  const overlayFadeMs =
    embed ?
      TOUR_LOAD_SPLASH_EMBED_OVERLAY_FADE_MS
    : TOUR_LOAD_SPLASH_OVERLAY_FADE_MS;
  const splashLogo = logo ?? PLATFORM_PRODUCT_LOGO;
  const splashAlt = logoAlt ?? productName ?? 'Virtual Tour';
  const [fadeOut, setFadeOut] = useState(false);
  const [logoIn, setLogoIn] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);
  const exitNotifiedRef = useRef(false);

  useEffect(() => {
    setLogoIn(false);
    const img = logoRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      const frame = requestAnimationFrame(() => setLogoIn(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [splashLogo]);

  useEffect(() => {
    if (!exiting) {
      setFadeOut(false);
      exitNotifiedRef.current = false;
      return;
    }

    if (!fadeOverlay) return;

    const frame = requestAnimationFrame(() => setFadeOut(true));
    return () => cancelAnimationFrame(frame);
  }, [exiting, fadeOverlay]);

  const notifyExitComplete = () => {
    if (exitNotifiedRef.current) return;
    exitNotifiedRef.current = true;
    onExitComplete?.();
  };

  return (
    <div
      className={cn(
        'tour-load-splash pointer-events-none absolute inset-0 z-[105] flex items-center justify-center bg-white',
        embed && 'tour-load-splash--embed',
        fadeOut && 'tour-load-splash--out',
      )}
      style={
        { '--tour-load-splash-fade-ms': `${overlayFadeMs}ms` } as CSSProperties
      }
      role='status'
      aria-live='polite'
      aria-label={`Loading ${productName ?? 'virtual tour'}`}
      aria-hidden={fadeOut ? true : undefined}
      onAnimationEnd={(event) => {
        if (
          event.target !== event.currentTarget ||
          event.animationName !== 'tour-load-splash-curtain'
        ) {
          return;
        }
        notifyExitComplete();
      }}
    >
      <img
        ref={logoRef}
        className={cn(
          'tour-load-splash__logo',
          logoIn && 'tour-load-splash__logo--in',
          fadeOut && 'tour-load-splash__logo--out',
        )}
        src={splashLogo}
        alt={splashAlt}
        draggable={false}
        onLoad={() => setLogoIn(true)}
        onError={() => setLogoIn(true)}
      />
    </div>
  );
}
