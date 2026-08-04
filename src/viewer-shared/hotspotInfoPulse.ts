/**
 * NO info-hotspot pulse: keep the original scale animation, but set scaleX/scaleY
 * so absolute edge growth matches on all sides (uniform scale stretched wide pills).
 */

const observedHosts = new WeakSet<Element>();

/** Same absolute grow as scale(1.5) on the short axis (height). */
function applyPulseScaleVars(host: HTMLElement): void {
  const pulse = host.querySelector('.hotspot-info__pulse');
  if (!(pulse instanceof HTMLElement)) return;

  // Size the transforming box (pulse), not the host — keeps growth concentric.
  const w = pulse.offsetWidth;
  const h = pulse.offsetHeight;
  if (w <= 0 || h <= 0) return;

  const growPx = h * 0.25;
  const scaleX = ((w + 2 * growPx) / w).toFixed(4);
  const scaleY = ((h + 2 * growPx) / h).toFixed(4);
  pulse.style.setProperty('--hotspot-pulse-scale-x', scaleX);
  pulse.style.setProperty('--hotspot-pulse-scale-y', scaleY);
}

export function syncHotspotInfoPulseScales(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.hotspot-info').forEach((host) => {
    applyPulseScaleVars(host);
    if (observedHosts.has(host)) return;
    observedHosts.add(host);
    new ResizeObserver(() => {
      applyPulseScaleVars(host);
    }).observe(host);
  });
}

/** Watch marker DOM inserts (PSV / CSS2D) and keep pulse scales in sync. */
export function attachHotspotInfoPulseScaleSync(root: HTMLElement): () => void {
  const run = () => syncHotspotInfoPulseScales(root);
  const mo = new MutationObserver(run);
  mo.observe(root, { childList: true, subtree: true });
  run();
  return () => mo.disconnect();
}
