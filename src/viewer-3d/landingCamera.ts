import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ViewPosition } from '../types/tour';
import { computeModelOrbitCenter } from './modelOrbitCenter';
import { easeInOutCubic } from './dualTargetCameraAnim';

export const LANDING_DURATION_MIN_MS = 2200;
export const LANDING_DURATION_MAX_MS = 4000;
/** Hero start — opposite side of defaultView yaw for a wide orbit arc. */
export const LANDING_START_YAW_OFFSET_DEG = 180;
/** Hero start pitch — slight downward overview (degrees). */
export const LANDING_START_PITCH_DEG = 30;
export const LANDING_BBOX_FIT_PADDING = 3;
export const LANDING_MAX_DISTANCE_HEADROOM = 1.2;

export interface LandingCameraPose {
  camPos: THREE.Vector3;
  target: THREE.Vector3;
}

export interface SphericalLandingAnim {
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  startYaw: number;
  startPitch: number;
  startDistance: number;
  endYaw: number;
  endPitch: number;
  endDistance: number;
  endCamPos: THREE.Vector3;
  t0: number;
  durationMs: number;
}

function yawDeltaDeg(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360) - 180);
}

function lerpYawShortestPath(from: number, to: number, t: number): number {
  const delta = ((to - from + 180) % 360) - 180;
  return from + delta * t;
}

export function cameraPositionFromOrbit(
  target: THREE.Vector3,
  yawDeg: number,
  pitchDeg: number,
  distance: number,
): THREE.Vector3 {
  const yawRad = THREE.MathUtils.degToRad(yawDeg);
  const pitchRad = THREE.MathUtils.degToRad(pitchDeg);
  const lookDir = new THREE.Vector3(
    Math.sin(yawRad) * Math.cos(pitchRad),
    Math.sin(pitchRad),
    Math.cos(yawRad) * Math.cos(pitchRad),
  ).normalize();
  return target.clone().addScaledVector(lookDir, -distance);
}

/** Orbit yaw/pitch/distance for a camera pose looking at target. */
export function readOrbitFromPose(
  camPos: THREE.Vector3,
  target: THREE.Vector3,
): { yaw: number; pitch: number; distance: number } {
  const lookDir = target.clone().sub(camPos).normalize();
  return {
    yaw: THREE.MathUtils.radToDeg(Math.atan2(lookDir.x, lookDir.z)),
    pitch: THREE.MathUtils.radToDeg(Math.asin(lookDir.y)),
    distance: camPos.distanceTo(target),
  };
}

/** Distance so the model bbox fits in the camera frustum. */
export function computeModelBBoxFitDistance(
  modelRoot: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  padding = LANDING_BBOX_FIT_PADDING,
): number {
  const bbox = new THREE.Box3().setFromObject(modelRoot);
  const size = bbox.getSize(new THREE.Vector3());
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const fitHeightDistance = size.y / 2 / Math.tan(fovRad / 2);
  const fitWidthDistance = size.x / 2 / (Math.tan(fovRad / 2) * camera.aspect);
  const fitDiagonalDistance = size.length() / 2 / Math.tan(fovRad / 2);
  return (
    Math.max(fitHeightDistance, fitWidthDistance, fitDiagonalDistance) * padding
  );
}

export function resolveHeroLandingDurationMs(
  startYaw: number,
  startPitch: number,
  startDistance: number,
  endYaw: number,
  endPitch: number,
  endDistance: number,
): number {
  const yaw = yawDeltaDeg(startYaw, endYaw);
  const pitch = Math.abs(startPitch - endPitch);
  const distRatio = Math.abs(
    Math.log(Math.max(startDistance, 0.01) / Math.max(endDistance, 0.01)),
  );
  const normalized = Math.min(
    1,
    (yaw / 180) * 0.5 + (pitch / 45) * 0.25 + (distRatio / 1.5) * 0.25,
  );
  return Math.round(
    LANDING_DURATION_MIN_MS +
      normalized * (LANDING_DURATION_MAX_MS - LANDING_DURATION_MIN_MS),
  );
}

