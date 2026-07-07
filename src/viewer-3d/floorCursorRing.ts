import * as THREE from 'three';

export const FLOOR_CURSOR_RING_NAME = 'floor-cursor-ring';

/** Normalized ring radii — world size comes from camera-distance scaling below. */
const RING_INNER_RADIUS = 0.4;
const RING_OUTER_RADIUS = 0.68;
const RING_HALO_INNER_RADIUS = 0.68;
const RING_HALO_OUTER_RADIUS = 1;
const RING_INNER_OPACITY = 0.52;
const RING_HALO_OPACITY = 0.22;
/** Outer ring diameter as a fraction of viewport height at the hit distance. */
const RING_SCREEN_HEIGHT_FRACTION = 0.058;
/** Lift above the surface as a fraction of the ring's world scale. */
const SURFACE_LIFT_SCALE = 0.012;
/** Up-facing surfaces above this normal.y count as walkable floor. */
const FLOOR_NORMAL_MIN_Y = 0.45;

export interface FloorCursorRing {
  root: THREE.Group;
  hide: () => void;
  updateFromRaycast: (
    raycaster: THREE.Raycaster,
    pointer: THREE.Vector2,
    camera: THREE.Camera,
    walkTargets: THREE.Object3D[],
  ) => boolean;
  dispose: () => void;
}

function disableRaycast(object: THREE.Object3D): void {
  object.raycast = () => {};
}

function createRingMesh(
  inner: number,
  outer: number,
  opacity: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  disableRaycast(mesh);
  return mesh;
}

function computeRingWorldScale(
  camera: THREE.Camera,
  point: THREE.Vector3,
): number {
  const distance = Math.max(camera.position.distanceTo(point), 0.01);

  if (camera instanceof THREE.PerspectiveCamera) {
    const vFovRad = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFovRad / 2) * distance;
    return (visibleHeight * RING_SCREEN_HEIGHT_FRACTION) / 2;
  }

  return distance * 0.04;
}

export function createFloorCursorRing(scene: THREE.Scene): FloorCursorRing {
  const root = new THREE.Group();
  root.name = FLOOR_CURSOR_RING_NAME;
  root.visible = false;
  root.renderOrder = 10;
  disableRaycast(root);

  const innerRing = createRingMesh(
    RING_INNER_RADIUS,
    RING_OUTER_RADIUS,
    RING_INNER_OPACITY,
  );
  const haloRing = createRingMesh(
    RING_HALO_INNER_RADIUS,
    RING_HALO_OUTER_RADIUS,
    RING_HALO_OPACITY,
  );
  root.add(innerRing, haloRing);
  scene.add(root);

  const worldNormal = new THREE.Vector3();
  const ringUp = new THREE.Vector3(0, 0, 1);
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

  for (const mesh of [innerRing, haloRing]) {
    disposables.push(mesh.geometry, mesh.material);
  }

  return {
    root,
    hide() {
      root.visible = false;
    },
    updateFromRaycast(raycaster, pointer, camera, walkTargets) {
      if (walkTargets.length === 0) {
        root.visible = false;
        return false;
      }

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(walkTargets, true);

      for (const hit of hits) {
        if (!hit.face) continue;

        worldNormal.copy(hit.face.normal);
        const mesh = hit.object;
        if (mesh instanceof THREE.Mesh) {
          worldNormal.transformDirection(mesh.matrixWorld);
        }

        if (worldNormal.y < FLOOR_NORMAL_MIN_Y) continue;

        const scale = computeRingWorldScale(camera, hit.point);
        root.scale.setScalar(scale);
        root.position
          .copy(hit.point)
          .addScaledVector(worldNormal, scale * SURFACE_LIFT_SCALE);
        root.quaternion.setFromUnitVectors(ringUp, worldNormal);
        root.visible = true;
        return true;
      }

      root.visible = false;
      return false;
    },
    dispose() {
      for (const resource of disposables) {
        resource.dispose();
      }
      root.removeFromParent();
    },
  };
}

export function collectFloorRaycastTargets(
  modelRoot: THREE.Object3D | null,
): THREE.Object3D[] {
  return modelRoot ? [modelRoot] : [];
}

export function isFinePointerDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches
  );
}

/** UI layers that must not trigger canvas click-focus, floor ring, or drag cursors. */
export const VIEWER_OVERLAY_UI_SELECTOR =
  '.hotspot-3d-wrap, .hotspot-3d-anchored-panel, .hotspot-nav, .hotspot-info, .psv-navbar, .viewer-3d-controls';

export function isViewerOverlayUiTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(VIEWER_OVERLAY_UI_SELECTOR);
}

export function isPointerOverHotspotUi(
  clientX: number,
  clientY: number,
): boolean {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return false;
  return !!el.closest(VIEWER_OVERLAY_UI_SELECTOR);
}
