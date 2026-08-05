import * as THREE from 'three';
import type { Hotspot, Scene, Tour } from '../types/tour';
import { resolveSceneNavHotspots } from '../utils/resolveSceneHotspots';
import { VIEWER_MARKER_AUDIENCE } from '../utils/sceneVisibility';
import { positionOnSphere } from './sphericalDirection';
import { enterImmersiveVr, exitImmersiveVr } from './webxrSession';

const SPHERE_RADIUS = 500;
const HOTSPOT_DISTANCE = 40;
const HOTSPOT_SIZE = 1.15;
/** Thumbstick look — rad/sec at full deflection (xr-standard right stick). */
const STICK_LOOK_SPEED = 1.85;
const STICK_DEADZONE = 0.12;
const KEY_LOOK_SPEED = 1.35;
/** Clamp content pitch so the view cannot flip. */
const MAX_CONTENT_PITCH = THREE.MathUtils.degToRad(80);

export type PanoramaXrNavHit = {
  hotspotId: string;
  targetSceneId: string;
  label: string;
};

export type PanoramaXrSessionOptions = {
  /** Parent for the WebGL canvas — must stay laid out (not display:none). */
  container: HTMLElement;
  tour: Tour;
  sceneId: string;
  onNavigate: (targetSceneId: string, hotspotId: string) => void;
  onSessionEnd: () => void;
  onError?: (error: unknown) => void;
};

type HotspotUserData = {
  kind: 'nav';
  hotspotId: string;
  targetSceneId: string;
  label: string;
};

/**
 * Seated panorama WebXR session — equirect sphere + raycastable nav orbs.
 *
 * Look: headset pose + right-stick look (X yaw, Y pitch) per common XR/FPS
 * mapping; left stick ignored for look. Keyboard Q/E·←/→ yaw, W/S·↑/↓ pitch
 * for Immersive Web Emulator when sticks are idle.
 */
export class PanoramaXrSession {
  private readonly container: HTMLElement;
  private readonly onNavigate: PanoramaXrSessionOptions['onNavigate'];
  private readonly onSessionEnd: () => void;
  private readonly onError?: (error: unknown) => void;

  private tour: Tour;
  private sceneId: string;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private contentRoot: THREE.Group | null = null;
  private sphereMesh: THREE.Mesh | null = null;
  private hotspotGroup: THREE.Group | null = null;
  private texture: THREE.Texture | null = null;
  private xrSession: XRSession | null = null;
  private disposed = false;
  private lastFrameMs = 0;

  private readonly raycaster = new THREE.Raycaster();
  private readonly tempMatrix = new THREE.Matrix4();
  private readonly controllers: THREE.XRTargetRaySpace[] = [];
  private readonly keysDown = new Set<string>();

  constructor(options: PanoramaXrSessionOptions) {
    this.container = options.container;
    this.tour = options.tour;
    this.sceneId = options.sceneId;
    this.onNavigate = options.onNavigate;
    this.onSessionEnd = options.onSessionEnd;
    this.onError = options.onError;
  }