/**
 * Bbox hero → defaultView as explicit yaw / pitch / distance orbit:
 * start on model center (fit distance, opposite yaw, overview pitch),
 * end at the authored defaultView pose.
 */
export function computeHeroLandingAnim(
  modelRoot: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  endPose: LandingCameraPose,
): SphericalLandingAnim {
  const startTarget = computeModelOrbitCenter(modelRoot);
  const fitDistance = computeModelBBoxFitDistance(modelRoot, camera);
  const endOrbit = readOrbitFromPose(endPose.camPos, endPose.target);
  const startYaw = endOrbit.yaw + LANDING_START_YAW_OFFSET_DEG;
  const startPitch = LANDING_START_PITCH_DEG;

  return {
    startTarget: startTarget.clone(),
    endTarget: endPose.target.clone(),
    startYaw,
    startPitch,
    startDistance: fitDistance,
    endYaw: endOrbit.yaw,
    endPitch: endOrbit.pitch,
    endDistance: endOrbit.distance,
    endCamPos: endPose.camPos.clone(),
    t0: 0,
    durationMs: resolveHeroLandingDurationMs(
      startYaw,
      startPitch,
      fitDistance,
      endOrbit.yaw,
      endOrbit.pitch,
      endOrbit.distance,
    ),
  };
}

export function applySphericalLandingPose(
  anim: SphericalLandingAnim,
  t: number,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): void {
  const target = new THREE.Vector3().lerpVectors(
    anim.startTarget,
    anim.endTarget,
    t,
  );
  const yaw = lerpYawShortestPath(anim.startYaw, anim.endYaw, t);
  const pitch = THREE.MathUtils.lerp(anim.startPitch, anim.endPitch, t);
  const distance = THREE.MathUtils.lerp(
    anim.startDistance,
    anim.endDistance,
    t,
  );
  const camPos = cameraPositionFromOrbit(target, yaw, pitch, distance);

  camera.position.copy(camPos);
  controls.target.copy(target);
  camera.lookAt(target);
}

function syncOrbitControls(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): void {
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = true;
}

/** Orbit yaw / pitch / distance + target lerp — true arc landing. */
export function tickSphericalLandingAnim(
  anim: SphericalLandingAnim,
  now: number,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): boolean {
  const elapsed = now - anim.t0;
  const raw = Math.min(elapsed / anim.durationMs, 1);
  const e = easeInOutCubic(raw);

  applySphericalLandingPose(anim, e, camera, controls);

  if (raw >= 1) {
    camera.position.copy(anim.endCamPos);
    controls.target.copy(anim.endTarget);
    camera.lookAt(anim.endTarget);
    syncOrbitControls(camera, controls);
    return true;
  }

  return false;
}

export function computeLandingOrbitMaxDistance(
  modelRoot: THREE.Object3D | null,
  camera: THREE.PerspectiveCamera,
  view?: ViewPosition,
  baseMax = 500,
): number {
  let maxDistance = baseMax;

  if (modelRoot) {
    const bbox = new THREE.Box3().setFromObject(modelRoot);
    maxDistance = Math.max(
      maxDistance,
      bbox.getSize(new THREE.Vector3()).length() * 2.5,
    );
    maxDistance = Math.max(
      maxDistance,
      computeModelBBoxFitDistance(modelRoot, camera) *
        LANDING_MAX_DISTANCE_HEADROOM,
    );
  }

  if (view?.zoom) {
    maxDistance = Math.max(
      maxDistance,
      view.zoom * LANDING_MAX_DISTANCE_HEADROOM,
    );
  }

  return maxDistance;
}

export function heroLandingStartPose(
  anim: SphericalLandingAnim,
): LandingCameraPose {
  return {
    camPos: cameraPositionFromOrbit(
      anim.startTarget,
      anim.startYaw,
      anim.startPitch,
      anim.startDistance,
    ),
    target: anim.startTarget.clone(),
  };
}
