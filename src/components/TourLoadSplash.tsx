import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '../lib/cn';
import { PLATFORM_PRODUCT_LOGO } from '../constants/branding';

/** White overlay fade — applied via `--tour-load-splash-fade-ms` on the splash root */
export const TOUR_LOAD_SPLASH_OVERLAY_FADE_MS = 3200;

export const TOUR_LOAD_SPLASH_FADE_MS = TOUR_LOAD_SPLASH_OVERLAY_FADE_MS + 120;

interface TourLoadSplashProps {
  exiting?: boolean;
  /** Begin overlay fade — synced to landing camera motion start. */
  fadeOverlay?: boolean;
  onExitComplete?: () => void;
  logo?: string;
  logoAlt?: string;
  productName?: string;
}

/** Centered client logo — first panorama load only. */
export function TourLoadSplash({
  exiting = false,
  fadeOverlay = false,
  onExitComplete,
  logo,
  logoAlt,
  productName,
}: TourLoadSplashProps) {
  const splashLogo = logo ?? PLATFORM_PRODUCT_LOGO;
  const splashAlt = logoAlt ?? productName ?? 'Virtual Tour';
  const [fadeOut, setFadeOut] = useState(false);
  const exitNotifiedRef = useRef(false);

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
        fadeOut && 'tour-load-splash--out',
      )}
      style={
        {
          '--tour-load-splash-fade-ms': `${TOUR_LOAD_SPLASH_OVERLAY_FADE_MS}ms`,
        } as CSSProperties
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
        className={cn(
          'tour-load-splash__logo block h-14 w-auto',
          fadeOut && 'tour-load-splash__logo--out',
        )}
        src={splashLogo}
        alt={splashAlt}
        draggable={false}
      />
    </div>
  );
}
