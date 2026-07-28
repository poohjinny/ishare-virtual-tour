import * as THREE from 'three';

/** World-space pivot fallback — geometric center of the loaded model. */
export function computeModelOrbitCenter(
  modelRoot: THREE.Object3D,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  return new THREE.Box3().setFromObject(modelRoot).getCenter(out);
}
