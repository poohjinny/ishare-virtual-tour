import { useLayoutEffect, useState } from 'react';
import type { Tour } from '../types/tour';
import {
  registerImmersiveBackgroundController,
  unregisterImmersiveBackgroundController,
} from '../utils/tourMediaCoordinator';
import {
  createImmersiveBackgroundController,
  type ImmersiveBackgroundController,
} from '../viewer/immersiveBackgroundController';

/** Tour-scoped immersive bed — survives PanoramaViewer remounts during scene navigation. */
export function useImmersiveBackground(
  tour: Tour,
): ImmersiveBackgroundController | null {
  const [controller, setController] =
    useState<ImmersiveBackgroundController | null>(null);

  useLayoutEffect(() => {
    const config = tour.immersiveBackground;
    if (!config) {
      setController(null);
      unregisterImmersiveBackgroundController();
      return;
    }

    const next = createImmersiveBackgroundController(config);
    registerImmersiveBackgroundController(next);
    setController(next);

    return () => {
      next.destroy();
      unregisterImmersiveBackgroundController();
      setController(null);
    };
  }, [tour.id]);

  return controller;
}
