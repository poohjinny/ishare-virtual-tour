import * as THREE from 'three';

/**
 * PSV / tour JSON yaw+pitch (degrees) → unit look direction.
 * Matches {@link buildCameraBasis} in equirectPreviewRender (forward vector).
 */
export function directionFromYawPitch(
  yawDeg: number,
  pitchDeg: number,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const yaw = THREE.MathUtils.degToRad(yawDeg);
  const pitch = THREE.MathUtils.degToRad(pitchDeg);
  const cosP = Math.cos(pitch);
  return target.set(
    Math.sin(yaw) * cosP,
    Math.sin(pitch),
    Math.cos(yaw) * cosP,
  );
}

/** Place a point on a sphere of {@link radius} along the look direction. */
export function positionOnSphere(
  yawDeg: number,
  pitchDeg: number,
  radius: number,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  return directionFromYawPitch(yawDeg, pitchDeg, target).multiplyScalar(radius);
}
