import { useState } from 'react';
import { DevViewPanel, type DevSceneOption } from './DevViewPanel';
import type { ClickCoords, DevSceneRef } from '../utils/devHotspotLogger';
import type { Tour, ViewPosition } from '../types/tour';
import type { DevTourMutateOptions } from '../utils/devTourApi';
import { devFabVariants, devToolsStackClassName } from './devViewPanelVariants';

interface DevToolsProps {
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  scene: DevSceneRef;
  currentSceneId: string;
  sceneOptions: DevSceneOption[];
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
}

export function DevTools({
  tour,
  onTourMutated,
  scene,
  currentSceneId,
  sceneOptions,
  view,
  clickCoords,
}: DevToolsProps) {
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className={devToolsStackClassName}>
      <button
        type='button'
        className={devFabVariants({ open: panelOpen })}
        aria-expanded={panelOpen}
        aria-controls='dev-view-panel'
        aria-label={panelOpen ? 'Hide dev panel' : 'Show dev panel'}
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
