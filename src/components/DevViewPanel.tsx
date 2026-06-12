import { useCallback, useEffect, useState } from 'react';
import type { ViewPosition } from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  copyToClipboard,
  formatHotspotPositionJson,
  formatLandingJson,
  formatViewPosition,
  logLandingView,
  type DevSceneRef,
} from '../utils/devHotspotLogger';
import './DevViewPanel.css';

interface DevViewPanelProps {
  scene: DevSceneRef;
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
  /** Stack above bottom-left floor plan minimap */
  aboveMinimap?: boolean;
}

export function DevViewPanel({
  scene,
  view,
  clickCoords,
  aboveMinimap = false,
}: DevViewPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyLanding = useCallback(async () => {
    if (!view) return;
    logLandingView(scene, view);
    const ok = await copyToClipboard(formatLandingJson(scene, view));
    setCopied(ok ? 'landing' : null);
  }, [scene, view]);

  const copyHotspot = useCallback(async () => {
    if (!clickCoords) return;
    const ok = await copyToClipboard(
      formatHotspotPositionJson(clickCoords.yaw, clickCoords.pitch),
    );
    setCopied(ok ? 'hotspot' : null);
  }, [clickCoords]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        void copyLanding();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [copyLanding]);

  return (
    <div
      className={`dev-panel${aboveMinimap ? ' dev-panel--above-minimap' : ''}`}
    >
      <p className='dev-panel__title'>
        DEV — {scene.clientId ? `${scene.clientId} / ` : ''}
        {scene.title ?? scene.id}
        {scene.title && (
          <span className='dev-panel__scene-id'> ({scene.id})</span>
        )}
      </p>

      <div className='dev-panel__row'>
        <span className='dev-panel__label'>Landing (view)</span>
        <span className='dev-panel__value'>
          {view ? formatViewPosition(view) : '—'}
        </span>
      </div>

      <div className='dev-panel__row'>
        <span className='dev-panel__label'>Click (hotspot)</span>
        <span className='dev-panel__value'>
          {clickCoords ? formatViewPosition({ ...clickCoords, zoom: 0 }) : '—'}
        </span>
      </div>

      <div className='dev-panel__actions'>
        <button
          type='button'
          className='dev-panel__btn'
          onClick={() => void copyLanding()}
        >
          {copied === 'landing' ? 'Copied!' : 'Copy landing JSON (L)'}
        </button>
        <button
          type='button'
          className='dev-panel__btn dev-panel__btn--secondary'
          onClick={() => void copyHotspot()}
          disabled={!clickCoords}
        >
          {copied === 'hotspot' ? 'Copied!' : 'Copy hotspot JSON'}
        </button>
      </div>

      <p className='dev-panel__hint'>
        Pan to the desired start view, then copy landing JSON into the matching
        client&apos;s <code>tours/&#123;client&#125;.json</code>{' '}
        <code>defaultView</code>.
      </p>
    </div>
  );
}
