import { useCallback, useEffect, useState } from 'react';
import { tourNavIconButtonA11y } from '../constants/tourNavActions';
import {
  TOUR_NAV_ACTION_ENTER_VR,
  TOUR_NAV_ACTION_EXIT_VR,
} from '../constants/tourVr';
import { cn } from '../lib/cn';
import {
  isImmersiveVrSupported,
  shouldOfferEnterVr,
} from '../utils/webxrSupport';

type EnterVrButtonProps = {
  embed?: boolean;
  ready?: boolean;
  /** True while a WebXR session is presenting. */
  xrActive: boolean;
  disabled?: boolean;
  className?: string;
  onEnterVr: () => void | Promise<void>;
  onExitVr: () => void | Promise<void>;
};

/**
 * Flat-UI Enter / Exit VR control. Hidden when WebXR immersive-vr is
 * unavailable or the tour is embedded in an iframe.
 */
export function EnterVrButton({
  embed,
  ready = true,
  xrActive,
  disabled,
  className,
  onEnterVr,
  onExitVr,
}: EnterVrButtonProps) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shouldOfferEnterVr({ embed, ready })) {
      setSupported(false);
      return;
    }
    let cancelled = false;
    void isImmersiveVrSupported().then((ok) => {
      if (!cancelled) setSupported(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [embed, ready]);

  const handleClick = useCallback(async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      if (xrActive) await onExitVr();
      else await onEnterVr();
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, onEnterVr, onExitVr, xrActive]);

  if (!shouldOfferEnterVr({ embed, ready }) || !supported) {
    return null;
  }

  const label = xrActive ? TOUR_NAV_ACTION_EXIT_VR : TOUR_NAV_ACTION_ENTER_VR;

  return (
    <button
      type='button'
      className={cn(
        'tour-enter-vr-btn',
        xrActive && 'tour-enter-vr-btn--active',
        className,
      )}
      disabled={disabled || busy}
      data-ishare-tooltip={label}
      {...tourNavIconButtonA11y(label)}
      onClick={() => {
        void handleClick();
      }}
    >
      <span className='tour-enter-vr-btn__label' aria-hidden='true'>
        {xrActive ? 'Exit VR' : 'Enter VR'}
      </span>
    </button>
  );
}
