import * as THREE from 'three';

/** Keep env reflections present but not bleaching face color. */
const MODEL_ENV_MAP_INTENSITY = 0.65;

/**
 * Cap env intensity so studio HDRI doesn't wash materials to white.
 * Skips basic/unlit materials; only touches PBR-capable maps.
 */
export function enhanceModelLightingResponse(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    const materials =
      Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    for (const material of materials) {
      if (!material || !('isMaterial' in material)) continue;
      const mat = material as THREE.Material & {
        envMapIntensity?: number;
        needsUpdate?: boolean;
      };
      if (typeof mat.envMapIntensity === 'number') {
        mat.envMapIntensity = MODEL_ENV_MAP_INTENSITY;
        mat.needsUpdate = true;
      }
    }
  });
}

/** Enable shadow casting on model meshes (ground receives). */
export function enableModelShadowCasting(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}
