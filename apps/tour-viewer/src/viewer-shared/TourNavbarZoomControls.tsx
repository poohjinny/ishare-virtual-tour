import { useEffect, useRef } from 'react';
import { IconTooltip } from '../components/ui/IconTooltip';
import { MaterialSymbol } from '../components/ui/MaterialSymbol';
import { tourNavbarMaterialSymbolProps } from './tourNavbarMaterialSymbol';

const NAVBAR_SYMBOL_PROPS = tourNavbarMaterialSymbolProps;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** PSV-matching zoom range — 0 left (out) … 1 right (in). */
export function TourNavbarZoomRangeButton({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (level: number) => void;
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromClientX = (clientX: number) => {
    const line = lineRef.current;
    if (!line) return;
    const rect = line.getBoundingClientRect();
    if (rect.width <= 0) return;
    onChangeRef.current(clamp01((clientX - rect.left) / rect.width));
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(event.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const level = clamp01(value);

  return (
    <IconTooltip label='Zoom' placement='top'>
      <button
        type='button'
        className='psv-button psv-zoom-range'
        disabled={disabled}
        aria-label='Zoom'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level * 100)}
        onPointerDown={(event) => {
          if (disabled) return;
          event.preventDefault();
          draggingRef.current = true;
          setFromClientX(event.clientX);
        }}
      >
        <div ref={lineRef} className='psv-zoom-range-line'>
          <div
            className='psv-zoom-range-handle'
            style={{ left: `${level * 100}%` }}
          />
        </div>
      </button>
    </IconTooltip>
  );
}

export interface TourNavbarZoomControlsProps {
  disabled?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** 0 = zoomed out, 1 = zoomed in (PSV zoomRange convention). */
  zoomLevel: number;
  onZoomLevelChange: (level: number) => void;
}

/**
 * Zoom cluster in PSV order: − → range → +.
 * Used by model3d toolbar; panorama uses the same ids via PSV navbar.
 */
export function TourNavbarZoomControls({
  disabled,
  onZoomIn,
  onZoomOut,
  zoomLevel,
  onZoomLevelChange,
}: TourNavbarZoomControlsProps) {
  return (
    <>
      <IconTooltip label='Zoom out' placement='top'>
        <button
          type='button'
          className='psv-button psv-zoom-out-button'
          disabled={disabled}
          aria-label='Zoom out'
          onClick={onZoomOut}
        >
          <MaterialSymbol name='remove' {...NAVBAR_SYMBOL_PROPS} />
        </button>
      </IconTooltip>

      <TourNavbarZoomRangeButton
        value={zoomLevel}
        disabled={disabled}
        onChange={onZoomLevelChange}
      />

      <IconTooltip label='Zoom in' placement='top'>
        <button
          type='button'
          className='psv-button psv-zoom-in-button'
          disabled={disabled}
          aria-label='Zoom in'
          onClick={onZoomIn}
        >
          <MaterialSymbol name='add' {...NAVBAR_SYMBOL_PROPS} />
        </button>
      </IconTooltip>
    </>
  );
}
