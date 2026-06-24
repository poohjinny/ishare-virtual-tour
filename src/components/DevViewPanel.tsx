import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/cn';
import {
  DEV_URL_FLAG_TOGGLES,
  type DevUrlFlagToggle,
} from '../constants/devUrlFlags';
import { useAppSearchParams } from '../hooks/useAppSearchParams';
import { listTours, loadTour } from '../data/loadTour';
import {
  buildTourLocation,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../utils/tourPaths';
import {
  DEV_HOTSPOT_TABS,
  DEV_NAMING_DEFAULT_BODY,
  DEV_NAMING_DEFAULT_PRICE,
  DEV_NAMING_STATUS_OPTIONS,
  type DevHotspotTab,
} from '../constants/devHotspot';
import type { NamingOpportunityStatus, ViewPosition } from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  DEV_NAV_NAME_STORAGE_KEY,
  DEV_NO_NAME_STORAGE_KEY,
  formatViewPosition,
  logLandingView,
  slugifyHotspotName,
  toViewPosition,
  type DevSceneRef,
} from '../utils/devHotspotLogger';
import {
  DevTourApiError,
  devApplySceneDefaultView,
  devCreateNamingHotspot,
  devCreateNavHotspot,
} from '../utils/devTourApi';
import {
  devViewPanelActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelCoordsClassName,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelInputClassName,
  devViewPanelAboveMinimapClassName,
  devViewPanelRootClassName,
  devViewPanelSceneIdClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSectionLeadClassName,
  devViewPanelSectionTitleVariants,
  devViewPanelSectionVariants,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelTabVariants,
  devViewPanelTabsClassName,
  devViewPanelTextareaClassName,
  devViewPanelToggleHintClassName,
  devViewPanelToggleInputClassName,
  devViewPanelToggleLabelClassName,
  devViewPanelToggleListClassName,
  devViewPanelToggleNameClassName,
  devViewPanelHotspotSectionClassName,
  devViewPanelTitleClassName,
} from './devViewPanelVariants';

export interface DevSceneOption {
  id: string;
  title: string;
}

interface DevViewPanelProps {
  scene: DevSceneRef;
  currentSceneId: string;
  sceneOptions: DevSceneOption[];
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
  /** Stack above bottom-left floor plan minimap */
  aboveMinimap?: boolean;
}

type ActionStatus = 'idle' | 'working' | 'done' | 'error';

function readSessionValue(key: string): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(key)?.trim() ?? '';
}

function writeSessionValue(key: string, value: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const trimmed = value.trim();
  if (trimmed) sessionStorage.setItem(key, trimmed);
  else sessionStorage.removeItem(key);
}

