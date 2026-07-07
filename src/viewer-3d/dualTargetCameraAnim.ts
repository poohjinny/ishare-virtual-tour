import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface DualTargetCameraAnim {
  startCamPos: THREE.Vector3;
  endCamPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  t0: number;
  durationMs: number;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function syncOrbitControls(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): void {
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = true;
}

/** Lerp orbit target + camera offset — shared by landing and scene transitions. */
export function tickDualTargetCameraAnim(
  anim: DualTargetCameraAnim,
  now: number,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): boolean {
  const elapsed = now - anim.t0;
  const raw = Math.min(elapsed / anim.durationMs, 1);
  const e = easeInOutCubic(raw);

  const target = new THREE.Vector3().lerpVectors(
    anim.startTarget,
    anim.endTarget,
    e,
  );
  const startRel = new THREE.Vector3().subVectors(
    anim.startCamPos,
    anim.startTarget,
  );
  const endRel = new THREE.Vector3().subVectors(anim.endCamPos, anim.endTarget);
  const rel = new THREE.Vector3().lerpVectors(startRel, endRel, e);

  camera.position.copy(target).add(rel);
  controls.target.copy(target);
  camera.lookAt(target);

  if (raw >= 1) {
    camera.position.copy(anim.endCamPos);
    controls.target.copy(anim.endTarget);
    camera.lookAt(anim.endTarget);
    syncOrbitControls(camera, controls);
    return true;
  }

  return false;
}
