/**
 * Shared open-reveal gate: panel enter CSS ∥ camera clip-nudge, then heavy hero.
 * Same sequencing for panorama markers and model3d CSS2D panels.
 */

export interface AnchoredPanelSettleGate {
  markEnterDone: () => void;
  markCameraSettled: () => void;
}

/**
 * Calls `onSettled` once both enter and camera have finished (order-independent).
 */
export function createAnchoredPanelSettleGate(
  onSettled: () => void,
): AnchoredPanelSettleGate {
  let enterDone = false;
  let cameraSettled = false;

  const tryReveal = () => {
    if (!enterDone || !cameraSettled) return;
    onSettled();
  };

  return {
    markEnterDone: () => {
      enterDone = true;
      tryReveal();
    },
    markCameraSettled: () => {
      cameraSettled = true;
      tryReveal();
    },
  };
}

/**
 * Run enter wait and camera nudge in parallel; `onSettled` fires when both done.
 */
export async function runAnchoredPanelOpenReveal(options: {
  waitEnter: () => Promise<void>;
  runNudge: () => Promise<unknown>;
  onSettled: () => void;
}): Promise<void> {
  const gate = createAnchoredPanelSettleGate(options.onSettled);

  const enterPromise = Promise.resolve()
    .then(() => options.waitEnter())
    .catch(() => {
      /* enter wait interrupted */
    })
    .then(() => {
      gate.markEnterDone();
    });

  const nudgePromise = Promise.resolve()
    .then(() => options.runNudge())
    .catch(() => {
      /* camera move interrupted */
    })
    .then(() => {
      gate.markCameraSettled();
    });

  await Promise.all([enterPromise, nudgePromise]);
}
