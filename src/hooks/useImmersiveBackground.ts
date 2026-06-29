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
  disabled = false,
): ImmersiveBackgroundController | null {
  const [controller, setController] =
    useState<ImmersiveBackgroundController | null>(null);

  useLayoutEffect(() => {
    const config = tour.immersiveBackground;

    if (disabled || !config) {
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
  }, [disabled, tour.id]);

  return controller;
}
