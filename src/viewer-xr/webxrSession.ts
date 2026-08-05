import type { WebGLRenderer } from 'three';

/**
 * Session init for Quest Browser + Immersive Web Emulator.
 * Avoid `layers` — some emulators fail or accept the session without usable input.
 */
export const DEFAULT_IMMERSIVE_VR_SESSION_INIT: XRSessionInit = {
  optionalFeatures: ['local-floor', 'bounded-floor'],
};

/**
 * Request an immersive-vr session and attach it to a Three.js renderer.
 * Caller owns ending the session (`session.end()` or Exit VR).
 */
export async function enterImmersiveVr(
  renderer: WebGLRenderer,
  sessionInit: XRSessionInit = DEFAULT_IMMERSIVE_VR_SESSION_INIT,
): Promise<XRSession> {
  if (!navigator.xr) {
    throw new Error('WebXR is not available in this browser');
  }

  renderer.xr.enabled = true;
  // Prefer local-floor so emulator / headset have a stable seated origin.
  try {
    renderer.xr.setReferenceSpaceType('local-floor');
  } catch {
    try {
      renderer.xr.setReferenceSpaceType('local');
    } catch {
      // Browser default.
    }
  }

  const session = await navigator.xr.requestSession(
    'immersive-vr',
    sessionInit,
  );
  await renderer.xr.setSession(session);
  return session;
}

export async function exitImmersiveVr(
  session: XRSession | null,
): Promise<void> {
  if (!session) return;
  try {
    await session.end();
  } catch {
    // Already ended.
  }
}

/** True while the renderer is presenting an XR session. */
export function isRendererXrPresenting(renderer: WebGLRenderer): boolean {
  return Boolean(renderer.xr?.isPresenting);
}
