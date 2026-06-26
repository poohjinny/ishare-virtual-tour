import { useEffect, useState } from 'react';
import { DevViewPanel, type DevSceneOption } from './DevViewPanel';
import type { ClickCoords, DevSceneRef } from '../utils/devHotspotLogger';
import type { Tour, ViewPosition } from '../types/tour';
import type { DevTourMutateOptions } from '../utils/devTourApi';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import { isTypingTarget } from '../utils/isTypingTarget';
import { devFabVariants, devToolsStackClassName } from './devViewPanelVariants';

interface DevToolsProps {
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  scene: DevSceneRef;
  currentSceneId: string;
  sceneOptions: DevSceneOption[];
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
  panelStack?: TourPanelStack;
}

export function DevTools({
  tour,
  onTourMutated,
  scene,
  currentSceneId,
  sceneOptions,
  view,
  clickCoords,
  panelStack,
}: DevToolsProps) {
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    return panelStack?.registerPanel('dev-panel', () => {
      setPanelOpen(false);
    });
  }, [panelStack]);

  useEffect(() => {
    if (!panelStack) return;
    if (panelOpen) panelStack.openPanel('dev-panel');
    else panelStack.closePanel('dev-panel');
  }, [panelOpen, panelStack]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'd' && event.key !== 'D') return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      setPanelOpen((open) => !open);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <div className={devToolsStackClassName}>
      <button
        type='button'
        className={devFabVariants({ open: panelOpen })}
        aria-expanded={panelOpen}
        aria-controls='dev-view-panel'
        aria-label={panelOpen ? 'Hide dev panel (D)' : 'Show dev panel (D)'}
        onClick={() => setPanelOpen((open) => !open)}
      >
        Dev
      </button>

      {panelOpen ?
        <DevViewPanel
          id='dev-view-panel'
          tour={tour}
          onTourMutated={onTourMutated}
          scene={scene}
          currentSceneId={currentSceneId}
          sceneOptions={sceneOptions}
          view={view}
          clickCoords={clickCoords}
        />
      : null}
    </div>
  );
}
