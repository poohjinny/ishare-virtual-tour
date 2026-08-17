import type { CSSProperties } from 'react';

/**
 * Charts fill one element at a time. Each track chooses one sweep preset, and
 * every segment gets the matching slice of that curve — a sub-curve of a cubic
 * bezier is itself a cubic bezier — so the leading edge stays continuous.
 * Easing each segment independently would brake and restart at every join.
 */
const CHART_SWEEP_MS = 700;

interface Point {
  x: number;
  y: number;
}

type Curve = [Point, Point, Point, Point];

export type ChartMotionEasing = 'linear' | 'ease-in-out' | 'ease-out';

/**
 * Timing presets: x = elapsed, y = track covered. `linear` and `ease-in-out`
 * match their CSS namesakes; `ease-out` decelerates harder than CSS's (quart,
 * not quad) so a fill launches fast and settles — the tail stays moving, which
 * an expo-style curve would flatten into a stall.
 */
const SWEEP_CURVES: Record<ChartMotionEasing, Curve> = {
  linear: [
    { x: 0, y: 0 },
    { x: 1 / 3, y: 1 / 3 },
    { x: 2 / 3, y: 2 / 3 },
    { x: 1, y: 1 },
  ],
  'ease-in-out': [
    { x: 0, y: 0 },
    { x: 0.42, y: 0 },
    { x: 0.58, y: 1 },
    { x: 1, y: 1 },
  ],
  'ease-out': [
    { x: 0, y: 0 },
    { x: 0.25, y: 1 },
    { x: 0.5, y: 1 },
    { x: 1, y: 1 },
  ],
};

function lerp(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** de Casteljau split: the curve over `[0, t]` and the curve over `[t, 1]`. */
function splitCurve(curve: Curve, t: number) {
  const [p0, p1, p2, p3] = curve;
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const split = lerp(d, e, t);
  return { head: [p0, a, d, split] as Curve, tail: [split, e, c, p3] as Curve };
}

function pointAt(curve: Curve, t: number) {
  return splitCurve(curve, t).head[3];
}

/** The part of `curve` between two of its own parameters. */
function sliceCurve(curve: Curve, from: number, to: number): Curve {
  const { head } = splitCurve(curve, to);
  if (to <= 0) return head;
  return splitCurve(head, from / to).tail;
}

/** Curve parameter where the sweep has covered `progress` of the track. */
function paramAtProgress(curve: Curve, progress: number) {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 20; step += 1) {
    const mid = (low + high) / 2;
    if (pointAt(curve, mid).y < progress) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** One segment's slice of the sweep, normalized to its own time / length box. */
function segmentEase(curve: Curve) {
  const [p0, p1, p2, p3] = curve;
  const spanX = p3.x - p0.x;
  const spanY = p3.y - p0.y;
  if (spanX <= 0 || spanY <= 0) return 'linear';

  const control = (point: Point) =>
    `${Math.round(((point.x - p0.x) / spanX) * 1000) / 1000}, ${
      Math.round(((point.y - p0.y) / spanY) * 1000) / 1000
    }`;
  return `cubic-bezier(${control(p1)}, ${control(p2)})`;
}

/** Track share per item — the weight a donut slice or stacked bar fills. */
export function chartShares(items: { count: number }[]) {
  const total = items.reduce((sum, item) => sum + Math.max(item.count, 0), 0);
  return items.map((item) => (total > 0 ? Math.max(item.count, 0) / total : 0));
}

/** Duration, delay, and easing per weight, aligned to the input order. */
export function chartFillTimeline(
  weights: number[],
  startMs = 0,
  easing: ChartMotionEasing = 'ease-out',
) {
  const sweepCurve = SWEEP_CURVES[easing];
  const track = weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0);
  const sweepMs = track * CHART_SWEEP_MS;
  let covered = 0;
  let param = 0;

  return weights.map((weight) => {
    const nextCovered = covered + Math.max(weight, 0);
    const nextParam =
      track > 0 ? paramAtProgress(sweepCurve, nextCovered / track) : 0;
    const fromMs = pointAt(sweepCurve, param).x * sweepMs;
    const toMs = pointAt(sweepCurve, nextParam).x * sweepMs;
    const style = {
      '--chart-fill-ms': `${Math.round(toMs - fromMs)}ms`,
      '--chart-fill-delay': `${Math.round(startMs + fromMs)}ms`,
      '--chart-fill-ease': segmentEase(
        sliceCurve(sweepCurve, param, nextParam),
      ),
    } as CSSProperties;

    covered = nextCovered;
    param = nextParam;
    return style;
  });
}

/** Start time for each chart so siblings sweep back to back, in order. */
export function chartStartTimes(groups: number[][]) {
  let cursor = 0;
  return groups.map((weights) => {
    const startMs = cursor;
    cursor +=
      weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0) *
      CHART_SWEEP_MS;
    return startMs;
  });
}