export function DevViewPanel({
  scene,
  currentSceneId,
  sceneOptions,
  view,
  clickCoords,
  aboveMinimap = false,
}: DevViewPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const appSearchParams = useAppSearchParams();
  const tourOptions = listTours();
  const currentTourId = scene.tourId ?? '';
  const [landingStatus, setLandingStatus] = useState<ActionStatus>('idle');
  const [landingError, setLandingError] = useState<string | null>(null);
  const [navStatus, setNavStatus] = useState<ActionStatus>('idle');
  const [navError, setNavError] = useState<string | null>(null);
  const [namingStatus, setNamingStatus] = useState<ActionStatus>('idle');
  const [namingError, setNamingError] = useState<string | null>(null);

  const [navName, setNavName] = useState(() =>
    readSessionValue(DEV_NAV_NAME_STORAGE_KEY),
  );
  const [navTargetSceneId, setNavTargetSceneId] = useState('');
  const [navTargetTouched, setNavTargetTouched] = useState(false);

  const [noName, setNoName] = useState(() =>
    readSessionValue(DEV_NO_NAME_STORAGE_KEY),
  );
  const [noPrice, setNoPrice] = useState(DEV_NAMING_DEFAULT_PRICE);
  const [noStatus, setNoStatus] =
    useState<NamingOpportunityStatus>('coming_soon');
  const [noBody, setNoBody] = useState(DEV_NAMING_DEFAULT_BODY);
  const [hotspotTab, setHotspotTab] = useState<DevHotspotTab>('nav');

  const canWriteTour = Boolean(scene.tourId && view);
  const trimmedNavName = navName.trim();
  const trimmedNoName = noName.trim();
  const navSlug = useMemo(
    () => (trimmedNavName ? slugifyHotspotName(trimmedNavName) : ''),
    [trimmedNavName],
  );
  const noSlug = useMemo(
    () => (trimmedNoName ? slugifyHotspotName(trimmedNoName) : ''),
    [trimmedNoName],
  );

  const canCreateNav = Boolean(
    scene.tourId && clickCoords && trimmedNavName && navTargetSceneId,
  );
  const canCreateNaming = Boolean(
    scene.tourId &&
    clickCoords &&
    trimmedNoName &&
    noPrice.trim() &&
    noBody.trim(),
  );

  const sortedSceneOptions = useMemo(
    () => [...sceneOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [sceneOptions],
  );

  useEffect(() => {
    writeSessionValue(DEV_NAV_NAME_STORAGE_KEY, navName);
  }, [navName]);

  useEffect(() => {
    writeSessionValue(DEV_NO_NAME_STORAGE_KEY, noName);
  }, [noName]);

  useEffect(() => {
    if (navTargetTouched || !navSlug) return;
    const matchedScene = sortedSceneOptions.find(
      (entry) => entry.id === navSlug,
    );
    if (matchedScene) {
      setNavTargetSceneId(matchedScene.id);
    }
  }, [navSlug, navTargetTouched, sortedSceneOptions]);

  const buildScenePayload = useCallback(() => {
    if (!scene.tourId || !view) return null;
    return {
      tourId: scene.tourId,
      sceneId: scene.id,
      defaultView: toViewPosition(view.yaw, view.pitch, view.zoom ?? 0),
    };
  }, [scene.id, scene.tourId, view]);

  const buildHotspotPosition = useCallback(() => {
    if (!clickCoords) return null;
    return { yaw: clickCoords.yaw, pitch: clickCoords.pitch };
  }, [clickCoords]);

  const applyDefaultView = useCallback(async () => {
    const payload = buildScenePayload();
    if (!payload || !view) return;

    setLandingStatus('working');
    setLandingError(null);
    logLandingView(scene, view);

    try {
      await devApplySceneDefaultView(payload);
      setLandingStatus('done');
    } catch (error) {
      setLandingStatus('error');
      setLandingError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save defaultView',
      );
    }
  }, [buildScenePayload, scene, view]);

  const createNavHotspot = useCallback(async () => {
    const position = buildHotspotPosition();
    if (!scene.tourId || !position || !trimmedNavName || !navTargetSceneId)
      return;

    setNavStatus('working');
    setNavError(null);

    try {
      await devCreateNavHotspot({
        tourId: scene.tourId,
        sceneId: scene.id,
        name: trimmedNavName,
        position,
        targetSceneId: navTargetSceneId,
      });
      setNavStatus('done');
    } catch (error) {
      setNavStatus('error');
      setNavError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create nav hotspot',
      );
    }
  }, [
    buildHotspotPosition,
    navTargetSceneId,
    scene.id,
    scene.tourId,
    trimmedNavName,
  ]);

  const createNamingHotspot = useCallback(async () => {
    const position = buildHotspotPosition();
    if (
      !scene.tourId ||
      !position ||
      !trimmedNoName ||
      !noPrice.trim() ||
      !noBody.trim()
    ) {
      return;
    }

    setNamingStatus('working');
    setNamingError(null);

    try {
      await devCreateNamingHotspot({
        tourId: scene.tourId,
        sceneId: scene.id,
        name: trimmedNoName,
        position,
        price: noPrice.trim(),
        status: noStatus,
        body: noBody.trim(),
      });
      setNamingStatus('done');
    } catch (error) {
      setNamingStatus('error');
      setNamingError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create naming hotspot',
      );
    }
  }, [
    buildHotspotPosition,
    noBody,
    noPrice,
    noStatus,
    scene.id,
    scene.tourId,
    trimmedNoName,
  ]);

  useEffect(() => {
    if (
      landingStatus === 'idle' &&
      navStatus === 'idle' &&
      namingStatus === 'idle'
    ) {
      return;
    }

    const t = window.setTimeout(() => {
      if (landingStatus !== 'working') {
        setLandingStatus('idle');
        setLandingError(null);
      }
      if (navStatus !== 'working') {
        setNavStatus('idle');
        setNavError(null);
      }
      if (namingStatus !== 'working') {
        setNamingStatus('idle');
        setNamingError(null);
      }
    }, 2500);

    return () => window.clearTimeout(t);
  }, [landingStatus, namingStatus, navStatus]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        void applyDefaultView();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyDefaultView]);

  const markerCoords =
    clickCoords ? formatViewPosition({ ...clickCoords, zoom: 0 }) : '—';

  const setDevUrlFlag = useCallback(
    (toggle: DevUrlFlagToggle, enabled: boolean) => {
      navigate(
        `${location.pathname}${preservedSearchStringFrom(searchParams, toggle.urlPatch(enabled))}`,
        { replace: true },
      );
    },
    [location.pathname, navigate, searchParams],
  );

  return (
    <div
      className={cn(
        devViewPanelRootClassName,
        aboveMinimap && devViewPanelAboveMinimapClassName,
      )}
    >
      <p className={devViewPanelTitleClassName}>
        DEV — {scene.tourId ?? scene.id}
        {scene.clientId && scene.clientId !== (scene.tourId ?? scene.id) ?
          ` · ${scene.clientId}`
        : ''}{' '}
        / {scene.title ?? scene.id}
        {scene.title && (
          <span className={devViewPanelSceneIdClassName}> ({scene.id})</span>
        )}
      </p>

      {tourOptions.length > 1 ?
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Switch tour</span>
          <select
            className={devViewPanelSelectClassName}
            value={currentTourId}
            aria-label='Switch tour'
            onChange={(event) => {
              const nextTourId = event.target.value;
              if (!nextTourId || nextTourId === currentTourId) return;

              const nextTour = loadTour(nextTourId);
              const nextSceneId = resolveSceneId(nextTourId, currentSceneId);

              navigate(
                buildTourLocation(
                  nextTourId,
                  nextSceneId,
                  nextTour.firstScene,
                  searchParams,
                ),
                { replace: true },
              );
            }}
          >
            {tourOptions.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.facilityTitle} | {tour.label}
              </option>
            ))}
          </select>
        </label>
      : null}

      <section className={devViewPanelSectionVariants({ kind: 'flags' })}>
        <h3 className={devViewPanelSectionTitleVariants({ kind: 'flags' })}>
          URL flags
        </h3>
        <ul className={devViewPanelToggleListClassName}>
          {DEV_URL_FLAG_TOGGLES.map((toggle) => {
            const checked = toggle.isOn(appSearchParams);

            return (
              <li key={toggle.key}>
                <label className={devViewPanelToggleLabelClassName}>
                  <input
                    type='checkbox'
                    className={devViewPanelToggleInputClassName}
                    checked={checked}
                    onChange={(event) =>
                      setDevUrlFlag(toggle, event.currentTarget.checked)
                    }
                  />
                  <span>
                    <span className={devViewPanelToggleNameClassName}>
                      <code>{toggle.label}</code>
                    </span>
                    <span className={devViewPanelToggleHintClassName}>
                      {' '}
                      — {toggle.hint}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={devViewPanelSectionVariants({ kind: 'landing' })}>
        <h3 className={devViewPanelSectionTitleVariants({ kind: 'landing' })}>
          Landing view
        </h3>
        <p className={devViewPanelSectionLeadClassName}>
          Pan the scene — saves <code>defaultView</code> + bakes{' '}
          <code>thumbnail</code>
        </p>
        <p className={devViewPanelCoordsClassName}>
          {view ? formatViewPosition(view) : '—'}
        </p>
        <div className={devViewPanelActionsClassName}>
          <button
            type='button'
            className={devViewPanelBtnVariants({ tone: 'primary' })}
            onClick={() => void applyDefaultView()}
            disabled={!canWriteTour || landingStatus === 'working'}
          >
            {landingStatus === 'working' ?
              'Saving…'
            : landingStatus === 'done' ?
              'Saved!'
            : 'Apply defaultView (L)'}
          </button>
        </div>
        {landingError ?
          <p className={devViewPanelSectionHintClassName}>{landingError}</p>
        : null}
      </section>

      <section className={devViewPanelHotspotSectionClassName}>
        <h3 className={devViewPanelSectionTitleVariants({ kind: 'hotspot' })}>
          Hotspots
        </h3>
        <div
          className={devViewPanelTabsClassName}
          role='tablist'
          aria-label='Hotspot type'
        >
          {DEV_HOTSPOT_TABS.map((tab) => (
            <button
              key={tab.id}
              type='button'
              role='tab'
              id={`dev-hotspot-tab-${tab.id}`}
              aria-selected={hotspotTab === tab.id}
              aria-controls={`dev-hotspot-panel-${tab.id}`}
              className={devViewPanelTabVariants({
                kind: tab.id,
                active: hotspotTab === tab.id,
              })}
              onClick={() => setHotspotTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {hotspotTab === 'nav' ?
          <div
            id='dev-hotspot-panel-nav'
            role='tabpanel'
            aria-labelledby='dev-hotspot-tab-nav'
            className={devViewPanelSectionVariants({ kind: 'nav' })}
          >
            <p className={devViewPanelSectionLeadClassName}>
              Click the panorama for marker position — adds to this scene
            </p>
            <p className={devViewPanelCoordsClassName}>{markerCoords}</p>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Name</span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={navName}
                onChange={(e) => setNavName(e.target.value)}
                placeholder='e.g. Main Entrance'
                spellCheck={false}
                autoComplete='off'
              />
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Target scene
              </span>
              <select
                className={devViewPanelSelectClassName}
                value={navTargetSceneId}
                onChange={(e) => {
                  setNavTargetTouched(true);
                  setNavTargetSceneId(e.target.value);
                }}
              >
                <option value=''>Select scene…</option>
                {sortedSceneOptions.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title} ({entry.id})
                  </option>
                ))}
              </select>
            </label>

            {navSlug ?
              <p className={devViewPanelSlugPreviewClassName}>
                id <code>nav-to-{navSlug}</code> · uses target{' '}
                <code>defaultView</code>
              </p>
            : null}

            <div className={devViewPanelActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => void createNavHotspot()}
                disabled={!canCreateNav || navStatus === 'working'}
              >
                {navStatus === 'working' ?
                  'Creating…'
                : navStatus === 'done' ?
                  'Nav created!'
                : 'Create nav'}
              </button>
            </div>
            {navError ?
              <p className={devViewPanelSectionHintClassName}>{navError}</p>
            : null}
          </div>
        : <div
            id='dev-hotspot-panel-naming'
            role='tabpanel'
            aria-labelledby='dev-hotspot-tab-naming'
            className={devViewPanelSectionVariants({ kind: 'naming' })}
          >
            <p className={devViewPanelSectionLeadClassName}>
              Click the panorama for marker position — info hotspot on this
              scene
            </p>
            <p className={devViewPanelCoordsClassName}>{markerCoords}</p>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Name</span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={noName}
                onChange={(e) => setNoName(e.target.value)}
                placeholder='e.g. Parking Lot'
                spellCheck={false}
                autoComplete='off'
              />
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Price</span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={noPrice}
                onChange={(e) => setNoPrice(e.target.value)}
                placeholder='e.g. $75,000'
                spellCheck={false}
                autoComplete='off'
              />
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Status</span>
              <select
                className={devViewPanelSelectClassName}
                value={noStatus}
                onChange={(e) =>
                  setNoStatus(e.target.value as NamingOpportunityStatus)
                }
              >
                {DEV_NAMING_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Body</span>
              <textarea
                className={devViewPanelTextareaClassName}
                value={noBody}
                onChange={(e) => setNoBody(e.target.value)}
                rows={3}
                spellCheck={true}
              />
            </label>

            {noSlug ?
              <p className={devViewPanelSlugPreviewClassName}>
                id <code>info-{noSlug}</code> · deep link{' '}
                <code>?no={noSlug}</code>
              </p>
            : null}

            <div className={devViewPanelActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => void createNamingHotspot()}
                disabled={!canCreateNaming || namingStatus === 'working'}
              >
                {namingStatus === 'working' ?
                  'Creating…'
                : namingStatus === 'done' ?
                  'NO created!'
                : 'Create NO'}
              </button>
            </div>
            {namingError ?
              <p className={devViewPanelSectionHintClassName}>{namingError}</p>
            : null}
          </div>
        }
      </section>
    </div>
  );
}
