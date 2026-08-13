import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DEV_HOTSPOT_MANAGE_FILTER_TABS,
  DEV_INFO_DISPLAY_OPTIONS,
  type DevHotspotManageFilter,
  type DevHotspotTab,
  getDevHotspotSectionConfig,
  type DevHotspotManageScope,
} from '../../constants/devHotspot';
import {
  NAV_HOTSPOT_VARIANT_DEFAULT,
  NAV_HOTSPOT_VARIANT_OPTIONS,
  resolveNavHotspotVariant,
  serializeNavHotspotVariant,
} from '../../constants/navHotspotVariant';
import type {
  Hotspot,
  NavHotspotVariant,
  PopupDisplay,
  Scene,
  Tour,
  ViewPosition,
} from '../../types/tour';
import { isWorldPosition } from '../../types/tour';
import { resolveHotspotNamingRecord } from '../../utils/namingSceneInherit';
import { resolveNamingVisibility } from '../../utils/namingVisibility';
import {
  resolveTourSceneOrder,
} from '../../utils/sceneOrder';
import { sceneIdsWithTitleCollisions } from '../../viewer-shared/sceneDepth';
import type { ClickCoords } from '../../utils/devHotspotLogger';
import type { DevHotspotMovePosition } from '../../utils/devTourBridge';
import {
  DEV_NAV_NAME_STORAGE_KEY,
  formatCoords,
  formatViewPosition,
  isWorldClickCoords,
  logLandingView,
  slugifyHotspotName,
  toViewPosition,
  type DevSceneRef,
} from '../../utils/devHotspotLogger';
import {
  allocateOpaqueId,
  createOpaqueId,
  OPAQUE_SCENE_ID_PREFIX,
} from '../../utils/opaqueId';
import {
  DevTourApiError,
  devApplySceneDefaultView,
  devCreateInfoHotspot,
  devCreatePlaceOverviewHotspot,
  devCreateNamingHotspot,
  devCreateNavHotspot,
  devCreateScene,
  devDeleteHotspot,
  devReplaceScenePanorama,
  devUpdateHotspotPosition,
  devUpdateInfoHotspot,
  devUpdateNavHotspot,
  devUpdateNamingHotspot,
  type DevTourMutateOptions,
} from '../../utils/devTourApi';
import { buildTourLocation } from '../../utils/tourPaths';
import {
  catalogVisibilityManageBadgeLabel,
  catalogVisibilityShowsManageBadge,
  resolveHotspotMarkerVisibility,
} from '../../utils/sceneVisibility';
import {
  findHotspotInTour,
  findNamingHotspotByNamingId,
} from '../../utils/findTourHotspot';
import { isPlaceOverviewHotspot } from '../../utils/placeOverview';
import { cn } from '../../lib/cn';
import {
  devViewPanelActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelIconBtnVariants,
  devViewPanelCoordsClassName,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelInputClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelTabPanelBodyClassName,
  devViewPanelToggleInputClassName,
  devViewPanelToggleLabelClassName,
  devViewPanelToggleNameClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemBodyClassName,
  devViewPanelManageListItemContentClassName,
  devViewPanelManageListItemIconActionsClassName,
  devViewPanelManageListItemDescBulletItemClassName,
  devViewPanelManageListItemDescBulletListClassName,
  devViewPanelManageListItemDescStackClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemTitleClassName,
  formatManageListItemId,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemSceneBadgesClassName,
  devViewPanelManageListItemMainRowClassName,
  devHotspotKindBadgeVariants,
  type DevHotspotKindBadgeKind,
} from './devViewPanelVariants';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import { DevPanelFileField } from './DevPanelFileField';
import { DevPanelFileInput } from './DevPanelFileInput';
import { DevPanoramaFilePreview } from './DevPanoramaFilePreview';
import { DevPanelFormGroup } from './DevPanelFormGroup';
import { DevPanelTertiaryTabs } from './DevPanelTertiaryTabs';
import { DevPanelDescriptionTextarea } from './DevPanelDescriptionTextarea';
import { Badge } from '../ui/Badge';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import {
  type ActionStatus,
  confirmDevPanelDelete,
  hotspotDisplayLabel,
  isNamingInfoHotspot,
  readSessionValue,
  resolveModel3dSceneCreatePayload,
  writeSessionValue,
} from './devViewPanelHelpers';

function hotspotKindLabel(hotspot: Hotspot): string {
  if (hotspot.type === 'nav') {
    const variant = resolveNavHotspotVariant(hotspot);
    const variantLabel =
      NAV_HOTSPOT_VARIANT_OPTIONS.find((option) => option.value === variant)
        ?.label ?? 'Discover';
    return `Nav · ${variantLabel}`;
  }
  if (isNamingInfoHotspot(hotspot)) return 'NO';
  if (isPlaceOverviewHotspot(hotspot)) return 'Overview';
  if (hotspot.type === 'info') return 'Info';
  return hotspot.type;
}

function hotspotKindBadgeKind(hotspot: Hotspot): DevHotspotKindBadgeKind {
  if (hotspot.type === 'nav') return 'nav';
  if (isNamingInfoHotspot(hotspot)) return 'naming';
  return 'info';
}

function matchesHotspotManageFilter(
  hotspot: Hotspot,
  filter: DevHotspotManageFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'nav') return hotspot.type === 'nav';
  if (filter === 'naming') return isNamingInfoHotspot(hotspot);
  return hotspot.type === 'info' && !isNamingInfoHotspot(hotspot);
}

function formatHotspotPosition(hotspot: Hotspot): string {
  if (isWorldPosition(hotspot.position)) {
    return formatCoords(hotspot.position);
  }
  return formatViewPosition(hotspot.position);
}

function hotspotManageKindOrder(hotspot: Hotspot): number {
  if (isPlaceOverviewHotspot(hotspot)) return 0;
  if (hotspot.type === 'nav') return 1;
  if (isNamingInfoHotspot(hotspot)) return 2;
  if (hotspot.type === 'info') return 3;
  return 4;
}

function sortSceneHotspotsForManage(
  hotspots: Hotspot[],
  tour: Tour,
  hostScene?: Scene | null,
): Hotspot[] {
  return [...hotspots].sort((a, b) => {
    const kindDiff = hotspotManageKindOrder(a) - hotspotManageKindOrder(b);
    if (kindDiff !== 0) return kindDiff;

    const labelDiff = hotspotDisplayLabel(a, tour, hostScene).localeCompare(
      hotspotDisplayLabel(b, tour, hostScene),
      undefined,
      { sensitivity: 'base' },
    );
    if (labelDiff !== 0) return labelDiff;

    return a.id.localeCompare(b.id);
  });
}


type DevSceneOption = {
  id: string;
  title: string;
};

type DevSceneTabPanelProps = {
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  scene: DevSceneRef;
  sceneOptions: DevSceneOption[];
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
  captureSceneThumbnail?: () => Promise<Blob | null>;
  getCurrentView?: () => ViewPosition | null;
  animateToView?: (view: ViewPosition) => Promise<void> | void;
  focusHotspot?: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
  openNamingOpportunity?: (sceneId: string, hotspotId: string) => void;
  onHotspotPlacementCaptureChange?: (active: boolean) => void;
  onHotspotMoveIdChange?: (hotspotId: string | null) => void;
  registerHotspotMoveCommit?: (
    handler: ((position: DevHotspotMovePosition) => Promise<void>) | null,
  ) => void;
  selectedNamingId: string;
  onSelectedNamingIdChange: (namingId: string) => void;
  onOpenCreateNaming: () => void;
  onRequestSceneTab?: () => void;
  onClearNamingCatalogEdit?: () => void;
  onNamingHotspotDeleted?: (namingId: string) => void;
  hotspotInteractionClearKey: number;
};

