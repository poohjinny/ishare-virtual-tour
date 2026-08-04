import * as THREE from 'three';
import { computeModelOrbitCenter } from './modelOrbitCenter';

/** Shadow disc diameter vs model horizontal footprint. */
const SHADOW_SIZE_FACTOR = 1.95;
/**
 * Sit just above bbox floor so architectural floors don't bury the disc.
 * (Below-floor placement is invisible under the mesh.)
 */
const SHADOW_Y_BIAS = 0.04;
/** Peak opacity — strong contact blob on light and dark grounds. */
const SHADOW_ALPHA_CENTER = 1;

function createShadowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: { uAlphaCenter: { value: SHADOW_ALPHA_CENTER } },
    vertexShader: /* glsl */ `
      varying vec2 vRadialUv;
      void main() {
        vRadialUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uAlphaCenter;
      varying vec2 vRadialUv;

      float smootherstep01(float x) {
        float t = clamp(x, 0.0, 1.0);
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
      }

      void main() {
        float t = length(vRadialUv);
        if (t > 1.0) discard;
        // Wide dense core + soft rim — anchors the model on the studio ground.
        float falloff = 1.0 - smootherstep01(pow(t, 0.42));
        float alpha = uAlphaCenter * falloff;
        gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
}

export interface ModelContactShadow {
  root: THREE.Object3D;
  updateFromModel: (modelRoot: THREE.Object3D) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

/**
 * Soft disc on the model footprint — grounded look without shadow maps.
 * Placed slightly above bbox.min.y so it sits on floors instead of under them.
 */
export function createModelContactShadow(): ModelContactShadow {
  const root = new THREE.Object3D();
  root.name = 'model-contact-shadow';
  root.frustumCulled = false;

  const material = createShadowMaterial();
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), material);
  mesh.name = 'model-contact-shadow-disc';
  mesh.rotation.x = -Math.PI / 2;
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  mesh.raycast = () => {};
  root.add(mesh);

  return {
    root,
    updateFromModel(modelRoot) {
      const bbox = new THREE.Box3().setFromObject(modelRoot);
      if (bbox.isEmpty()) {
        root.visible = false;
        return;
      }

      const size = bbox.getSize(new THREE.Vector3());
      const center = computeModelOrbitCenter(modelRoot);
      const radius = Math.max(size.x, size.z, 0.5) * 0.5 * SHADOW_SIZE_FACTOR;

      mesh.scale.set(radius, radius, 1);
      // Above the floor slab — previously sat under the mesh and was occluded.
      root.position.set(center.x, bbox.min.y + SHADOW_Y_BIAS, center.z);
    },
    setVisible(visible) {
      root.visible = visible;
    },
    dispose() {
      root.removeFromParent();
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
