/**
 * WebXR capability helpers — Enter VR is offered only where immersive-vr
 * works. Embed / iframe tours hide the control (WebXR needs a capable top
 * window / permission path).
 */

export type WebXrOfferContext = {
  /** Nested iframe embed — hide Enter VR. */
  embed?: boolean;
  /**
   * When false, do not offer VR (e.g. tour bootstrap not ready).
   * Default true when omitted.
   */
  ready?: boolean;
};

/** Whether this browsing context may show an Enter VR control. */
export function shouldOfferEnterVr(context: WebXrOfferContext = {}): boolean {
  if (context.embed) return false;
  if (context.ready === false) return false;
  if (typeof navigator === 'undefined') return false;
  return Boolean(navigator.xr);
}

/**
 * Probe immersive-vr support. Safe to call from effects; rejects → false.
 * Result is cached for the page lifetime.
 */
let immersiveVrSupportPromise: Promise<boolean> | null = null;

export function isImmersiveVrSupported(): Promise<boolean> {
  if (immersiveVrSupportPromise) return immersiveVrSupportPromise;

  immersiveVrSupportPromise = (async () => {
    try {
      if (!navigator.xr?.isSessionSupported) return false;
      return await navigator.xr.isSessionSupported('immersive-vr');
    } catch {
      return false;
    }
  })();

  return immersiveVrSupportPromise;
}

/** Reset cache (tests / Dev device frame remounts). */
export function resetImmersiveVrSupportCache(): void {
  immersiveVrSupportPromise = null;
}
