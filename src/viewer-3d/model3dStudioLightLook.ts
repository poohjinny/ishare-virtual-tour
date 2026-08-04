/**
 * Model3d studio light intensity / warm–cool tone.
 * Applied to key / fill / rim directionals (env map stays baked).
 */

import * as THREE from 'three';
import type { ModelStudioLights } from './modelGroundSurface';

export const MODEL3D_LIGHT_INTENSITY_MIN = 0.15;
export const MODEL3D_LIGHT_INTENSITY_MAX = 2.5;
export const MODEL3D_LIGHT_INTENSITY_DEFAULT = 1;

/** 0 = warm, 1 = cool (slider left → right). */
export const MODEL3D_LIGHT_TONE_MIN = 0;
export const MODEL3D_LIGHT_TONE_MAX = 1;
/** Default matches the cool daylight product look. */
export const MODEL3D_LIGHT_TONE_DEFAULT = 1;

/** Approximate CCT for tone=0 (warm tungsten). */
export const MODEL3D_LIGHT_TONE_KELVIN_WARM = 2700;
/** Approximate CCT for tone=1 (cool daylight) — default look. */
export const MODEL3D_LIGHT_TONE_KELVIN_COOL = 6500;

/** Base intensities at intensity multiplier = 1. */
const BASE_KEY_INTENSITY = 2.35;
const BASE_FILL_INTENSITY = 0.18;
const BASE_RIM_INTENSITY = 2.4;

/** Softened endpoints — less tungsten / ice than the full A/B extremes. */
const WARM_KEY = new THREE.Color(0xe8a868);
const WARM_FILL = new THREE.Color(0x4a4858);
const WARM_RIM = new THREE.Color(0xe0c090);

const COOL_KEY = new THREE.Color(0xe0e6f0);
const COOL_FILL = new THREE.Color(0x505868);
const COOL_RIM = new THREE.Color(0xc8d0dc);

export interface Model3dStudioLightLook {
  /** Multiplier on base key/fill/rim intensities. */
  intensity: number;
  /** 0 = warm, 1 = cool. */
  tone: number;
}

export function clampModel3dLightIntensity(value: number): number {
  return THREE.MathUtils.clamp(
    value,
    MODEL3D_LIGHT_INTENSITY_MIN,
    MODEL3D_LIGHT_INTENSITY_MAX,
  );
}

export function clampModel3dLightTone(value: number): number {
  return THREE.MathUtils.clamp(
    value,
    MODEL3D_LIGHT_TONE_MIN,
    MODEL3D_LIGHT_TONE_MAX,
  );
}

/** Map tone 0…1 → approximate CCT kelvin (rounded to 50K). */
export function model3dLightToneToKelvin(tone: number): number {
  const t = clampModel3dLightTone(tone);
  const kelvin = THREE.MathUtils.lerp(
    MODEL3D_LIGHT_TONE_KELVIN_WARM,
    MODEL3D_LIGHT_TONE_KELVIN_COOL,
    t,
  );
  return Math.round(kelvin / 50) * 50;
}

export function formatModel3dLightToneKelvin(tone: number): string {
  return `${model3dLightToneToKelvin(tone)}K`;
}

export function applyModel3dStudioLightLook(
  lights: ModelStudioLights,
  look: Model3dStudioLightLook,
): void {
  const intensity = clampModel3dLightIntensity(look.intensity);
  const tone = clampModel3dLightTone(look.tone);

  lights.key.color.lerpColors(WARM_KEY, COOL_KEY, tone);
  lights.fill.color.lerpColors(WARM_FILL, COOL_FILL, tone);
  lights.rim.color.lerpColors(WARM_RIM, COOL_RIM, tone);

  lights.key.intensity = BASE_KEY_INTENSITY * intensity;
  lights.fill.intensity = BASE_FILL_INTENSITY * intensity;
  lights.rim.intensity = BASE_RIM_INTENSITY * intensity;
}
