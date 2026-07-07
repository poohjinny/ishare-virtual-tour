import * as THREE from 'three';
import { readOrbitFromPose } from './landingCamera';

export interface CameraTransitionDurationOptions {
  /** Fixed duration — skips distance scaling. */
  durationMs?: number;
  minMs?: number;
  maxMs?: number;
}

/** Same-scene hotspot / NO nav framing. */
export const HOTSPOT_CAMERA_TRANSITION_TIMING = {
  minMs: 450,
  maxMs: 1700,
} as const satisfies CameraTransitionDurationOptions;

/** Recenter / default-view return. */
export const RECENTER_CAMERA_TRANSITION_TIMING = {
  minMs: 500,
  maxMs: 2000,
} as const satisfies CameraTransitionDurationOptions;

/** Scene-to-scene hop floor — max comes from tour JSON. */
export const SCENE_CAMERA_TRANSITION_TIMING = {
  minMs: 600,
} as const satisfies CameraTransitionDurationOptions;

function yawDeltaDeg(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360) - 180);
}

/**
 * Distance- and angle-aware camera transition length.
 * Short hops finish quickly; long arcs / target travel use more time.
 */
export function resolveCameraTransitionDurationMs(
  startCamPos: THREE.Vector3,
  startTarget: THREE.Vector3,
  endCamPos: THREE.Vector3,
  endTarget: THREE.Vector3,
  options: CameraTransitionDurationOptions = {},
): number {
  if (options.durationMs !== undefined) return options.durationMs;

  const minMs = options.minMs ?? 550;
  const maxMs = options.maxMs ?? 2400;

  const startOrbit = readOrbitFromPose(startCamPos, startTarget);
  const endOrbit = readOrbitFromPose(endCamPos, endTarget);

  const yaw = yawDeltaDeg(startOrbit.yaw, endOrbit.yaw);
  const pitch = Math.abs(startOrbit.pitch - endOrbit.pitch);
  const zoomDelta = Math.abs(
    Math.log(
      Math.max(startOrbit.distance, 0.01) / Math.max(endOrbit.distance, 0.01),
    ),
  );
  const targetTravel = startTarget.distanceTo(endTarget);
  const camTravel = startCamPos.distanceTo(endCamPos);
  const spatialTravel = targetTravel + camTravel * 0.35;

  const spatialNorm = Math.min(1, spatialTravel / 12);
  const yawNorm = Math.min(1, yaw / 110);
  const pitchNorm = Math.min(1, pitch / 40);
  const zoomNorm = Math.min(1, zoomDelta / 1.4);

  const normalized = Math.min(
    1,
    spatialNorm * 0.4 +
      yawNorm * 0.3 +
      pitchNorm * 0.15 +
      zoomNorm * 0.15,
  );

  return Math.round(minMs + normalized * (maxMs - minMs));
}

export function resolveCameraViewTransitionDurationMs(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3 },
  endCamPos: THREE.Vector3,
  endTarget: THREE.Vector3,
  options: CameraTransitionDurationOptions = {},
): number {
  return resolveCameraTransitionDurationMs(
    camera.position,
    controls.target,
    endCamPos,
    endTarget,
    options,
  );
}
