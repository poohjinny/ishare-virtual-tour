import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** OrbitControls default — kept in sync with three.js getZoomScale(). */
function orbitWheelZoomScale(zoomSpeed: number): number {
  return Math.pow(0.95, zoomSpeed);
}

/** Impulse per wheel deltaY — tuned for wider dolly steps per scroll notch. */
const WHEEL_ZOOM_VELOCITY_SCALE = 0.065;
/** Velocity decay (1/s) — higher = snappier stop. */
const WHEEL_ZOOM_FRICTION = 4.2;
const WHEEL_ZOOM_VELOCITY_EPS = 1e-4;
const WHEEL_ZOOM_SETTLE_EPS = 0.001;
const WHEEL_ZOOM_LIMIT_EPS = 1e-4;
const WHEEL_ZOOM_MAX_VELOCITY = 1.35;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function readOrbitDistance(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): number {
  return camera.position.distanceTo(controls.target);
}

function setOrbitDistance(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  distance: number,
): void {
  const offset = camera.position.clone().sub(controls.target);
  if (offset.lengthSq() < 1e-12) offset.set(0, 0, 1);
  offset.normalize().multiplyScalar(distance);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

export function applyOrbitWheelStep(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  deltaY: number,
): void {
  if (deltaY === 0) return;

  const scale = orbitWheelZoomScale(controls.zoomSpeed);
  const distance = readOrbitDistance(camera, controls);
  const nextDistance = deltaY < 0 ? distance / scale : distance * scale;

  setOrbitDistance(
    camera,
    controls,
    THREE.MathUtils.clamp(
      nextDistance,
      controls.minDistance,
      controls.maxDistance,
    ),
  );
}

function isAtOrbitDistanceLimit(
  distance: number,
  controls: OrbitControls,
  direction: 'in' | 'out',
): boolean {
  if (direction === 'out') {
    return distance >= controls.maxDistance - WHEEL_ZOOM_LIMIT_EPS;
  }
  return distance <= controls.minDistance + WHEEL_ZOOM_LIMIT_EPS;
}

function clampWheelZoomVelocity(velocity: number): number {
  return THREE.MathUtils.clamp(
    velocity,
    -WHEEL_ZOOM_MAX_VELOCITY,
    WHEEL_ZOOM_MAX_VELOCITY,
  );
}

function zeroWheelZoomVelocityTowardLimit(
  velocity: number,
  distance: number,
  controls: OrbitControls,
): number {
  if (velocity > 0 && isAtOrbitDistanceLimit(distance, controls, 'out')) {
    return 0;
  }
  if (velocity < 0 && isAtOrbitDistanceLimit(distance, controls, 'in')) {
    return 0;
  }
  return velocity;
}

/** Impulse per toolbar +/- click — matches one wheel notch (`deltaY` ±120). */
export const ORBIT_ZOOM_BUTTON_DELTA_Y = 120;

function applyZoomImpulse(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  deltaY: number,
  options:
    | {
        shouldIgnoreWheel?: (event: WheelEvent) => boolean;
        onDistanceSettled?: () => void;
      }
    | undefined,
  state: { zoomVelocity: number; settledDistance: number },
): void {
  if (deltaY === 0) return;

  if (prefersReducedMotion()) {
    applyOrbitWheelStep(camera, controls, deltaY);
    state.settledDistance = readOrbitDistance(camera, controls);
    options?.onDistanceSettled?.();
    return;
  }

  const distance = readOrbitDistance(camera, controls);
  let impulse = deltaY * WHEEL_ZOOM_VELOCITY_SCALE;
  if (impulse > 0 && isAtOrbitDistanceLimit(distance, controls, 'out')) {
    impulse = 0;
  }
  if (impulse < 0 && isAtOrbitDistanceLimit(distance, controls, 'in')) {
    impulse = 0;
  }
  state.zoomVelocity = clampWheelZoomVelocity(state.zoomVelocity + impulse);
}

export interface SmoothOrbitZoomHandle {
  tick: (
    dt: number,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
  ) => void;
  /** Toolbar +/- — same smooth dolly as wheel zoom. */
  impulse: (deltaY: number) => void;
  resetTarget: () => void;
  dispose: () => void;
}

export function attachSmoothOrbitZoom(
  domElement: HTMLElement,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  options?: {
    shouldIgnoreWheel?: (event: WheelEvent) => boolean;
    onDistanceSettled?: () => void;
  },
): SmoothOrbitZoomHandle {
  let zoomVelocity = 0;
  let settledDistance = readOrbitDistance(camera, controls);
  const state = {
    get zoomVelocity() {
      return zoomVelocity;
    },
    set zoomVelocity(value: number) {
      zoomVelocity = value;
    },
    get settledDistance() {
      return settledDistance;
    },
    set settledDistance(value: number) {
      settledDistance = value;
    },
  };

  const onWheel = (event: WheelEvent) => {
    if (options?.shouldIgnoreWheel?.(event)) return;

    event.preventDefault();
    event.stopPropagation();

    applyZoomImpulse(camera, controls, event.deltaY, options, state);
  };

  domElement.addEventListener('wheel', onWheel, { passive: false });

  return {
    tick(dt, cam, ctrl) {
      if (Math.abs(zoomVelocity) < WHEEL_ZOOM_VELOCITY_EPS) {
        zoomVelocity = 0;
        const distance = readOrbitDistance(cam, ctrl);
        if (Math.abs(distance - settledDistance) > WHEEL_ZOOM_SETTLE_EPS) {
          settledDistance = distance;
          options?.onDistanceSettled?.();
        }
        return;
      }

      const distance = readOrbitDistance(cam, ctrl);
      zoomVelocity = zeroWheelZoomVelocityTowardLimit(
        zoomVelocity,
        distance,
        ctrl,
      );
      zoomVelocity *= Math.exp(-WHEEL_ZOOM_FRICTION * dt);

      const factor = Math.exp(zoomVelocity * dt);
      setOrbitDistance(
        cam,
        ctrl,
        THREE.MathUtils.clamp(
          distance * factor,
          ctrl.minDistance,
          ctrl.maxDistance,
        ),
      );
    },
    impulse(deltaY: number) {
      applyZoomImpulse(camera, controls, deltaY, options, state);
    },
    resetTarget() {
      zoomVelocity = 0;
      settledDistance = readOrbitDistance(camera, controls);
    },
    dispose() {
      domElement.removeEventListener('wheel', onWheel);
    },
  };
}
