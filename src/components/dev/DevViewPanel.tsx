import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { subscribeDevCatalogSnapshot } from '../../data/devCatalogSnapshot';
import {
  listRoutableTourIds,
  listTours,
  loadTour,
  removeDevTourCache,
  setDevTourCache,
  tryLoadTour,
  type TourListItem,
} from '../../data/loadTour';
import { normalizeTourAssets } from '../../services/normalizeTourAssets';
import {
  buildTourLocation,
  isRootPathWithoutTour,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../../utils/tourPaths';
import { getTourClientId } from '../../utils/tourClientId';
import { useFallbackImageSrc } from '../../hooks/useFallbackImageSrc';
import {
  clientBrandFaviconCandidates,
  resolveTourBranding,
  tourBrandFaviconCandidates,
} from '../../utils/resolveTourBranding';
import {
  DEV_PANEL_TABS,
  DEV_PANEL_PRIMARY_TABS,
  DEV_SHELL_TOUR_ID,
  type DevPanelTab,
} from '../../constants/devPanel';
import { useDevPanelLayout, useDevPanelTheme } from '../../utils/devPanelPrefs';
import type { Tour, ViewPosition } from '../../types/tour';
import type { DevSceneRef } from '../../utils/devHotspotLogger';
import type { DevHotspotMovePosition } from '../../utils/devTourBridge';
import {
  devFetchCatalogClients,
  devFetchTour,
  refreshDevCatalogSnapshot,
  type DevCatalogClient,
  type DevTourMutateOptions,
} from '../../utils/devTourApi';
import { cn } from '../../lib/cn';
import {
  devViewPanelBodyClassName,
  devViewPanelRootFloatingClassName,
  devViewPanelRootVariants,
  devViewPanelTabLeadClassName,
  devViewPanelStickyHeaderVariants,
  devViewPanelPrimaryTabsVariants,
  devViewPanelTabPanelClassName,
  devViewPanelTabVariants,
} from './devViewPanelVariants';
import { DevPanelSectionPersistProvider } from './DevPanelSectionPersist';
import { DevClientPanel } from './DevClientPanel';
import { DevPanelHeaderChrome } from './DevPanelHeaderChrome';
import { DevSceneTabPanel } from './DevSceneTabPanel';
import { DevScenesListPanel } from './DevScenesListPanel';
import { DevNamingCatalogPanel } from './DevNamingCatalogPanel';
import { DevToursCatalogPanel } from './DevToursCatalogPanel';

const MemoDevSceneTabPanel = memo(DevSceneTabPanel);
const MemoDevScenesListPanel = memo(DevScenesListPanel);
const MemoDevNamingCatalogPanel = memo(DevNamingCatalogPanel);
const MemoDevToursCatalogPanel = memo(DevToursCatalogPanel);
const MemoDevClientPanel = memo(DevClientPanel);

export interface DevSceneOption {
  id: string;
  title: string;
}

interface DevViewPanelProps {
  id?: string;
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  scene: DevSceneRef;
  currentSceneId: string;
  sceneOptions: DevSceneOption[];
  captureSceneThumbnail?: () => Promise<Blob | null>;
  getCurrentView?: () => ViewPosition | null;
  /** Restore the pre-hover camera after Manage list hover preview. */
  animateToView?: (view: ViewPosition) => Promise<void> | void;
  focusHotspot?: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
  /** Currently open naming / place-overview hotspot id (viewer selection). */
  activeNamingHotspotId?: string | null;
  openNamingOpportunity?: (sceneId: string, hotspotId: string) => void;
  /**
   * Fires when hotspot create is armed — 3D uses this to pause
   * floor click-to-move so placement clicks are not stolen.
   */
  onHotspotPlacementCaptureChange?: (active: boolean) => void;
  /** Manage → Move — which hotspot is armed for viewer drag-drop. */
  onHotspotMoveIdChange?: (hotspotId: string | null) => void;
  /** Register commit handler for viewer drag-drop saves. */
  registerHotspotMoveCommit?: (
    handler: ((position: DevHotspotMovePosition) => Promise<void>) | null,
  ) => void;
  onClose?: () => void;
  /** When false, close portaled header/tour menus (panel stays mounted). */
  panelOpen?: boolean;
}

function DevViewPanelInner({
  id,
  tour,
  onTourMutated,
  scene,
  currentSceneId,
  sceneOptions,
  captureSceneThumbnail,
  getCurrentView,
  animateToView,
  focusHotspot,
  activeNamingHotspotId = null,
  openNamingOpportunity,
  onHotspotPlacementCaptureChange,
  onHotspotMoveIdChange,
  registerHotspotMoveCommit,
  onClose,
  panelOpen = true,
}: DevViewPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(
    () => subscribeDevCatalogSnapshot(() => setCatalogTick((tick) => tick + 1)),
    [],
  );

  const tourOptions = useMemo(() => listTours(), [catalogTick]);
  const tourGroups = useMemo(() => {
    const groups: {
      clientId: string;
      clientName: string;
      tours: TourListItem[];
    }[] = [];
    const byClientId = new Map<string, (typeof groups)[number]>();
    for (const option of tourOptions) {
      let group = byClientId.get(option.clientId);
      if (!group) {
        group = {
          clientId: option.clientId,
          clientName: option.label,
          tours: [],
        };
        byClientId.set(option.clientId, group);
        groups.push(group);
      }
      group.tours.push(option);
    }
    return groups;
  }, [tourOptions]);
  const currentTourId = scene.tourId ?? '';
  const isModel3dTour = tour.viewerType === 'model3d';

  const [manageClientId, setManageClientId] = useState('');
  const [catalogClients, setCatalogClients] = useState<DevCatalogClient[]>([]);
  const [selectedNamingId, setSelectedNamingId] = useState('');
  const [namingAddEnsureKey, setNamingAddEnsureKey] = useState(0);
  const [namingCatalogClearKey, setNamingCatalogClearKey] = useState(0);
  const [hotspotInteractionClearKey, setHotspotInteractionClearKey] =
    useState(0);
  const [deletedNamingId, setDeletedNamingId] = useState<string | null>(null);
  const [deletedNamingHotspotKey, setDeletedNamingHotspotKey] = useState(0);
  const [panelTab, setPanelTab] = useState<DevPanelTab>('scene');
  const devPanelTheme = useDevPanelTheme();
  const devPanelLayout = useDevPanelLayout();
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const panelScrollTopRequestRef = useRef(false);

  const currentClientId = useMemo(() => {
    if (tour.id === DEV_SHELL_TOUR_ID || !tour.firstScene) return '';
    return getTourClientId(tour);
  }, [tour]);

  useEffect(() => {
    if (panelTab !== 'tour' && panelTab !== 'client') return;

    void devFetchCatalogClients()
      .then((clients) => {
        setCatalogClients(clients);
        setManageClientId((current) => {
          if (current && clients.some((client) => client.id === current)) {
            return current;
          }
          if (!tour.firstScene || tour.id === DEV_SHELL_TOUR_ID) {
            return '';
          }
          const openClientId = getTourClientId(tour);
          if (
            openClientId &&
            clients.some((client) => client.id === openClientId)
          ) {
            return openClientId;
          }
          return '';
        });
      })
      .catch(() => {
        setCatalogClients([]);
      });
  }, [panelTab, tour, catalogTick]);

  useLayoutEffect(() => {
    if (!panelScrollTopRequestRef.current) return;
    panelScrollTopRequestRef.current = false;
    panelBodyRef.current?.scrollTo({ top: 0, left: 0 });
  }, [panelTab]);

  const stickyTourBranding = useMemo(
    () => resolveTourBranding(tour),
    [tour, catalogTick],
  );
  const stickyIconCandidates = useMemo(() => {
    const clientId = getTourClientId(tour);
    return [
      ...tourBrandFaviconCandidates(tour),
      ...clientBrandFaviconCandidates(clientId, stickyTourBranding?.favicon),
      stickyTourBranding?.logo,
    ];
  }, [stickyTourBranding?.favicon, stickyTourBranding?.logo, tour]);
  const { src: stickyTourIcon, onError: onStickyTourIconError } =
    useFallbackImageSrc(stickyIconCandidates);
  const currentTourEntry = useMemo(
    () => tourOptions.find((option) => option.id === currentTourId),
    [currentTourId, tourOptions],
  );
  const isDevShellTour =
    tour.id === DEV_SHELL_TOUR_ID || currentTourId === DEV_SHELL_TOUR_ID;
  const stickyTourName =
    isDevShellTour ? 'Select a tour' : (
      (currentTourEntry?.facilityTitle ?? tour.title ?? currentTourId)
    );

  useEffect(() => {
    if (!isDevShellTour) return;
    setManageClientId('');
  }, [isDevShellTour]);

  const handleSwitchTour = useCallback(
    (nextTourId: string) => {
      if (!nextTourId) return;
      const atRootWithoutTour = isRootPathWithoutTour(location.pathname);
      if (nextTourId === currentTourId && !atRootWithoutTour) return;
      const nextTour = loadTour(nextTourId);
      const nextSceneId = resolveSceneId(nextTourId, currentSceneId);
      navigate(
        buildTourLocation(
          nextTourId,
          nextSceneId,
          nextTour.firstScene,
          searchParams,
          { intro: null },
        ),
        { replace: true },
      );
    },
    [currentSceneId, currentTourId, location.pathname, navigate, searchParams],
  );

  const openIntroGallery = useCallback(() => {
    navigate(
      {
        pathname: '/',
        search: preservedSearchStringFrom(searchParams, { intro: '1' }),
      },
      { replace: true },
    );
  }, [navigate, searchParams]);

  const handleClientDeleted = useCallback(
    async (result: {
      clientId: string;
      deletedTourIds: string[];
      redirectTourId: string | null;
    }) => {
      for (const tourId of result.deletedTourIds) {
        removeDevTourCache(tourId);
      }

      const openClientDeleted = result.deletedTourIds.includes(tour.id);
      if (!openClientDeleted) return;

      const resolveNextTour = async (tourId: string): Promise<Tour | null> => {
        try {
          const fresh = normalizeTourAssets(await devFetchTour(tourId));
          setDevTourCache(fresh);
          return fresh;
        } catch {
          return tryLoadTour(tourId);
        }
      };

      const nextTourId =
        result.redirectTourId ?? listRoutableTourIds()[0] ?? null;

      if (nextTourId) {
        const nextTour = await resolveNextTour(nextTourId);
        if (nextTour) {
          navigate(
            buildTourLocation(
              nextTour.id,
              nextTour.firstScene,
              nextTour.firstScene,
              searchParams,
            ),
            { replace: true },
          );
          return;
        }
      }

      navigate(`/${preservedSearchStringFrom(searchParams)}`, {
        replace: true,
      });
    },
    [navigate, searchParams, tour.id],
  );

  const openCreateNamingTab = useCallback(() => {
    setHotspotInteractionClearKey((key) => key + 1);
    setPanelTab('naming');
    setNamingAddEnsureKey((key) => key + 1);
  }, []);

  const requestSceneTab = useCallback(() => {
    setPanelTab('scene');
  }, []);

  const clearNamingCatalogEdit = useCallback(() => {
    setNamingCatalogClearKey((key) => key + 1);
  }, []);

  const handleNamingHotspotDeleted = useCallback((namingId: string) => {
    setDeletedNamingId(namingId);
    setDeletedNamingHotspotKey((key) => key + 1);
  }, []);

  const clearHotspotInteraction = useCallback(() => {
    setHotspotInteractionClearKey((key) => key + 1);
  }, []);

  const refreshCatalogSnapshot = useCallback(async () => {
    await refreshDevCatalogSnapshot();
  }, []);

  return (
    <DevPanelSectionPersistProvider>
      <div
        id={id}
        data-dev-theme={devPanelTheme}
        className={cn(
          devViewPanelRootVariants({ tab: panelTab }),
          devPanelLayout === 'floating' && devViewPanelRootFloatingClassName,
          // Push sits flush beside the stage — no edge border.
          devPanelLayout === 'push' && 'border-0',
        )}
      >
        <div className={devViewPanelStickyHeaderVariants({ tab: panelTab })}>
          <DevPanelHeaderChrome
            tourLogoSrc={stickyTourIcon}
            tourLogoAlt={stickyTourBranding?.logoAlt ?? tour.title}
            onTourLogoError={onStickyTourIconError}
            stickyTourName={stickyTourName}
            tourGroups={tourGroups}
            currentTourId={currentTourId}
            tourId={tour.id}
            isModel3dTour={isModel3dTour}
            panelOpen={panelOpen}
            onClose={onClose}
            onSwitchTour={handleSwitchTour}
            onOpenIntroGallery={openIntroGallery}
          />

          <div
            className={devViewPanelPrimaryTabsVariants({ tab: panelTab })}
            role='tablist'
            aria-label='Dev panel section'
          >
            {DEV_PANEL_PRIMARY_TABS.map((tab) => (
              <button
                key={tab.id}
                type='button'
                role='tab'
                id={`dev-panel-tab-${tab.id}`}
                aria-selected={panelTab === tab.id}
                aria-controls={`dev-panel-${tab.id}`}
                className={devViewPanelTabVariants({
                  depth: 'primary',
                  kind: tab.id,
                  active: panelTab === tab.id,
                })}
                onClick={() => setPanelTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={devViewPanelBodyClassName} ref={panelBodyRef}>
          <p className={devViewPanelTabLeadClassName}>
            {DEV_PANEL_TABS.find((tab) => tab.id === panelTab)?.description}
          </p>
          <div
            id='dev-panel-scene'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scene'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'scene'}
          >
            <MemoDevSceneTabPanel
              tour={tour}
              onTourMutated={onTourMutated}
              scene={scene}
              sceneOptions={sceneOptions}
              captureSceneThumbnail={captureSceneThumbnail}
              getCurrentView={getCurrentView}
              animateToView={animateToView}
              focusHotspot={focusHotspot}
              openNamingOpportunity={openNamingOpportunity}
              onHotspotPlacementCaptureChange={onHotspotPlacementCaptureChange}
              onHotspotMoveIdChange={onHotspotMoveIdChange}
              registerHotspotMoveCommit={registerHotspotMoveCommit}
              selectedNamingId={selectedNamingId}
              onSelectedNamingIdChange={setSelectedNamingId}
              onOpenCreateNaming={openCreateNamingTab}
              onRequestSceneTab={requestSceneTab}
              onClearNamingCatalogEdit={clearNamingCatalogEdit}
              onNamingHotspotDeleted={handleNamingHotspotDeleted}
              hotspotInteractionClearKey={hotspotInteractionClearKey}
            />
          </div>
          {panelTab === 'client' ?
            <div
              id='dev-panel-client'
              role='tabpanel'
              aria-labelledby='dev-panel-tab-client'
              className={devViewPanelTabPanelClassName}
            >
              <MemoDevClientPanel
                catalogClients={catalogClients}
                catalogTick={catalogTick}
                currentClientId={currentClientId}
                manageClientId={manageClientId}
                onManageClientIdChange={setManageClientId}
                onCatalogRefresh={refreshCatalogSnapshot}
                onClientDeleted={handleClientDeleted}
              />
            </div>
          : null}
          <div
            id='dev-panel-scenes'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scenes'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'scenes'}
          >
            <MemoDevScenesListPanel
              tour={tour}
              onTourMutated={onTourMutated}
              scene={scene}
              captureSceneThumbnail={captureSceneThumbnail}
              getCurrentView={getCurrentView}
              isModel3dTour={isModel3dTour}
              onRequestSceneTab={requestSceneTab}
            />
          </div>
          <div
            id='dev-panel-naming'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-naming'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'naming'}
          >
            <MemoDevNamingCatalogPanel
              tour={tour}
              onTourMutated={onTourMutated}
              scene={scene}
              openNamingOpportunity={openNamingOpportunity}
              activeNamingHotspotId={activeNamingHotspotId}
              getCurrentView={getCurrentView}
              animateToView={animateToView}
              focusHotspot={focusHotspot}
              ensureOpenKey={namingAddEnsureKey}
              catalogClearKey={namingCatalogClearKey}
              onSelectNamingId={setSelectedNamingId}
              onClearHotspotInteraction={clearHotspotInteraction}
              deletedNamingId={deletedNamingId}
              deletedNamingHotspotKey={deletedNamingHotspotKey}
            />
          </div>
          <div
            id='dev-panel-tour'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-tour'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'tour'}
          >
            <MemoDevToursCatalogPanel
              tour={tour}
              onTourMutated={onTourMutated}
              catalogTick={catalogTick}
              catalogClients={catalogClients}
              currentSceneId={currentSceneId}
              active={panelTab === 'tour'}
            />
          </div>
        </div>
      </div>
    </DevPanelSectionPersistProvider>
  );
}

export const DevViewPanel = memo(DevViewPanelInner);
