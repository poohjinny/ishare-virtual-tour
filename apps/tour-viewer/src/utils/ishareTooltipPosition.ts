import type { IshareTooltipPlacement } from '../components/ui/tooltipClasses';

const GAP_PX = 8;
const VIEWPORT_PAD_PX = 8;

const OPPOSITE: Record<IshareTooltipPlacement, IshareTooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const FALLBACK_ORDER: IshareTooltipPlacement[] = [
  'top',
  'bottom',
  'right',
  'left',
];

export type IshareTooltipCoords = {
  left: number;
  top: number;
  placement: IshareTooltipPlacement;
};

function placeAnchor(
  trigger: DOMRect,
  tipW: number,
  tipH: number,
  placement: IshareTooltipPlacement,
): { left: number; top: number } {
  switch (placement) {
    case 'top':
      return {
        left: trigger.left + trigger.width / 2 - tipW / 2,
        top: trigger.top - GAP_PX - tipH,
      };
    case 'bottom':
      return {
        left: trigger.left + trigger.width / 2 - tipW / 2,
        top: trigger.bottom + GAP_PX,
      };
    case 'left':
      return {
        left: trigger.left - GAP_PX - tipW,
        top: trigger.top + trigger.height / 2 - tipH / 2,
      };
    case 'right':
      return {
        left: trigger.right + GAP_PX,
        top: trigger.top + trigger.height / 2 - tipH / 2,
      };
  }
}

function fitsViewport(
  left: number,
  top: number,
  tipW: number,
  tipH: number,
  vw: number,
  vh: number,
): boolean {
  return (
    left >= VIEWPORT_PAD_PX &&
    top >= VIEWPORT_PAD_PX &&
    left + tipW <= vw - VIEWPORT_PAD_PX &&
    top + tipH <= vh - VIEWPORT_PAD_PX
  );
}

function clampToViewport(
  left: number,
  top: number,
  tipW: number,
  tipH: number,
  vw: number,
  vh: number,
): { left: number; top: number } {
  const maxLeft = Math.max(VIEWPORT_PAD_PX, vw - VIEWPORT_PAD_PX - tipW);
  const maxTop = Math.max(VIEWPORT_PAD_PX, vh - VIEWPORT_PAD_PX - tipH);
  return {
    left: Math.min(Math.max(left, VIEWPORT_PAD_PX), maxLeft),
    top: Math.min(Math.max(top, VIEWPORT_PAD_PX), maxTop),
  };
}

function placementOrder(
  preferred: IshareTooltipPlacement,
): IshareTooltipPlacement[] {
  const rest = FALLBACK_ORDER.filter(
    (p) => p !== preferred && p !== OPPOSITE[preferred],
  );
  return [preferred, OPPOSITE[preferred], ...rest];
}

/**
 * Position a fixed tooltip near a trigger: try preferred placement, flip, then
 * shift into the viewport. Independent of ancestor overflow.
 */
export function computeIshareTooltipPosition(options: {
  trigger: DOMRect;
  tipWidth: number;
  tipHeight: number;
  preferred: IshareTooltipPlacement;
  viewportWidth?: number;
  viewportHeight?: number;
}): IshareTooltipCoords {
  const vw = options.viewportWidth ?? window.innerWidth;
  const vh = options.viewportHeight ?? window.innerHeight;
  const { trigger, tipWidth, tipHeight, preferred } = options;

  for (const placement of placementOrder(preferred)) {
    const pos = placeAnchor(trigger, tipWidth, tipHeight, placement);
    if (fitsViewport(pos.left, pos.top, tipWidth, tipHeight, vw, vh)) {
      return { ...pos, placement };
    }
  }

  const fallback = placeAnchor(trigger, tipWidth, tipHeight, preferred);
  return {
    ...clampToViewport(
      fallback.left,
      fallback.top,
      tipWidth,
      tipHeight,
      vw,
      vh,
    ),
    placement: preferred,
  };
}
