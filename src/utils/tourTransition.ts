import type { Tour } from '../types/tour';

export type TourSceneTransitionEffect = 'fade' | 'black';

export interface TourSceneTransitionOptions {
  effect: TourSceneTransitionEffect;
  speed: string;
}

const DEFAULT_TRANSITION: TourSceneTransitionOptions = {
  effect: 'fade',
  speed: '500ms',
};

/** Scene-to-scene transition options for VirtualTourPlugin. */
export function resolveTourSceneTransition(
  tour: Pick<Tour, 'defaultTransition'>,
): TourSceneTransitionOptions {
  const effect = tour.defaultTransition?.effect;
  const speed = tour.defaultTransition?.speed?.trim();

  return {
    effect: effect === 'black' ? 'black' : 'fade',
    speed: speed || DEFAULT_TRANSITION.speed,
  };
}
