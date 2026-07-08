import type { Viewer } from '@photo-sphere-viewer/core';
import type { ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';

/** PSV zoom level 0 = widest FOV (max zoom out). */
export const LANDING_ZOOM_OUT = 0;

/** Random landing start — pitch (°). Wide spread so the reveal tilts, not just pans. */
const LANDING_PITCH_MIN = -50;
const LANDING_PITCH_MAX = 24;

/** Landing animate duration bounds (ms) — scaled by travel distance. */
const LANDING_DURATION_MIN_MS = 1400;
const LANDING_DURATION_MAX_MS = 3200;

function toDeg(deg: number): string {
  return `${deg}deg`;
}

function toPsvPosition(view: ViewPosition) {
  return { yaw: toDeg(view.yaw), pitch: toDeg(view.pitch) };
}

function applyView(viewer: Viewer, view: ViewPosition): void {
  viewer.rotate(toPsvPosition(view));
  viewer.zoom(toPsvZoom(view.zoom));
}

/** Apply landing start pose — zoom is a raw PSV level (0 = max wide). */
function applyLandingStartView(viewer: Viewer, view: ViewPosition): void {
  viewer.rotate(toPsvPosition(view));
  viewer.zoom(view.zoom ?? LANDING_ZOOM_OUT);
}

function landingStartPsvZoom(view: ViewPosition): number {
  return view.zoom ?? LANDING_ZOOM_OUT;
}

function targetPsvZoom(view: ViewPosition): number {
  return toPsvZoom(view.zoom);
}

function yawDeltaDeg(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360) - 180);
}

/**
 * Map start → target travel to landing duration.
 * Yaw dominates; pitch and zoom add smaller contributions.
 */
export function resolveLandingDurationMs(
  from: ViewPosition,
  to: ViewPosition,
): number {
  const yaw = yawDeltaDeg(from.yaw, to.yaw);
  const pitch = Math.abs(from.pitch - to.pitch);
  const zoom = Math.abs(landingStartPsvZoom(from) - targetPsvZoom(to));

  const normalized = Math.min(
    1,
    (yaw / 160) * 0.62 + (pitch / 55) * 0.23 + (zoom / 50) * 0.15,
  );

  return Math.round(
    LANDING_DURATION_MIN_MS +
      normalized * (LANDING_DURATION_MAX_MS - LANDING_DURATION_MIN_MS),
  );
}

function isNearLandingStart(viewer: Viewer, start: ViewPosition): boolean {
  const position = viewer.getPosition();
  const yaw = (position.yaw * 180) / Math.PI;
  const pitch = (position.pitch * 180) / Math.PI;
  return (
    yawDeltaDeg(yaw, start.yaw) < 2 &&
    Math.abs(pitch - start.pitch) < 2 &&
    Math.abs(viewer.getZoomLevel() - landingStartPsvZoom(start)) < 2
  );
}

/** Per-tour guard — landing zoom runs once per tour session, not on scene changes. */
let landingPlayedTourId: string | null = null;

export function hasLandingTransitionPlayed(tourId: string): boolean {
  return landingPlayedTourId === tourId;
}

export function markLandingTransitionPlayed(tourId: string): void {
  landingPlayedTourId = tourId;
}

export function resetLandingTransitionState(): void {
  landingPlayedTourId = null;
}

/** Random wide-angle starting pose for the landing reveal. */
export function pickRandomLandingView(): ViewPosition {
  const pitch =
    LANDING_PITCH_MIN + Math.random() * (LANDING_PITCH_MAX - LANDING_PITCH_MIN);

  // Always start fully zoomed out so the reveal zooms in — more dynamic than a pure pan.
  return { yaw: Math.random() * 360, pitch, zoom: LANDING_ZOOM_OUT };
}

export async function playLandingTransition(
  viewer: Viewer,
  start: ViewPosition,
  target: ViewPosition,
): Promise<void> {
  await viewer.stopAnimation();

  if (!isNearLandingStart(viewer, start)) {
    applyLandingStartView(viewer, start);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }

  const durationMs = resolveLandingDurationMs(start, target);

  try {
    const animation = viewer.animate({
      ...toPsvPosition(target),
      zoom: toPsvZoom(target.zoom),
      speed: durationMs,
      easing: 'inOutCubic',
    });
    if (animation) await animation;
    else applyView(viewer, target);
  } catch {
    applyView(viewer, target);
  }
}
