import {
  MODEL3D_LIGHT_INTENSITY_DEFAULT,
  MODEL3D_LIGHT_TONE_DEFAULT,
  clampModel3dLightIntensity,
  clampModel3dLightTone,
} from './model3dStudioLightLook';

export interface Model3dDebugLightsState {
  /** Key + fill only. */
  directional: boolean;
  /** Separated so rim can be A/B’d clearly. */
  rim: boolean;
  /** Soft blob disc (no shadow map). */
  contactShadow: boolean;
  /** Matte ground plane that receives shadow maps. */
  groundSurface: boolean;
  /** DirectionalLightHelper gizmos — where lights aim from. */
  lightHelpers: boolean;
  /** Multiplier on base key/fill/rim intensities (1 = default). */
  intensity: number;
  /** 0 = warm, 1 = cool. */
  tone: number;
}

export const DEFAULT_MODEL3D_DEBUG_LIGHTS: Model3dDebugLightsState = {
  directional: true,
  rim: true,
  contactShadow: true,
  groundSurface: true,
  lightHelpers: false,
  intensity: MODEL3D_LIGHT_INTENSITY_DEFAULT,
  tone: MODEL3D_LIGHT_TONE_DEFAULT,
};

let state: Model3dDebugLightsState = { ...DEFAULT_MODEL3D_DEBUG_LIGHTS };
const listeners = new Set<() => void>();

export function getModel3dDebugLights(): Model3dDebugLightsState {
  return state;
}

export function setModel3dDebugLights(
  patch: Partial<Model3dDebugLightsState>,
): void {
  const next = { ...state, ...patch };
  if (patch.intensity !== undefined) {
    next.intensity = clampModel3dLightIntensity(patch.intensity);
  }
  if (patch.tone !== undefined) {
    next.tone = clampModel3dLightTone(patch.tone);
  }
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeModel3dDebugLights(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
