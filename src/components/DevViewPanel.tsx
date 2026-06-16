import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ViewPosition } from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  copyToClipboard,
  formatLandingJson,
  formatNavHotspotJson,
  formatNamingHotspotJson,
  formatViewPosition,
  getDevHotspotName,
  logLandingView,
  setDevHotspotName,
  slugifyHotspotName,
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
  const [hotspotName, setHotspotName] = useState(
    () => getDevHotspotName() ?? '',
  );

  const nameOptions = useMemo(
    () => (hotspotName.trim() ? { name: hotspotName.trim() } : undefined),
    [hotspotName],
  );

  const hotspotSlug = useMemo(() => {
    const trimmed = hotspotName.trim();
    return trimmed ? slugifyHotspotName(trimmed) : '';
  }, [hotspotName]);

  useEffect(() => {
    setDevHotspotName(hotspotName);
  }, [hotspotName]);

  const copyLanding = useCallback(async () => {
    if (!view) return;
    logLandingView(scene, view);
    const ok = await copyToClipboard(formatLandingJson(scene, view));
    setCopied(ok ? 'landing' : null);
  }, [scene, view]);

  const copyNavHotspot = useCallback(async () => {
    if (!clickCoords) return;
    const ok = await copyToClipboard(
      formatNavHotspotJson(
        clickCoords.yaw,
        clickCoords.pitch,
        scene,
        nameOptions,
      ),
    );
    setCopied(ok ? 'nav' : null);
  }, [clickCoords, nameOptions, scene]);

  const copyNamingHotspot = useCallback(async () => {
    if (!clickCoords) return;
    const ok = await copyToClipboard(
      formatNamingHotspotJson(
        clickCoords.yaw,
        clickCoords.pitch,
        scene,
        nameOptions,
      ),
    );
    setCopied(ok ? 'naming' : null);
  }, [clickCoords, nameOptions, scene]);

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
        DEV — {scene.tourId ?? scene.id}
        {scene.clientId && scene.clientId !== (scene.tourId ?? scene.id) ?
          ` · ${scene.clientId}`
        : ''}{' '}
        / {scene.title ?? scene.id}
        {scene.title && (
          <span className='dev-panel__scene-id'> ({scene.id})</span>
        )}
      </p>

      <section className='dev-panel__section dev-panel__section--landing'>
        <h3 className='dev-panel__section-title'>Landing view</h3>
        <p className='dev-panel__section-lead'>
          Pan the scene — updates <code>defaultView</code>
        </p>
        <p className='dev-panel__coords'>
          {view ? formatViewPosition(view) : '—'}
        </p>
        <div className='dev-panel__actions'>
          <button
            type='button'
            className='dev-panel__btn'
            onClick={() => void copyLanding()}
            disabled={!view}
          >
            {copied === 'landing' ? 'Copied!' : 'Copy landing JSON (L)'}
          </button>
        </div>
      </section>

      <section className='dev-panel__section dev-panel__section--hotspot'>
        <h3 className='dev-panel__section-title'>Hotspot</h3>
        <p className='dev-panel__section-lead'>
          Click the panorama for marker position
        </p>
        <p className='dev-panel__coords'>
          {clickCoords ? formatViewPosition({ ...clickCoords, zoom: 0 }) : '—'}
        </p>

        <label className='dev-panel__field'>
          <span className='dev-panel__field-label'>Hotspot name</span>
          <input
            className='dev-panel__input'
            type='text'
            value={hotspotName}
            onChange={(e) => setHotspotName(e.target.value)}
            placeholder='e.g. Parking Lot'
            spellCheck={false}
            autoComplete='off'
          />
        </label>

        {hotspotSlug ?
          <p className='dev-panel__slug-preview'>
            nav <code>nav-to-{hotspotSlug}</code> · NO{' '}
            <code>info-{hotspotSlug}</code>
          </p>
        : null}

        <div className='dev-panel__actions'>
          <button
            type='button'
            className='dev-panel__btn dev-panel__btn--secondary'
            onClick={() => void copyNavHotspot()}
            disabled={!clickCoords}
          >
            {copied === 'nav' ? 'Copied!' : 'Copy nav JSON'}
          </button>
          <button
            type='button'
            className='dev-panel__btn dev-panel__btn--secondary'
            onClick={() => void copyNamingHotspot()}
            disabled={!clickCoords}
          >
            {copied === 'naming' ? 'Copied!' : 'Copy NO JSON'}
          </button>
        </div>
        <p className='dev-panel__section-hint'>
          <strong>nav</strong> = scene preview marker · <strong>NO</strong> =
          naming opportunity on target scene
        </p>
      </section>
    </div>
  );
}
