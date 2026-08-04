/**
 * Model3d navigation scaling — one contract for all tours / canvas sizes.
 *
 * Platforms (Sketchfab, Earth, CAD) normalize by **model scale + orbit distance**,
 * not canvas CSS pixels. Embed/layout size must not change world feel.
 *
 * | Input        | Rule |
 * |--------------|------|
 * | Rotate (LMB) | Angular — base Sketchfab speed. Soften only when very close (inspect). |
 * | Pan (RMB)    | Constant panSpeed. OrbitControls already scales by camera↔target dist. |
 * | Zoom (wheel) | Fractional dolly via smoothOrbitZoom + min/max from model radius. |
 * | Walk (WASD)  | ≈ constant × model radius (human pace). Not tied to orbit lever arm. |
 * | Pivot        | tightenOrbitPivotIfOversized when look-hit << arm (indoor + oversized). |
 *
 * Never multiply the same axis by distance twice (OC built-in + our multiplier).
 */

import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeUserOrbitMaxDistance } from './landingCamera';
import {
  SKETCHFAB_PAN_SPEED,
  SKETCHFAB_ROTATE_SPEED,
} from './sketchfabNavigation';

/** Walk speed ≈ this × model radius (units/s). */
const WALK_SPEED_RADIUS_FACTOR = 0.4;
/** Closest dolly — fraction of bounding-sphere radius. */
const MIN_DISTANCE_RADIUS_FACTOR = 0.02;
const MIN_DISTANCE_FLOOR = 0.08;
/**
 * Max comfortable orbit radius as a fraction of model radius. Beyond this, if
 * a surface sits much nearer than the pivot, pull the target forward so orbit
 * does not swing on a huge lever arm (Sketchfab-style).
 */
const MAX_ORBIT_RADIUS_FACTOR = 0.4;
/** Focus-move approach distance vs model radius. */
const FOCUS_APPROACH_RADIUS_FACTOR = 0.22;
const FOCUS_APPROACH_CURRENT_FACTOR = 0.55;

/** Walk: allow a little extra pace only in extreme overview (not close slowdown). */
const WALK_DISTANCE_MIN_T = 1;
const WALK_DISTANCE_MAX_T = 1.25;

const _lookDir = new THREE.Vector3();
const _sphere = new THREE.Sphere();

export interface ModelNavigationScale {
  /** Bounding-sphere radius of the loaded model. */
  radius: number;
  minDistance: number;
  maxDistance: number;
  /** Walk speed (units/s) — model-scale pace, not canvas-dependent. */
  baseWalkSpeed: number;
}

export function measureModelNavigationScale(
  modelRoot: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  _baseMaxDistance = 500,
): ModelNavigationScale {
  const bbox = new THREE.Box3().setFromObject(modelRoot);
  bbox.getBoundingSphere(_sphere);
  const radius = Math.max(_sphere.radius, 0.5);
  const minDistance = Math.max(
    MIN_DISTANCE_FLOOR,
    radius * MIN_DISTANCE_RADIUS_FACTOR,
  );
  const maxDistance = Math.max(
    computeUserOrbitMaxDistance(modelRoot, camera),
    minDistance * 8,
  );

  return {
    radius,
    minDistance,
    maxDistance,
    baseWalkSpeed: radius * WALK_SPEED_RADIUS_FACTOR,
  };
}

/**
 * WASD walk — model-scale pace. Orbit distance must not dominate (that made
 * post-pivot / close views feel sluggish vs overview). Mild boost only when
 * very far so large campuses stay traversable.
 */
export function resolveAdaptiveWalkSpeed(
  distance: number,
  scale: ModelNavigationScale,
): number {
  const mid = Math.max(scale.radius * 0.35, scale.minDistance * 4);
  const t = THREE.MathUtils.clamp(
    distance / mid,
    WALK_DISTANCE_MIN_T,
    WALK_DISTANCE_MAX_T,
  );
  return scale.baseWalkSpeed * t;
}

/**
 * Pan multiplier — constant. OrbitControls already scales pan by target
 * distance; boosting when far was optional, cutting when close made walk
 * views feel dead.
 */
export function resolveAdaptivePanSpeed(
  _distance: number,
  _scale: ModelNavigationScale,
): number {
  return SKETCHFAB_PAN_SPEED;
}

/**
 * Rotate — angular look-around. Soften only under a close-inspect threshold;
 * otherwise keep Sketchfab base (no distance boost when far).
 */
export function resolveAdaptiveRotateSpeed(
  distance: number,
  scale: ModelNavigationScale,
): number {
  const closeRef = Math.max(scale.radius * 0.15, scale.minDistance * 3);
  if (distance >= closeRef) return SKETCHFAB_ROTATE_SPEED;
  const t = THREE.MathUtils.clamp(distance / closeRef, 0.45, 1);
  return SKETCHFAB_ROTATE_SPEED * t;
}