export function DevSceneTabPanel({
  tour,
  onTourMutated,
  scene,
  sceneOptions,
  view,
  clickCoords,
  captureSceneThumbnail,
  getCurrentView,
  animateToView,
  focusHotspot,
  openNamingOpportunity,
  onHotspotPlacementCaptureChange,
  onHotspotMoveIdChange,
  registerHotspotMoveCommit,
  selectedNamingId,
  onSelectedNamingIdChange,
  onOpenCreateNaming,
  onRequestSceneTab,
  onClearNamingCatalogEdit,
  onNamingHotspotDeleted,
  hotspotInteractionClearKey,
}: DevSceneTabPanelProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isModel3dTour = tour.viewerType === 'model3d';
  const [landingStatus, setLandingStatus] = useState<ActionStatus>('idle');
  const [landingError, setLandingError] = useState<string | null>(null);
  const [navStatus, setNavStatus] = useState<ActionStatus>('idle');
  const [navError, setNavError] = useState<string | null>(null);
  const [namingStatus, setNamingStatus] = useState<ActionStatus>('idle');
  const [namingError, setNamingError] = useState<string | null>(null);
  const [hotspotManageStatus, setHotspotManageStatus] =
    useState<ActionStatus>('idle');
  const [hotspotManageError, setHotspotManageError] = useState<string | null>(
    null,
  );
  const [movingHotspotId, setMovingHotspotId] = useState<string | null>(null);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [editNavLabel, setEditNavLabel] = useState('');
  const [editNavTarget, setEditNavTarget] = useState('');
  const [editNavInstant, setEditNavInstant] = useState(false);
  const [editNavVariant, setEditNavVariant] = useState<NavHotspotVariant>(
    NAV_HOTSPOT_VARIANT_DEFAULT,
  );
  const [editNoNamingId, setEditNoNamingId] = useState('');
  const [editInfoTitle, setEditInfoTitle] = useState('');
  const [editInfoBody, setEditInfoBody] = useState('');
  const [editInfoDisplay, setEditInfoDisplay] =
    useState<PopupDisplay>('anchored');
  const [editInfoVideoUrl, setEditInfoVideoUrl] = useState('');
  const [editInfoImage, setEditInfoImage] = useState('');
  const [editInfoVisitScene, setEditInfoVisitScene] = useState('');
  const [replacePanoramaFile, setReplacePanoramaFile] = useState<File | null>(
    null,
  );
  const [replacePanoramaStatus, setReplacePanoramaStatus] =
    useState<ActionStatus>('idle');
  const [replacePanoramaError, setReplacePanoramaError] = useState<
    string | null
  >(null);
  const [navName, setNavName] = useState(() =>
    readSessionValue(DEV_NAV_NAME_STORAGE_KEY),
  );
  const [navTargetSceneId, setNavTargetSceneId] = useState('');
  const [navTargetTouched, setNavTargetTouched] = useState(false);
  const [navTargetSceneTitle, setNavTargetSceneTitle] = useState('');
  const [navTargetSceneFile, setNavTargetSceneFile] = useState<File | null>(
    null,
  );
  const [navTargetQuickCreateOpen, setNavTargetQuickCreateOpen] =
    useState(false);
  const [navTargetSceneStatus, setNavTargetSceneStatus] =
    useState<ActionStatus>('idle');
  const [navTargetSceneError, setNavTargetSceneError] = useState<string | null>(
    null,
  );
  const [navInstant, setNavInstant] = useState(false);
  const [navVariant, setNavVariant] = useState<NavHotspotVariant>(
    NAV_HOTSPOT_VARIANT_DEFAULT,
  );
  const [infoName, setInfoName] = useState('');
  const [infoBody, setInfoBody] = useState('');
  const [infoDisplay, setInfoDisplay] = useState<PopupDisplay>('anchored');
  const [infoVideoUrl, setInfoVideoUrl] = useState('');
  const [infoImage, setInfoImage] = useState('');
  const [infoVisitScene, setInfoVisitScene] = useState('');
  const [infoStatus, setInfoStatus] = useState<ActionStatus>('idle');
  const [infoError, setInfoError] = useState<string | null>(null);
  const [overviewStatus, setOverviewStatus] = useState<ActionStatus>('idle');
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [hotspotCreateOpen, setHotspotCreateOpen] = useState(false);
  const [hotspotAddCloseKey, setHotspotAddCloseKey] = useState(0);
  const [pendingNavTargetSceneId, setPendingNavTargetSceneId] = useState(() =>
    createOpaqueId(OPAQUE_SCENE_ID_PREFIX),
  );
  const [hotspotTab, setHotspotTab] = useState<DevHotspotTab>('nav');
  const [hotspotManageFilter, setHotspotManageFilter] =
    useState<DevHotspotManageFilter>('all');

  const hotspotManageScope = useMemo((): DevHotspotManageScope => {
    return isModel3dTour ? 'model3d-tour' : 'panorama-scene';
  }, [isModel3dTour]);

  const hotspotSectionConfig = useMemo(
    () => getDevHotspotSectionConfig(hotspotManageScope),
    [hotspotManageScope],
  );

  const managedHotspots = useMemo(() => {
    const hostScene = tour.scenes[scene.id];
    if (isModel3dTour) {
      // Same world set the 3D viewer draws (`resolveSceneHotspots`) — do not
      // hide pins whose `sceneId` is another viewpoint (that made Dev look empty
      // while markers were still visible in the walkthrough).
      const fromTour = tour.hotspots ?? [];
      const legacy = (hostScene?.hotspots ?? []).filter(
        (hotspot) => !fromTour.some((entry) => entry.id === hotspot.id),
      );
      return sortSceneHotspotsForManage(
        [...fromTour, ...legacy],
        tour,
        hostScene,
      );
    }
    return sortSceneHotspotsForManage(
      hostScene?.hotspots ?? [],
      tour,
      hostScene,
    );
  }, [isModel3dTour, scene.id, tour]);

  const filteredManagedHotspots = useMemo(
    () =>
      managedHotspots.filter((hotspot) =>
        matchesHotspotManageFilter(hotspot, hotspotManageFilter),
      ),
    [hotspotManageFilter, managedHotspots],
  );

  const namingCatalogRows = useMemo(() => {
    const catalog = tour.namingOpportunities ?? {};
    return Object.values(catalog)
      .map((record) => {
        const placement = findNamingHotspotByNamingId(tour, record.id);
        const hostScene =
          placement ? tour.scenes[placement.sceneId] : undefined;
        const displayName =
          record.name?.trim() || hostScene?.title?.trim() || record.id;
        return {
          record,
          placement,
          displayName,
          sceneTitle: hostScene?.title?.trim() || placement?.sceneId || '',
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [tour]);

  const tourScenes = useMemo(() => {
    const byId = tour.scenes;
    return resolveTourSceneOrder(tour)
      .map((id) => byId[id])
      .filter((entry): entry is Scene => Boolean(entry));
  }, [tour]);
  const collidingSceneTitleIds = useMemo(
    () => sceneIdsWithTitleCollisions(tourScenes),
    [tourScenes],
  );

  const hotspotCreateTabs = hotspotSectionConfig.createTabs;

  const canCreateNavHotspot = hotspotCreateTabs.some((tab) => tab.id === 'nav');
  const canCreateNamingHotspot = hotspotCreateTabs.some(
    (tab) => tab.id === 'naming',
  );
  const canCreateInfoHotspot = hotspotCreateTabs.some(
    (tab) => tab.id === 'info',
  );
  const canCreateOverviewHotspot = hotspotCreateTabs.some(
    (tab) => tab.id === 'overview',
  );

  const sceneHasPlaceOverview = useMemo(
    () => managedHotspots.some((entry) => isPlaceOverviewHotspot(entry)),
    [managedHotspots],
  );


  const canWriteTour = Boolean(scene.tourId && view);
  const trimmedNavName = navName.trim();
  const trimmedInfoName = infoName.trim();
  const navSlug = useMemo(
    () => (trimmedNavName ? slugifyHotspotName(trimmedNavName) : ''),
    [trimmedNavName],
  );

  const canCreateNav = Boolean(scene.tourId && clickCoords && navTargetSceneId);
  const canCreateNaming = Boolean(
    scene.tourId && clickCoords && selectedNamingId.trim(),
  );
  const canCreateInfo = Boolean(scene.tourId && clickCoords && trimmedInfoName);
  const canReplacePanorama = Boolean(scene.tourId && replacePanoramaFile);
  const canCreateOverview = Boolean(
    scene.tourId && clickCoords && !isModel3dTour && !sceneHasPlaceOverview,
  );

  const mintNavTargetSceneId = useCallback(() => {
    setPendingNavTargetSceneId(
      allocateOpaqueId(OPAQUE_SCENE_ID_PREFIX, Object.keys(tour.scenes)),
    );
  }, [tour.scenes]);

  const closeHotspotAddSection = useCallback(() => {
    setHotspotCreateOpen(false);
    setHotspotAddCloseKey((key) => key + 1);
  }, []);

  const onSceneAccordionOpenIndicesChange = useCallback(
    (openIndices: readonly number[]) => {
      // Scene accordion: 0 Panorama, 1 Add hotspot, 2 Manage hotspots
      setHotspotCreateOpen(openIndices.includes(1));
    },
    [],
  );

  const sortedSceneOptions = useMemo(
    () => [...sceneOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [sceneOptions],
  );
  const otherNavTargetSceneOptions = useMemo(
    () => sortedSceneOptions.filter((entry) => entry.id !== scene.id),
    [scene.id, sortedSceneOptions],
  );
  const showNavTargetQuickCreate =
    navTargetQuickCreateOpen || otherNavTargetSceneOptions.length === 0;
  const namingIdsPlacedHere = useMemo(() => {
    const ids = new Set<string>();
    for (const hotspot of managedHotspots) {
      if (!isNamingInfoHotspot(hotspot)) continue;
      const namingId = hotspot.namingId?.trim();
      if (!namingId) continue;
      if (isModel3dTour && hotspot.sceneId && hotspot.sceneId !== scene.id) {
        continue;
      }
      ids.add(namingId);
    }
    return ids;
  }, [isModel3dTour, managedHotspots, scene.id]);
  const trimmedNavTargetSceneTitle = navTargetSceneTitle.trim();
  const navTargetSceneSlug = pendingNavTargetSceneId;
  const canCreateNavTargetScene = Boolean(
    scene.tourId &&
    trimmedNavTargetSceneTitle &&
    (isModel3dTour ? view : navTargetSceneFile),
  );

  const devViewerClickPlaceholder =
    isModel3dTour ? 'Click the 3D viewer…' : 'Click the panorama…';
  const devViewerClickHint =
    isModel3dTour ?
      'Click the 3D viewer to set position (pauses floor move)'
    : 'Click the panorama to set position';

  useEffect(() => {
    writeSessionValue(DEV_NAV_NAME_STORAGE_KEY, navName);
  }, [navName]);

  useEffect(() => {
    onHotspotPlacementCaptureChange?.(hotspotCreateOpen);
  }, [hotspotCreateOpen, onHotspotPlacementCaptureChange]);

  useEffect(() => {
    onHotspotMoveIdChange?.(movingHotspotId);
  }, [movingHotspotId, onHotspotMoveIdChange]);

  useEffect(
    () => () => {
      onHotspotPlacementCaptureChange?.(false);
      onHotspotMoveIdChange?.(null);
    },
    [onHotspotMoveIdChange, onHotspotPlacementCaptureChange],
  );

  useEffect(() => {
    if (!hotspotInteractionClearKey) return;
    setEditingHotspotId(null);
    setMovingHotspotId(null);
  }, [hotspotInteractionClearKey]);


  useEffect(() => {
    // Scene-scoped hotspot drafts only — do not wipe Naming catalog / other tabs.
    setNavName('');
    setNavTargetSceneId('');
    setNavTargetTouched(false);
    setNavTargetSceneTitle('');
    setNavTargetSceneFile(null);
    setNavTargetQuickCreateOpen(false);
    setNavTargetSceneStatus('idle');
    setNavTargetSceneError(null);
    setNavInstant(false);
    setNavVariant(NAV_HOTSPOT_VARIANT_DEFAULT);
    setInfoName('');
    setInfoBody('');
    setInfoVideoUrl('');
    setInfoImage('');
    setInfoVisitScene('');
    setInfoDisplay('anchored');
    onSelectedNamingIdChange('');
    setHotspotCreateOpen(false);
    setHotspotAddCloseKey((key) => key + 1);
  }, [scene.id]);

  useEffect(() => {
    if (navTargetTouched || !navSlug) return;
    const matchedScene = sortedSceneOptions.find(
      (entry) => entry.id === navSlug,
    );
    if (matchedScene) {
      setNavTargetSceneId(matchedScene.id);
    }
  }, [navSlug, navTargetTouched, sortedSceneOptions]);

  const buildHotspotPosition = useCallback(() => {
    if (!clickCoords) return null;
    if (isWorldClickCoords(clickCoords)) {
      return { x: clickCoords.x, y: clickCoords.y, z: clickCoords.z };
    }
    return { yaw: clickCoords.yaw, pitch: clickCoords.pitch };
  }, [clickCoords]);

  const captureModel3dNamingPreview = useCallback(async () => {
    const liveView = getCurrentView?.() ?? view;
    if (!liveView) {
      throw new Error('Current view is not available');
    }

    const previewFile = (await captureSceneThumbnail?.()) ?? null;
    if (!previewFile) {
      throw new Error(
        'Could not capture 3D preview — ensure the model is loaded and visible in the viewer',
      );
    }

    return { targetView: liveView, previewFile };
  }, [captureSceneThumbnail, getCurrentView, view]);

  const applyModel3dViewpointLanding = useCallback(
    async (sceneId: string) => {
      const liveView = getCurrentView?.() ?? view;
      if (!scene.tourId || !liveView) {
        throw new Error('Current view is not available');
      }

      const thumbnailFile = (await captureSceneThumbnail?.()) ?? null;
      if (!thumbnailFile) {
        throw new Error(
          'Could not capture 3D thumbnail — ensure the model is loaded and visible in the viewer',
        );
      }

      await devApplySceneDefaultView({
        tourId: scene.tourId,
        sceneId,
        defaultView: liveView,
        thumbnailFile,
      });
    },
    [captureSceneThumbnail, getCurrentView, scene.tourId, view],
  );

  const applyDefaultView = useCallback(async () => {
    const liveView = getCurrentView?.() ?? view;
    if (!scene.tourId || !liveView) return;

    setLandingStatus('working');
    setLandingError(null);
    logLandingView(scene, liveView);

    try {
      if (isModel3dTour) {
        await applyModel3dViewpointLanding(scene.id);
      } else {
        await devApplySceneDefaultView({
          tourId: scene.tourId,
          sceneId: scene.id,
          defaultView: toViewPosition(
            liveView.yaw,
            liveView.pitch,
            liveView.zoom ?? 0,
          ),
        });
      }
      await onTourMutated?.();
      setLandingStatus('done');
    } catch (error) {
      setLandingStatus('error');
      setLandingError(
        error instanceof DevTourApiError ? error.message
        : error instanceof Error ? error.message
        : 'Could not save defaultView',
      );
    }
  }, [
    applyModel3dViewpointLanding,
    getCurrentView,
    isModel3dTour,
    onTourMutated,
    scene,
    view,
  ]);

  const createNavHotspot = useCallback(async () => {
    const position = buildHotspotPosition();
    if (!scene.tourId || !position || !navTargetSceneId) return;

    setNavStatus('working');
    setNavError(null);

    try {
      await devCreateNavHotspot({
        tourId: scene.tourId,
        sceneId: scene.id,
        name: trimmedNavName,
        position,
        targetSceneId: navTargetSceneId,
        instant: navInstant || undefined,
        navVariant: serializeNavHotspotVariant(navVariant),
      });
      await onTourMutated?.();
      setNavStatus('done');
      setNavName('');
      setNavTargetSceneId('');
      setNavTargetTouched(false);
      setNavInstant(false);
      setNavVariant(NAV_HOTSPOT_VARIANT_DEFAULT);
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
    navInstant,
    navVariant,
    scene.id,
    scene.tourId,
    trimmedNavName,
    onTourMutated,
  ]);

  const createNamingHotspot = useCallback(async () => {
    const position = buildHotspotPosition();
    const namingId = selectedNamingId.trim();
    if (!scene.tourId || !position || !namingId) {
      return;
    }

    setNamingStatus('working');
    setNamingError(null);

    try {
      let targetView: ViewPosition | undefined;
      let previewFile: Blob | null = null;
      if (isModel3dTour) {
        ({ targetView, previewFile } = await captureModel3dNamingPreview());
      }

      await devCreateNamingHotspot({
        tourId: scene.tourId,
        sceneId: scene.id,
        namingId,
        position,
        targetView,
        previewFile,
      });
      await onTourMutated?.({ keepCurrentScene: true });
      setNamingStatus('done');
    } catch (error) {
      setNamingStatus('error');
      setNamingError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not place naming hotspot',
      );
    }
  }, [
    buildHotspotPosition,
    captureModel3dNamingPreview,
    isModel3dTour,
    onTourMutated,
    scene.id,
    scene.tourId,
    selectedNamingId,
  ]);

  const createInfoHotspotHandler = useCallback(async () => {
    const position = buildHotspotPosition();
    if (!scene.tourId || !position || !trimmedInfoName) {
      return;
    }

    setInfoStatus('working');
    setInfoError(null);

    try {
      await devCreateInfoHotspot({
        tourId: scene.tourId,
        sceneId: scene.id,
        name: trimmedInfoName,
        position,
        body: infoBody.trim() || undefined,
        display: infoDisplay,
        videoUrl: infoVideoUrl.trim() || undefined,
        image: infoImage.trim() || undefined,
        visitScene: infoVisitScene.trim() || undefined,
      });
      await onTourMutated?.();
      setInfoStatus('done');
      setInfoName('');
      setInfoBody('');
      setInfoVideoUrl('');
      setInfoImage('');
      setInfoVisitScene('');
    } catch (error) {
      setInfoStatus('error');
      setInfoError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create info hotspot',
      );
    }
  }, [
    buildHotspotPosition,
    infoBody,
    infoDisplay,
    infoImage,
    infoVideoUrl,
    scene.id,
    scene.tourId,
    trimmedInfoName,
    onTourMutated,
  ]);

  const createPlaceOverviewHotspotHandler = useCallback(async () => {
    const position = buildHotspotPosition();
    if (!scene.tourId || !position || isModel3dTour) return;

    setOverviewStatus('working');
    setOverviewError(null);

    try {
      await devCreatePlaceOverviewHotspot({
        tourId: scene.tourId,
        sceneId: scene.id,
        position,
      });
      await onTourMutated?.();
      setOverviewStatus('done');
      closeHotspotAddSection();
    } catch (error) {
      setOverviewStatus('error');
      setOverviewError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create place overview hotspot',
      );
    }
  }, [
    buildHotspotPosition,
    closeHotspotAddSection,
    isModel3dTour,
    onTourMutated,
    scene.id,
    scene.tourId,
  ]);

  const createNavTargetScene = useCallback(async () => {
    if (!scene.tourId || !trimmedNavTargetSceneTitle) return;
    if (!isModel3dTour && !navTargetSceneFile) return;

    setNavTargetSceneStatus('working');
    setNavTargetSceneError(null);

    try {
      const createdTitle = trimmedNavTargetSceneTitle;
      const model3dPayload =
        isModel3dTour ?
          await resolveModel3dSceneCreatePayload({
            getCurrentView,
            view,
            captureSceneThumbnail,
            manualThumbnailFile: navTargetSceneFile,
            sceneIdForFile: pendingNavTargetSceneId,
          })
        : null;
      const result = await devCreateScene({
        tourId: scene.tourId,
        title: createdTitle,
        sceneId: pendingNavTargetSceneId,
        ...(isModel3dTour ?
          {
            thumbnailFile: model3dPayload?.thumbnailFile,
            defaultView: model3dPayload?.defaultView,
          }
        : { panoramaFile: navTargetSceneFile! }),
      });
      setNavTargetSceneTitle('');
      setNavTargetSceneFile(null);
      setNavTargetQuickCreateOpen(false);
      setNavTargetSceneStatus('done');
      setNavTargetSceneId(result.scene.id);
      setNavTargetTouched(true);
      mintNavTargetSceneId();
      if (!trimmedNavName) {
        setNavName(createdTitle);
      }
      await onTourMutated?.({ keepCurrentScene: true });
    } catch (error) {
      setNavTargetSceneStatus('error');
      setNavTargetSceneError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create scene',
      );
    }
  }, [
    isModel3dTour,
    mintNavTargetSceneId,
    navTargetSceneFile,
    onTourMutated,
    pendingNavTargetSceneId,
    captureSceneThumbnail,
    getCurrentView,
    resolveModel3dSceneCreatePayload,
    view,
    scene.tourId,
    trimmedNavName,
    trimmedNavTargetSceneTitle,
  ]);

  const deleteHotspot = useCallback(
    async (hotspotId: string) => {
      if (!scene.tourId) return;

      // Prefer the current scene's hotspot when ids could collide.
      const onCurrentScene = managedHotspots.find(
        (entry) => entry.id === hotspotId,
      );
      const found =
        onCurrentScene ?
          { hotspot: onCurrentScene, sceneId: scene.id }
        : findHotspotInTour(tour, hotspotId);
      const label =
        found ? hotspotDisplayLabel(found.hotspot, tour) : hotspotId;
      const deleteScopeLabel = isModel3dTour ? 'tour' : `scene “${scene.id}”`;
      const isNamingHotspotDelete =
        found ? isNamingInfoHotspot(found.hotspot) : false;
      if (
        !confirmDevPanelDelete(
          isNamingHotspotDelete ?
            `Delete naming hotspot “${label}” (${hotspotId})? If this is the last placement, the catalog entry is removed too.`
          : `Delete hotspot “${label}” (${hotspotId}) from ${deleteScopeLabel}?`,
        )
      ) {
        return;
      }

      setHotspotManageStatus('working');
      setHotspotManageError(null);

      try {
        const hostSceneId = found?.sceneId ?? scene.id;
        await devDeleteHotspot({
          tourId: scene.tourId,
          sceneId: hostSceneId,
          hotspotId,
        });
        if (movingHotspotId === hotspotId) {
          setMovingHotspotId(null);
        }
        if (editingHotspotId === hotspotId) {
          setEditingHotspotId(null);
        }
        if (found?.hotspot.namingId) {
          onNamingHotspotDeleted?.(found.hotspot.namingId);
        }
        await onTourMutated?.();
        setHotspotManageStatus('done');
      } catch (error) {
        setHotspotManageStatus('error');
        setHotspotManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not delete hotspot',
        );
      }
    },
    [
      onNamingHotspotDeleted,
      editingHotspotId,
      isModel3dTour,
      managedHotspots,
      movingHotspotId,
      onTourMutated,
      scene.id,
      scene.tourId,
      tour,
    ],
  );

  const commitHotspotMove = useCallback(
    async (position: DevHotspotMovePosition) => {
      if (!scene.tourId || !movingHotspotId) return;

      setHotspotManageStatus('working');
      setHotspotManageError(null);

      try {
        await devUpdateHotspotPosition({
          tourId: scene.tourId,
          sceneId: scene.id,
          hotspotId: movingHotspotId,
          position,
        });
        setMovingHotspotId(null);
        await onTourMutated?.();
        setHotspotManageStatus('done');
      } catch (error) {
        setHotspotManageStatus('error');
        setHotspotManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not move hotspot',
        );
      }
    },
    [movingHotspotId, onTourMutated, scene.id, scene.tourId],
  );

  useEffect(() => {
    registerHotspotMoveCommit?.(commitHotspotMove);
    return () => registerHotspotMoveCommit?.(null);
  }, [commitHotspotMove, registerHotspotMoveCommit]);

  const startEditHotspot = useCallback(
    (hotspot: Hotspot) => {
      setEditingHotspotId(hotspot.id);
      onClearNamingCatalogEdit?.();
      setMovingHotspotId(null);
      if (hotspot.type === 'nav') {
        const targetTitle =
          tour.scenes[hotspot.targetScene ?? '']?.title?.trim() ?? '';
        const stored = hotspot.label?.trim() ?? '';
        setEditNavLabel(stored && stored !== targetTitle ? stored : '');
        setEditNavTarget(hotspot.targetScene ?? '');
        setEditNavInstant(Boolean(hotspot.instant));
        setEditNavVariant(resolveNavHotspotVariant(hotspot));
        return;
      }
      if (isNamingInfoHotspot(hotspot)) {
        setEditNoNamingId(hotspot.namingId?.trim() ?? '');
        return;
      }
      if (isPlaceOverviewHotspot(hotspot)) {
        // Title/body inherit from the scene — no popup copy fields to edit.
        return;
      }
      setEditInfoTitle(hotspot.popup?.title ?? '');
      setEditInfoBody(hotspot.popup?.body ?? '');
      setEditInfoDisplay(hotspot.popup?.display ?? 'anchored');
      setEditInfoVideoUrl(hotspot.popup?.videoUrl ?? '');
      setEditInfoImage(hotspot.popup?.image ?? '');
      setEditInfoVisitScene(hotspot.popup?.visitScene ?? '');
    },
    [onClearNamingCatalogEdit, scene.id, tour],
  );

  const openNavTargetScene = useCallback(
    (targetSceneId: string) => {
      if (!scene.tourId || !targetSceneId.trim()) return;
      navigate(
        buildTourLocation(
          scene.tourId,
          targetSceneId.trim(),
          tour.firstScene,
          searchParams,
        ),
      );
      onRequestSceneTab?.();
    },
    [navigate, onRequestSceneTab, scene.tourId, searchParams, tour.firstScene],
  );

  const openNamingHotspot = useCallback(
    (sceneId: string, hotspotId: string) => {
      if (!openNamingOpportunity) return;
      // Keep the current Dev tab (e.g. Namings manage/edit) — only move the viewer.
      openNamingOpportunity(sceneId, hotspotId);
    },
    [openNamingOpportunity],
  );

  const saveHotspotEdit = useCallback(async () => {
    if (!scene.tourId || !editingHotspotId) return;
    // Prefer current-scene hotspot when ids could collide.
    const onCurrentScene = managedHotspots.find(
      (entry) => entry.id === editingHotspotId,
    );
    const found =
      onCurrentScene ?
        { hotspot: onCurrentScene, sceneId: scene.id }
      : findHotspotInTour(tour, editingHotspotId);
    const hotspot = found?.hotspot;
    if (!hotspot) return;

    if (isPlaceOverviewHotspot(hotspot)) {
      setEditingHotspotId(null);
      return;
    }

    setHotspotManageStatus('working');
    setHotspotManageError(null);

    try {
      const hostSceneId = found.sceneId ?? scene.id;
      if (hotspot.type === 'nav') {
        await devUpdateNavHotspot({
          tourId: scene.tourId,
          sceneId: hostSceneId,
          hotspotId: editingHotspotId,
          label: editNavLabel.trim(),
          targetSceneId: editNavTarget.trim() || undefined,
          instant: editNavInstant,
          navVariant: editNavVariant,
        });
      } else if (isNamingInfoHotspot(hotspot)) {
        let targetView: ViewPosition | undefined;
        let previewFile: Blob | null = null;
        if (isModel3dTour) {
          ({ targetView, previewFile } = await captureModel3dNamingPreview());
        }

        await devUpdateNamingHotspot({
          tourId: scene.tourId,
          sceneId: hostSceneId,
          hotspotId: editingHotspotId,
          namingId: editNoNamingId.trim() || undefined,
          targetView,
          previewFile,
        });
      } else {
        await devUpdateInfoHotspot({
          tourId: scene.tourId,
          sceneId: hostSceneId,
          hotspotId: editingHotspotId,
          title: editInfoTitle.trim() || undefined,
          body: editInfoBody.trim() || undefined,
          display: editInfoDisplay,
          videoUrl: editInfoVideoUrl,
          image: editInfoImage,
          visitScene: editInfoVisitScene,
        });
      }
      setEditingHotspotId(null);
      await onTourMutated?.();
      setHotspotManageStatus('done');
    } catch (error) {
      setHotspotManageStatus('error');
      setHotspotManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save hotspot',
      );
    }
  }, [
    editInfoBody,
    editInfoDisplay,
    editInfoImage,
    editInfoTitle,
    editInfoVideoUrl,
    editInfoVisitScene,
    editNavInstant,
    editNavVariant,
    editNavLabel,
    editNavTarget,
    editNoNamingId,
    editingHotspotId,
    captureModel3dNamingPreview,
    isModel3dTour,
    managedHotspots,
    onTourMutated,
    scene.id,
    scene.tourId,
    tour,
  ]);

  const replacePanorama = useCallback(async () => {
    if (!scene.tourId || !replacePanoramaFile) return;

    setReplacePanoramaStatus('working');
    setReplacePanoramaError(null);

    try {
      await devReplaceScenePanorama({
        tourId: scene.tourId,
        sceneId: scene.id,
        panoramaFile: replacePanoramaFile,
      });
      setReplacePanoramaFile(null);
      await onTourMutated?.({ bustPanorama: true });
      setReplacePanoramaStatus('done');
    } catch (error) {
      setReplacePanoramaStatus('error');
      setReplacePanoramaError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not replace panorama',
      );
    }
  }, [onTourMutated, replacePanoramaFile, scene.id, scene.tourId]);

  useEffect(() => {
    setMovingHotspotId(null);
    setEditingHotspotId(null);
  }, [scene.id]);

  const focusHotspotRef = useRef(focusHotspot);
  focusHotspotRef.current = focusHotspot;
  const getCurrentViewRef = useRef(getCurrentView);
  getCurrentViewRef.current = getCurrentView;
  const animateToViewRef = useRef(animateToView);
  animateToViewRef.current = animateToView;
  /** Camera pose before the first Manage-list hover preview this pass. */
  const hoverPreviewReturnViewRef = useRef<ViewPosition | null>(null);

  useEffect(() => {
    const hotspotId = editingHotspotId ?? movingHotspotId;
    focusHotspotRef.current?.(hotspotId);
    return () => {
      focusHotspotRef.current?.(null);
    };
  }, [editingHotspotId, movingHotspotId]);

  useEffect(() => {
    // Edit/Move owns the camera — drop any pending hover return pose.
    if (editingHotspotId || movingHotspotId) {
      hoverPreviewReturnViewRef.current = null;
    }
  }, [editingHotspotId, movingHotspotId]);

  const previewHotspotHighlight = useCallback(
    (hotspotId: string | null) => {
      // Edit/Move already frames the pin — list hover must not steal the camera.
      if (editingHotspotId || movingHotspotId) return;
      if (!hotspotId) return;
      if (!hoverPreviewReturnViewRef.current) {
        hoverPreviewReturnViewRef.current =
          getCurrentViewRef.current?.() ?? null;
      }
      focusHotspotRef.current?.(hotspotId, { animate: true });
    },
    [editingHotspotId, movingHotspotId],
  );

  /** Leave the whole manage list (back to viewer / other UI) — restore pose. */
  const endManageHoverPreview = useCallback(() => {
    if (editingHotspotId || movingHotspotId) return;
    focusHotspotRef.current?.(null, { animate: false });
    const returnView = hoverPreviewReturnViewRef.current;
    hoverPreviewReturnViewRef.current = null;
    if (returnView) {
      void animateToViewRef.current?.(returnView);
    }
  }, [editingHotspotId, movingHotspotId]);

  useLayoutEffect(() => {
    setEditingHotspotId(null);
    setMovingHotspotId(null);
    setHotspotManageError(null);
    setHotspotManageStatus('idle');
  }, [hotspotManageScope]);

  useEffect(() => {
    if (
      landingStatus === 'idle' &&
      navStatus === 'idle' &&
      namingStatus === 'idle' &&
      infoStatus === 'idle' &&
      hotspotManageStatus === 'idle' &&
      replacePanoramaStatus === 'idle'
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
      if (infoStatus !== 'working') {
        setInfoStatus('idle');
        setInfoError(null);
      }
      if (hotspotManageStatus !== 'working') {
        setHotspotManageStatus('idle');
        setHotspotManageError(null);
      }
      if (replacePanoramaStatus !== 'working') {
        setReplacePanoramaStatus('idle');
        setReplacePanoramaError(null);
      }
    }, 2500);

    return () => window.clearTimeout(t);
  }, [
    hotspotManageStatus,
    landingStatus,
    namingStatus,
    infoStatus,
    navStatus,
    replacePanoramaStatus,
  ]);


  return (
    <DevPanelSectionAccordion
      persistKey='tab:scene-v2'
      defaultOpenIndex={2}
      ensureCloseIndex={1}
      ensureCloseKey={hotspotAddCloseKey}
      onOpenIndicesChange={onSceneAccordionOpenIndicesChange}
    >
                <DevPanelSection
                  title={isModel3dTour ? 'Viewpoint' : 'Panorama'}
                  description={
                    isModel3dTour ?
                      'Camera pose for this scene — landing view and card thumbnail.'
                    : 'Set the landing view and thumbnail, or replace the scene image.'
                  }
                >
                  <DevPanelFormGroup
                    title='Landing view'
                    hint={
                      <p className={devViewPanelSectionHintClassName}>
                        {isModel3dTour ?
                          <>
                            Orbit, pan, and zoom — saves{' '}
                            <code>defaultView</code> and bakes{' '}
                            <code>thumbnail</code> from the current 3D view.{' '}
                            <code>zoom</code> is orbit distance (lower = closer;
                            unlike PSV zoom level).
                          </>
                        : <>
                            Pan the scene — saves <code>defaultView</code> +
                            bakes <code>thumbnail</code>
                          </>
                        }
                      </p>
                    }
                  >
                    <p className={devViewPanelCoordsClassName}>
                      {view ? formatViewPosition(view) : '—'}
                    </p>

                    {landingError ?
                      <p className={devViewPanelSectionHintClassName}>
                        {landingError}
                      </p>
                    : null}

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
                        : 'Apply defaultView'}
                      </button>
                    </div>
                  </DevPanelFormGroup>

                  {!isModel3dTour ?
                    <DevPanelFormGroup
                      title='Replace panorama'
                      hint={
                        <p className={devViewPanelSectionHintClassName}>
                          Overwrites <code>{scene.id}.webp</code> for this scene
                          and rebakes the thumbnail.
                        </p>
                      }
                    >
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Panorama file
                        </span>
                        <DevPanelFileField
                          file={replacePanoramaFile}
                          preview={
                            replacePanoramaFile ?
                              <DevPanoramaFilePreview
                                file={replacePanoramaFile}
                              />
                            : null
                          }
                          onClearPreview={() => setReplacePanoramaFile(null)}
                          showClear={Boolean(replacePanoramaFile)}
                        >
                          <DevPanelFileInput
                            accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                            file={replacePanoramaFile}
                            onChange={setReplacePanoramaFile}
                          />
                        </DevPanelFileField>
                      </label>

                      {replacePanoramaError ?
                        <p className={devViewPanelSectionHintClassName}>
                          {replacePanoramaError}
                        </p>
                      : null}

                      <div className={devViewPanelActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'primary',
                          })}
                          onClick={() => void replacePanorama()}
                          disabled={
                            !canReplacePanorama ||
                            replacePanoramaStatus === 'working'
                          }
                        >
                          {replacePanoramaStatus === 'working' ?
                            'Replacing…'
                          : replacePanoramaStatus === 'done' ?
                            'Replaced!'
                          : 'Replace panorama'}
                        </button>
                      </div>
                    </DevPanelFormGroup>
                  : null}
                </DevPanelSection>
      <>
        <DevPanelSection
          title='Add hotspot'
          description={
            isModel3dTour ?
              'Place a nav, naming, or info hotspot on the 3D model. Naming catalog fields live on the Naming tab.'
            : 'Place a nav, naming, info, or place-overview hotspot on this scene. Naming catalog fields live on the Naming tab.'
          }
        >
          <div className={devViewPanelTabPanelBodyClassName}>
            <DevPanelTertiaryTabs
              aria-label='Hotspot type'
              value={hotspotTab}
              onChange={setHotspotTab}
              tabs={hotspotCreateTabs.map((tab) => ({
                id: tab.id,
                label: tab.label,
                kind: tab.id === 'overview' ? 'info' : tab.id,
                htmlId: `dev-hotspot-tab-${tab.id}`,
                ariaControls: `dev-hotspot-panel-${tab.id}`,
              }))}
            />

            {canCreateNavHotspot && hotspotTab === 'nav' ?
              <div
                id='dev-hotspot-panel-nav'
                role='tabpanel'
                aria-labelledby='dev-hotspot-tab-nav'
              >
                <DevPanelFormGroup>
                  <div className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Hotspot position
                    </span>
                    <p className={devViewPanelSectionHintClassName}>
                      {devViewerClickHint} — navigation to another scene.
                    </p>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      readOnly
                      tabIndex={-1}
                      value={clickCoords ? formatCoords(clickCoords) : ''}
                      placeholder={devViewerClickPlaceholder}
                    />
                  </div>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Label (optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      value={navName}
                      onChange={(e) => setNavName(e.target.value)}
                      placeholder={
                        sortedSceneOptions.find(
                          (entry) => entry.id === navTargetSceneId,
                        )?.title || 'Uses target scene title'
                      }
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </label>
                  <p className={devViewPanelSectionHintClassName}>
                    Optional override. Leave empty (or matching the target
                    title) to inherit the scene title and stay in sync.
                  </p>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Target scene
                    </span>
                    <select
                      className={devViewPanelSelectClassName}
                      value={navTargetSceneId}
                      onChange={(e) => {
                        setNavTargetTouched(true);
                        const nextId = e.target.value;
                        const prevTitle =
                          sortedSceneOptions.find(
                            (entry) => entry.id === navTargetSceneId,
                          )?.title ?? '';
                        setNavTargetSceneId(nextId);
                        const matchedScene = sortedSceneOptions.find(
                          (entry) => entry.id === nextId,
                        );
                        setNavName((prev) => {
                          const trimmed = prev.trim();
                          if (!trimmed || trimmed === prevTitle) {
                            return matchedScene?.title ?? '';
                          }
                          return prev;
                        });
                      }}
                    >
                      <option value=''>Select scene…</option>
                      {sortedSceneOptions.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {collidingSceneTitleIds.has(entry.id) ?
                            `${entry.title} · id ${entry.id}`
                          : entry.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  {otherNavTargetSceneOptions.length === 0 ?
                    <p className={devViewPanelSectionHintClassName}>
                      No other scenes yet — create a target scene below, then
                      finish this nav hotspot.
                    </p>
                  : null}

                  {showNavTargetQuickCreate ?
                    <DevPanelFormGroup title='Create target scene'>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Title
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='text'
                          value={navTargetSceneTitle}
                          onChange={(e) =>
                            setNavTargetSceneTitle(e.target.value)
                          }
                          placeholder='e.g. Main Entrance'
                          spellCheck={false}
                          autoComplete='off'
                        />
                        <p className={devViewPanelSectionHintClassName}>
                          New scene becomes the nav target; you stay on this
                          scene and keep the hotspot click position.
                        </p>
                      </label>

                      {!isModel3dTour ?
                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Panorama file
                          </span>
                          <DevPanelFileField
                            file={navTargetSceneFile}
                            preview={
                              navTargetSceneFile ?
                                <DevPanoramaFilePreview
                                  file={navTargetSceneFile}
                                />
                              : null
                            }
                            onClearPreview={() => setNavTargetSceneFile(null)}
                            showClear={Boolean(navTargetSceneFile)}
                          >
                            <DevPanelFileInput
                              accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                              file={navTargetSceneFile}
                              onChange={setNavTargetSceneFile}
                            />
                          </DevPanelFileField>
                        </label>
                      : null}

                      {navTargetSceneSlug ?
                        <p className={devViewPanelSlugPreviewClassName}>
                          stable id <code>{navTargetSceneSlug}</code>
                        </p>
                      : null}

                      {navTargetSceneError ?
                        <p className={devViewPanelSectionHintClassName}>
                          {navTargetSceneError}
                        </p>
                      : null}

                      <div className={devViewPanelActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'primary',
                          })}
                          onClick={() => void createNavTargetScene()}
                          disabled={
                            !canCreateNavTargetScene ||
                            navTargetSceneStatus === 'working'
                          }
                        >
                          {navTargetSceneStatus === 'working' ?
                            'Creating…'
                          : navTargetSceneStatus === 'done' ?
                            'Scene created!'
                          : 'Create target scene'}
                        </button>
                        {otherNavTargetSceneOptions.length > 0 ?
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'secondary',
                            })}
                            onClick={() => {
                              setNavTargetQuickCreateOpen(false);
                              setNavTargetSceneTitle('');
                              setNavTargetSceneFile(null);
                              setNavTargetSceneError(null);
                              setNavTargetSceneStatus('idle');
                            }}
                            disabled={navTargetSceneStatus === 'working'}
                          >
                            Cancel
                          </button>
                        : null}
                      </div>
                    </DevPanelFormGroup>
                  : <button
                      type='button'
                      className={cn(
                        devViewPanelBtnVariants({ tone: 'secondary' }),
                        'w-fit',
                      )}
                      onClick={() => {
                        mintNavTargetSceneId();
                        setNavTargetQuickCreateOpen(true);
                      }}
                    >
                      + Create target scene
                    </button>
                  }

                  <p className={devViewPanelSectionHintClassName}>
                    Pin id is assigned on create · copies target{' '}
                    <code>defaultView</code> on create and save
                  </p>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Nav role
                    </span>
                    <select
                      className={devViewPanelSelectClassName}
                      value={navVariant}
                      onChange={(e) => {
                        const nextVariant = e.target.value as NavHotspotVariant;
                        setNavVariant(nextVariant);
                        if (nextVariant === 'back' || nextVariant === 'hub') {
                          setNavInstant(true);
                        }
                        if (nextVariant === 'hub') {
                          setNavTargetSceneId(tour.firstScene);
                        }
                      }}
                    >
                      {NAV_HOTSPOT_VARIANT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className={devViewPanelSectionHintClassName}>
                    {
                      NAV_HOTSPOT_VARIANT_OPTIONS.find(
                        (option) => option.value === navVariant,
                      )?.hint
                    }
                  </p>

                  <label className={devViewPanelToggleLabelClassName}>
                    <input
                      className={devViewPanelToggleInputClassName}
                      type='checkbox'
                      checked={navInstant}
                      onChange={(e) => setNavInstant(e.target.checked)}
                    />
                    <span className={devViewPanelToggleNameClassName}>
                      Instant (skip preview card)
                    </span>
                  </label>

                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'secondary' })}
                      onClick={closeHotspotAddSection}
                      disabled={navStatus === 'working'}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'primary' })}
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
                    <p className={devViewPanelSectionHintClassName}>
                      {navError}
                    </p>
                  : null}
                </DevPanelFormGroup>
              </div>
            : canCreateNamingHotspot && hotspotTab === 'naming' ?
              <div
                id='dev-hotspot-panel-naming'
                role='tabpanel'
                aria-labelledby='dev-hotspot-tab-naming'
              >
                <DevPanelFormGroup>
                  <div className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Hotspot position
                    </span>
                    <p className={devViewPanelSectionHintClassName}>
                      {devViewerClickHint} — place a catalog naming opportunity
                      here.
                      {isModel3dTour ?
                        <>
                          {' '}
                          Saves the current camera as <code>targetView</code> +
                          Explore <code>preview.image</code>.
                        </>
                      : <>
                          {' '}
                          Saves <code>position</code> and bakes Explore{' '}
                          <code>preview.image</code> (card thumbnail).
                        </>
                      }
                    </p>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      readOnly
                      tabIndex={-1}
                      value={clickCoords ? formatCoords(clickCoords) : ''}
                      placeholder={devViewerClickPlaceholder}
                    />
                  </div>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Naming opportunity
                    </span>
                    <select
                      className={devViewPanelSelectClassName}
                      value={selectedNamingId}
                      onChange={(e) => onSelectedNamingIdChange(e.target.value)}
                    >
                      <option value=''>Select naming opportunity…</option>
                      {namingCatalogRows.map((row) => (
                        <option key={row.record.id} value={row.record.id}>
                          {row.displayName}
                          {namingIdsPlacedHere.has(row.record.id) ?
                            ' · placed here'
                          : ''}
                          {' · '}
                          {row.record.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  {namingCatalogRows.length === 0 ?
                    <p className={devViewPanelSectionHintClassName}>
                      No naming opportunities yet — create one in Naming
                      catalog, then come back to place the hotspot.
                    </p>
                  : null}
                  <button
                    type='button'
                    className={cn(
                      devViewPanelBtnVariants({ tone: 'secondary' }),
                      'w-fit',
                    )}
                    onClick={onOpenCreateNaming}
                  >
                    + Create in Naming catalog
                  </button>

                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'secondary' })}
                      onClick={closeHotspotAddSection}
                      disabled={namingStatus === 'working'}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'primary' })}
                      onClick={() => void createNamingHotspot()}
                      disabled={!canCreateNaming || namingStatus === 'working'}
                    >
                      {namingStatus === 'working' ?
                        'Placing…'
                      : namingStatus === 'done' ?
                        'Hotspot placed!'
                      : 'Place hotspot'}
                    </button>
                  </div>
                  {namingError ?
                    <p className={devViewPanelSectionHintClassName}>
                      {namingError}
                    </p>
                  : null}
                </DevPanelFormGroup>
              </div>
            : canCreateInfoHotspot && hotspotTab === 'info' ?
              <div
                id='dev-hotspot-panel-info'
                role='tabpanel'
                aria-labelledby='dev-hotspot-tab-info'
              >
                <DevPanelFormGroup>
                  <div className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Hotspot position
                    </span>
                    <p className={devViewPanelSectionHintClassName}>
                      {devViewerClickHint} — general info popup (not a naming
                      opportunity).
                    </p>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      readOnly
                      tabIndex={-1}
                      value={clickCoords ? formatCoords(clickCoords) : ''}
                      placeholder={devViewerClickPlaceholder}
                    />
                  </div>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Title
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      value={infoName}
                      onChange={(e) => setInfoName(e.target.value)}
                      placeholder='e.g. Welcome Desk'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </label>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Display
                    </span>
                    <select
                      className={devViewPanelSelectClassName}
                      value={infoDisplay}
                      onChange={(e) =>
                        setInfoDisplay(e.target.value as PopupDisplay)
                      }
                    >
                      {DEV_INFO_DISPLAY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Body (optional)
                    </span>
                    <DevPanelDescriptionTextarea
                      value={infoBody}
                      onChange={(e) => setInfoBody(e.target.value)}
                      placeholder='Leave empty for placeholder copy from the title…'
                      spellCheck={true}
                    />
                    <p className={devViewPanelSectionHintClassName}>
                      Supports **bold** and *italic*.
                    </p>
                  </label>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Video URL (optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='url'
                      value={infoVideoUrl}
                      onChange={(e) => setInfoVideoUrl(e.target.value)}
                      placeholder='https://youtube.com/…'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </label>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Image path (optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      value={infoImage}
                      onChange={(e) => setInfoImage(e.target.value)}
                      placeholder='/assets/…/photo.webp'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </label>

                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Visit scene (optional)
                    </span>
                    <select
                      className={devViewPanelSelectClassName}
                      value={infoVisitScene}
                      onChange={(e) => setInfoVisitScene(e.target.value)}
                    >
                      <option value=''>None</option>
                      {sortedSceneOptions.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {collidingSceneTitleIds.has(entry.id) ?
                            `${entry.title} · id ${entry.id}`
                          : entry.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className={devViewPanelSectionHintClassName}>
                    Pin id is assigned on create
                  </p>

                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'secondary' })}
                      onClick={closeHotspotAddSection}
                      disabled={infoStatus === 'working'}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'primary' })}
                      onClick={() => void createInfoHotspotHandler()}
                      disabled={!canCreateInfo || infoStatus === 'working'}
                    >
                      {infoStatus === 'working' ?
                        'Creating…'
                      : infoStatus === 'done' ?
                        'Info created!'
                      : 'Create info'}
                    </button>
                  </div>
                  {infoError ?
                    <p className={devViewPanelSectionHintClassName}>
                      {infoError}
                    </p>
                  : null}
                </DevPanelFormGroup>
              </div>
            : canCreateOverviewHotspot && hotspotTab === 'overview' ?
              <div
                id='dev-hotspot-panel-overview'
                role='tabpanel'
                aria-labelledby='dev-hotspot-tab-overview'
              >
                <DevPanelFormGroup>
                  <div className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Hotspot position
                    </span>
                    <p className={devViewPanelSectionHintClassName}>
                      {devViewerClickHint} — place overview pin for this scene.
                      Title/body inherit the scene (or first public naming
                      body). One per scene.
                    </p>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      readOnly
                      tabIndex={-1}
                      value={clickCoords ? formatCoords(clickCoords) : ''}
                      placeholder={devViewerClickPlaceholder}
                    />
                  </div>

                  {sceneHasPlaceOverview ?
                    <p className={devViewPanelSectionHintClassName}>
                      This scene already has a place overview hotspot. Delete it
                      first to place another.
                    </p>
                  : null}

                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'secondary' })}
                      onClick={closeHotspotAddSection}
                      disabled={overviewStatus === 'working'}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'primary' })}
                      onClick={() => void createPlaceOverviewHotspotHandler()}
                      disabled={
                        !canCreateOverview || overviewStatus === 'working'
                      }
                    >
                      {overviewStatus === 'working' ?
                        'Creating…'
                      : overviewStatus === 'done' ?
                        'Overview created!'
                      : 'Create overview'}
                    </button>
                  </div>
                  {overviewError ?
                    <p className={devViewPanelSectionHintClassName}>
                      {overviewError}
                    </p>
                  : null}
                </DevPanelFormGroup>
              </div>
            : null}
          </div>
        </DevPanelSection>

        <DevPanelSection
          title={hotspotSectionConfig.title}
          description={hotspotSectionConfig.description}
        >
          <DevPanelTertiaryTabs
            aria-label='Filter hotspots'
            value={hotspotManageFilter}
            onChange={(filter) => {
              setHotspotManageFilter(filter);
              setEditingHotspotId(null);
              setMovingHotspotId(null);
            }}
            tabs={DEV_HOTSPOT_MANAGE_FILTER_TABS.map((tab) => ({
              id: tab.id,
              label: tab.label,
              kind: tab.id === 'all' ? 'scene' : tab.id,
            }))}
          />
          <DevPanelFormGroup>
            {filteredManagedHotspots.length > 0 ?
              <ul
                className={devViewPanelManageListClassName}
                onMouseLeave={endManageHoverPreview}
              >
                {filteredManagedHotspots.map((hotspot) => {
                  const isMoving = movingHotspotId === hotspot.id;
                  const isEditing = editingHotspotId === hotspot.id;

                  return (
                    <li
                      key={hotspot.id}
                      className={cn(
                        devViewPanelManageListItemClassName,
                        (isMoving || isEditing) &&
                          devViewPanelManageListItemActiveClassName,
                      )}
                      onMouseEnter={() => previewHotspotHighlight(hotspot.id)}
                    >
                      <div className={devViewPanelManageListItemBodyClassName}>
                        <div
                          className={devViewPanelManageListItemMainRowClassName}
                        >
                          <div
                            className={
                              devViewPanelManageListItemContentClassName
                            }
                          >
                            <div
                              className={cn(
                                devViewPanelManageListItemHeadMainClassName,
                                'flex-nowrap',
                              )}
                            >
                              <span
                                className={cn(
                                  devViewPanelManageListItemTitleClassName,
                                  'truncate',
                                )}
                              >
                                {hotspotDisplayLabel(
                                  hotspot,
                                  tour,
                                  isModel3dTour ? null : tour.scenes[scene.id],
                                )}
                              </span>
                            </div>
                            <div
                              className={
                                devViewPanelManageListItemSceneBadgesClassName
                              }
                            >
                              <Badge
                                variant='fill'
                                size='sm'
                                tone='none'
                                className={devHotspotKindBadgeVariants({
                                  kind: hotspotKindBadgeKind(hotspot),
                                })}
                              >
                                {hotspotKindLabel(hotspot)}
                              </Badge>
                              {hotspot.type === 'nav' && hotspot.targetScene ?
                                (() => {
                                  const targetVisibility =
                                    resolveHotspotMarkerVisibility(
                                      tour,
                                      hotspot,
                                    );
                                  return (
                                      catalogVisibilityShowsManageBadge(
                                        targetVisibility,
                                      )
                                    ) ?
                                      <Badge
                                        variant='fill'
                                        size='sm'
                                        tone='none'
                                        className={devSceneManageBadgeVariants({
                                          kind: targetVisibility,
                                        })}
                                      >
                                        {catalogVisibilityManageBadgeLabel(
                                          targetVisibility,
                                        )}
                                      </Badge>
                                    : null;
                                })()
                              : null}
                              {isNamingInfoHotspot(hotspot) ?
                                (() => {
                                  const namingVisibility =
                                    resolveNamingVisibility(
                                      resolveHotspotNamingRecord(tour, hotspot),
                                    );
                                  return (
                                      catalogVisibilityShowsManageBadge(
                                        namingVisibility,
                                      )
                                    ) ?
                                      <Badge
                                        variant='fill'
                                        size='sm'
                                        tone='none'
                                        className={devSceneManageBadgeVariants({
                                          kind: namingVisibility,
                                        })}
                                      >
                                        {catalogVisibilityManageBadgeLabel(
                                          namingVisibility,
                                        )}
                                      </Badge>
                                    : null;
                                })()
                              : null}
                              {hotspot.instant ?
                                <Badge
                                  variant='fill'
                                  size='sm'
                                  tone='none'
                                  className={devSceneManageBadgeVariants({
                                    kind: 'instant',
                                  })}
                                >
                                  Instant
                                </Badge>
                              : null}
                            </div>
                          </div>
                          <div
                            className={
                              devViewPanelManageListItemIconActionsClassName
                            }
                          >
                            {hotspot.type === 'nav' && hotspot.targetScene ?
                              <button
                                type='button'
                                className={devViewPanelIconBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() =>
                                  openNavTargetScene(hotspot.targetScene!)
                                }
                                disabled={hotspotManageStatus === 'working'}
                                aria-label={`Open ${hotspotDisplayLabel(
                                  hotspot,
                                  tour,
                                  isModel3dTour ? null : tour.scenes[scene.id],
                                )}`}
                                title='Open'
                              >
                                <MaterialSymbol
                                  name='visibility'
                                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                                  className={materialSymbolLayoutClassName}
                                  aria-hidden
                                />
                              </button>
                            : null}
                            {(
                              (isNamingInfoHotspot(hotspot) ||
                                isPlaceOverviewHotspot(hotspot)) &&
                              openNamingOpportunity
                            ) ?
                              <button
                                type='button'
                                className={devViewPanelIconBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => {
                                  // Overview pins: always use this manage row's scene.
                                  const hostSceneId =
                                    isPlaceOverviewHotspot(hotspot) ?
                                      scene.id
                                    : (findHotspotInTour(tour, hotspot.id)
                                        ?.sceneId ?? scene.id);
                                  openNamingHotspot(hostSceneId, hotspot.id);
                                }}
                                disabled={hotspotManageStatus === 'working'}
                                aria-label={`Open ${hotspotDisplayLabel(
                                  hotspot,
                                  tour,
                                  isModel3dTour ? null : tour.scenes[scene.id],
                                )}`}
                                title='Open'
                              >
                                <MaterialSymbol
                                  name='visibility'
                                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                                  className={materialSymbolLayoutClassName}
                                  aria-hidden
                                />
                              </button>
                            : null}
                            <button
                              type='button'
                              className={devViewPanelIconBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() => {
                                if (isMoving) return;
                                setEditingHotspotId(null);
                                setMovingHotspotId(hotspot.id);
                              }}
                              disabled={
                                hotspotManageStatus === 'working' || isMoving
                              }
                              aria-label={`Move ${hotspotDisplayLabel(
                                hotspot,
                                tour,
                                isModel3dTour ? null : tour.scenes[scene.id],
                              )}`}
                              title='Move'
                            >
                              <MaterialSymbol
                                name='open_with'
                                sizePx={MATERIAL_SYMBOL_SIZE_18}
                                className={materialSymbolLayoutClassName}
                                aria-hidden
                              />
                            </button>
                            <button
                              type='button'
                              className={devViewPanelIconBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() => startEditHotspot(hotspot)}
                              disabled={
                                hotspotManageStatus === 'working' || isEditing
                              }
                              aria-label={`Edit ${hotspotDisplayLabel(
                                hotspot,
                                tour,
                                isModel3dTour ? null : tour.scenes[scene.id],
                              )}`}
                              title='Edit'
                            >
                              <MaterialSymbol
                                name='edit'
                                sizePx={MATERIAL_SYMBOL_SIZE_18}
                                className={materialSymbolLayoutClassName}
                                aria-hidden
                              />
                            </button>
                            <button
                              type='button'
                              className={devViewPanelIconBtnVariants({
                                tone: 'danger',
                              })}
                              onClick={() => void deleteHotspot(hotspot.id)}
                              disabled={hotspotManageStatus === 'working'}
                              aria-label={`Delete ${hotspotDisplayLabel(
                                hotspot,
                                tour,
                                isModel3dTour ? null : tour.scenes[scene.id],
                              )}`}
                              title='Delete'
                            >
                              <MaterialSymbol
                                name='delete'
                                sizePx={MATERIAL_SYMBOL_SIZE_18}
                                className={materialSymbolLayoutClassName}
                                aria-hidden
                              />
                            </button>
                          </div>
                        </div>
                        <div
                          className={
                            devViewPanelManageListItemDescStackClassName
                          }
                        >
                          <ul
                            className={
                              devViewPanelManageListItemDescBulletListClassName
                            }
                          >
                            <li
                              className={
                                devViewPanelManageListItemDescBulletItemClassName
                              }
                              title={hotspot.id}
                            >
                              {formatManageListItemId('hotspot', hotspot.id)}
                            </li>
                            <li
                              className={
                                devViewPanelManageListItemDescBulletItemClassName
                              }
                              title={formatHotspotPosition(hotspot)}
                            >
                              <span className='line-clamp-2'>
                                {formatHotspotPosition(hotspot)}
                              </span>
                            </li>
                            {(
                              isModel3dTour &&
                              hotspot.type === 'info' &&
                              hotspot.sceneId
                            ) ?
                              <li
                                className={
                                  devViewPanelManageListItemDescBulletItemClassName
                                }
                                title={hotspot.sceneId}
                              >
                                {`viewpoint ${hotspot.sceneId}`}
                              </li>
                            : null}
                          </ul>
                        </div>

                        {isMoving ?
                          <DevPanelFormGroup inline manageEdit>
                            <div className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Hotspot position
                              </span>
                              <p className={devViewPanelSectionHintClassName}>
                                Drag the highlighted hotspot in the viewer —
                                drop to save
                                {(
                                  isNamingInfoHotspot(hotspot) && !isModel3dTour
                                ) ?
                                  <>
                                    {' '}
                                    (also rebakes Explore{' '}
                                    <code>preview.image</code>)
                                  </>
                                : null}
                                .
                              </p>
                              {hotspotManageStatus === 'working' ?
                                <p className={devViewPanelSectionHintClassName}>
                                  Saving…
                                </p>
                              : hotspotManageError ?
                                <p className={devViewPanelSectionHintClassName}>
                                  {hotspotManageError}
                                </p>
                              : null}
                            </div>
                            <div className={devViewPanelActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => setMovingHotspotId(null)}
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Cancel
                              </button>
                            </div>
                          </DevPanelFormGroup>
                        : null}
                        {isEditing ?
                          hotspot.type === 'nav' ?
                            <DevPanelFormGroup inline manageEdit>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Label (optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={editNavLabel}
                                  onChange={(e) =>
                                    setEditNavLabel(e.target.value)
                                  }
                                  placeholder={
                                    tour.scenes[editNavTarget]?.title?.trim() ||
                                    'Uses target scene title'
                                  }
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Target scene
                                </span>
                                <select
                                  className={devViewPanelSelectClassName}
                                  value={editNavTarget}
                                  onChange={(e) => {
                                    const nextId = e.target.value;
                                    const prevTitle =
                                      tour.scenes[
                                        editNavTarget
                                      ]?.title?.trim() ?? '';
                                    setEditNavTarget(nextId);
                                    setEditNavLabel((prev) => {
                                      const trimmed = prev.trim();
                                      if (!trimmed || trimmed === prevTitle) {
                                        return '';
                                      }
                                      return prev;
                                    });
                                  }}
                                >
                                  <option value=''>Select scene…</option>
                                  {sortedSceneOptions.map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                      {collidingSceneTitleIds.has(entry.id) ?
                                        `${entry.title} · id ${entry.id}`
                                      : entry.title}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <p className={devViewPanelSectionHintClassName}>
                                Leave label empty to use the target scene title
                                (stays in sync when the scene is renamed).
                              </p>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Nav role
                                </span>
                                <select
                                  className={devViewPanelSelectClassName}
                                  value={editNavVariant}
                                  onChange={(e) => {
                                    const nextVariant = e.target
                                      .value as NavHotspotVariant;
                                    setEditNavVariant(nextVariant);
                                    if (
                                      nextVariant === 'back' ||
                                      nextVariant === 'hub'
                                    ) {
                                      setEditNavInstant(true);
                                    }
                                    if (nextVariant === 'hub') {
                                      setEditNavTarget(tour.firstScene);
                                    }
                                  }}
                                >
                                  {NAV_HOTSPOT_VARIANT_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <p className={devViewPanelSectionHintClassName}>
                                {
                                  NAV_HOTSPOT_VARIANT_OPTIONS.find(
                                    (option) => option.value === editNavVariant,
                                  )?.hint
                                }
                              </p>
                              <p className={devViewPanelSectionHintClassName}>
                                Arrival camera always uses the target scene
                                landing view. Update it from the target scene’s{' '}
                                <code>defaultView</code> (Apply landing view).
                              </p>
                              <label
                                className={devViewPanelToggleLabelClassName}
                              >
                                <input
                                  className={devViewPanelToggleInputClassName}
                                  type='checkbox'
                                  checked={editNavInstant}
                                  onChange={(e) =>
                                    setEditNavInstant(e.target.checked)
                                  }
                                />
                                <span
                                  className={devViewPanelToggleNameClassName}
                                >
                                  Instant (skip preview card)
                                </span>
                              </label>
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'secondary',
                                  })}
                                  onClick={() => setEditingHotspotId(null)}
                                  disabled={hotspotManageStatus === 'working'}
                                >
                                  Cancel
                                </button>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'primary',
                                  })}
                                  onClick={() => void saveHotspotEdit()}
                                  disabled={hotspotManageStatus === 'working'}
                                >
                                  Save nav
                                </button>
                              </div>
                            </DevPanelFormGroup>
                          : isNamingInfoHotspot(hotspot) ?
                            <DevPanelFormGroup inline manageEdit>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Naming opportunity
                                </span>
                                <select
                                  className={devViewPanelSelectClassName}
                                  value={editNoNamingId}
                                  onChange={(e) =>
                                    setEditNoNamingId(e.target.value)
                                  }
                                >
                                  <option value=''>
                                    Select naming opportunity…
                                  </option>
                                  {namingCatalogRows.map((row) => (
                                    <option
                                      key={row.record.id}
                                      value={row.record.id}
                                    >
                                      {row.displayName}
                                      {' · '}
                                      {row.record.id}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <p className={devViewPanelSectionHintClassName}>
                                Like nav target scene — this hotspot points at a
                                catalog NO. Edit name / price / status / media
                                in Naming catalog. Use Move to reposition
                                {!isModel3dTour ?
                                  <>
                                    {' '}
                                    (rebakes Explore <code>preview.image</code>)
                                  </>
                                : null}
                                .
                              </p>
                              {isModel3dTour ?
                                <label className={devViewPanelFieldClassName}>
                                  <span
                                    className={devViewPanelFieldLabelClassName}
                                  >
                                    targetView
                                  </span>
                                  <p
                                    className={devViewPanelSectionHintClassName}
                                  >
                                    Orbit to frame the opening shot — Save
                                    writes <code>targetView</code> and bakes
                                    Explore <code>preview.image</code> from the
                                    current 3D view. Scene landing unchanged.
                                  </p>
                                  <input
                                    className={devViewPanelInputClassName}
                                    type='text'
                                    readOnly
                                    tabIndex={-1}
                                    value={view ? formatViewPosition(view) : ''}
                                    placeholder='Orbit the 3D viewer…'
                                  />
                                </label>
                              : null}
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'secondary',
                                  })}
                                  onClick={() => setEditingHotspotId(null)}
                                  disabled={hotspotManageStatus === 'working'}
                                >
                                  Cancel
                                </button>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'primary',
                                  })}
                                  onClick={() => void saveHotspotEdit()}
                                  disabled={
                                    hotspotManageStatus === 'working' ||
                                    !editNoNamingId.trim()
                                  }
                                >
                                  Save hotspot
                                </button>
                              </div>
                            </DevPanelFormGroup>
                          : isPlaceOverviewHotspot(hotspot) ?
                            <DevPanelFormGroup inline manageEdit>
                              <p className={devViewPanelSectionHintClassName}>
                                Place overview copy inherits the scene title and
                                Description (or the first public naming body).
                                Edit those on the Scene form. Use Move to
                                reposition.
                              </p>
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'secondary',
                                  })}
                                  onClick={() => setEditingHotspotId(null)}
                                >
                                  Done
                                </button>
                              </div>
                            </DevPanelFormGroup>
                          : <DevPanelFormGroup inline manageEdit>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Title
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={editInfoTitle}
                                  onChange={(e) =>
                                    setEditInfoTitle(e.target.value)
                                  }
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Display
                                </span>
                                <select
                                  className={devViewPanelSelectClassName}
                                  value={editInfoDisplay}
                                  onChange={(e) =>
                                    setEditInfoDisplay(
                                      e.target.value as PopupDisplay,
                                    )
                                  }
                                >
                                  {DEV_INFO_DISPLAY_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Body
                                </span>
                                <DevPanelDescriptionTextarea
                                  value={editInfoBody}
                                  onChange={(e) =>
                                    setEditInfoBody(e.target.value)
                                  }
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Video URL (optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='url'
                                  value={editInfoVideoUrl}
                                  onChange={(e) =>
                                    setEditInfoVideoUrl(e.target.value)
                                  }
                                  placeholder='https://youtube.com/…'
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Image path (optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={editInfoImage}
                                  onChange={(e) =>
                                    setEditInfoImage(e.target.value)
                                  }
                                  placeholder='/assets/…/photo.webp'
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Visit scene (optional)
                                </span>
                                <select
                                  className={devViewPanelSelectClassName}
                                  value={editInfoVisitScene}
                                  onChange={(e) =>
                                    setEditInfoVisitScene(e.target.value)
                                  }
                                >
                                  <option value=''>None</option>
                                  {sortedSceneOptions.map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                      {collidingSceneTitleIds.has(entry.id) ?
                                        `${entry.title} · id ${entry.id}`
                                      : entry.title}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'secondary',
                                  })}
                                  onClick={() => setEditingHotspotId(null)}
                                  disabled={hotspotManageStatus === 'working'}
                                >
                                  Cancel
                                </button>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'primary',
                                  })}
                                  onClick={() => void saveHotspotEdit()}
                                  disabled={
                                    hotspotManageStatus === 'working' ||
                                    (!editInfoTitle.trim() &&
                                      !editInfoBody.trim() &&
                                      !editInfoVideoUrl.trim() &&
                                      !editInfoImage.trim())
                                  }
                                >
                                  Save info
                                </button>
                              </div>
                            </DevPanelFormGroup>

                        : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            : <p className={devViewPanelSectionHintClassName}>
                {managedHotspots.length === 0 ?
                  hotspotSectionConfig.emptyMessage
                : hotspotManageFilter === 'all' ?
                  hotspotSectionConfig.emptyMessage
                : `No ${
                    hotspotManageFilter === 'naming' ? 'NO'
                    : hotspotManageFilter === 'nav' ? 'nav'
                    : 'info'
                  } hotspots in this list.`
                }
              </p>
            }
            {hotspotManageError ?
              <p className={devViewPanelSectionHintClassName}>
                {hotspotManageError}
              </p>
            : null}
          </DevPanelFormGroup>
        </DevPanelSection>
      </>
    </DevPanelSectionAccordion>
  );
}
