import type { Viewer } from '@photo-sphere-viewer/core';

type PanDirection = 'up' | 'down' | 'left' | 'right';

interface ViewerWithKeyboardDynamics extends Viewer {
  dynamics: {
    position: {
      roll: (rolls: { yaw?: boolean; pitch?: boolean }) => void;
      stop: () => void;
    };
    zoom: { roll: (invert: boolean) => void; stop: () => void };
  };
  resetIdleTimer: () => void;
}

function getViewerDynamics(viewer: Viewer): ViewerWithKeyboardDynamics {
  return viewer as ViewerWithKeyboardDynamics;
}

export interface PanoramaKeyboardControl {
  setEnabled: (enabled: boolean) => void;
  destroy: () => void;
}

export interface PanoramaKeyboardControlOptions {
  isEnabled: () => boolean;
}

function isZoomInKey(event: KeyboardEvent): boolean {
  return (
    event.key === 'PageUp' ||
    event.key === '+' ||
    event.key === '=' ||
    (event.key === '+' && event.shiftKey)
  );
}

function isZoomOutKey(event: KeyboardEvent): boolean {
  return event.key === 'PageDown' || event.key === '-';
}

export function bindPanoramaKeyboardControl(
  viewer: Viewer,
  options: PanoramaKeyboardControlOptions,
): PanoramaKeyboardControl {
  const pressedPan = new Set<PanDirection>();
  let zoomIn = false;
  let zoomOut = false;
  let externallyEnabled = true;
  let destroyed = false;
  const v = getViewerDynamics(viewer);

  const resetKeys = () => {
    pressedPan.clear();
    zoomIn = false;
    zoomOut = false;
    v.dynamics.position.stop();
    v.dynamics.zoom.stop();
    v.resetIdleTimer();
  };

  const syncPositionRoll = () => {
    const rolls: { yaw?: boolean; pitch?: boolean } = {};

    if (pressedPan.has('up') && !pressedPan.has('down')) rolls.pitch = false;
    else if (pressedPan.has('down') && !pressedPan.has('up'))
      rolls.pitch = true;

    if (pressedPan.has('left') && !pressedPan.has('right')) rolls.yaw = true;
    else if (pressedPan.has('right') && !pressedPan.has('left'))
      rolls.yaw = false;

    if (rolls.pitch !== undefined || rolls.yaw !== undefined) {
      v.dynamics.position.roll(rolls);
      return;
    }

    v.dynamics.position.stop();
    v.resetIdleTimer();
  };

  const syncZoomRoll = () => {
    if (zoomIn && !zoomOut) {
      v.dynamics.zoom.roll(false);
      return;
    }

    if (zoomOut && !zoomIn) {
      v.dynamics.zoom.roll(true);
      return;
    }

    v.dynamics.zoom.stop();
  };

  const canHandle = () =>
    !destroyed && externallyEnabled && options.isEnabled();

  const onKeyDown = (event: KeyboardEvent) => {
    if (!canHandle()) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        pressedPan.add('up');
        handled = true;
        break;
      case 'ArrowDown':
        pressedPan.add('down');
        handled = true;
        break;
      case 'ArrowLeft':
        pressedPan.add('left');
        handled = true;
        break;
      case 'ArrowRight':
        pressedPan.add('right');
        handled = true;
        break;
      default:
        if (isZoomInKey(event)) {
          zoomIn = true;
          handled = true;
        } else if (isZoomOutKey(event)) {
          zoomOut = true;
          handled = true;
        }
        break;
    }

    if (!handled) return;

    syncPositionRoll();
    syncZoomRoll();
    event.preventDefault();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (destroyed) return;

    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        pressedPan.delete('up');
        handled = true;
        break;
      case 'ArrowDown':
        pressedPan.delete('down');
        handled = true;
        break;
      case 'ArrowLeft':
        pressedPan.delete('left');
        handled = true;
        break;
      case 'ArrowRight':
        pressedPan.delete('right');
        handled = true;
        break;
      default:
        if (isZoomInKey(event)) {
          zoomIn = false;
          handled = true;
        } else if (isZoomOutKey(event)) {
          zoomOut = false;
          handled = true;
        }
        break;
    }

    if (!handled) return;

    syncPositionRoll();
    syncZoomRoll();
    event.preventDefault();
  };

  const onWindowBlur = () => {
    resetKeys();
  };

  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onWindowBlur);

  return {
    setEnabled(enabled: boolean) {
      externallyEnabled = enabled;
      if (!enabled) resetKeys();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      resetKeys();
    },
  };
}
