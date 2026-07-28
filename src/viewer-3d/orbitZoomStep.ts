import { ORBIT_ZOOM_BUTTON_DELTA_Y } from './smoothOrbitZoom';

/** Toolbar +/- zoom impulse direction — same sign convention as wheel `deltaY`. */
export function orbitZoomButtonDeltaY(direction: 'in' | 'out'): number {
  return direction === 'in' ?
      -ORBIT_ZOOM_BUTTON_DELTA_Y
    : ORBIT_ZOOM_BUTTON_DELTA_Y;
}
