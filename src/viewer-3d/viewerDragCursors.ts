import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Sketchfab-style orbit drag — open hand → closed hand. */
export const VIEWER_3D_CURSOR_ORBIT = 'viewer-3d-container--orbit-drag';
/** Sketchfab-style pan drag — four-way move. */
export const VIEWER_3D_CURSOR_PAN = 'viewer-3d-container--pan-drag';
/** Middle-button dolly. */
export const VIEWER_3D_CURSOR_DOLLY = 'viewer-3d-container--dolly-drag';

type DragMode = 'orbit' | 'pan' | 'dolly';

const DRAG_CLASS: Record<DragMode, string> = {
  orbit: VIEWER_3D_CURSOR_ORBIT,
  pan: VIEWER_3D_CURSOR_PAN,
  dolly: VIEWER_3D_CURSOR_DOLLY,
};

export interface ViewerDragCursorsHandle {
  dispose: () => void;
}

/**
 * Sketchfab-style cursors: grab by default, grabbing on orbit drag, move on pan.
 */
export function attachViewerDragCursors(
  container: HTMLElement,
  domElement: HTMLElement,
  controls: OrbitControls,
  options?: {
    shouldIgnore?: () => boolean;
    isOverHotspotUi?: (clientX: number, clientY: number) => boolean;
  },
): ViewerDragCursorsHandle {
  let dragMode: DragMode | null = null;
  let activeDragClass: string | null = null;

  const clearDragCursor = () => {
    if (activeDragClass) {
      container.classList.remove(activeDragClass);
      activeDragClass = null;
    }
    dragMode = null;
  };

  const applyDragCursor = (mode: DragMode) => {
    const nextClass = DRAG_CLASS[mode];
    if (activeDragClass === nextClass) return;
    if (activeDragClass) container.classList.remove(activeDragClass);
    container.classList.add(nextClass);
    activeDragClass = nextClass;
  };

  const dragModeFromButton = (button: number): DragMode | null => {
    if (button === 0) return 'orbit';
    if (button === 1) return 'dolly';
    if (button === 2) return 'pan';
    return null;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    if (options?.shouldIgnore?.()) return;
    if (options?.isOverHotspotUi?.(event.clientX, event.clientY)) return;

    dragMode = dragModeFromButton(event.button);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    clearDragCursor();
  };

  const onOrbitStart = () => {
    if (options?.shouldIgnore?.() || !dragMode) return;
    applyDragCursor(dragMode);
  };

  const onOrbitEnd = () => {
    clearDragCursor();
  };

  domElement.addEventListener('pointerdown', onPointerDown, true);
  domElement.addEventListener('pointerup', onPointerUp, true);
  domElement.addEventListener('pointercancel', onPointerUp, true);
  window.addEventListener('pointerup', onPointerUp, true);
  controls.addEventListener('start', onOrbitStart);
  controls.addEventListener('end', onOrbitEnd);

  return {
    dispose: () => {
      clearDragCursor();
      domElement.removeEventListener('pointerdown', onPointerDown, true);
      domElement.removeEventListener('pointerup', onPointerUp, true);
      domElement.removeEventListener('pointercancel', onPointerUp, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      controls.removeEventListener('start', onOrbitStart);
      controls.removeEventListener('end', onOrbitEnd);
    },
  };
}
