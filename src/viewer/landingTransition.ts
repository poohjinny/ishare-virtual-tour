import type { Viewer } from '@photo-sphere-viewer/core';
import type { ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';

/** PSV zoom level 0 = widest FOV (max zoom out). */
export const LANDING_ZOOM_OUT = 0;

/** PSV animate(): number = duration in ms ('2200ms' string is invalid). */
const LANDING_DURATION_MS = 3000;

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

function yawDeltaDeg(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360) - 180);
}

function isNearLandingStart(viewer: Viewer, start: ViewPosition): boolean {
  const position = viewer.getPosition();
  const yaw = (position.yaw * 180) / Math.PI;
  const pitch = (position.pitch * 180) / Math.PI;
  return (
    yawDeltaDeg(yaw, start.yaw) < 2 &&
    Math.abs(pitch - start.pitch) < 2 &&
    Math.abs(viewer.getZoomLevel() - LANDING_ZOOM_OUT) < 2
  );
}

/** Random wide-angle starting pose for the landing reveal. */
export function pickRandomLandingView(): ViewPosition {
  return { yaw: Math.random() * 360, pitch: -32 + Math.random() * 36, zoom: 0 };
}

export async function playLandingTransition(
  viewer: Viewer,
  start: ViewPosition,
  target: ViewPosition,
): Promise<void> {
  await viewer.stopAnimation();

  if (!isNearLandingStart(viewer, start)) {
    applyView(viewer, { ...start, zoom: LANDING_ZOOM_OUT });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }

  try {
    const animation = viewer.animate({
      ...toPsvPosition(target),
      zoom: toPsvZoom(target.zoom),
      speed: LANDING_DURATION_MS,
      easing: 'inOutCubic',
    });
    if (animation) await animation;
    else applyView(viewer, target);
  } catch {
    applyView(viewer, target);
  }
}
