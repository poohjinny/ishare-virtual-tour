import type { Viewer } from '@photo-sphere-viewer/core';

interface SliderUpdate {
  value: number;
  mousedown: boolean;
}

interface ZoomRangeButtonInternal {
  slider?: { listener: (data: SliderUpdate) => void };
}

interface ViewerWithDynamics extends Viewer {
  dynamics: { zoom: { goto: (level: number, speedMult?: number) => void } };
}

/** PSV zoom slider calls setValue (instant). Use dynamics.goto for smooth zoom while dragging. */
export function patchZoomSliderSmoothZoom(viewer: Viewer): void {
  const btn = viewer.navbar.getButton('zoomRange', false) as
    | ZoomRangeButtonInternal
    | undefined;
  if (!btn?.slider) return;

  const dynamics = (viewer as ViewerWithDynamics).dynamics.zoom;

  btn.slider.listener = (data) => {
    if (data.mousedown) {
      dynamics.goto(data.value * 100);
    }
  };
}
