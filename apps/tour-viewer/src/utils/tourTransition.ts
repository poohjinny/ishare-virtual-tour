import type { Tour } from '../types/tour';

export type TourSceneTransitionEffect = 'fade' | 'black';

/** PSV VirtualTourPlugin — effect only; omit JSON speed until mapped to VT format. */
export function resolveTourSceneTransitionEffect(
  tour: Pick<Tour, 'defaultTransition'>,
): TourSceneTransitionEffect {
  return tour.defaultTransition?.effect === 'black' ? 'black' : 'fade';
}

/** @deprecated JSON speed (e.g. 500ms) is not passed to PSV yet — use resolveTourSceneTransitionEffect */
export function resolveTourSceneTransition(
  tour: Pick<Tour, 'defaultTransition'>,
): { effect: TourSceneTransitionEffect; speed: string } {
  return {
    effect: resolveTourSceneTransitionEffect(tour),
    speed: tour.defaultTransition?.speed?.trim() || '500ms',
  };
}

const DEFAULT_TRANSITION_DURATION_MS = 600;

/** 3D camera fly covers spatial distance — scale panorama timing up. */
const MODEL3D_TRANSITION_SPEED_FACTOR = 5;
const MODEL3D_TRANSITION_MAX_MS = 3200;
const MODEL3D_TRANSITION_FALLBACK_MAX_MS = 2600;

/** Parse tour `defaultTransition.speed` (e.g. `500ms`, `0.8s`) for camera/UI timing. */
export function parseTourTransitionDurationMs(
  tour: Pick<Tour, 'defaultTransition'>,
): number {
  const speed = tour.defaultTransition?.speed?.trim();
  if (!speed) return DEFAULT_TRANSITION_DURATION_MS;
  const match = speed.match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/i);
  if (!match) return DEFAULT_TRANSITION_DURATION_MS;
  const value = parseFloat(match[1]);
  return match[2]?.toLowerCase() === 's' ? value * 1000 : value;
}

/**
 * Upper bound for distance-scaled 3D scene-to-scene camera transitions.
 * Actual duration is computed from travel distance / orbit change (see cameraTransitionDuration.ts).
 */
export function parseModel3dSceneTransitionDurationMs(
  tour: Pick<Tour, 'defaultTransition'>,
): number {
  const base = parseTourTransitionDurationMs(tour);
  return Math.min(
    Math.max(
      Math.round(base * MODEL3D_TRANSITION_SPEED_FACTOR),
      MODEL3D_TRANSITION_FALLBACK_MAX_MS,
    ),
    MODEL3D_TRANSITION_MAX_MS,
  );
}
