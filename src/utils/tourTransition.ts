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
