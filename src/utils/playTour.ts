import type { PlayTour, PlayTourStop, Tour, ViewPosition } from '../types/tour';
import { buildSceneVisitOrder } from '../viewer/sceneDepth';
import { isSceneVisibleInExplore } from './sceneVisibility';

/** Default dwell for the full arrive → defaultView → exit ken-burns. */
export const PLAY_TOUR_DEFAULT_DWELL_MS = 6000;

const MIN_DWELL_MS = 1200;
const MAX_DWELL_MS = 60_000;

function clampDwellMs(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(MAX_DWELL_MS, Math.max(MIN_DWELL_MS, Math.round(value)));
}

function normalizeView(raw: unknown): ViewPosition | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const view = raw as Record<string, unknown>;
  if (typeof view.yaw !== 'number' || typeof view.pitch !== 'number') {
    return undefined;
  }
  const next: ViewPosition = { yaw: view.yaw, pitch: view.pitch };
  if (typeof view.zoom === 'number' && Number.isFinite(view.zoom)) {
    next.zoom = view.zoom;
  }
  return next;
}

/**
 * Default Play sequence — Explore-visible scenes in nav-graph BFS order
 * (overview → level-1 floors → nested places).
 */
export function buildDefaultPlayTourStops(tour: Tour): PlayTourStop[] {
  return buildSceneVisitOrder(tour, tour.scenes, tour.firstScene)
    .filter((sceneId) => {
      const scene = tour.scenes[sceneId];
      return scene ? isSceneVisibleInExplore(scene) : false;
    })
    .map((sceneId) => ({ sceneId }));
}

/** Platform default when a tour omits `playTour` (or authored stops are invalid). */
export function buildDefaultPlayTour(tour: Tour): PlayTour | undefined {
  const stops = buildDefaultPlayTourStops(tour);
  if (stops.length < 2) return undefined;
  return { dwellMs: PLAY_TOUR_DEFAULT_DWELL_MS, loop: true, stops };
}

/**
 * Prefer authored stops when ≥2 resolve; otherwise fall back to Explore BFS.
 * Tours with fewer than 2 Explore scenes get no Play control.
 */
export function normalizePlayTour(
  tour: Tour,
  playTour: PlayTour | null | undefined,
): PlayTour | undefined {
  const defaultDwell = clampDwellMs(
    playTour && typeof playTour === 'object' ? playTour.dwellMs : undefined,
    PLAY_TOUR_DEFAULT_DWELL_MS,
  );

  const rawStops =
    playTour && typeof playTour === 'object' && Array.isArray(playTour.stops) ?
      playTour.stops
    : [];
  const authoredStops: PlayTourStop[] = [];

  for (const entry of rawStops) {
    if (!entry || typeof entry !== 'object') continue;
    const sceneId =
      typeof entry.sceneId === 'string' ? entry.sceneId.trim() : '';
    if (!sceneId || !tour.scenes[sceneId]) continue;

    const stop: PlayTourStop = { sceneId };
    const view = normalizeView(entry.view);
    if (view) stop.view = view;
    if (entry.dwellMs !== undefined) {
      stop.dwellMs = clampDwellMs(entry.dwellMs, defaultDwell);
    }
    authoredStops.push(stop);
  }

  if (authoredStops.length >= 2) {
    return {
      dwellMs: defaultDwell,
      ...(playTour?.loop === true ? { loop: true } : {}),
      stops: authoredStops,
    };
  }

  return buildDefaultPlayTour(tour);
}

/** True when the tour should show a Play control. */
export function hasPlayTour(tour: Tour): boolean {
  return (tour.playTour?.stops.length ?? 0) >= 2;
}

export function resolvePlayTourStopView(
  tour: Tour,
  stop: PlayTourStop,
): ViewPosition {
  return (
    stop.view ?? tour.scenes[stop.sceneId]?.defaultView ?? { yaw: 0, pitch: 0 }
  );
}

export function resolvePlayTourStopDwellMs(
  playTour: PlayTour,
  stop: PlayTourStop,
): number {
  return stop.dwellMs ?? playTour.dwellMs ?? PLAY_TOUR_DEFAULT_DWELL_MS;
}

/**
 * Ken-burns offset from a stop’s authored view — used as the *arrive* pose.
 * Dwell then eases from this random offset into defaultView (not the reverse).
 */
export const PLAY_TOUR_DWELL_DRIFT_YAW_DEG = 95;
export const PLAY_TOUR_DWELL_DRIFT_PITCH_DEG = 12;
export const PLAY_TOUR_DWELL_DRIFT_ZOOM = 36;

/** Keep motion perceptible — avoid near-zero random scales. */
const DRIFT_SCALE_MIN = 0.65;
const DRIFT_SCALE_MAX = 1.2;

const PITCH_MIN = -80;
const PITCH_MAX = 80;

function clampPitch(pitch: number): number {
  return Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch));
}

function clampZoom(zoom: number): number {
  return Math.min(100, Math.max(0, zoom));
}

function randomSign(): 1 | -1 {
  return Math.random() < 0.5 ? -1 : 1;
}

function randomScale(min = DRIFT_SCALE_MIN, max = DRIFT_SCALE_MAX): number {
  return min + Math.random() * (max - min);
}

export function resolvePlayTourDwellDriftView(
  view: ViewPosition,
): ViewPosition {
  return resolvePlayTourDwellOffsetPair(view).arrive;
}

/**
 * Symmetric offsets around `view` so a move arrive → view → exit puts
 * defaultView at the midpoint of the ken-burns path.
 */
export function resolvePlayTourDwellOffsetPair(view: ViewPosition): {
  arrive: ViewPosition;
  exit: ViewPosition;
} {
  const baseZoom = view.zoom ?? 50;
  const yawDelta = randomSign() * PLAY_TOUR_DWELL_DRIFT_YAW_DEG * randomScale();
  const pitchDelta =
    randomSign() * PLAY_TOUR_DWELL_DRIFT_PITCH_DEG * randomScale();
  const zoomDelta = randomSign() * PLAY_TOUR_DWELL_DRIFT_ZOOM * randomScale();

  return {
    arrive: {
      yaw: view.yaw + yawDelta,
      pitch: clampPitch(view.pitch + pitchDelta),
      zoom: clampZoom(baseZoom + zoomDelta),
    },
    exit: {
      yaw: view.yaw - yawDelta,
      pitch: clampPitch(view.pitch - pitchDelta),
      zoom: clampZoom(baseZoom - zoomDelta),
    },
  };
}

export function prefersPlayTourReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
