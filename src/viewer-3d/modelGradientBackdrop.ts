import * as THREE from 'three';
import { computeModelOrbitCenter } from './modelOrbitCenter';

/** Disc diameter vs model bounding-sphere radius. */
const BACKDROP_SIZE_FACTOR = 2;
/** Push the disc toward the far side of the bounding sphere (fraction of radius). */
const BACKDROP_BEHIND_OFFSET_FACTOR = 0.92;

const COLOR_INNER = new THREE.Color(0x262626);
const COLOR_OUTER = new THREE.Color(0x0a0a0a);
/** Radial falloff exponent — lower spreads darkening across a wider radius. */
const GRADIENT_FALLOFF = 1;

const _viewDir = new THREE.Vector3();

function createBackdropMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
    uniforms: {
      uInnerColor: { value: COLOR_INNER.clone() },
      uOuterColor: { value: COLOR_OUTER.clone() },
      uFalloff: { value: GRADIENT_FALLOFF },
    },
    vertexShader: /* glsl */ `
      varying vec2 vRadialUv;
      void main() {
        vRadialUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInnerColor;
      uniform vec3 uOuterColor;
      uniform float uFalloff;
      varying vec2 vRadialUv;

      float gradientDither(vec2 fragCoord) {
        return (fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.0008;
      }

      void main() {
        float t = length(vRadialUv);
        if (t > 1.0) {
          discard;
        }

        float blend = pow(t, uFalloff);
        vec3 color = mix(uInnerColor, uOuterColor, blend);
        color += gradientDither(gl_FragCoord.xy);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

export interface ModelGradientBackdrop {
  root: THREE.Object3D;
  updateFromModel: (modelRoot: THREE.Object3D) => void;
  updateCamera: (cameraPos: THREE.Vector3) => void;
  dispose: () => void;
}

/** Circular gradient disc on a plane — billboards behind the model. */
export function createModelGradientBackdrop(): ModelGradientBackdrop {
  const root = new THREE.Object3D();
  root.name = 'model-gradient-backdrop';

  const material = createBackdropMaterial();
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 128), material);
  mesh.name = 'model-gradient-backdrop-disc';
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  root.add(mesh);

  const center = new THREE.Vector3();
  let modelRadius = 1;

  const updateFromModel = (modelRoot: THREE.Object3D) => {
    center.copy(computeModelOrbitCenter(modelRoot));
    const sphere = new THREE.Sphere();
    new THREE.Box3().setFromObject(modelRoot).getBoundingSphere(sphere);
    modelRadius = Math.max(sphere.radius, 0.5);

    const discRadius = modelRadius * BACKDROP_SIZE_FACTOR;
    mesh.scale.set(discRadius, discRadius, 1);
  };

  const updateCamera = (cameraPos: THREE.Vector3) => {
    _viewDir.subVectors(center, cameraPos);
    const dist = _viewDir.length();
    if (dist > 1e-4) {
      root.position
        .copy(center)
        .addScaledVector(
          _viewDir.multiplyScalar(1 / dist),
          modelRadius * BACKDROP_BEHIND_OFFSET_FACTOR,
        );
    } else {
      root.position.copy(center);
    }
    root.lookAt(cameraPos);
  };

  return {
    root,
    updateFromModel,
    updateCamera,
    dispose() {
      root.removeFromParent();
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}

export const MODEL_GRADIENT_BACKDROP_OUTER_COLOR = COLOR_OUTER;
