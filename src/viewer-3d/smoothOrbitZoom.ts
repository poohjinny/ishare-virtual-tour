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
/**
 * Slider ease-to-target rate (1/s). Higher = snappier than wheel friction coast,
 * without the ~1s lag / handle jump of the old impulse-to-target path.
 */
const SLIDER_ZOOM_SMOOTH_RATE = 16;

/** Impulse per toolbar +/- click — matches one wheel notch (`deltaY` ±120). */
export const ORBIT_ZOOM_BUTTON_DELTA_Y = 120;

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

/** 0 = zoomed out (maxDistance), 1 = zoomed in (minDistance) — matches PSV zoomRange. */
export function orbitDistanceToZoomLevel(
  distance: number,
  minDistance: number,
  maxDistance: number,
): number {
  if (!(maxDistance > minDistance)) return 0.5;
  return THREE.MathUtils.clamp(
    1 - (distance - minDistance) / (maxDistance - minDistance),
    0,
    1,
  );
}

export function zoomLevelToOrbitDistance(
  level: number,
  minDistance: number,
  maxDistance: number,
): number {
  const t = THREE.MathUtils.clamp(level, 0, 1);
  return minDistance + (1 - t) * (maxDistance - minDistance);
}

export function setOrbitDistance(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  distance: number,
): void {
  const offset = camera.position.clone().sub(controls.target);
  if (offset.lengthSq() < 1e-12) offset.set(0, 0, 1);
  offset.normalize().multiplyScalar(distance);
  camera.position.copy(controls.target).add(offset);
  // Damped controls.update() would ease away from this dolly — sync without coast.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;
}

function clampOrbitDistance(distance: number, controls: OrbitControls): number {
  return THREE.MathUtils.clamp(
    distance,
    controls.minDistance,
    controls.maxDistance,
  );
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
    clampOrbitDistance(nextDistance, controls),
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

export interface SmoothOrbitZoomHandle {
  tick: (
    dt: number,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
  ) => void;
  /** Toolbar +/- — same impulse + friction coast as wheel. */
  impulse: (deltaY: number) => void;
  /** Toolbar zoom-range — ease to absolute distance; handle owns UI mid-chase. */
  setDistance: (distance: number) => void;
  /** True while slider ease-to-target is running (skip toolbar overwrite). */
  isSliderChasing: () => boolean;
  /** Wheel coast or slider chase — pause pivot tighten while dollying. */
  isBusy: () => boolean;
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
    /** Fires when distance updates from wheel/coast (keeps toolbar in sync). */
    onDistanceChange?: (distance: number) => void;
  },
): SmoothOrbitZoomHandle {
  let zoomVelocity = 0;
  let settledDistance = readOrbitDistance(camera, controls);
  /** Absolute ease target from slider; null when idle / wheel-only. */
  let sliderTargetDistance: number | null = null;

  const commitDistance = (
    cam: THREE.PerspectiveCamera,
    ctrl: OrbitControls,
    distance: number,
    opts?: { syncToolbar?: boolean; settled?: boolean },
  ) => {
    setOrbitDistance(cam, ctrl, distance);
    if (opts?.syncToolbar !== false) {
      options?.onDistanceChange?.(distance);
    }
    if (opts?.settled) {
      settledDistance = distance;
      options?.onDistanceSettled?.();
    }
  };

  const clearSliderChase = () => {
    sliderTargetDistance = null;
  };

  const applyImpulse = (deltaY: number) => {
    if (deltaY === 0) return;

    clearSliderChase();

    if (prefersReducedMotion()) {
      applyOrbitWheelStep(camera, controls, deltaY);
      const distance = readOrbitDistance(camera, controls);
      commitDistance(camera, controls, distance, {
        syncToolbar: true,
        settled: true,
      });
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
    zoomVelocity = clampWheelZoomVelocity(zoomVelocity + impulse);
  };

  const onWheel = (event: WheelEvent) => {
    if (options?.shouldIgnoreWheel?.(event)) return;

    event.preventDefault();
    event.stopPropagation();

    applyImpulse(event.deltaY);
  };

  domElement.addEventListener('wheel', onWheel, { passive: false });

  return {
    tick(dt, cam, ctrl) {
      // Slider: exponential ease toward absolute target (handle already set in React).
      if (sliderTargetDistance !== null) {
        zoomVelocity = 0;
        const distance = readOrbitDistance(cam, ctrl);
        const target = clampOrbitDistance(sliderTargetDistance, ctrl);
        const alpha = 1 - Math.exp(-SLIDER_ZOOM_SMOOTH_RATE * dt);
        let nextDistance = distance + (target - distance) * alpha;

        if (Math.abs(nextDistance - target) <= WHEEL_ZOOM_SETTLE_EPS) {
          nextDistance = target;
          clearSliderChase();
          commitDistance(cam, ctrl, nextDistance, {
            // Keep scrubbed handle — don't remap from camera and jump the dot.
            syncToolbar: false,
            settled: true,
          });
          return;
        }

        commitDistance(cam, ctrl, nextDistance, { syncToolbar: false });
        return;
      }

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

      const nextDistance = clampOrbitDistance(
        distance * Math.exp(zoomVelocity * dt),
        ctrl,
      );

      const settled =
        Math.abs(zoomVelocity) < WHEEL_ZOOM_VELOCITY_EPS ||
        Math.abs(nextDistance - distance) <= WHEEL_ZOOM_SETTLE_EPS;

      commitDistance(cam, ctrl, nextDistance, { syncToolbar: true, settled });
      if (settled) zoomVelocity = 0;
    },
    impulse(deltaY) {
      applyImpulse(deltaY);
    },
    setDistance(distance) {
      const clamped = clampOrbitDistance(distance, controls);
      zoomVelocity = 0;

      if (prefersReducedMotion()) {
        clearSliderChase();
        commitDistance(camera, controls, clamped, {
          syncToolbar: false,
          settled: true,
        });
        return;
      }

      sliderTargetDistance = clamped;
    },
    isSliderChasing() {
      return sliderTargetDistance !== null;
    },
    isBusy() {
      return (
        sliderTargetDistance !== null ||
        Math.abs(zoomVelocity) >= WHEEL_ZOOM_VELOCITY_EPS
      );
    },
    resetTarget() {
      zoomVelocity = 0;
      clearSliderChase();
      settledDistance = readOrbitDistance(camera, controls);
    },
    dispose() {
      domElement.removeEventListener('wheel', onWheel);
    },
  };
}