export function resolveFocusApproachDistance(
  currentOrbitDistance: number,
  scale: ModelNavigationScale,
): number {
  const byScale = scale.radius * FOCUS_APPROACH_RADIUS_FACTOR;
  const byCurrent = currentOrbitDistance * FOCUS_APPROACH_CURRENT_FACTOR;
  return THREE.MathUtils.clamp(
    Math.min(byScale, byCurrent),
    scale.minDistance * 1.25,
    Math.min(scale.maxDistance, scale.radius * 0.6),
  );
}

const _focusToHitXZ = new THREE.Vector3();

/** Standing eye height above the clicked floor (multi-floor click-to-move). */
export const FOCUS_CLICK_EYE_HEIGHT = 1.6;

/**
 * Floor click-to-move pose: approach on XZ, stand at eye height above the
 * *clicked* floor (so 2F→1F descends), look level at the destination.
 * Planting the orbit target on the floor made the camera pitch down hard.
 */
export function resolveFocusClickMovePose(
  cameraPos: THREE.Vector3,
  floorHit: THREE.Vector3,
  currentOrbitDistance: number,
  scale: ModelNavigationScale,
  eyeHeightAboveFloor = FOCUS_CLICK_EYE_HEIGHT,
): { endCam: THREE.Vector3; endTarget: THREE.Vector3 } {
  const approachDist = resolveFocusApproachDistance(
    currentOrbitDistance,
    scale,
  );
  const eyeY = floorHit.y + eyeHeightAboveFloor;

  _focusToHitXZ.set(floorHit.x - cameraPos.x, 0, floorHit.z - cameraPos.z);
  const horizDist = _focusToHitXZ.length();

  let endCam: THREE.Vector3;
  if (horizDist < 1e-4) {
    endCam = new THREE.Vector3(cameraPos.x, eyeY, cameraPos.z);
  } else {
    _focusToHitXZ.multiplyScalar(1 / horizDist);
    const standOff = Math.min(
      approachDist,
      Math.max(horizDist * 0.45, scale.minDistance * 1.25),
    );
    endCam = new THREE.Vector3(
      floorHit.x - _focusToHitXZ.x * standOff,
      eyeY,
      floorHit.z - _focusToHitXZ.z * standOff,
    );
  }

  const endTarget = new THREE.Vector3(floorHit.x, eyeY, floorHit.z);
  return { endCam, endTarget };
}

export function maxComfortableOrbitRadius(scale: ModelNavigationScale): number {
  return Math.max(
    scale.minDistance * 8,
    scale.radius * MAX_ORBIT_RADIUS_FACTOR,
  );
}

/**
 * If the orbit pivot sits behind / beyond nearby geometry, slide the target
 * along the look ray toward the surface. View direction stays the same — only
 * the lever arm shrinks (walkthrough look-around after walking indoors).
 *
 * Does **not** require orbitDist > maxOrbit: indoors the arm is often “medium”
 * vs the whole model, but still much longer than the wall in front.
 */
export function tightenOrbitPivotIfOversized(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  scale: ModelNavigationScale,
  modelRoot: THREE.Object3D | null,
  raycaster: THREE.Raycaster,
): boolean {
  if (!modelRoot) return false;

  const orbitDist = camera.position.distanceTo(controls.target);
  const maxOrbit = maxComfortableOrbitRadius(scale);

  _lookDir.subVectors(controls.target, camera.position);
  if (_lookDir.lengthSq() < 1e-10) return false;
  _lookDir.normalize();

  raycaster.set(camera.position, _lookDir);
  const hit = raycaster.intersectObject(modelRoot, true)[0];
  if (!hit) return false;

  // Pivot already near the visible surface — leave alone.
  if (hit.distance >= orbitDist * 0.85) return false;
  // Nothing close in view — still an overview, don't yank the target in.
  if (hit.distance > maxOrbit * 1.35) return false;

  const focusDist = THREE.MathUtils.clamp(
    hit.distance * 0.9,
    scale.minDistance,
    Math.min(maxOrbit, orbitDist),
  );
  controls.target.copy(camera.position).addScaledVector(_lookDir, focusDist);
  return true;
}

/** Apply contract speeds (pan fixed; rotate softens only when very close). */
export function applyAdaptiveOrbitSpeeds(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  scale: ModelNavigationScale,
): void {
  const distance = camera.position.distanceTo(controls.target);
  controls.panSpeed = resolveAdaptivePanSpeed(distance, scale);
  controls.rotateSpeed = resolveAdaptiveRotateSpeed(distance, scale);
}
