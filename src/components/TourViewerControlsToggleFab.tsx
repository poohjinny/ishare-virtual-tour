import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  TOUR_TOOLBAR_TOGGLE_COLLAPSE_LABEL,
  TOUR_TOOLBAR_TOGGLE_EXPAND_LABEL,
} from '../constants/tourToolbar';
import { cn } from '../lib/cn';

/** Gap between the toolbar pill’s right edge and the hide FAB (px). */
const HIDE_FAB_GAP_PX = 8;

export interface TourViewerControlsToggleFabProps {
  /** True when the viewer toolbar pill is hidden. */
  collapsed: boolean;
  onToggle: () => void;
}

function ControlsFabButton({
  label,
  icon,
  pressed,
  onToggle,
  className,
  style,
  active,
}: {
  label: string;
  icon: 'keyboard_arrow_up' | 'keyboard_arrow_down';
  pressed: boolean;
  onToggle: () => void;
  className: string;
  style?: CSSProperties;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        'tour-viewer-controls-toggle-fab',
        className,
        active && 'is-active',
      )}
      style={style}
    >
      <IconTooltip label={label} placement='top' disabled={!active}>
        <button
          type='button'
          className='tour-viewer-controls-toggle-fab__button'
          aria-label={label}
          aria-pressed={pressed}
          aria-hidden={!active}
          tabIndex={active ? 0 : -1}
          disabled={!active}
          onClick={onToggle}
        >
          <MaterialSymbol name={icon} sizePx={20} aria-hidden />
        </button>
      </IconTooltip>
    </span>
  );
}

/** Desktop show/hide for the bottom viewer toolbar — separate from the pill. */
export function TourViewerControlsToggleFab({
  collapsed,
  onToggle,
}: TourViewerControlsToggleFabProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [hideFabLeftPx, setHideFabLeftPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    const area = layer?.closest('.viewer-area');
    if (!(area instanceof HTMLElement)) return;

    const syncHideFabLeft = () => {
      const navbar = area.querySelector('.psv-navbar');
      if (!(navbar instanceof HTMLElement) || navbar.offsetWidth <= 0) return;
      // Navbar is centered (`left: 50%` + `translateX(-50%)`) — dock FAB to its
      // layout width so the gap stays tight regardless of pill content width.
      setHideFabLeftPx(
        area.clientWidth / 2 + navbar.offsetWidth / 2 + HIDE_FAB_GAP_PX,
      );
    };

    const resizeObserver = new ResizeObserver(syncHideFabLeft);
    resizeObserver.observe(area);

    const mutationObserver = new MutationObserver(() => {
      const navbar = area.querySelector('.psv-navbar');
      if (navbar instanceof HTMLElement) {
        resizeObserver.observe(navbar);
      }
      syncHideFabLeft();
    });
    mutationObserver.observe(area, { childList: true, subtree: true });

    const navbar = area.querySelector('.psv-navbar');
    if (navbar instanceof HTMLElement) {
      resizeObserver.observe(navbar);
    }
    syncHideFabLeft();

    // Skip exit/enter motion on first paint (default may already be collapsed).
    const motionFrame = requestAnimationFrame(() => {
      area.classList.add('tour-viewer-controls--motion-ready');
    });

    return () => {
      cancelAnimationFrame(motionFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      area.classList.remove('tour-viewer-controls--motion-ready');
    };
  }, []);

  return (
    <div ref={layerRef} className='tour-viewer-controls-toggle-layer'>
      <ControlsFabButton
        label={TOUR_TOOLBAR_TOGGLE_COLLAPSE_LABEL}
        icon='keyboard_arrow_down'
        pressed
        onToggle={onToggle}
        className='tour-viewer-controls-toggle-fab--hide'
        active={!collapsed}
        style={
          hideFabLeftPx === null ? undefined : { left: `${hideFabLeftPx}px` }
        }
      />
      <ControlsFabButton
        label={TOUR_TOOLBAR_TOGGLE_EXPAND_LABEL}
        icon='keyboard_arrow_up'
        pressed={false}
        onToggle={onToggle}
        className='tour-viewer-controls-toggle-fab--show'
        active={collapsed}
      />
    </div>
  );
}