  async start(): Promise<void> {
    if (this.disposed) return;

    // Canvas must have a non-zero box before requestSession (no display:none).
    const width = Math.max(this.container.clientWidth, 2);
    const height = Math.max(this.container.clientHeight, 2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;
    renderer.domElement.className = 'panorama-xr-canvas';
    renderer.domElement.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;touch-action:none;';
    this.container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      width / height,
      0.1,
      SPHERE_RADIUS * 2,
    );
    scene.add(camera);
    this.camera = camera;

    const contentRoot = new THREE.Group();
    scene.add(contentRoot);
    this.contentRoot = contentRoot;

    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const sphere = new THREE.Mesh(geometry, material);
    contentRoot.add(sphere);
    this.sphereMesh = sphere;

    const hotspots = new THREE.Group();
    contentRoot.add(hotspots);
    this.hotspotGroup = hotspots;

    this.setupControllers(renderer, scene);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    await this.loadScene(this.sceneId);

    try {
      const session = await enterImmersiveVr(renderer);
      this.xrSession = session;
      session.addEventListener('end', this.handleSessionEnded);
      session.addEventListener(
        'inputsourceschange',
        this.handleInputSourcesChange,
      );
    } catch (error) {
      this.onError?.(error);
      this.dispose();
      throw error;
    }

    this.lastFrameMs = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min((now - this.lastFrameMs) / 1000, 0.05);
      this.lastFrameMs = now;
      this.applyLook(dt);
      if (this.scene && this.camera) {
        renderer.render(this.scene, this.camera);
      }
    });
  }

  async setTourScene(tour: Tour, sceneId: string): Promise<void> {
    this.tour = tour;
    this.sceneId = sceneId;
    await this.loadScene(sceneId);
  }

  async end(): Promise<void> {
    await exitImmersiveVr(this.xrSession);
    this.xrSession = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keysDown.clear();

    const renderer = this.renderer;
    if (renderer) {
      renderer.setAnimationLoop(null);
      if (renderer.domElement.parentElement === this.container) {
        this.container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }

    this.xrSession?.removeEventListener('end', this.handleSessionEnded);
    this.xrSession?.removeEventListener(
      'inputsourceschange',
      this.handleInputSourcesChange,
    );
    void exitImmersiveVr(this.xrSession);
    this.xrSession = null;

    this.disposeTexture();
    this.clearHotspots();

    this.sphereMesh?.geometry.dispose();
    if (this.sphereMesh?.material instanceof THREE.Material) {
      this.sphereMesh.material.dispose();
    }

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.contentRoot = null;
    this.sphereMesh = null;
    this.hotspotGroup = null;
  }

  private readonly handleSessionEnded = () => {
    this.xrSession = null;
    this.onSessionEnd();
    this.dispose();
  };

  private readonly handleInputSourcesChange = () => {
    // Controllers / gamepads may appear after session start (emulator).
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault();
      void this.end();
      return;
    }
    this.keysDown.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.keysDown.delete(event.code);
  };

  private setupControllers(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
  ): void {
    for (let i = 0; i < 2; i += 1) {
      const controller = renderer.xr.getController(i);
      controller.addEventListener('select', this.handleSelect);
      // Emulator / some runtimes fire selectstart more reliably than select.
      controller.addEventListener('selectstart', this.handleSelect);
      scene.add(controller);
      this.controllers.push(controller);

      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -HOTSPOT_DISTANCE * 1.2),
      ]);
      const ray = new THREE.Line(
        rayGeo,
        new THREE.LineBasicMaterial({
          color: 0x8ec8ff,
          transparent: true,
          opacity: 0.65,
        }),
      );
      controller.add(ray);
    }
  }

  private readonly handleSelect = (event: { target: unknown }): void => {
    const controller = event.target as THREE.XRTargetRaySpace;
    const hit = this.raycastNav(controller);
    if (!hit) return;
    this.onNavigate(hit.targetSceneId, hit.hotspotId);
  };

  /**
   * Standard look: horizontal = yaw, vertical = pitch (stick up = look up).
   * Prefer the right-hand xr-standard thumbstick (axes 2/3).
   */
  private applyLook(dt: number): void {
    const root = this.contentRoot;
    if (!root) return;

    const stick = this.readLookStick();
    let yaw = stick.x;
    let pitch = stick.y;

    let keyYaw = 0;
    let keyPitch = 0;
    if (this.keysDown.has('KeyQ') || this.keysDown.has('ArrowLeft'))
      keyYaw -= 1;
    if (this.keysDown.has('KeyE') || this.keysDown.has('ArrowRight'))
      keyYaw += 1;
    // Stick/gamepad Y: positive = down. W/↑ = look up → negative pitch input.
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp'))
      keyPitch -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown'))
      keyPitch += 1;

    if (keyYaw !== 0 || keyPitch !== 0) {
      yaw = keyYaw;
      pitch = keyPitch;
      // Content yaw follows stick/key so view turns the same way as the input.
      root.rotation.y += yaw * KEY_LOOK_SPEED * dt;
      root.rotation.x += pitch * KEY_LOOK_SPEED * dt;
      root.rotation.x = THREE.MathUtils.clamp(
        root.rotation.x,
        -MAX_CONTENT_PITCH,
        MAX_CONTENT_PITCH,
      );
      return;
    }

    yaw = deadzoneAxis(yaw);
    pitch = deadzoneAxis(pitch);
    if (yaw === 0 && pitch === 0) return;

    root.rotation.y += yaw * STICK_LOOK_SPEED * dt;
    // Gamepad Y+ is down — add so stick-down looks down.
    root.rotation.x += pitch * STICK_LOOK_SPEED * dt;
    root.rotation.x = THREE.MathUtils.clamp(
      root.rotation.x,
      -MAX_CONTENT_PITCH,
      MAX_CONTENT_PITCH,
    );
  }

  /**
   * Right-hand thumbstick first (look), else any stick with the largest
   * deflection — matches Quest / FPS “right stick look” when both exist.
   */
  private readLookStick(): { x: number; y: number } {
    let best = { x: 0, y: 0 };
    let bestScore = 0;

    const consider = (
      pad: Gamepad | null | undefined,
      preferRight: boolean,
    ) => {
      const axes = stickAxes(pad);
      if (!axes) return;
      const score = Math.hypot(axes.x, axes.y) + (preferRight ? 0.05 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = axes;
      }
    };

    const session = this.xrSession ?? this.renderer?.xr.getSession() ?? null;
    if (session) {
      for (const source of session.inputSources) {
        consider(source.gamepad, source.handedness === 'right');
      }
    }

    if (typeof navigator.getGamepads === 'function') {
      for (const pad of navigator.getGamepads()) {
        consider(pad, false);
      }
    }

    return best;
  }

  private raycastNav(
    controller: THREE.XRTargetRaySpace,
  ): PanoramaXrNavHit | null {
    if (!this.hotspotGroup) return null;

    this.tempMatrix.identity().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

    const hits = this.raycaster.intersectObjects(
      this.hotspotGroup.children,
      true,
    );
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        const data = obj.userData as HotspotUserData | undefined;
        if (data?.kind === 'nav') {
          return {
            hotspotId: data.hotspotId,
            targetSceneId: data.targetSceneId,
            label: data.label,
          };
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  private async loadScene(sceneId: string): Promise<void> {
    const sceneData = this.tour.scenes[sceneId];
    if (!sceneData?.panorama) {
      throw new Error(`Scene missing panorama: ${sceneId}`);
    }

    await this.applyPanoramaTexture(sceneData.panorama);
    this.rebuildNavHotspots(sceneData);
  }

  private async applyPanoramaTexture(url: string): Promise<void> {
    if (!this.sphereMesh) return;

    const loader = new THREE.TextureLoader();
    const next = await loader.loadAsync(url);
    next.colorSpace = THREE.SRGBColorSpace;
    next.minFilter = THREE.LinearMipmapLinearFilter;
    next.magFilter = THREE.LinearFilter;
    next.generateMipmaps = true;

    this.disposeTexture();
    this.texture = next;

    const material = this.sphereMesh.material as THREE.MeshBasicMaterial;
    material.map = next;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  }

  private disposeTexture(): void {
    this.texture?.dispose();
    this.texture = null;
  }

  private clearHotspots(): void {
    if (!this.hotspotGroup) return;
    for (const child of [...this.hotspotGroup.children]) {
      this.hotspotGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    }
  }

  private rebuildNavHotspots(sceneData: Scene): void {
    this.clearHotspots();
    if (!this.hotspotGroup) return;

    const navHotspots = resolveSceneNavHotspots(
      this.tour,
      sceneData,
      VIEWER_MARKER_AUDIENCE,
    );

    for (const hotspot of navHotspots) {
      if (!hotspot.targetScene || !isSphericalHotspot(hotspot)) continue;

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(HOTSPOT_SIZE, 20, 16),
        new THREE.MeshBasicMaterial({
          color: 0x4ade80,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      );
      positionOnSphere(
        hotspot.position.yaw,
        hotspot.position.pitch,
        HOTSPOT_DISTANCE,
        mesh.position,
      );
      mesh.userData = {
        kind: 'nav',
        hotspotId: hotspot.id,
        targetSceneId: hotspot.targetScene,
        label: hotspot.label?.trim() || hotspot.targetScene,
      } satisfies HotspotUserData;
      this.hotspotGroup.add(mesh);
    }
  }
}

function stickAxes(
  pad: Gamepad | null | undefined,
): { x: number; y: number } | null {
  if (!pad?.axes?.length) return null;
  // xr-standard: thumbstick is axes[2]/axes[3]; touchpad/legacy often 0/1.
  const hasStick = pad.axes.length >= 4;
  const x = hasStick ? (pad.axes[2] ?? 0) : (pad.axes[0] ?? 0);
  const y = hasStick ? (pad.axes[3] ?? 0) : (pad.axes[1] ?? 0);
  if (x === 0 && y === 0 && hasStick) {
    // Some emulators only fill 0/1 — fall back.
    return { x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 };
  }
  return { x, y };
}

function deadzoneAxis(value: number): number {
  if (Math.abs(value) < STICK_DEADZONE) return 0;
  const mag = (Math.abs(value) - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  return Math.sign(value) * Math.min(mag, 1);
}

function isSphericalHotspot(
  hotspot: Hotspot,
): hotspot is Hotspot & { position: { yaw: number; pitch: number } } {
  const pos = hotspot.position as { yaw?: unknown; pitch?: unknown };
  return typeof pos?.yaw === 'number' && typeof pos?.pitch === 'number';
}
