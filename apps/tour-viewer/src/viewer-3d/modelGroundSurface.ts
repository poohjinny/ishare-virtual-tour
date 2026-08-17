import * as THREE from 'three';
import { computeModelOrbitCenter } from './modelOrbitCenter';

/**
 * Disc diameter vs model horizontal footprint.
 * Large enough that typical exterior orbits read as a continuous floor,
 * not a small pad under the building.
 */
const GROUND_SIZE_FACTOR = 8;
/** Sit just under the model bbox floor. */
const GROUND_Y_BIAS = 0.01;
/** Solid core before the soft rim (local disc radius = 1). */
const GROUND_FADE_START = 0.78;
const GROUND_DISC_SEGMENTS = 96;

export interface ModelGroundSurface {
  root: THREE.Object3D;
  mesh: THREE.Mesh;
  updateFromModel: (modelRoot: THREE.Object3D) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

/**
 * Soft-edged matte disc under the model — receives shadow maps, fades into
 * the clear black so the ground doesn't read as a hard studio card.
 */
function createGroundMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: 0x0e1014,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.15,
    transparent: true,
    depthWrite: false,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        varying vec2 vGroundDiscXy;
        `,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        vGroundDiscXy = position.xy;
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        varying vec2 vGroundDiscXy;
        `,
      )
      .replace(
        '#include <alphamap_fragment>',
        /* glsl */ `
        #include <alphamap_fragment>
        float groundT = length(vGroundDiscXy);
        float groundEdge = 1.0 - smoothstep(${GROUND_FADE_START.toFixed(3)}, 1.0, groundT);
        groundEdge = groundEdge * groundEdge * (3.0 - 2.0 * groundEdge);
        diffuseColor.a *= groundEdge;
        `,
      );
  };
  material.customProgramCacheKey = () => 'model-ground-soft-disc-v1';

  return material;
}

export function createModelGroundSurface(): ModelGroundSurface {
  const root = new THREE.Object3D();
  root.name = 'model-ground-surface';
  root.frustumCulled = false;

  const material = createGroundMaterial();
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(1, GROUND_DISC_SEGMENTS),
    material,
  );
  mesh.name = 'model-ground-surface-disc';
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  root.add(mesh);

  return {
    root,
    mesh,
    updateFromModel(modelRoot) {
      const bbox = new THREE.Box3().setFromObject(modelRoot);
      if (bbox.isEmpty()) {
        root.visible = false;
        return;
      }

      const size = bbox.getSize(new THREE.Vector3());
      const center = computeModelOrbitCenter(modelRoot);
      const radius = (Math.max(size.x, size.z, 1) * GROUND_SIZE_FACTOR) / 2;

      mesh.scale.set(radius, radius, 1);
      root.position.set(center.x, bbox.min.y - GROUND_Y_BIAS, center.z);
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

/**
 * Fixed studio directions (world axes) — same angles every load / scene.
 * Only distance scales with model size so shadows stay framed.
 */
const KEY_LIGHT_DIR = new THREE.Vector3(0.55, 0.78, 0.3).normalize();
const FILL_LIGHT_DIR = new THREE.Vector3(-0.82, 0.22, -0.35).normalize();
const RIM_LIGHT_DIR = new THREE.Vector3(0.12, 0.32, -0.94).normalize();

const KEY_LIGHT_DISTANCE = 2.2;
const FILL_LIGHT_DISTANCE = 2.0;
const RIM_LIGHT_DISTANCE = 2.5;

export interface ModelStudioLights {
  key: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
}

function fitKeyShadowCamera(
  light: THREE.DirectionalLight,
  center: THREE.Vector3,
  radius: number,
): void {
  const cam = light.shadow.camera;
  const dist = light.position.distanceTo(center);
  cam.left = -radius;
  cam.right = radius;
  cam.top = radius;
  cam.bottom = -radius;
  cam.near = Math.max(0.5, dist - radius * 2.5);
  cam.far = dist + radius * 2.5;
  cam.updateProjectionMatrix();
}

/**
 * Place key / fill / rim on fixed compass bearings around the model.
 * Replaces the old “derive dir from current pose” fit that could drift.
 */
export function placeModelStudioLights(
  lights: ModelStudioLights,
  modelRoot: THREE.Object3D,
  padding = 1.35,
): void {
  const bbox = new THREE.Box3().setFromObject(modelRoot);
  if (bbox.isEmpty()) return;

  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.5 * padding, 1);

  const place = (
    light: THREE.DirectionalLight,
    dir: THREE.Vector3,
    distanceFactor: number,
  ) => {
    light.position.copy(center).addScaledVector(dir, radius * distanceFactor);
    light.target.position.copy(center);
    light.target.updateMatrixWorld();
  };

  place(lights.key, KEY_LIGHT_DIR, KEY_LIGHT_DISTANCE);
  place(lights.fill, FILL_LIGHT_DIR, FILL_LIGHT_DISTANCE);
  place(lights.rim, RIM_LIGHT_DIR, RIM_LIGHT_DISTANCE);
  fitKeyShadowCamera(lights.key, center, radius);
}
