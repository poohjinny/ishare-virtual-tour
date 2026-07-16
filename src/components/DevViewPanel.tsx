import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DEV_URL_FLAG_TOGGLES,
  type DevUrlFlagToggle,
} from '../constants/devUrlFlags';
import { useAppSearchParams } from '../hooks/useAppSearchParams';
import { subscribeDevCatalogSnapshot } from '../data/devCatalogSnapshot';
import {
  listRoutableTourIds,
  listTours,
  loadTour,
  removeDevTourCache,
  setDevTourCache,
  tryLoadTour,
  type TourListItem,
} from '../data/loadTour';
import { normalizeTourAssets } from '../services/normalizeTourAssets';
import {
  listTourCategories,
  findCatalogClient,
  findCatalogTour,
} from '../data/tourCatalog';
import {
  buildTourLocation,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../utils/tourPaths';
import { getTourClientId } from '../utils/tourClientId';
import {
  resolveTourBranding,
  tourUsesCustomBranding,
} from '../utils/resolveTourBranding';
import { getTourProductFullName } from '../utils/tourProductName';
import {
  formatNamingPriceInput,
  parseNamingPriceInput,
} from '../utils/namingPrice';
import {
  DEV_INFO_DISPLAY_OPTIONS,
  DEV_NAMING_STATUS_OPTIONS,
  type DevHotspotTab,
  getDevHotspotSectionConfig,
  type DevHotspotManageScope,
} from '../constants/devHotspot';
import {
  NAV_HOTSPOT_VARIANT_DEFAULT,
  NAV_HOTSPOT_VARIANT_OPTIONS,
  resolveNavHotspotVariant,
  serializeNavHotspotVariant,
} from '../constants/navHotspotVariant';
import {
  DEV_CRUD_MODE_TABS,
  DEV_PANEL_TABS,
  DEV_CATALOG_VISIBILITY_OPTIONS,
  type DevCatalogTourVisibility,
  type DevCrudModeTab,
  type DevPanelTab,
} from '../constants/devPanel';
import type { TourCategory } from '../constants/tourCategories';
import type {
  FaqEntry,
  Hotspot,
  NamingOpportunityStatus,
  NavHotspotVariant,
  PopupDisplay,
  Scene,
  Tour,
  TourKnowledge,
  ViewPosition,
} from '../types/tour';
import { isWorldPosition } from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import { resolveNavHotspotLabel } from '../utils/navHotspotLabel';
import {
  DEV_NAV_NAME_STORAGE_KEY,
  DEV_NO_NAME_STORAGE_KEY,
  DEV_SCENE_TITLE_STORAGE_KEY,
  formatCoords,
  formatViewPosition,
  isWorldClickCoords,
  logLandingView,
  previewHotspotId,
  slugifyHotspotName,
  toViewPosition,
  type DevSceneRef,
} from '../utils/devHotspotLogger';
import {
  DevTourApiError,
  devApplySceneDefaultView,
  devCreateInfoHotspot,
  devCreateNamingHotspot,
  devCreateNavHotspot,
  devCreateScene,
  devCreateTour,
  devDeleteHotspot,
  devDeleteScene,
  devDeleteTour,
  devFetchTour,
  refreshDevCatalogSnapshot,
  devFetchCatalogClients,
  devFetchKnowledge,
  devFetchTourRecord,
  devUpdateKnowledge,
  devBase64ToImageFile,
  devReplaceScenePanorama,
  devSuggestBranding,
  devUpdateHotspotPosition,
  devUpdateInfoHotspot,
  devUpdateNavHotspot,
  devUpdateNamingHotspot,
  devUpdateScene,
  devUpdateTour,
  devUpdateTourFloorPlan,
  type DevCatalogClient,
  type DevTourBrandingMode,
  type DevTourMutateOptions,
} from '../utils/devTourApi';
import {
  buildDefaultPanoramaRelativePath,
  buildDefaultPanoramaWebPath,
  buildDefaultSceneThumbnailRelativePath,
  buildDefaultSceneThumbnailWebPath,
} from '../utils/devScenePanoramaPath';
import {
  sceneKnowledgeFromForm,
  sceneKnowledgeToForm,
} from '../utils/devKnowledgeForm';
import {
  findHotspotInTour,
  listAllTourHotspotIds,
  listDevTourHotspots,
} from '../utils/findTourHotspot';
import { buildScenePlaceLeadFromNaming } from '../utils/resolveScenePlaceLead';
import { TOUR_DIRECTORY_GROUP_OTHER } from '../constants/tourDirectory';
import { buildSceneGroupSecondaryById } from '../viewer/sceneDepth';
import { cn } from '../lib/cn';
import {
  devViewPanelActionsClassName,
  devViewPanelBodyClassName,
  devViewPanelBtnVariants,
  devViewPanelCoordsClassName,
  devViewPanelControlRadiusClassName,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelBrandFaviconClassName,
  devViewPanelBrandLogoClassName,
  devViewPanelInputClassName,
  devViewPanelRootClassName,
  devViewPanelSectionHintClassName,
  devViewPanelTabHintClassName,
  devViewPanelSectionLeadClassName,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelStickyHeaderClassName,
  devViewPanelStickyTourLogoClassName,
  devViewPanelStickyTourLogoWrapClassName,
  devViewPanelStickyTourTitleClassName,
  devViewPanelFormGroupTitleClassName,
  devViewPanelPrimaryTabsClassName,
  devViewPanelSecondaryTabsClassName,
  devViewPanelTabPanelBodyClassName,
  devViewPanelTabPanelClassName,
  devViewPanelTabVariants,
  devViewPanelTextareaClassName,
  devViewPanelToggleHintClassName,
  devViewPanelFormCheckboxInputClassName,
  devViewPanelFormCheckboxLabelClassName,
  devViewPanelToggleInputClassName,
  devViewPanelToggleLabelClassName,
  devViewPanelToggleLabelMultilineClassName,
  devViewPanelToggleListClassName,
  devViewPanelToggleNameClassName,
  devViewPanelToggleTextClassName,
  devViewPanelTourSwitchAnchorClassName,
  devViewPanelTourSwitchChevronClassName,
  devViewPanelTourSwitchMenuClassName,
  devViewPanelTourSwitchGroupHeadingClassName,
  devViewPanelTourSwitchMenuItemActiveClassName,
  devViewPanelTourSwitchMenuItemClassName,
  devViewPanelTourSwitchTriggerClassName,
  devViewPanelTourSwitcherClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListFooterClassName,
  devViewPanelStackedFormFooterClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemDescClassName,
  devViewPanelManageListItemHeadClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelManageListItemBulletClassName,
  devViewPanelManageListItemIdClassName,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemBadgesClassName,
  devHotspotKindBadgeVariants,
  type DevHotspotKindBadgeKind,
} from './devViewPanelVariants';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import { DevClientPanel } from './DevClientPanel';
import { DevPanelFileField } from './DevPanelFileField';
import { DevPanelFileInput } from './DevPanelFileInput';
import { DevLocalFilePreview } from './DevLocalFilePreview';
import { DevPanoramaFilePreview } from './DevPanoramaFilePreview';
import {
  DevPanelColorField,
  normalizeHexColorInput,
} from './DevPanelColorField';
import {
  buildDevExperienceApiFields,
  DEFAULT_DEV_EXPERIENCE_FORM,
  DevPanelExperienceSection,
  type DevImmersiveMode,
} from './DevPanelExperienceSection';
import {
  DevPanelFormGroup,
  DevPanelFormRow,
  DevPanelFormSection,
} from './DevPanelFormGroup';
import { DevPanelTertiaryTabs } from './DevPanelTertiaryTabs';
import { DevPanelEmbedDebug } from './DevPanelEmbedDebug';
import { Badge } from './ui/Badge';

const DEFAULT_NEW_TOUR_PRIMARY_COLOR = '#007078';

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
  view: ViewPosition | null;
  clickCoords: ClickCoords | null;
  captureSceneThumbnail?: () => Promise<Blob | null>;
  getCurrentView?: () => ViewPosition | null;
  focusHotspot?: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
  onClose?: () => void;
}

type ActionStatus = 'idle' | 'working' | 'done' | 'error';

function isNamingInfoHotspot(hotspot: Hotspot): boolean {
  return hotspot.type === 'info' && Boolean(hotspot.popup?.namingOpportunity);
}

function hotspotKindLabel(hotspot: Hotspot): string {
  if (hotspot.type === 'nav') {
    const variant = resolveNavHotspotVariant(hotspot);
    const variantLabel =
      NAV_HOTSPOT_VARIANT_OPTIONS.find((option) => option.value === variant)
        ?.label ?? 'Discover';
    return `Nav · ${variantLabel}`;
  }
  if (isNamingInfoHotspot(hotspot)) return 'NO';
  if (hotspot.type === 'info') return 'Info';
  return hotspot.type;
}

function hotspotKindBadgeKind(hotspot: Hotspot): DevHotspotKindBadgeKind {
  if (hotspot.type === 'nav') return 'nav';
  if (isNamingInfoHotspot(hotspot)) return 'naming';
  return 'info';
}

function hotspotDisplayLabel(hotspot: Hotspot, tour: Tour): string {
  if (hotspot.type === 'nav') return resolveNavHotspotLabel(hotspot, tour);
  if (isNamingInfoHotspot(hotspot)) {
    return (
      hotspot.popup?.namingOpportunity?.name?.trim() ||
      hotspot.popup?.title?.trim() ||
      hotspot.id
    );
  }
  return hotspot.popup?.title?.trim() || hotspot.label?.trim() || hotspot.id;
}

function confirmDevPanelDelete(message: string): boolean {
  return window.confirm(`${message}\n\nThis cannot be undone.`);
}

function formatHotspotPosition(hotspot: Hotspot): string {
  if (isWorldPosition(hotspot.position)) {
    return formatCoords(hotspot.position);
  }
  return formatViewPosition(hotspot.position);
}

function hotspotManageKindOrder(hotspot: Hotspot): number {
  if (hotspot.type === 'nav') return 0;
  if (isNamingInfoHotspot(hotspot)) return 1;
  if (hotspot.type === 'info') return 2;
  return 3;
}

function sortSceneHotspotsForManage(
  hotspots: Hotspot[],
  tour: Tour,
): Hotspot[] {
  return [...hotspots].sort((a, b) => {
    const kindDiff = hotspotManageKindOrder(a) - hotspotManageKindOrder(b);
    if (kindDiff !== 0) return kindDiff;

    const labelDiff = hotspotDisplayLabel(a, tour).localeCompare(
      hotspotDisplayLabel(b, tour),
      undefined,
      { sensitivity: 'base' },
    );
    if (labelDiff !== 0) return labelDiff;

    return a.id.localeCompare(b.id);
  });
}

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
  id,
  tour,
  onTourMutated,
  scene,
  currentSceneId,
  sceneOptions,
  view,
  clickCoords,
  captureSceneThumbnail,
  getCurrentView,
  focusHotspot,
  onClose,
}: DevViewPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const appSearchParams = useAppSearchParams();
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
  const devViewerClickPlaceholder =
    isModel3dTour ? 'Click the 3D viewer…' : 'Click the panorama…';
  const devViewerClickHint =
    isModel3dTour ?
      'Click the 3D viewer to set position'
    : 'Click the panorama to set position';
  const [landingStatus, setLandingStatus] = useState<ActionStatus>('idle');
  const [landingError, setLandingError] = useState<string | null>(null);
  const [navStatus, setNavStatus] = useState<ActionStatus>('idle');
  const [navError, setNavError] = useState<string | null>(null);
  const [namingStatus, setNamingStatus] = useState<ActionStatus>('idle');
  const [namingError, setNamingError] = useState<string | null>(null);
  const [sceneStatus, setSceneStatus] = useState<ActionStatus>('idle');
  const [sceneError, setSceneError] = useState<string | null>(null);
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
  const [editNoTitle, setEditNoTitle] = useState('');
  const [editNoPrice, setEditNoPrice] = useState('');
  const [editNoStatus, setEditNoStatus] = useState<
    NamingOpportunityStatus | ''
  >('');
  const [editNoBody, setEditNoBody] = useState('');
  const [editNoVideoUrl, setEditNoVideoUrl] = useState('');
  const [editNoImage, setEditNoImage] = useState('');
  const [editNoSyncPosition, setEditNoSyncPosition] = useState(false);
  const [editInfoTitle, setEditInfoTitle] = useState('');
  const [editInfoBody, setEditInfoBody] = useState('');
  const [editInfoDisplay, setEditInfoDisplay] =
    useState<PopupDisplay>('anchored');
  const [editInfoVideoUrl, setEditInfoVideoUrl] = useState('');
  const [editInfoImage, setEditInfoImage] = useState('');
  const [editInfoVisitScene, setEditInfoVisitScene] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneTitle, setEditSceneTitle] = useState('');
  const [editSceneDescription, setEditSceneDescription] = useState('');
  const [editScenePreviewVideoUrl, setEditScenePreviewVideoUrl] = useState('');
  const [editSceneVideoUrl, setEditSceneVideoUrl] = useState('');
  const [editSceneAsFirst, setEditSceneAsFirst] = useState(false);
  const [editSceneMapEnabled, setEditSceneMapEnabled] = useState(false);
  const [editSceneMapX, setEditSceneMapX] = useState('');
  const [editSceneMapY, setEditSceneMapY] = useState('');
  const [editSceneMapHeading, setEditSceneMapHeading] = useState('');
  const [sceneManageStatus, setSceneManageStatus] =
    useState<ActionStatus>('idle');
  const [sceneManageError, setSceneManageError] = useState<string | null>(null);
  const [tourModeTab, setTourModeTab] = useState<DevCrudModeTab>('manage');
  const [manageClientId, setManageClientId] = useState('');
  const [catalogClients, setCatalogClients] = useState<DevCatalogClient[]>([]);
  const [newTourClientId, setNewTourClientId] = useState('');
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourSummary, setNewTourSummary] = useState('');
  const [newTourIdInput, setNewTourIdInput] = useState('');
  const [newTourCategory, setNewTourCategory] =
    useState<TourCategory>('Healthcare');
  const [newTourVisibility, setNewTourVisibility] =
    useState<DevCatalogTourVisibility>('unlisted');
  const [newTourFeatured, setNewTourFeatured] = useState(false);
  const [newTourTransitionEffect, setNewTourTransitionEffect] = useState<
    'fade' | 'black'
  >(DEFAULT_DEV_EXPERIENCE_FORM.transitionEffect);
  const [newTourTransitionSpeed, setNewTourTransitionSpeed] = useState(
    DEFAULT_DEV_EXPERIENCE_FORM.transitionSpeed,
  );
  const [newTourImmersiveMode, setNewTourImmersiveMode] =
    useState<DevImmersiveMode>(DEFAULT_DEV_EXPERIENCE_FORM.immersiveMode);
  const [newTourImmersiveAudio, setNewTourImmersiveAudio] = useState(
    DEFAULT_DEV_EXPERIENCE_FORM.immersiveAudio,
  );
  const [newTourImmersivePlaylistText, setNewTourImmersivePlaylistText] =
    useState(DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistText);
  const [
    newTourImmersivePlaylistManifest,
    setNewTourImmersivePlaylistManifest,
  ] = useState(DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistManifest);
  const [newTourImmersiveVolume, setNewTourImmersiveVolume] = useState(
    DEFAULT_DEV_EXPERIENCE_FORM.immersiveVolume,
  );
  const [newTourPrimaryColor, setNewTourPrimaryColor] = useState(
    DEFAULT_NEW_TOUR_PRIMARY_COLOR,
  );
  const [newTourBrandingMode, setNewTourBrandingMode] =
    useState<DevTourBrandingMode>('client');
  const [newTourLogoAlt, setNewTourLogoAlt] = useState('');
  const [newTourLogoFile, setNewTourLogoFile] = useState<File | null>(null);
  const [newTourFaviconFile, setNewTourFaviconFile] = useState<File | null>(
    null,
  );
  const [suggestBrandingStatus, setSuggestBrandingStatus] =
    useState<ActionStatus>('idle');
  const [suggestBrandingNotes, setSuggestBrandingNotes] = useState<string[]>(
    [],
  );
  const [newFirstSceneTitle, setNewFirstSceneTitle] = useState('Overview');
  const [newTourPanoramaFile, setNewTourPanoramaFile] = useState<File | null>(
    null,
  );
  const [newTourStatus, setNewTourStatus] = useState<ActionStatus>('idle');
  const [newTourError, setNewTourError] = useState<string | null>(null);
  const [editTourTitle, setEditTourTitle] = useState('');
  const [editTourSummary, setEditTourSummary] = useState('');
  const [editTourCategory, setEditTourCategory] =
    useState<TourCategory>('Healthcare');
  const [editTourVisibility, setEditTourVisibility] =
    useState<DevCatalogTourVisibility>('unlisted');
  const [editTourFeatured, setEditTourFeatured] = useState(false);
  const [editTourPrimaryColor, setEditTourPrimaryColor] = useState(
    DEFAULT_NEW_TOUR_PRIMARY_COLOR,
  );
  const [editTourBrandingMode, setEditTourBrandingMode] =
    useState<DevTourBrandingMode>('client');
  const [editTourLogoAlt, setEditTourLogoAlt] = useState('');
  const [editTourFontFamily, setEditTourFontFamily] = useState('');
  const [editTourFontSourceUrl, setEditTourFontSourceUrl] = useState('');
  const [editTourProductFullName, setEditTourProductFullName] = useState('');
  const [editTransitionEffect, setEditTransitionEffect] = useState<
    'fade' | 'black'
  >('fade');
  const [editTransitionSpeed, setEditTransitionSpeed] = useState('500ms');
  const [editImmersiveMode, setEditImmersiveMode] = useState<
    'platform' | 'manifest' | 'audio' | 'playlist'
  >('platform');
  const [editImmersiveAudio, setEditImmersiveAudio] = useState('');
  const [editImmersivePlaylistText, setEditImmersivePlaylistText] =
    useState('');
  const [editImmersivePlaylistManifest, setEditImmersivePlaylistManifest] =
    useState('');
  const [editImmersiveVolume, setEditImmersiveVolume] = useState('');
  const [editTourLogoFile, setEditTourLogoFile] = useState<File | null>(null);
  const [editTourFaviconFile, setEditTourFaviconFile] = useState<File | null>(
    null,
  );
  const [editTourSuggestStatus, setEditTourSuggestStatus] =
    useState<ActionStatus>('idle');
  const [editTourSuggestNotes, setEditTourSuggestNotes] = useState<string[]>(
    [],
  );
  const [editTourStatus, setEditTourStatus] = useState<ActionStatus>('idle');
  const [editTourError, setEditTourError] = useState<string | null>(null);
  const [deleteTourConfirm, setDeleteTourConfirm] = useState('');
  const [deleteTourStatus, setDeleteTourStatus] =
    useState<ActionStatus>('idle');
  const [deleteTourError, setDeleteTourError] = useState<string | null>(null);
  const [floorPlanWidth, setFloorPlanWidth] = useState('');
  const [floorPlanHeight, setFloorPlanHeight] = useState('');
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanStatus, setFloorPlanStatus] = useState<ActionStatus>('idle');
  const [floorPlanError, setFloorPlanError] = useState<string | null>(null);
  const [knowledgeMissing, setKnowledgeMissing] = useState(false);
  const [knowledgeLoadStatus, setKnowledgeLoadStatus] =
    useState<ActionStatus>('idle');
  const [knowledgeLoadError, setKnowledgeLoadError] = useState<string | null>(
    null,
  );
  const [knowledgeUrl, setKnowledgeUrl] = useState('');
  const [knowledgeFacilityName, setKnowledgeFacilityName] = useState('');
  const [knowledgeSummary, setKnowledgeSummary] = useState('');
  const [knowledgeSceneId, setKnowledgeSceneId] = useState('');
  const [knowledgeSceneTitle, setKnowledgeSceneTitle] = useState('');
  const [knowledgeSceneDescription, setKnowledgeSceneDescription] =
    useState('');
  const [knowledgeFactsText, setKnowledgeFactsText] = useState('');
  const [knowledgeFaqs, setKnowledgeFaqs] = useState<FaqEntry[]>([]);
  const [knowledgeSuggestedText, setKnowledgeSuggestedText] = useState('');
  const [knowledgeStatus, setKnowledgeStatus] = useState<ActionStatus>('idle');
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [replacePanoramaFile, setReplacePanoramaFile] = useState<File | null>(
    null,
  );
  const [replacePanoramaStatus, setReplacePanoramaStatus] =
    useState<ActionStatus>('idle');
  const [replacePanoramaError, setReplacePanoramaError] = useState<
    string | null
  >(null);

  const tourScenes = useMemo(
    () =>
      Object.values(tour.scenes).sort((a, b) => a.title.localeCompare(b.title)),
    [tour.scenes],
  );

  /** Dev Manage secondary — floor / department title; fall back to scene id. */
  const sceneManageSecondaryById = useMemo(
    () =>
      buildSceneGroupSecondaryById(
        tour,
        tour.scenes,
        tour.firstScene,
        TOUR_DIRECTORY_GROUP_OTHER,
      ),
    [tour],
  );
  const knowledgeSceneDraftsRef = useRef<
    Record<string, TourKnowledge['scenes'][string]>
  >({});

  const applyKnowledgeSceneForm = useCallback(
    (sceneId: string) => {
      const scene = tour.scenes[sceneId];
      const draft = knowledgeSceneDraftsRef.current[sceneId];
      const form = sceneKnowledgeToForm(draft, sceneId, scene?.title);
      setKnowledgeSceneTitle(form.title);
      setKnowledgeSceneDescription(form.description);
      setKnowledgeFactsText(form.factsText);
      setKnowledgeFaqs(form.faqs);
      setKnowledgeSuggestedText(form.suggestedQuestionsText);
    },
    [tour.scenes],
  );

  const persistKnowledgeSceneDraft = useCallback(
    (sceneId: string) => {
      if (!sceneId) return;
      knowledgeSceneDraftsRef.current[sceneId] = sceneKnowledgeFromForm({
        title: knowledgeSceneTitle,
        description: knowledgeSceneDescription,
        factsText: knowledgeFactsText,
        faqs: knowledgeFaqs,
        suggestedQuestionsText: knowledgeSuggestedText,
      });
    },
    [
      knowledgeFaqs,
      knowledgeFactsText,
      knowledgeSceneDescription,
      knowledgeSceneTitle,
      knowledgeSuggestedText,
    ],
  );

  const [sceneTitle, setSceneTitle] = useState(() =>
    readSessionValue(DEV_SCENE_TITLE_STORAGE_KEY),
  );
  const [scenePanoramaFile, setScenePanoramaFile] = useState<File | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [scenePreviewVideoUrl, setScenePreviewVideoUrl] = useState('');
  const [sceneVideoUrl, setSceneVideoUrl] = useState('');

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

  const [noName, setNoName] = useState(() =>
    readSessionValue(DEV_NO_NAME_STORAGE_KEY),
  );
  const [noPrice, setNoPrice] = useState('');
  const [noStatus, setNoStatus] = useState<NamingOpportunityStatus | ''>('');
  const [noBody, setNoBody] = useState('');
  const [noVideoUrl, setNoVideoUrl] = useState('');
  const [noImage, setNoImage] = useState('');
  const [infoName, setInfoName] = useState('');
  const [infoBody, setInfoBody] = useState('');
  const [infoDisplay, setInfoDisplay] = useState<PopupDisplay>('anchored');
  const [infoVideoUrl, setInfoVideoUrl] = useState('');
  const [infoImage, setInfoImage] = useState('');
  const [infoVisitScene, setInfoVisitScene] = useState('');
  const [infoStatus, setInfoStatus] = useState<ActionStatus>('idle');
  const [infoError, setInfoError] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<DevPanelTab>('scene');
  const [hotspotModeTab, setHotspotModeTab] =
    useState<DevCrudModeTab>('manage');
  const [sceneModeTab, setSceneModeTab] = useState<DevCrudModeTab>('manage');
  const [tourSwitchOpen, setTourSwitchOpen] = useState(false);
  const [tourSwitchMenuStyle, setTourSwitchMenuStyle] = useState<CSSProperties>(
    {},
  );
  const tourSwitchRef = useRef<HTMLDivElement>(null);
  const tourSwitchTriggerRef = useRef<HTMLButtonElement>(null);
  const tourSwitchMenuRef = useRef<HTMLUListElement>(null);
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const panelScrollTopRequestRef = useRef(false);
  const [hotspotTab, setHotspotTab] = useState<DevHotspotTab>('nav');

  const hotspotManageScope = useMemo((): DevHotspotManageScope => {
    return isModel3dTour ? 'model3d-tour' : 'panorama-scene';
  }, [isModel3dTour]);

  const hotspotSectionConfig = useMemo(
    () => getDevHotspotSectionConfig(hotspotManageScope),
    [hotspotManageScope],
  );

  const managedHotspots = useMemo(() => {
    if (isModel3dTour) {
      return sortSceneHotspotsForManage(listDevTourHotspots(tour), tour);
    }
    return sortSceneHotspotsForManage(
      tour.scenes[scene.id]?.hotspots ?? [],
      tour,
    );
  }, [isModel3dTour, scene.id, tour]);

  const showHotspotDevPanel =
    !isModel3dTour ?
      panelTab === 'scene'
    : panelTab === 'tour' && tourModeTab === 'manage';

  const hotspotCreateTabs = hotspotSectionConfig.createTabs;

  const canCreateNavHotspot = hotspotCreateTabs.some((tab) => tab.id === 'nav');
  const canCreateNamingHotspot = hotspotCreateTabs.some(
    (tab) => tab.id === 'naming',
  );
  const canCreateInfoHotspot = hotspotCreateTabs.some(
    (tab) => tab.id === 'info',
  );

  const canWriteTour = Boolean(scene.tourId && view);
  const trimmedNavName = navName.trim();
  const trimmedNoName = noName.trim();
  const trimmedInfoName = infoName.trim();
  const hostSceneRecord = tour.scenes[scene.id];
  const inheritedNoTitle = hostSceneRecord?.title?.trim() ?? '';
  const inheritedNoBody = hostSceneRecord?.description?.trim() ?? '';
  const inheritedNoVideo = hostSceneRecord?.previewVideoUrl?.trim() ?? '';
  const navSlug = useMemo(
    () => (trimmedNavName ? slugifyHotspotName(trimmedNavName) : ''),
    [trimmedNavName],
  );
  const noSlug = useMemo(() => {
    const display = trimmedNoName || inheritedNoTitle;
    return display ? slugifyHotspotName(display) : '';
  }, [inheritedNoTitle, trimmedNoName]);
  const infoSlug = useMemo(
    () => (trimmedInfoName ? slugifyHotspotName(trimmedInfoName) : ''),
    [trimmedInfoName],
  );
  const existingHotspotIds = useMemo(
    () =>
      isModel3dTour ?
        listAllTourHotspotIds(tour)
      : managedHotspots.map((hotspot) => hotspot.id),
    [isModel3dTour, managedHotspots, tour],
  );
  const navHotspotIdPreview = useMemo(
    () =>
      navSlug ? previewHotspotId(existingHotspotIds, `nav-to-${navSlug}`) : '',
    [existingHotspotIds, navSlug],
  );
  const noHotspotIdPreview = useMemo(
    () =>
      noSlug ? previewHotspotId(existingHotspotIds, `info-${noSlug}`) : '',
    [existingHotspotIds, noSlug],
  );
  const infoHotspotIdPreview = useMemo(
    () =>
      infoSlug ? previewHotspotId(existingHotspotIds, `info-${infoSlug}`) : '',
    [existingHotspotIds, infoSlug],
  );
  const trimmedSceneTitle = sceneTitle.trim();
  const sceneSlug = useMemo(
    () => (trimmedSceneTitle ? slugifyHotspotName(trimmedSceneTitle) : ''),
    [trimmedSceneTitle],
  );
  const tourCategoryOptions = useMemo(() => listTourCategories(), []);
  const trimmedNewTourTitle = newTourTitle.trim();
  const selectedCreateCatalogClient = useMemo(
    () => catalogClients.find((client) => client.id === newTourClientId),
    [catalogClients, newTourClientId],
  );
  const createTourClientWebsite = selectedCreateCatalogClient?.website ?? '';
  const openCatalogClient = useMemo(
    () => findCatalogClient(getTourClientId(tour)),
    [tour, catalogTick],
  );
  const newTourSlug = useMemo(
    () =>
      newTourIdInput.trim() ? slugifyHotspotName(newTourIdInput)
      : trimmedNewTourTitle ? slugifyHotspotName(trimmedNewTourTitle)
      : '',
    [newTourIdInput, trimmedNewTourTitle],
  );
  const newFirstSceneSlug = useMemo(
    () =>
      newFirstSceneTitle.trim() ? slugifyHotspotName(newFirstSceneTitle) : '',
    [newFirstSceneTitle],
  );

  const canCreateNav = Boolean(scene.tourId && clickCoords && navTargetSceneId);
  const canCreateNaming = Boolean(
    scene.tourId &&
    clickCoords &&
    parseNamingPriceInput(noPrice) != null &&
    noStatus,
  );
  const canCreateInfo = Boolean(scene.tourId && clickCoords && trimmedInfoName);
  const canCreateScene = Boolean(
    scene.tourId &&
    trimmedSceneTitle &&
    (isModel3dTour ? view : scenePanoramaFile),
  );
  const canCreateNewTour = Boolean(
    newTourSlug && newFirstSceneSlug && newTourPanoramaFile && newTourClientId,
  );

  const resetNewTourForm = useCallback((preferredClientId?: string) => {
    setNewTourTitle('');
    setNewTourSummary('');
    setNewTourIdInput('');
    setNewTourCategory('Healthcare');
    setNewTourVisibility('unlisted');
    setNewTourFeatured(false);
    setNewTourTransitionEffect(DEFAULT_DEV_EXPERIENCE_FORM.transitionEffect);
    setNewTourTransitionSpeed(DEFAULT_DEV_EXPERIENCE_FORM.transitionSpeed);
    setNewTourImmersiveMode(DEFAULT_DEV_EXPERIENCE_FORM.immersiveMode);
    setNewTourImmersiveAudio(DEFAULT_DEV_EXPERIENCE_FORM.immersiveAudio);
    setNewTourImmersivePlaylistText(
      DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistText,
    );
    setNewTourImmersivePlaylistManifest(
      DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistManifest,
    );
    setNewTourImmersiveVolume(DEFAULT_DEV_EXPERIENCE_FORM.immersiveVolume);
    setNewTourPrimaryColor(DEFAULT_NEW_TOUR_PRIMARY_COLOR);
    setNewTourBrandingMode('client');
    setNewTourLogoAlt('');
    setNewTourLogoFile(null);
    setNewTourFaviconFile(null);
    setNewFirstSceneTitle('Overview');
    setNewTourPanoramaFile(null);
    setSuggestBrandingNotes([]);
    setSuggestBrandingStatus('idle');
    setNewTourStatus('idle');
    setNewTourError(null);
    setNewTourClientId(preferredClientId ?? '');
  }, []);

  const openCreateTourTab = useCallback(
    (preferredClientId?: string) => {
      resetNewTourForm(preferredClientId);
      setTourModeTab('create');
    },
    [resetNewTourForm],
  );

  const handleTourModeTabChange = useCallback(
    (tab: DevCrudModeTab) => {
      if (tab === 'create') {
        openCreateTourTab();
        return;
      }
      setTourModeTab(tab);
    },
    [openCreateTourTab],
  );

  const openCreateHotspotTab = useCallback(() => {
    setEditingHotspotId(null);
    setMovingHotspotId(null);
    setHotspotTab(hotspotSectionConfig.createTabs[0]?.id ?? 'nav');
    setHotspotModeTab('create');
  }, [hotspotSectionConfig.createTabs]);

  const openCreateSceneTab = useCallback(() => {
    setEditingSceneId(null);
    setSceneModeTab('create');
  }, []);

  const canSaveEditTour = Boolean(editTourTitle.trim() && editTourCategory);
  const editTourProductNamePreview = useMemo(
    () =>
      getTourProductFullName({
        ...tour,
        title: editTourTitle.trim() || tour.title,
        productFullName: editTourProductFullName.trim() || undefined,
      }),
    [editTourProductFullName, editTourTitle, tour],
  );
  const canSaveFloorPlan = Boolean(
    tour.id &&
    (floorPlanFile ||
      (tour.floorPlan &&
        (floorPlanWidth.trim() !== String(tour.floorPlan.width) ||
          floorPlanHeight.trim() !== String(tour.floorPlan.height)))),
  );
  const canClearFloorPlan = Boolean(tour.floorPlan);
  const canDeleteTour = deleteTourConfirm.trim() === tour.id;
  const canSaveKnowledge = Boolean(
    tour.id &&
    knowledgeSceneId &&
    knowledgeFacilityName.trim() &&
    knowledgeSceneTitle.trim() &&
    knowledgeLoadStatus !== 'working',
  );
  const canReplacePanorama = Boolean(scene.tourId && replacePanoramaFile);
  const canMoveHotspot = Boolean(
    scene.tourId && movingHotspotId && clickCoords,
  );
  const scenePanoramaAutoPath =
    sceneSlug ?
      isModel3dTour ?
        buildDefaultSceneThumbnailWebPath(
          tour.clientId ?? tour.id,
          tour.id,
          sceneSlug,
        )
      : buildDefaultPanoramaWebPath(
          tour.clientId ?? tour.id,
          tour.id,
          sceneSlug,
        )
    : '';

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
  const trimmedNavTargetSceneTitle = navTargetSceneTitle.trim();
  const navTargetSceneSlug = useMemo(
    () =>
      trimmedNavTargetSceneTitle ?
        slugifyHotspotName(trimmedNavTargetSceneTitle)
      : '',
    [trimmedNavTargetSceneTitle],
  );
  const canCreateNavTargetScene = Boolean(
    scene.tourId &&
    trimmedNavTargetSceneTitle &&
    (isModel3dTour ? view : navTargetSceneFile),
  );

  useEffect(() => {
    if (panelTab !== 'tour' && panelTab !== 'client') return;

    void devFetchCatalogClients()
      .then((clients) => {
        setCatalogClients(clients);
        setManageClientId((current) => {
          if (current) return current;
          const openClientId = getTourClientId(tour);
          if (
            openClientId &&
            clients.some((client) => client.id === openClientId)
          ) {
            return openClientId;
          }
          return clients[0]?.id ?? '';
        });
      })
      .catch(() => {
        setCatalogClients([]);
      });
  }, [panelTab, tour]);

  useEffect(() => {
    if (panelTab !== 'tour' || !tour.id) return;

    void devFetchTourRecord(tour.id)
      .then(({ tour: rawTour, catalog }) => {
        if (catalog) {
          setEditTourVisibility(catalog.visibility);
          setEditTourFeatured(catalog.featured);
          setEditTourSummary(catalog.summary);
        }

        setEditTourProductFullName(rawTour.productFullName ?? '');
        setEditTransitionEffect(rawTour.defaultTransition?.effect ?? 'fade');
        setEditTransitionSpeed(rawTour.defaultTransition?.speed ?? '500ms');

        const immersive = rawTour.immersiveBackground;
        if (!immersive) {
          setEditImmersiveMode('platform');
          setEditImmersiveAudio('');
          setEditImmersivePlaylistText('');
          setEditImmersivePlaylistManifest('');
          setEditImmersiveVolume('');
          return;
        }

        if (immersive.playlistManifest) {
          setEditImmersiveMode('manifest');
          setEditImmersivePlaylistManifest(immersive.playlistManifest);
          setEditImmersiveAudio('');
          setEditImmersivePlaylistText('');
        } else if (immersive.audio) {
          setEditImmersiveMode('audio');
          setEditImmersiveAudio(immersive.audio);
          setEditImmersivePlaylistManifest('');
          setEditImmersivePlaylistText('');
        } else if (immersive.playlist?.length) {
          setEditImmersiveMode('playlist');
          setEditImmersivePlaylistText(immersive.playlist.join('\n'));
          setEditImmersiveAudio('');
          setEditImmersivePlaylistManifest('');
        } else {
          setEditImmersiveMode('manifest');
          setEditImmersivePlaylistManifest('');
          setEditImmersiveAudio('');
          setEditImmersivePlaylistText('');
        }

        setEditImmersiveVolume(
          immersive.volume !== undefined ? String(immersive.volume) : '',
        );
      })
      .catch(() => {
        /* catalog entry may be missing for legacy tours */
      });
  }, [panelTab, tour.id]);

  useEffect(() => {
    if (panelTab !== 'tour' || !tour.id) return;

    setKnowledgeLoadStatus('working');
    setKnowledgeLoadError(null);

    void devFetchKnowledge(tour.id)
      .then(({ knowledge, missing }) => {
        setKnowledgeMissing(missing);
        setKnowledgeUrl(knowledge.url ?? '');
        setKnowledgeFacilityName(knowledge.global?.facilityName ?? '');
        setKnowledgeSummary(knowledge.global?.summary ?? '');

        const drafts = { ...(knowledge.scenes ?? {}) };
        for (const scene of Object.values(tour.scenes)) {
          if (!drafts[scene.id]) {
            drafts[scene.id] = sceneKnowledgeFromForm(
              sceneKnowledgeToForm(undefined, scene.id, scene.title),
            );
          }
        }
        knowledgeSceneDraftsRef.current = drafts;

        const initialSceneId =
          tour.scenes[currentSceneId] ? currentSceneId : tour.firstScene;
        setKnowledgeSceneId(initialSceneId);
        applyKnowledgeSceneForm(initialSceneId);
        setKnowledgeLoadStatus('idle');
        setKnowledgeStatus('idle');
        setKnowledgeError(null);
      })
      .catch((error) => {
        setKnowledgeLoadStatus('error');
        setKnowledgeLoadError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not load knowledge',
        );
      });
  }, [
    applyKnowledgeSceneForm,
    currentSceneId,
    panelTab,
    tour.firstScene,
    tour.id,
    tour.scenes,
  ]);

  useEffect(() => {
    const catalogClient = findCatalogClient(getTourClientId(tour));

    setEditTourTitle(tour.title);
    setEditTourSummary(
      findCatalogTour(getTourClientId(tour), tour.id)?.summary ?? '',
    );
    setEditTourCategory((tour.category as TourCategory) ?? 'Healthcare');
    const usesCustomBranding = tourUsesCustomBranding(tour);
    setEditTourBrandingMode(usesCustomBranding ? 'custom' : 'client');
    const brandingSource =
      usesCustomBranding ? tour.branding : catalogClient?.branding;
    setEditTourPrimaryColor(
      brandingSource?.primaryColor ?? DEFAULT_NEW_TOUR_PRIMARY_COLOR,
    );
    setEditTourLogoAlt(brandingSource?.logoAlt ?? catalogClient?.name ?? '');
    setEditTourFontFamily(brandingSource?.fontFamily ?? '');
    setEditTourFontSourceUrl(brandingSource?.fontSourceUrl ?? '');
    setEditTourLogoFile(null);
    setEditTourFaviconFile(null);
    setEditTourSuggestNotes([]);
    setEditTourSuggestStatus('idle');
    setEditTourStatus('idle');
    setEditTourError(null);
    setFloorPlanWidth(tour.floorPlan ? String(tour.floorPlan.width) : '');
    setFloorPlanHeight(tour.floorPlan ? String(tour.floorPlan.height) : '');
    setFloorPlanFile(null);
    setFloorPlanStatus('idle');
    setFloorPlanError(null);
  }, [
    tour.branding?.fontFamily,
    tour.branding?.fontSourceUrl,
    tour.branding?.logoAlt,
    tour.branding?.primaryColor,
    tour.category,
    tour.clientId,
    tour.floorPlan?.height,
    tour.floorPlan?.width,
    tour.id,
    tour.title,
    catalogTick,
  ]);

  useEffect(() => {
    writeSessionValue(DEV_SCENE_TITLE_STORAGE_KEY, sceneTitle);
  }, [sceneTitle]);

  useEffect(() => {
    writeSessionValue(DEV_NAV_NAME_STORAGE_KEY, navName);
  }, [navName]);

  useEffect(() => {
    writeSessionValue(DEV_NO_NAME_STORAGE_KEY, noName);
  }, [noName]);

  useEffect(() => {
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
    setNoName('');
    setNoPrice('');
    setNoStatus('');
    setNoBody('');
    setNoVideoUrl('');
    setNoImage('');
    setInfoName('');
    setInfoBody('');
    setInfoVideoUrl('');
    setInfoImage('');
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
    const priceAmount = parseNamingPriceInput(noPrice);
    if (!scene.tourId || !position || priceAmount == null || !noStatus) {
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
        name: trimmedNoName,
        position,
        price: priceAmount,
        status: noStatus,
        body: noBody.trim() || undefined,
        videoUrl: noVideoUrl.trim() || undefined,
        image: noImage.trim() || undefined,
        targetView,
        previewFile,
      });
      await onTourMutated?.({ keepCurrentScene: true });
      setNamingStatus('done');
      setNoName('');
      setNoPrice('');
      setNoBody('');
      setNoVideoUrl('');
      setNoImage('');
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
    captureModel3dNamingPreview,
    isModel3dTour,
    noBody,
    noImage,
    noPrice,
    noStatus,
    noVideoUrl,
    scene.id,
    scene.tourId,
    trimmedNoName,
    onTourMutated,
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

  const resolveModel3dSceneCreatePayload = useCallback(
    async (title: string, manualThumbnailFile?: File | null) => {
      const liveView = getCurrentView?.() ?? view;
      if (!liveView) {
        throw new Error(
          'Current camera view is not available — load the model and orbit to the desired viewpoint first',
        );
      }

      let thumbnailFile: Blob | File | undefined =
        manualThumbnailFile ?? scenePanoramaFile ?? undefined;

      if (!thumbnailFile && captureSceneThumbnail) {
        const captured = await captureSceneThumbnail();
        if (captured) {
          const slug = slugifyHotspotName(title) || 'scene';
          thumbnailFile = new File([captured], `${slug}.png`, {
            type: captured.type || 'image/png',
          });
        }
      }

      if (!thumbnailFile) {
        throw new Error(
          'Could not capture 3D thumbnail — ensure the model is loaded and visible, or upload a card image',
        );
      }

      return { defaultView: liveView, thumbnailFile };
    },
    [captureSceneThumbnail, getCurrentView, scenePanoramaFile, view],
  );

  const createScene = useCallback(async () => {
    if (!scene.tourId || !trimmedSceneTitle) return;
    if (!isModel3dTour && !scenePanoramaFile) return;

    setSceneStatus('working');
    setSceneError(null);

    try {
      const model3dPayload =
        isModel3dTour ?
          await resolveModel3dSceneCreatePayload(trimmedSceneTitle)
        : null;

      const result = await devCreateScene({
        tourId: scene.tourId,
        title: trimmedSceneTitle,
        ...(isModel3dTour ?
          {
            thumbnailFile: model3dPayload?.thumbnailFile,
            defaultView: model3dPayload?.defaultView,
          }
        : {
            panoramaFile: scenePanoramaFile!,
            defaultView:
              view ?
                toViewPosition(view.yaw, view.pitch, view.zoom ?? 0)
              : undefined,
          }),
        description: sceneDescription.trim() || undefined,
        ...(!isModel3dTour ?
          {
            previewVideoUrl: scenePreviewVideoUrl.trim() || undefined,
            videoUrl: sceneVideoUrl.trim() || undefined,
          }
        : {}),
      });
      setSceneTitle('');
      setSceneDescription('');
      setScenePreviewVideoUrl('');
      setSceneVideoUrl('');
      setScenePanoramaFile(null);
      setSceneStatus('done');
      await onTourMutated?.({ navigateToScene: result.scene.id });
    } catch (error) {
      setSceneStatus('error');
      setSceneError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create scene',
      );
    }
  }, [
    isModel3dTour,
    onTourMutated,
    resolveModel3dSceneCreatePayload,
    scene.tourId,
    sceneDescription,
    scenePreviewVideoUrl,
    sceneVideoUrl,
    scenePanoramaFile,
    trimmedSceneTitle,
    view,
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
          await resolveModel3dSceneCreatePayload(
            trimmedNavTargetSceneTitle,
            navTargetSceneFile,
          )
        : null;
      const result = await devCreateScene({
        tourId: scene.tourId,
        title: createdTitle,
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
    navTargetSceneFile,
    onTourMutated,
    resolveModel3dSceneCreatePayload,
    scene.tourId,
    trimmedNavName,
    trimmedNavTargetSceneTitle,
  ]);

  const suggestEditTourBranding = useCallback(async () => {
    const websiteUrl = openCatalogClient?.website?.trim() ?? '';
    if (!websiteUrl) return;

    setEditTourSuggestStatus('working');
    setEditTourSuggestNotes([]);

    try {
      const result = await devSuggestBranding(websiteUrl);
      if (result.primaryColor) {
        setEditTourPrimaryColor(result.primaryColor);
      }
      if (result.logoFileBase64 && result.logoFileName) {
        setEditTourLogoFile(
          devBase64ToImageFile(result.logoFileBase64, result.logoFileName),
        );
      }
      if (result.faviconFileBase64 && result.faviconFileName) {
        setEditTourFaviconFile(
          devBase64ToImageFile(
            result.faviconFileBase64,
            result.faviconFileName,
          ),
        );
      }
      setEditTourSuggestNotes(result.notes);
      setEditTourSuggestStatus('done');
    } catch (error) {
      setEditTourSuggestStatus('error');
      setEditTourSuggestNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest branding from website',
      ]);
    }
  }, [openCatalogClient?.website]);

  const saveEditTour = useCallback(async () => {
    if (!canSaveEditTour || !tour.id) return;

    setEditTourStatus('working');
    setEditTourError(null);

    try {
      await devUpdateTour({
        tourId: tour.id,
        tourTitle: editTourTitle.trim(),
        tourSummary: editTourSummary,
        category: editTourCategory,
        brandingMode: editTourBrandingMode,
        primaryColor: normalizeHexColorInput(editTourPrimaryColor),
        logoAlt: editTourLogoAlt.trim() || undefined,
        fontFamily: editTourFontFamily,
        fontSourceUrl: editTourFontSourceUrl,
        productFullName: editTourProductFullName,
        ...buildDevExperienceApiFields({
          transitionEffect: editTransitionEffect,
          transitionSpeed: editTransitionSpeed,
          immersiveMode: editImmersiveMode,
          immersiveAudio: editImmersiveAudio,
          immersivePlaylistText: editImmersivePlaylistText,
          immersivePlaylistManifest: editImmersivePlaylistManifest,
          immersiveVolume: editImmersiveVolume,
        }),
        logoFile: editTourLogoFile,
        faviconFile: editTourFaviconFile,
        visibility: editTourVisibility,
        featured: editTourFeatured,
      });
      setEditTourLogoFile(null);
      setEditTourFaviconFile(null);
      await onTourMutated?.({ refreshKnowledge: true });
      await refreshDevCatalogSnapshot();
      setEditTourStatus('done');
    } catch (error) {
      setEditTourStatus('error');
      setEditTourError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save tour',
      );
    }
  }, [
    canSaveEditTour,
    editImmersiveAudio,
    editImmersiveMode,
    editImmersivePlaylistManifest,
    editImmersivePlaylistText,
    editImmersiveVolume,
    editTourCategory,
    editTourFeatured,
    editTourFaviconFile,
    editTourFontFamily,
    editTourFontSourceUrl,
    editTourProductFullName,
    editTransitionEffect,
    editTransitionSpeed,
    editTourLogoAlt,
    editTourLogoFile,
    editTourBrandingMode,
    editTourPrimaryColor,
    editTourTitle,
    editTourSummary,
    editTourVisibility,
    onTourMutated,
    tour.id,
  ]);

  const saveFloorPlan = useCallback(async () => {
    if (!canSaveFloorPlan || !tour.id) return;

    setFloorPlanStatus('working');
    setFloorPlanError(null);

    try {
      await devUpdateTourFloorPlan({
        tourId: tour.id,
        floorPlanFile,
        width: floorPlanWidth.trim() ? Number(floorPlanWidth) : undefined,
        height: floorPlanHeight.trim() ? Number(floorPlanHeight) : undefined,
      });
      setFloorPlanFile(null);
      await onTourMutated?.();
      setFloorPlanStatus('done');
    } catch (error) {
      setFloorPlanStatus('error');
      setFloorPlanError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save floor plan',
      );
    }
  }, [
    canSaveFloorPlan,
    floorPlanFile,
    floorPlanHeight,
    floorPlanWidth,
    onTourMutated,
    tour.id,
  ]);

  const clearFloorPlan = useCallback(async () => {
    if (!canClearFloorPlan || !tour.id) return;

    setFloorPlanStatus('working');
    setFloorPlanError(null);

    try {
      await devUpdateTourFloorPlan({ tourId: tour.id, clearFloorPlan: true });
      setFloorPlanFile(null);
      setFloorPlanWidth('');
      setFloorPlanHeight('');
      await onTourMutated?.();
      setFloorPlanStatus('done');
    } catch (error) {
      setFloorPlanStatus('error');
      setFloorPlanError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not remove floor plan',
      );
    }
  }, [canClearFloorPlan, onTourMutated, tour.id]);

  const deleteCurrentTour = useCallback(async () => {
    if (!canDeleteTour || !tour.id) return;

    setDeleteTourStatus('working');
    setDeleteTourError(null);

    try {
      const result = await devDeleteTour({
        tourId: tour.id,
        confirmTourId: deleteTourConfirm.trim(),
      });

      removeDevTourCache(tour.id);
      await refreshDevCatalogSnapshot();

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
    } catch (error) {
      setDeleteTourStatus('error');
      setDeleteTourError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not delete tour',
      );
    }
  }, [canDeleteTour, deleteTourConfirm, navigate, searchParams, tour.id]);

  const handleKnowledgeSceneChange = useCallback(
    (nextSceneId: string) => {
      persistKnowledgeSceneDraft(knowledgeSceneId);
      setKnowledgeSceneId(nextSceneId);
      applyKnowledgeSceneForm(nextSceneId);
    },
    [applyKnowledgeSceneForm, knowledgeSceneId, persistKnowledgeSceneDraft],
  );

  const saveKnowledge = useCallback(async () => {
    if (!canSaveKnowledge || !tour.id || !knowledgeSceneId) return;

    persistKnowledgeSceneDraft(knowledgeSceneId);
    const scene = knowledgeSceneDraftsRef.current[knowledgeSceneId];
    if (!scene) return;

    setKnowledgeStatus('working');
    setKnowledgeError(null);

    try {
      const result = await devUpdateKnowledge({
        tourId: tour.id,
        url: knowledgeUrl.trim(),
        global: {
          facilityName: knowledgeFacilityName.trim(),
          summary: knowledgeSummary.trim(),
        },
        sceneId: knowledgeSceneId,
        scene,
      });
      knowledgeSceneDraftsRef.current = {
        ...knowledgeSceneDraftsRef.current,
        ...(result.knowledge.scenes ?? {}),
      };
      if (result.created) {
        setKnowledgeMissing(false);
      }
      await onTourMutated?.({ refreshKnowledge: true });
      setKnowledgeStatus('done');
    } catch (error) {
      setKnowledgeStatus('error');
      setKnowledgeError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save knowledge',
      );
    }
  }, [
    canSaveKnowledge,
    knowledgeFacilityName,
    knowledgeSceneId,
    knowledgeSummary,
    knowledgeUrl,
    onTourMutated,
    persistKnowledgeSceneDraft,
    tour.id,
  ]);

  const suggestNewTourBranding = useCallback(async () => {
    const websiteUrl = createTourClientWebsite.trim();
    if (!websiteUrl) return;

    setSuggestBrandingStatus('working');
    setSuggestBrandingNotes([]);

    try {
      const result = await devSuggestBranding(websiteUrl);
      if (result.primaryColor) {
        setNewTourPrimaryColor(result.primaryColor);
      }
      if (result.logoFileBase64 && result.logoFileName) {
        setNewTourLogoFile(
          devBase64ToImageFile(result.logoFileBase64, result.logoFileName),
        );
      }
      if (result.faviconFileBase64 && result.faviconFileName) {
        setNewTourFaviconFile(
          devBase64ToImageFile(
            result.faviconFileBase64,
            result.faviconFileName,
          ),
        );
      }
      setSuggestBrandingNotes(result.notes);
      setSuggestBrandingStatus('done');
    } catch (error) {
      setSuggestBrandingStatus('error');
      setSuggestBrandingNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest branding from website',
      ]);
    }
  }, [createTourClientWebsite]);

  const createNewTour = useCallback(async () => {
    if (!canCreateNewTour || !newTourPanoramaFile || !newTourSlug) return;

    setNewTourStatus('working');
    setNewTourError(null);

    try {
      const result = await devCreateTour({
        clientId: newTourClientId,
        tourId: newTourSlug,
        tourTitle: trimmedNewTourTitle || newTourSlug,
        tourSummary: newTourSummary.trim() || undefined,
        category: newTourCategory,
        firstSceneTitle: newFirstSceneTitle.trim(),
        panoramaFile: newTourPanoramaFile,
        logoFile: newTourBrandingMode === 'custom' ? newTourLogoFile : null,
        faviconFile:
          newTourBrandingMode === 'custom' ? newTourFaviconFile : null,
        primaryColor:
          newTourBrandingMode === 'custom' ?
            normalizeHexColorInput(newTourPrimaryColor)
          : undefined,
        logoAlt:
          newTourBrandingMode === 'custom' ?
            newTourLogoAlt.trim() || undefined
          : undefined,
        defaultView:
          view ?
            toViewPosition(view.yaw, view.pitch, view.zoom ?? 0)
          : undefined,
        visibility: newTourVisibility,
        featured: newTourFeatured,
        brandingMode: newTourBrandingMode,
        ...buildDevExperienceApiFields({
          transitionEffect: newTourTransitionEffect,
          transitionSpeed: newTourTransitionSpeed,
          immersiveMode: newTourImmersiveMode,
          immersiveAudio: newTourImmersiveAudio,
          immersivePlaylistText: newTourImmersivePlaylistText,
          immersivePlaylistManifest: newTourImmersivePlaylistManifest,
          immersiveVolume: newTourImmersiveVolume,
        }),
      });

      const freshTour = normalizeTourAssets(result.tour);
      setDevTourCache(freshTour);
      await refreshDevCatalogSnapshot();

      navigate(
        buildTourLocation(
          result.tourId,
          result.firstSceneId,
          result.firstSceneId,
          searchParams,
        ),
      );
    } catch (error) {
      setNewTourStatus('error');
      setNewTourError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create tour',
      );
    }
  }, [
    canCreateNewTour,
    navigate,
    newFirstSceneTitle,
    newTourBrandingMode,
    newTourCategory,
    newTourClientId,
    newTourFaviconFile,
    newTourLogoAlt,
    newTourLogoFile,
    newTourPanoramaFile,
    newTourPrimaryColor,
    newTourFeatured,
    newTourImmersiveAudio,
    newTourImmersiveMode,
    newTourImmersivePlaylistManifest,
    newTourImmersivePlaylistText,
    newTourImmersiveVolume,
    newTourSlug,
    newTourSummary,
    newTourTransitionEffect,
    newTourTransitionSpeed,
    newTourVisibility,
    searchParams,
    trimmedNewTourTitle,
    view,
  ]);

  const deleteHotspot = useCallback(
    async (hotspotId: string) => {
      if (!scene.tourId) return;

      const found = findHotspotInTour(tour, hotspotId);
      const label =
        found ? hotspotDisplayLabel(found.hotspot, tour) : hotspotId;
      const deleteScopeLabel = isModel3dTour ? 'tour' : `scene “${scene.id}”`;
      if (
        !confirmDevPanelDelete(
          `Delete hotspot “${label}” (${hotspotId}) from ${deleteScopeLabel}?`,
        )
      ) {
        return;
      }

      setHotspotManageStatus('working');
      setHotspotManageError(null);

      try {
        await devDeleteHotspot({
          tourId: scene.tourId,
          sceneId: scene.id,
          hotspotId,
        });
        if (movingHotspotId === hotspotId) {
          setMovingHotspotId(null);
        }
        if (editingHotspotId === hotspotId) {
          setEditingHotspotId(null);
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
      editingHotspotId,
      isModel3dTour,
      movingHotspotId,
      onTourMutated,
      scene.id,
      scene.tourId,
      tour,
    ],
  );

  const moveHotspotToClick = useCallback(async () => {
    const position = buildHotspotPosition();
    if (!scene.tourId || !movingHotspotId || !position) return;

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
  }, [
    buildHotspotPosition,
    movingHotspotId,
    onTourMutated,
    scene.id,
    scene.tourId,
  ]);

  const startEditHotspot = useCallback(
    (hotspot: Hotspot) => {
      setEditingHotspotId(hotspot.id);
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
        const hostScene = tour.scenes[scene.id];
        const sceneTitle = hostScene?.title?.trim() ?? '';
        const sceneBody = hostScene?.description?.trim() ?? '';
        const sceneVideo = hostScene?.previewVideoUrl?.trim() ?? '';
        const storedTitle = hotspot.popup?.title?.trim() ?? '';
        const storedBody = hotspot.popup?.body?.trim() ?? '';
        const storedVideo = hotspot.popup?.videoUrl?.trim() ?? '';
        setEditNoTitle(
          storedTitle && storedTitle !== sceneTitle ? storedTitle : '',
        );
        setEditNoPrice(
          formatNamingPriceInput(hotspot.popup?.namingOpportunity?.price),
        );
        setEditNoStatus(hotspot.popup?.namingOpportunity?.status ?? '');
        setEditNoBody(storedBody && storedBody !== sceneBody ? storedBody : '');
        setEditNoVideoUrl(
          storedVideo && storedVideo !== sceneVideo ? storedVideo : '',
        );
        setEditNoImage(hotspot.popup?.image ?? '');
        setEditNoSyncPosition(false);
        return;
      }
      setEditInfoTitle(hotspot.popup?.title ?? '');
      setEditInfoBody(hotspot.popup?.body ?? '');
      setEditInfoDisplay(hotspot.popup?.display ?? 'anchored');
      setEditInfoVideoUrl(hotspot.popup?.videoUrl ?? '');
      setEditInfoImage(hotspot.popup?.image ?? '');
      setEditInfoVisitScene(hotspot.popup?.visitScene ?? '');
    },
    [tour.scenes],
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
    },
    [navigate, scene.tourId, searchParams, tour.firstScene],
  );

  const saveHotspotEdit = useCallback(async () => {
    if (!scene.tourId || !editingHotspotId) return;
    const found = findHotspotInTour(tour, editingHotspotId);
    const hotspot = found?.hotspot;
    if (!hotspot) return;

    setHotspotManageStatus('working');
    setHotspotManageError(null);

    try {
      if (hotspot.type === 'nav') {
        await devUpdateNavHotspot({
          tourId: scene.tourId,
          sceneId: scene.id,
          hotspotId: editingHotspotId,
          label: editNavLabel.trim(),
          targetSceneId: editNavTarget.trim() || undefined,
          instant: editNavInstant,
          navVariant: editNavVariant,
        });
      } else if (isNamingInfoHotspot(hotspot)) {
        if (editNoSyncPosition) {
          const position = buildHotspotPosition();
          if (!position) {
            throw new Error(
              `Click the ${isModel3dTour ? 'model' : 'panorama'} to set a new position first`,
            );
          }
          await devUpdateHotspotPosition({
            tourId: scene.tourId,
            sceneId: scene.id,
            hotspotId: editingHotspotId,
            position,
          });
        }

        let targetView: ViewPosition | undefined;
        let previewFile: Blob | null = null;
        if (isModel3dTour) {
          ({ targetView, previewFile } = await captureModel3dNamingPreview());
        }

        await devUpdateNamingHotspot({
          tourId: scene.tourId,
          sceneId: scene.id,
          hotspotId: editingHotspotId,
          title: editNoTitle.trim(),
          price: parseNamingPriceInput(editNoPrice) ?? undefined,
          status: editNoStatus || undefined,
          body: editNoBody.trim(),
          videoUrl: editNoVideoUrl.trim(),
          image: editNoImage,
          targetView,
          previewFile,
        });
      } else {
        await devUpdateInfoHotspot({
          tourId: scene.tourId,
          sceneId: scene.id,
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
    editNoBody,
    editNoImage,
    editNoPrice,
    editNoStatus,
    editNoTitle,
    editNoVideoUrl,
    editNoSyncPosition,
    buildHotspotPosition,
    editingHotspotId,
    captureModel3dNamingPreview,
    isModel3dTour,
    onTourMutated,
    scene.id,
    scene.tourId,
    tour,
  ]);

  const deleteTourScene = useCallback(
    async (sceneId: string) => {
      if (!scene.tourId || sceneId === tour.firstScene) return;

      const sceneEntry = tour.scenes[sceneId];
      const title = sceneEntry?.title ?? sceneId;
      if (
        !confirmDevPanelDelete(
          `Delete scene “${title}” (${sceneId}) and all hotspots on it?`,
        )
      ) {
        return;
      }

      setSceneManageStatus('working');
      setSceneManageError(null);

      try {
        await devDeleteScene({ tourId: scene.tourId, sceneId });
        if (editingSceneId === sceneId) {
          setEditingSceneId(null);
        }
        await onTourMutated?.(
          sceneId === scene.id ?
            { navigateToScene: tour.firstScene }
          : undefined,
        );
        setSceneManageStatus('done');
      } catch (error) {
        setSceneManageStatus('error');
        setSceneManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not delete scene',
        );
      }
    },
    [
      editingSceneId,
      onTourMutated,
      scene.id,
      scene.tourId,
      tour.firstScene,
      tour.scenes,
    ],
  );

  const openTourScene = useCallback(
    async (sceneId: string) => {
      await onTourMutated?.({ navigateToScene: sceneId });
    },
    [onTourMutated],
  );

  const startEditScene = useCallback(
    (entry: Scene) => {
      setEditingSceneId(entry.id);
      setEditSceneTitle(entry.title);
      setEditSceneDescription(entry.description ?? '');
      setEditScenePreviewVideoUrl(entry.previewVideoUrl ?? '');
      setEditSceneVideoUrl(entry.videoUrl ?? '');
      setEditSceneAsFirst(entry.id === tour.firstScene);
      setEditSceneMapEnabled(Boolean(entry.map));
      setEditSceneMapX(String(entry.map?.x ?? 0.5));
      setEditSceneMapY(String(entry.map?.y ?? 0.5));
      setEditSceneMapHeading(String(entry.map?.heading ?? 0));
    },
    [tour.firstScene],
  );

  const saveSceneEdit = useCallback(async () => {
    if (!scene.tourId || !editingSceneId) return;

    const isAlreadyFirst = editingSceneId === tour.firstScene;
    const existingScene = tour.scenes[editingSceneId];
    const hadMap = Boolean(existingScene?.map);

    setSceneManageStatus('working');
    setSceneManageError(null);

    try {
      await devUpdateScene({
        tourId: scene.tourId,
        sceneId: editingSceneId,
        title: editSceneTitle.trim() || undefined,
        description: editSceneDescription,
        ...(!isModel3dTour ?
          {
            previewVideoUrl: editScenePreviewVideoUrl,
            videoUrl: editSceneVideoUrl,
          }
        : {}),
        setAsFirstScene: editSceneAsFirst && !isAlreadyFirst,
        ...(isModel3dTour ?
          {}
        : {
            clearMap: !editSceneMapEnabled && hadMap,
            map:
              editSceneMapEnabled ?
                {
                  x: Number(editSceneMapX),
                  y: Number(editSceneMapY),
                  heading: Number(editSceneMapHeading),
                }
              : undefined,
          }),
      });
      setEditingSceneId(null);
      await onTourMutated?.();
      setSceneManageStatus('done');
    } catch (error) {
      setSceneManageStatus('error');
      setSceneManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save scene',
      );
    }
  }, [
    editSceneAsFirst,
    editSceneDescription,
    editScenePreviewVideoUrl,
    editSceneVideoUrl,
    editSceneMapEnabled,
    editSceneMapHeading,
    editSceneMapX,
    editSceneMapY,
    editSceneTitle,
    editingSceneId,
    isModel3dTour,
    onTourMutated,
    scene.tourId,
    tour.firstScene,
    tour.scenes,
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

  useEffect(() => {
    const hotspotId = editingHotspotId ?? movingHotspotId;
    focusHotspotRef.current?.(hotspotId);
    return () => {
      focusHotspotRef.current?.(null);
    };
  }, [editingHotspotId, movingHotspotId]);

  const previewHotspotHighlight = useCallback((hotspotId: string | null) => {
    focusHotspotRef.current?.(hotspotId, { animate: false });
  }, []);

  const restoreLockedHotspotHighlight = useCallback(() => {
    const lockedId = editingHotspotId ?? movingHotspotId;
    focusHotspotRef.current?.(lockedId, { animate: false });
  }, [editingHotspotId, movingHotspotId]);

  useEffect(() => {
    if (
      landingStatus === 'idle' &&
      navStatus === 'idle' &&
      namingStatus === 'idle' &&
      infoStatus === 'idle' &&
      sceneStatus === 'idle' &&
      hotspotManageStatus === 'idle' &&
      replacePanoramaStatus === 'idle' &&
      sceneManageStatus === 'idle' &&
      newTourStatus === 'idle' &&
      editTourStatus === 'idle'
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
      if (sceneStatus !== 'working') {
        setSceneStatus('idle');
        setSceneError(null);
      }
      if (hotspotManageStatus !== 'working') {
        setHotspotManageStatus('idle');
        setHotspotManageError(null);
      }
      if (replacePanoramaStatus !== 'working') {
        setReplacePanoramaStatus('idle');
        setReplacePanoramaError(null);
      }
      if (sceneManageStatus !== 'working') {
        setSceneManageStatus('idle');
        setSceneManageError(null);
      }
      if (newTourStatus !== 'working') {
        setNewTourStatus('idle');
        setNewTourError(null);
      }
      if (editTourStatus !== 'working') {
        setEditTourStatus('idle');
        setEditTourError(null);
      }
    }, 2500);

    return () => window.clearTimeout(t);
  }, [
    hotspotManageStatus,
    landingStatus,
    namingStatus,
    infoStatus,
    navStatus,
    newTourStatus,
    editTourStatus,
    replacePanoramaStatus,
    sceneManageStatus,
    sceneStatus,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        void applyDefaultView();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyDefaultView]);

  const markerCoords = clickCoords ? formatCoords(clickCoords) : '—';

  const stickyTourBranding = useMemo(
    () => resolveTourBranding(tour),
    [tour, catalogTick],
  );
  const stickyTourIcon =
    stickyTourBranding?.favicon ?? stickyTourBranding?.logo;
  const currentTourEntry = useMemo(
    () => tourOptions.find((option) => option.id === currentTourId),
    [currentTourId, tourOptions],
  );
  const stickyTourName =
    currentTourEntry?.facilityTitle ?? tour.title ?? currentTourId;

  useEffect(() => {
    if (!tourSwitchOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (tourSwitchRef.current?.contains(target)) return;
      if (tourSwitchMenuRef.current?.contains(target)) return;
      setTourSwitchOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      event.stopPropagation();
      setTourSwitchOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [tourSwitchOpen]);

  // Menu is portaled to <body> so the panel's overflow clip can't cut it off
  // (e.g. when all sections are collapsed and the panel is short).
  useLayoutEffect(() => {
    if (!tourSwitchOpen) return;

    const updatePosition = () => {
      const trigger = tourSwitchTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setTourSwitchMenuStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [tourSwitchOpen]);

  const handleSwitchTour = useCallback(
    (nextTourId: string) => {
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
    },
    [currentSceneId, currentTourId, navigate, searchParams],
  );

  const openIntroGallery = useCallback(() => {
    navigate(`/${preservedSearchStringFrom(searchParams, { intro: '1' })}`, {
      replace: true,
    });
  }, [navigate, searchParams]);

  const setDevUrlFlag = useCallback(
    (toggle: DevUrlFlagToggle, enabled: boolean) => {
      navigate(
        `${location.pathname}${preservedSearchStringFrom(searchParams, toggle.urlPatch(enabled))}`,
        { replace: true },
      );
    },
    [location.pathname, navigate, searchParams],
  );

  const handleOpenTourFromClient = useCallback(
    (tourId: string) => {
      panelScrollTopRequestRef.current = true;
      const loadedTour = loadTour(tourId);
      navigate(
        buildTourLocation(
          tourId,
          loadedTour.firstScene,
          loadedTour.firstScene,
          searchParams,
        ),
      );
      setTourModeTab('manage');
      setPanelTab('tour');
    },
    [navigate, searchParams],
  );

  const handleCreateTourForClient = useCallback(
    (clientId: string) => {
      panelScrollTopRequestRef.current = true;
      openCreateTourTab(clientId);
      setPanelTab('tour');
    },
    [openCreateTourTab],
  );

  useLayoutEffect(() => {
    setEditingHotspotId(null);
    setMovingHotspotId(null);
    setHotspotManageError(null);
    setHotspotManageStatus('idle');
  }, [hotspotManageScope]);

  useLayoutEffect(() => {
    if (!panelScrollTopRequestRef.current) return;
    panelScrollTopRequestRef.current = false;
    panelBodyRef.current?.scrollTo({ top: 0, left: 0 });
  }, [panelTab, tourModeTab]);

  const createTourBrandingSection = (
    <DevPanelFormSection
      title='Branding (optional)'
      divided
      description='Choose whether this tour inherits the client brand or uses its own.'
    >
      <div className='flex flex-col gap-2'>
        <label className={devViewPanelFormCheckboxLabelClassName}>
          <input
            className={devViewPanelFormCheckboxInputClassName}
            type='radio'
            name='new-tour-branding-mode'
            checked={newTourBrandingMode === 'client'}
            onChange={() => setNewTourBrandingMode('client')}
          />
          <span className={devViewPanelToggleNameClassName}>
            Use client branding
          </span>
        </label>
        <label className={devViewPanelFormCheckboxLabelClassName}>
          <input
            className={devViewPanelFormCheckboxInputClassName}
            type='radio'
            name='new-tour-branding-mode'
            checked={newTourBrandingMode === 'custom'}
            onChange={() => setNewTourBrandingMode('custom')}
          />
          <span className={devViewPanelToggleNameClassName}>
            Custom branding for this tour
          </span>
        </label>
      </div>
      <p className={devViewPanelSectionHintClassName}>
        {newTourBrandingMode === 'client' ?
          selectedCreateCatalogClient ?
            `Inherits ${selectedCreateCatalogClient.name} branding from the Client tab. Edit shared branding there.`
          : 'Select a client to inherit its catalog branding.'
        : 'Logo and colors are saved on this tour only.'}
      </p>

      {newTourBrandingMode === 'custom' ?
        <>
          <div className='flex flex-col gap-1'>
            <div className={devViewPanelActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => void suggestNewTourBranding()}
                disabled={
                  !createTourClientWebsite.trim() ||
                  suggestBrandingStatus === 'working'
                }
              >
                {suggestBrandingStatus === 'working' ?
                  'Suggesting…'
                : 'Suggest from website'}
              </button>
            </div>
            <p className={devViewPanelSectionHintClassName}>
              Uses the client website from the Client tab to draft logo,
              favicon, and primary color — review before saving.
            </p>
          </div>

          {suggestBrandingNotes.length > 0 ?
            <ul className={devViewPanelSectionHintClassName}>
              {suggestBrandingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          : null}

          <DevPanelColorField
            label='Primary color'
            value={newTourPrimaryColor}
            onChange={setNewTourPrimaryColor}
            defaultColor={DEFAULT_NEW_TOUR_PRIMARY_COLOR}
            pickerAriaLabel='Primary color picker'
          />

          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Logo alt text
            </span>
            <input
              className={devViewPanelInputClassName}
              type='text'
              value={newTourLogoAlt}
              onChange={(e) => setNewTourLogoAlt(e.target.value)}
              placeholder={trimmedNewTourTitle || 'Tour title'}
              spellCheck={true}
              autoComplete='off'
            />
          </label>

          <DevPanelFormRow>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Logo</span>
              <DevPanelFileField
                file={newTourLogoFile}
                preview={
                  newTourLogoFile ?
                    <DevLocalFilePreview
                      file={newTourLogoFile}
                      className={devViewPanelBrandLogoClassName}
                      alt='Logo preview'
                    />
                  : null
                }
                onClearPreview={() => setNewTourLogoFile(null)}
                showClear={Boolean(newTourLogoFile)}
              >
                <DevPanelFileInput
                  accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                  file={newTourLogoFile}
                  onChange={setNewTourLogoFile}
                />
              </DevPanelFileField>
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Favicon (optional)
              </span>
              <DevPanelFileField
                file={newTourFaviconFile}
                preview={
                  newTourFaviconFile ?
                    <DevLocalFilePreview
                      file={newTourFaviconFile}
                      className={devViewPanelBrandFaviconClassName}
                      alt='Favicon preview'
                    />
                  : null
                }
                onClearPreview={() => setNewTourFaviconFile(null)}
                showClear={Boolean(newTourFaviconFile)}
              >
                <DevPanelFileInput
                  accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                  file={newTourFaviconFile}
                  onChange={setNewTourFaviconFile}
                />
              </DevPanelFileField>
            </label>
          </DevPanelFormRow>
        </>
      : null}
    </DevPanelFormSection>
  );

  const renderHotspotDevSection = () => {
    if (!showHotspotDevPanel) return null;

    return (
      <DevPanelSection
        title={hotspotSectionConfig.title}
        description={hotspotSectionConfig.description}
      >
        <div
          className={devViewPanelSecondaryTabsClassName}
          role='tablist'
          aria-label='Hotspot actions'
        >
          {DEV_CRUD_MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type='button'
              role='tab'
              id={`dev-hotspot-mode-tab-${tab.id}`}
              aria-selected={hotspotModeTab === tab.id}
              aria-controls={`dev-hotspot-mode-panel-${tab.id}`}
              className={devViewPanelTabVariants({
                depth: 'secondary',
                kind: tab.id,
                active: hotspotModeTab === tab.id,
              })}
              onClick={() => setHotspotModeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isModel3dTour ?
          <p className={devViewPanelSectionHintClassName}>
            Stored in <code>tour.json → hotspots[]</code>. Info / naming
            hotspots use <code>sceneId</code> (defaults to the scene you are
            viewing: <code>{scene.id}</code>).
          </p>
        : null}

        {hotspotModeTab === 'manage' ?
          <>
            <p className={devViewPanelTabHintClassName}>
              {hotspotSectionConfig.manageHint}
            </p>
            <DevPanelFormGroup>
              {managedHotspots.length > 0 ?
                <ul className={devViewPanelManageListClassName}>
                  {managedHotspots.map((hotspot) => {
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
                        onMouseLeave={restoreLockedHotspotHighlight}
                      >
                        <div
                          className={devViewPanelManageListItemHeadClassName}
                        >
                          <div
                            className={
                              devViewPanelManageListItemHeadMainClassName
                            }
                          >
                            <span
                              className={
                                devViewPanelManageListItemTitleClassName
                              }
                            >
                              {hotspotDisplayLabel(hotspot, tour)}
                            </span>
                            <span
                              className={
                                devViewPanelManageListItemBulletClassName
                              }
                              aria-hidden='true'
                            >
                              ·
                            </span>
                            <code
                              className={devViewPanelManageListItemIdClassName}
                            >
                              {hotspot.id}
                            </code>
                          </div>
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
                        </div>
                        <p className={devViewPanelSectionHintClassName}>
                          {formatHotspotPosition(hotspot)}
                          {(
                            isModel3dTour &&
                            hotspot.type === 'info' &&
                            hotspot.sceneId
                          ) ?
                            <>
                              {' '}
                              · viewpoint <code>{hotspot.sceneId}</code>
                            </>
                          : null}
                        </p>
                        <div className={devViewPanelActionsClassName}>
                          {hotspot.type === 'nav' && hotspot.targetScene ?
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() =>
                                openNavTargetScene(hotspot.targetScene!)
                              }
                              disabled={hotspotManageStatus === 'working'}
                            >
                              Open
                            </button>
                          : null}
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
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
                          >
                            Move
                          </button>
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'secondary',
                            })}
                            onClick={() => startEditHotspot(hotspot)}
                            disabled={
                              hotspotManageStatus === 'working' || isEditing
                            }
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'danger',
                            })}
                            onClick={() => void deleteHotspot(hotspot.id)}
                            disabled={hotspotManageStatus === 'working'}
                          >
                            Delete
                          </button>
                        </div>

                        {isMoving ?
                          <DevPanelFormGroup inline manageEdit>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Hotspot position
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                readOnly
                                tabIndex={-1}
                                value={clickCoords ? markerCoords : ''}
                                placeholder={devViewerClickPlaceholder}
                              />
                            </label>
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
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'primary',
                                })}
                                onClick={() => void moveHotspotToClick()}
                                disabled={
                                  !canMoveHotspot ||
                                  hotspotManageStatus === 'working'
                                }
                              >
                                {hotspotManageStatus === 'working' ?
                                  'Moving…'
                                : 'Apply click position'}
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
                                      {entry.title} ({entry.id})
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
                                  Title (optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={editNoTitle}
                                  onChange={(e) =>
                                    setEditNoTitle(e.target.value)
                                  }
                                  placeholder={
                                    inheritedNoTitle || 'Uses scene title'
                                  }
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Price
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={editNoPrice}
                                  onChange={(e) =>
                                    setEditNoPrice(e.target.value)
                                  }
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Status
                                </span>
                                <select
                                  className={devViewPanelSelectClassName}
                                  value={editNoStatus}
                                  onChange={(e) =>
                                    setEditNoStatus(
                                      e.target.value as
                                        | NamingOpportunityStatus
                                        | '',
                                    )
                                  }
                                >
                                  <option value=''>Select status…</option>
                                  {DEV_NAMING_STATUS_OPTIONS.map((option) => (
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
                                  Body (optional)
                                </span>
                                <textarea
                                  className={devViewPanelTextareaClassName}
                                  value={editNoBody}
                                  onChange={(e) =>
                                    setEditNoBody(e.target.value)
                                  }
                                  placeholder={
                                    inheritedNoBody || 'Uses scene description'
                                  }
                                  rows={3}
                                />
                              </label>
                              <p className={devViewPanelSectionHintClassName}>
                                Leave title/body/video empty to inherit from
                                this scene (stays in sync when the scene
                                changes).
                              </p>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Video URL (optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='url'
                                  value={editNoVideoUrl}
                                  onChange={(e) =>
                                    setEditNoVideoUrl(e.target.value)
                                  }
                                  placeholder={
                                    inheritedNoVideo ||
                                    'Uses scene preview video URL'
                                  }
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
                                  value={editNoImage}
                                  onChange={(e) =>
                                    setEditNoImage(e.target.value)
                                  }
                                  placeholder='/assets/…/photo.webp'
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Hotspot position
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  readOnly
                                  tabIndex={-1}
                                  value={formatHotspotPosition(hotspot)}
                                />
                              </label>
                              <label
                                className={devViewPanelToggleLabelClassName}
                              >
                                <input
                                  className={devViewPanelToggleInputClassName}
                                  type='checkbox'
                                  checked={editNoSyncPosition}
                                  onChange={(e) =>
                                    setEditNoSyncPosition(e.target.checked)
                                  }
                                />
                                <span
                                  className={devViewPanelToggleNameClassName}
                                >
                                  Update position from latest click
                                </span>
                              </label>
                              {editNoSyncPosition ?
                                <label className={devViewPanelFieldClassName}>
                                  <span
                                    className={devViewPanelFieldLabelClassName}
                                  >
                                    New position
                                  </span>
                                  <input
                                    className={devViewPanelInputClassName}
                                    type='text'
                                    readOnly
                                    tabIndex={-1}
                                    value={
                                      clickCoords ? markerCoords : (
                                        devViewerClickPlaceholder
                                      )
                                    }
                                  />
                                </label>
                              : null}
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
                                    Orbit to frame the opening shot — saved on
                                    Save NO with Explore{' '}
                                    <code>preview.image</code>. Scene landing
                                    unchanged.
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
                                  disabled={hotspotManageStatus === 'working'}
                                >
                                  Save NO
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
                                <textarea
                                  className={devViewPanelTextareaClassName}
                                  value={editInfoBody}
                                  onChange={(e) =>
                                    setEditInfoBody(e.target.value)
                                  }
                                  rows={3}
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
                                      {entry.title} ({entry.id})
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
                      </li>
                    );
                  })}
                </ul>
              : <p className={devViewPanelSectionHintClassName}>
                  {hotspotSectionConfig.emptyMessage}
                </p>
              }
              {hotspotManageError ?
                <p className={devViewPanelSectionHintClassName}>
                  {hotspotManageError}
                </p>
              : null}

              <div className={devViewPanelManageListFooterClassName}>
                <button
                  type='button'
                  className={devViewPanelBtnVariants({ tone: 'secondary' })}
                  onClick={openCreateHotspotTab}
                >
                  {hotspotSectionConfig.addButtonLabel}
                </button>
              </div>
            </DevPanelFormGroup>
          </>
        : <>
            <p className={devViewPanelTabHintClassName}>
              {hotspotSectionConfig.createHint}{' '}
              {isModel3dTour ?
                devViewerClickHint
              : 'Click the panorama to set position.'}
            </p>
            <div className={devViewPanelTabPanelBodyClassName}>
              <DevPanelTertiaryTabs
                aria-label='Hotspot type'
                value={hotspotTab}
                onChange={setHotspotTab}
                tabs={hotspotCreateTabs.map((tab) => ({
                  id: tab.id,
                  label: tab.label,
                  kind: tab.id,
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
                            {entry.title} ({entry.id})
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
                      <DevPanelFormGroup
                        title='Create target scene'
                        hint={
                          <p className={devViewPanelSectionHintClassName}>
                            Stays on this scene — hotspot position is kept. New
                            scene is selected as the nav target.
                          </p>
                        }
                      >
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
                            id <code>{navTargetSceneSlug}</code>
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
                        onClick={() => setNavTargetQuickCreateOpen(true)}
                      >
                        + Create target scene
                      </button>
                    }

                    {navHotspotIdPreview ?
                      <p className={devViewPanelSlugPreviewClassName}>
                        id <code>{navHotspotIdPreview}</code>
                        {navHotspotIdPreview !== `nav-to-${navSlug}` ?
                          <>
                            {' '}
                            · suffix added — name slug already used on this
                            scene
                          </>
                        : null}{' '}
                        · copies target <code>defaultView</code> on create and
                        save
                      </p>
                    : null}

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Nav role
                      </span>
                      <select
                        className={devViewPanelSelectClassName}
                        value={navVariant}
                        onChange={(e) => {
                          const nextVariant = e.target
                            .value as NavHotspotVariant;
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
                        {devViewerClickHint} — naming opportunity popup on this
                        scene.
                        {isModel3dTour ?
                          <>
                            {' '}
                            Saves the current camera on this NO as{' '}
                            <code>targetView</code> + Explore{' '}
                            <code>preview.image</code> — scene landing is
                            unchanged.
                          </>
                        : null}
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
                        Name (optional)
                      </span>
                      <input
                        className={devViewPanelInputClassName}
                        type='text'
                        value={noName}
                        onChange={(e) => setNoName(e.target.value)}
                        placeholder={inheritedNoTitle || 'Uses scene title'}
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </label>
                    <p className={devViewPanelSectionHintClassName}>
                      Optional overrides. Empty name/body/video inherit from
                      this scene and stay in sync.
                    </p>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Price
                      </span>
                      <input
                        className={devViewPanelInputClassName}
                        type='text'
                        value={noPrice}
                        onChange={(e) => setNoPrice(e.target.value)}
                        placeholder='e.g. 75000'
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </label>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Status
                      </span>
                      <select
                        className={devViewPanelSelectClassName}
                        value={noStatus}
                        onChange={(e) =>
                          setNoStatus(
                            e.target.value as NamingOpportunityStatus | '',
                          )
                        }
                      >
                        <option value=''>Select status…</option>
                        {DEV_NAMING_STATUS_OPTIONS.map((option) => (
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
                      <textarea
                        className={devViewPanelTextareaClassName}
                        value={noBody}
                        onChange={(e) => setNoBody(e.target.value)}
                        placeholder={
                          inheritedNoBody || 'Uses scene description'
                        }
                        rows={3}
                        spellCheck={true}
                      />
                    </label>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Video URL (optional)
                      </span>
                      <input
                        className={devViewPanelInputClassName}
                        type='url'
                        value={noVideoUrl}
                        onChange={(e) => setNoVideoUrl(e.target.value)}
                        placeholder={
                          inheritedNoVideo || 'Uses scene preview video URL'
                        }
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
                        value={noImage}
                        onChange={(e) => setNoImage(e.target.value)}
                        placeholder='/assets/…/photo.webp'
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </label>

                    {noHotspotIdPreview ?
                      <p className={devViewPanelSlugPreviewClassName}>
                        id <code>{noHotspotIdPreview}</code>
                        {noHotspotIdPreview !== `info-${noSlug}` ?
                          <>
                            {' '}
                            · suffix added — name slug already used on this
                            scene
                          </>
                        : null}{' '}
                        · deep link{' '}
                        <code>
                          ?no=
                          {noHotspotIdPreview.replace(/^info-/, '')}
                        </code>
                      </p>
                    : null}

                    <div className={devViewPanelActionsClassName}>
                      <button
                        type='button'
                        className={devViewPanelBtnVariants({ tone: 'primary' })}
                        onClick={() => void createNamingHotspot()}
                        disabled={
                          !canCreateNaming || namingStatus === 'working'
                        }
                      >
                        {namingStatus === 'working' ?
                          'Creating…'
                        : namingStatus === 'done' ?
                          'NO created!'
                        : 'Create NO'}
                      </button>
                    </div>
                    {namingError ?
                      <p className={devViewPanelSectionHintClassName}>
                        {namingError}
                      </p>
                    : null}
                  </DevPanelFormGroup>
                </div>
              : canCreateInfoHotspot ?
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
                      <textarea
                        className={devViewPanelTextareaClassName}
                        value={infoBody}
                        onChange={(e) => setInfoBody(e.target.value)}
                        placeholder='Leave empty for placeholder copy from the title…'
                        rows={3}
                        spellCheck={true}
                      />
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
                            {entry.title} ({entry.id})
                          </option>
                        ))}
                      </select>
                    </label>

                    {infoHotspotIdPreview ?
                      <p className={devViewPanelSlugPreviewClassName}>
                        id <code>{infoHotspotIdPreview}</code>
                        {infoHotspotIdPreview !== `info-${infoSlug}` ?
                          <>
                            {' '}
                            · suffix added — name slug already used on this
                            scene
                          </>
                        : null}
                      </p>
                    : null}

                    <div className={devViewPanelActionsClassName}>
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
              : null}
            </div>
          </>
        }
      </DevPanelSection>
    );
  };
  const renderScenesDevSection = () => (
    <DevPanelSection
      title='Scenes'
      description={
        isModel3dTour ?
          'Open and edit viewpoints, or add a new scene on the shared 3D model.'
        : 'Open and edit tour scenes, or upload a new panorama.'
      }
    >
      <div
        className={devViewPanelSecondaryTabsClassName}
        role='tablist'
        aria-label='Scene actions'
      >
        {DEV_CRUD_MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            id={`dev-scene-mode-tab-${tab.id}`}
            aria-selected={sceneModeTab === tab.id}
            aria-controls={`dev-scene-mode-panel-${tab.id}`}
            className={devViewPanelTabVariants({
              depth: 'secondary',
              kind: tab.id,
              active: sceneModeTab === tab.id,
            })}
            onClick={() => setSceneModeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sceneModeTab === 'manage' ?
        <>
          <p className={devViewPanelTabHintClassName}>
            Open scenes on this tour, edit metadata, or delete.
          </p>
          <DevPanelFormGroup>
            {tourScenes.length > 0 ?
              <ul className={devViewPanelManageListClassName}>
                {tourScenes.map((entry) => {
                  const isCurrent = entry.id === scene.id;
                  const isFirst = entry.id === tour.firstScene;
                  const isEditing = editingSceneId === entry.id;
                  const canDelete = entry.id !== tour.firstScene;
                  const secondaryLabel =
                    sceneManageSecondaryById[entry.id] ?? entry.id;

                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        devViewPanelManageListItemClassName,
                        (isEditing || isCurrent) &&
                          devViewPanelManageListItemActiveClassName,
                      )}
                    >
                      <div className={devViewPanelManageListItemHeadClassName}>
                        <div
                          className={
                            devViewPanelManageListItemHeadMainClassName
                          }
                          title={entry.id}
                        >
                          <span
                            className={devViewPanelManageListItemTitleClassName}
                          >
                            {entry.title}
                          </span>
                          <span
                            className={
                              devViewPanelManageListItemBulletClassName
                            }
                            aria-hidden='true'
                          >
                            ·
                          </span>
                          <span
                            className={devViewPanelManageListItemIdClassName}
                          >
                            {secondaryLabel}
                          </span>
                        </div>
                        {isFirst || isCurrent ?
                          <div
                            className={
                              devViewPanelManageListItemBadgesClassName
                            }
                          >
                            {isFirst ?
                              <Badge
                                variant='fill'
                                size='sm'
                                tone='none'
                                className={devSceneManageBadgeVariants({
                                  kind: 'first',
                                })}
                              >
                                First
                              </Badge>
                            : null}
                            {isCurrent ?
                              <Badge
                                variant='fill'
                                size='sm'
                                tone='none'
                                className={devSceneManageBadgeVariants({
                                  kind: 'current',
                                })}
                              >
                                Current
                              </Badge>
                            : null}
                          </div>
                        : null}
                      </div>
                      {entry.description ?
                        <p
                          className={devViewPanelManageListItemDescClassName}
                          title={entry.description}
                        >
                          {entry.description}
                        </p>
                      : entry.placeLead ?
                        <p
                          className={devViewPanelManageListItemDescClassName}
                          title={entry.placeLead}
                        >
                          Auto soft lead · {entry.placeLead}
                        </p>
                      : null}
                      <div className={devViewPanelActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'secondary',
                          })}
                          onClick={() => void openTourScene(entry.id)}
                          disabled={sceneManageStatus === 'working'}
                        >
                          Open
                        </button>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'secondary',
                          })}
                          onClick={() => startEditScene(entry)}
                          disabled={
                            sceneManageStatus === 'working' || isEditing
                          }
                        >
                          Edit
                        </button>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'danger',
                          })}
                          onClick={() => void deleteTourScene(entry.id)}
                          disabled={
                            !canDelete || sceneManageStatus === 'working'
                          }
                        >
                          Delete
                        </button>
                      </div>

                      {isEditing ?
                        <DevPanelFormGroup inline manageEdit>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Title
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editSceneTitle}
                              onChange={(e) =>
                                setEditSceneTitle(e.target.value)
                              }
                            />
                          </label>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Description
                            </span>
                            <textarea
                              className={devViewPanelTextareaClassName}
                              value={editSceneDescription}
                              onChange={(e) =>
                                setEditSceneDescription(e.target.value)
                              }
                              rows={2}
                              placeholder='Optional client place copy — leave empty to remove'
                            />
                            <p className={devViewPanelSectionHintClassName}>
                              Wins over soft lead in Explore / nav preview when
                              set. Leave empty to use auto soft lead from NO.
                            </p>
                          </label>
                          <div className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Soft lead
                            </span>
                            {(() => {
                              const draftDesc = editSceneDescription.trim();
                              const autoLead =
                                buildScenePlaceLeadFromNaming(tour, entry) ||
                                entry.placeLead?.trim() ||
                                '';
                              if (draftDesc) {
                                return (
                                  <p
                                    className={devViewPanelSectionHintClassName}
                                  >
                                    Using Description — soft lead is ignored
                                    while Description is set.
                                  </p>
                                );
                              }
                              if (autoLead) {
                                return (
                                  <>
                                    <p
                                      className={
                                        devViewPanelManageListItemDescClassName
                                      }
                                      title={autoLead}
                                    >
                                      Auto from NO · {autoLead}
                                    </p>
                                    <p
                                      className={
                                        devViewPanelSectionHintClassName
                                      }
                                    >
                                      Updates automatically when NO copy changes
                                      (Description empty).
                                    </p>
                                  </>
                                );
                              }
                              return (
                                <p className={devViewPanelSectionHintClassName}>
                                  No place copy yet — add Description or NO body
                                  copy.
                                </p>
                              );
                            })()}
                          </div>
                          {!isModel3dTour ?
                            <>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Preview video URL (hero, optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='url'
                                  value={editScenePreviewVideoUrl}
                                  onChange={(e) =>
                                    setEditScenePreviewVideoUrl(e.target.value)
                                  }
                                  placeholder='https://share.synthesia.io/… or hosted mp4'
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                                <p className={devViewPanelSectionHintClassName}>
                                  Synthesia — Explore scene detail and nav
                                  preview hero for links to this scene.
                                </p>
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Body video URL (optional)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='url'
                                  value={editSceneVideoUrl}
                                  onChange={(e) =>
                                    setEditSceneVideoUrl(e.target.value)
                                  }
                                  placeholder='https://youtube.com/…'
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                                <p className={devViewPanelSectionHintClassName}>
                                  YouTube — shown in Explore scene detail and
                                  nav preview body below the description.
                                </p>
                              </label>
                            </>
                          : null}
                          <div className={devViewPanelToggleListClassName}>
                            {!isFirst ?
                              <label
                                className={devViewPanelToggleLabelClassName}
                              >
                                <input
                                  type='checkbox'
                                  className={devViewPanelToggleInputClassName}
                                  checked={editSceneAsFirst}
                                  onChange={(e) =>
                                    setEditSceneAsFirst(e.currentTarget.checked)
                                  }
                                />
                                <span
                                  className={devViewPanelToggleTextClassName}
                                >
                                  Set as firstScene
                                </span>
                              </label>
                            : null}
                            {!isModel3dTour ?
                              <>
                                <label
                                  className={devViewPanelToggleLabelClassName}
                                >
                                  <input
                                    type='checkbox'
                                    className={devViewPanelToggleInputClassName}
                                    checked={editSceneMapEnabled}
                                    onChange={(e) =>
                                      setEditSceneMapEnabled(
                                        e.currentTarget.checked,
                                      )
                                    }
                                  />
                                  <span
                                    className={devViewPanelToggleTextClassName}
                                  >
                                    Floor plan map position
                                  </span>
                                </label>
                              </>
                            : null}
                          </div>
                          {!isModel3dTour && editSceneMapEnabled ?
                            <DevPanelFormRow cols={3}>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Map X (0–1)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='number'
                                  min='0'
                                  max='1'
                                  step='0.001'
                                  value={editSceneMapX}
                                  onChange={(e) =>
                                    setEditSceneMapX(e.target.value)
                                  }
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Map Y (0–1)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='number'
                                  min='0'
                                  max='1'
                                  step='0.001'
                                  value={editSceneMapY}
                                  onChange={(e) =>
                                    setEditSceneMapY(e.target.value)
                                  }
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Map heading (°)
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='number'
                                  step='0.1'
                                  value={editSceneMapHeading}
                                  onChange={(e) =>
                                    setEditSceneMapHeading(e.target.value)
                                  }
                                />
                              </label>
                            </DevPanelFormRow>
                          : null}
                          <div className={devViewPanelActionsClassName}>
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() => setEditingSceneId(null)}
                              disabled={sceneManageStatus === 'working'}
                            >
                              Cancel
                            </button>
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'primary',
                              })}
                              onClick={() => void saveSceneEdit()}
                              disabled={
                                sceneManageStatus === 'working' ||
                                !editSceneTitle.trim()
                              }
                            >
                              Save scene
                            </button>
                          </div>
                        </DevPanelFormGroup>
                      : null}
                    </li>
                  );
                })}
              </ul>
            : <p className={devViewPanelSectionHintClassName}>
                No scenes on this tour yet.
              </p>
            }
            {sceneManageError ?
              <p className={devViewPanelSectionHintClassName}>
                {sceneManageError}
              </p>
            : null}

            <div className={devViewPanelManageListFooterClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={openCreateSceneTab}
              >
                Add scene to this tour
              </button>
            </div>
          </DevPanelFormGroup>
        </>
      : <>
          <p className={devViewPanelTabHintClassName}>
            {isModel3dTour ?
              <>
                Add a viewpoint on the tour&apos;s shared model — orbit to the
                desired camera pose first (saved as <code>defaultView</code>{' '}
                with orbit <code>target</code>). Card image captures from the
                current view, or upload manually to{' '}
                <code>
                  assets/&lt;client&gt;/{currentTourId}
                  /thumbnails/&lt;id&gt;.webp
                </code>
                .
              </>
            : <>
                Upload a panorama — title becomes scene id, image converts to{' '}
                <code>
                  assets/&lt;client&gt;/{currentTourId}
                  /panoramas/&lt;id&gt;.webp
                </code>{' '}
                automatically.
              </>
            }
          </p>
          <DevPanelFormGroup>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Title</span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={sceneTitle}
                onChange={(e) => setSceneTitle(e.target.value)}
                placeholder='e.g. Main Entrance'
                spellCheck={false}
                autoComplete='off'
              />
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                {isModel3dTour ?
                  'Card thumbnail (optional — auto-captures from view)'
                : 'Panorama file'}
              </span>
              <DevPanelFileField
                file={scenePanoramaFile}
                preview={<DevPanoramaFilePreview file={scenePanoramaFile} />}
                onClearPreview={() => setScenePanoramaFile(null)}
                showClear={Boolean(scenePanoramaFile)}
              >
                <DevPanelFileInput
                  accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                  file={scenePanoramaFile}
                  onChange={setScenePanoramaFile}
                />
              </DevPanelFileField>
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Description (optional)
              </span>
              <textarea
                className={devViewPanelTextareaClassName}
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                rows={2}
                spellCheck={true}
              />
            </label>

            {!isModel3dTour ?
              <>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Preview video URL (hero, optional)
                  </span>
                  <input
                    className={devViewPanelInputClassName}
                    type='url'
                    value={scenePreviewVideoUrl}
                    onChange={(e) => setScenePreviewVideoUrl(e.target.value)}
                    placeholder='https://share.synthesia.io/… or hosted mp4'
                    spellCheck={false}
                    autoComplete='off'
                  />
                  <p className={devViewPanelSectionHintClassName}>
                    Synthesia — Explore scene detail and nav preview hero for
                    links to this scene.
                  </p>
                </label>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Body video URL (optional)
                  </span>
                  <input
                    className={devViewPanelInputClassName}
                    type='url'
                    value={sceneVideoUrl}
                    onChange={(e) => setSceneVideoUrl(e.target.value)}
                    placeholder='https://youtube.com/…'
                    spellCheck={false}
                    autoComplete='off'
                  />
                  <p className={devViewPanelSectionHintClassName}>
                    YouTube — shown in Explore scene detail and nav preview body
                    below the description.
                  </p>
                </label>
              </>
            : null}

            {sceneSlug ?
              <p className={devViewPanelSlugPreviewClassName}>
                id <code>{sceneSlug}</code> ·{' '}
                <code>
                  {isModel3dTour ?
                    buildDefaultSceneThumbnailRelativePath(sceneSlug)
                  : buildDefaultPanoramaRelativePath(sceneSlug)}
                </code>
                {view ?
                  <> · defaultView {formatViewPosition(view)}</>
                : isModel3dTour ?
                  ' · orbit the model to set defaultView before creating'
                : ' · defaultView 0, 0, 17'}
              </p>
            : null}
            {scenePanoramaAutoPath ?
              <p className={devViewPanelSectionHintClassName}>
                {isModel3dTour ?
                  <>
                    card image path <code>{scenePanoramaAutoPath}</code>
                  </>
                : <>
                    saves to <code>{scenePanoramaAutoPath}</code>
                  </>
                }
              </p>
            : null}

            {sceneError ?
              <p className={devViewPanelSectionHintClassName}>{sceneError}</p>
            : null}

            <div className={devViewPanelActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'primary' })}
                onClick={() => void createScene()}
                disabled={!canCreateScene || sceneStatus === 'working'}
              >
                {sceneStatus === 'working' ?
                  'Creating…'
                : sceneStatus === 'done' ?
                  'Created!'
                : 'Create scene'}
              </button>
            </div>
          </DevPanelFormGroup>
        </>
      }
    </DevPanelSection>
  );

  return (
    <div id={id} className={devViewPanelRootClassName}>
      <div className={devViewPanelStickyHeaderClassName}>
        <div className={devViewPanelTourSwitcherClassName}>
          {stickyTourIcon ?
            <div className={devViewPanelStickyTourLogoWrapClassName}>
              <img
                className={devViewPanelStickyTourLogoClassName}
                src={stickyTourIcon}
                alt={stickyTourBranding?.logoAlt ?? tour.title}
              />
            </div>
          : null}
          <div
            ref={tourSwitchRef}
            className={devViewPanelTourSwitchAnchorClassName}
          >
            {tourOptions.length > 1 ?
              <>
                <button
                  ref={tourSwitchTriggerRef}
                  type='button'
                  className={devViewPanelTourSwitchTriggerClassName}
                  aria-label='Switch tour'
                  aria-haspopup='listbox'
                  aria-expanded={tourSwitchOpen}
                  onClick={() => setTourSwitchOpen((open) => !open)}
                >
                  <span className='min-w-0 truncate'>{stickyTourName}</span>
                  <svg
                    className={devViewPanelTourSwitchChevronClassName}
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>

                {tourSwitchOpen && typeof document !== 'undefined' ?
                  createPortal(
                    <ul
                      ref={tourSwitchMenuRef}
                      style={tourSwitchMenuStyle}
                      className={devViewPanelTourSwitchMenuClassName}
                      role='listbox'
                      aria-label='Switch tour'
                    >
                      {tourGroups.map((group) => (
                        <li key={group.clientId} role='presentation'>
                          <p
                            className={
                              devViewPanelTourSwitchGroupHeadingClassName
                            }
                          >
                            {group.clientName}
                          </p>
                          <ul role='group' aria-label={group.clientName}>
                            {group.tours.map((option) => {
                              const isActive = option.id === currentTourId;
                              return (
                                <li key={option.id}>
                                  <button
                                    type='button'
                                    role='option'
                                    aria-selected={isActive}
                                    className={cn(
                                      devViewPanelTourSwitchMenuItemClassName,
                                      isActive &&
                                        devViewPanelTourSwitchMenuItemActiveClassName,
                                    )}
                                    onClick={() => {
                                      handleSwitchTour(option.id);
                                      setTourSwitchOpen(false);
                                    }}
                                  >
                                    {option.facilityTitle}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>,
                    document.body,
                  )
                : null}
              </>
            : <p className={devViewPanelStickyTourTitleClassName}>
                {stickyTourName}
              </p>
            }
          </div>
          <button
            type='button'
            className={cn(
              devViewPanelBtnVariants({ tone: 'secondary' }),
              'shrink-0',
            )}
            onClick={openIntroGallery}
            aria-label='Open tour intro gallery'
            title='Open tour picker at / (?intro=1)'
          >
            Intro
          </button>
          {onClose ?
            <button
              type='button'
              className={cn(
                devViewPanelBtnVariants({ tone: 'secondary' }),
                'shrink-0 px-2.5',
              )}
              onClick={onClose}
              aria-label='Close dev panel (`)'
              title='Close dev panel (`)'
            >
              ✕
            </button>
          : null}
        </div>

        <div
          className={devViewPanelPrimaryTabsClassName}
          role='tablist'
          aria-label='Dev panel section'
        >
          {DEV_PANEL_TABS.map((tab) => (
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
        {panelTab === 'scene' ?
          <div
            id='dev-panel-scene'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scene'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
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
                          Orbit, pan, and zoom — saves <code>defaultView</code>{' '}
                          and bakes <code>thumbnail</code> from the current 3D
                          view. <code>zoom</code> is orbit distance (lower =
                          closer; unlike PSV zoom level).
                        </>
                      : <>
                          Pan the scene — saves <code>defaultView</code> + bakes{' '}
                          <code>thumbnail</code>
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
                      : 'Apply defaultView (L)'}
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
                        className={devViewPanelBtnVariants({ tone: 'primary' })}
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
              {renderHotspotDevSection()}
            </DevPanelSectionAccordion>
          </div>
        : panelTab === 'client' ?
          <div
            id='dev-panel-client'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-client'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
              <DevPanelSection
                title='Client'
                description='Catalog clients — shared contact and branding. Tour-only settings stay on the Tour tab.'
              >
                <DevClientPanel
                  catalogClients={catalogClients}
                  catalogTick={catalogTick}
                  manageClientId={manageClientId}
                  onManageClientIdChange={setManageClientId}
                  onCatalogRefresh={async () => {
                    await refreshDevCatalogSnapshot();
                  }}
                  onOpenTour={handleOpenTourFromClient}
                  onEditTour={handleOpenTourFromClient}
                  onCreateTourForClient={handleCreateTourForClient}
                />
              </DevPanelSection>
            </DevPanelSectionAccordion>
          </div>
        : panelTab === 'tour' ?
          <div
            id='dev-panel-tour'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-tour'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
              {isModel3dTour ?
                <>
                  {renderHotspotDevSection()}
                  {renderScenesDevSection()}
                </>
              : <>
                  {renderScenesDevSection()}
                  {renderHotspotDevSection()}
                </>
              }
              <DevPanelSection
                title='Tour'
                description='Edit the open tour or create a new one under a client.'
              >
                <div
                  className={devViewPanelSecondaryTabsClassName}
                  role='tablist'
                  aria-label='Tour mode'
                >
                  {DEV_CRUD_MODE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type='button'
                      role='tab'
                      aria-selected={tourModeTab === tab.id}
                      className={devViewPanelTabVariants({
                        depth: 'secondary',
                        kind: tab.id === 'manage' ? 'manage' : 'create',
                        active: tourModeTab === tab.id,
                      })}
                      onClick={() => handleTourModeTabChange(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {tourModeTab === 'manage' ?
                  <>
                    <p className={devViewPanelTabHintClassName}>
                      Edit the open tour.
                    </p>

                    <DevPanelFormGroup stacked>
                      <DevPanelFormSection title='Basics'>
                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Tour title
                          </span>
                          <input
                            className={devViewPanelInputClassName}
                            type='text'
                            value={editTourTitle}
                            onChange={(e) => setEditTourTitle(e.target.value)}
                            spellCheck={false}
                            autoComplete='off'
                          />
                        </label>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Tour summary (optional)
                          </span>
                          <textarea
                            className={devViewPanelTextareaClassName}
                            value={editTourSummary}
                            onChange={(e) => setEditTourSummary(e.target.value)}
                            placeholder='Short marketing blurb for gallery cards and share previews'
                            rows={2}
                            spellCheck={true}
                          />
                          <p className={devViewPanelSectionHintClassName}>
                            Stored in <code>catalog.json</code> (1–2 sentences).
                            Not the AI knowledge summary or scene descriptions.
                          </p>
                        </label>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Product full name (optional)
                          </span>
                          <input
                            className={devViewPanelInputClassName}
                            type='text'
                            value={editTourProductFullName}
                            onChange={(e) =>
                              setEditTourProductFullName(e.target.value)
                            }
                            placeholder='Leave empty for “{client} Virtual Tour”'
                            spellCheck={false}
                            autoComplete='off'
                          />
                        </label>
                        <p className={devViewPanelSectionHintClassName}>
                          Tab title, splash, and in-tour chrome preview:{' '}
                          <strong>{editTourProductNamePreview}</strong>
                        </p>

                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Category
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={editTourCategory}
                              onChange={(e) =>
                                setEditTourCategory(
                                  e.target.value as TourCategory,
                                )
                              }
                            >
                              {tourCategoryOptions.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Catalog visibility
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={editTourVisibility}
                              onChange={(e) =>
                                setEditTourVisibility(
                                  e.target.value as DevCatalogTourVisibility,
                                )
                              }
                            >
                              {DEV_CATALOG_VISIBILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </DevPanelFormRow>

                        <DevPanelFormRow>
                          <div className='col-span-2 flex flex-col gap-1'>
                            <label
                              className={devViewPanelFormCheckboxLabelClassName}
                            >
                              <input
                                className={
                                  devViewPanelFormCheckboxInputClassName
                                }
                                type='checkbox'
                                checked={editTourFeatured}
                                onChange={(e) =>
                                  setEditTourFeatured(e.target.checked)
                                }
                              />
                              <span className={devViewPanelToggleNameClassName}>
                                Featured on home gallery
                              </span>
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Badge on the card and listed first on{' '}
                              <code>/</code>. Use <code>?featured=1</code> for a
                              featured-only gallery.
                            </p>
                          </div>
                        </DevPanelFormRow>
                      </DevPanelFormSection>

                      <DevPanelExperienceSection
                        divided
                        transitionEffect={editTransitionEffect}
                        onTransitionEffectChange={setEditTransitionEffect}
                        transitionSpeed={editTransitionSpeed}
                        onTransitionSpeedChange={setEditTransitionSpeed}
                        immersiveMode={editImmersiveMode}
                        onImmersiveModeChange={setEditImmersiveMode}
                        immersiveAudio={editImmersiveAudio}
                        onImmersiveAudioChange={setEditImmersiveAudio}
                        immersivePlaylistText={editImmersivePlaylistText}
                        onImmersivePlaylistTextChange={
                          setEditImmersivePlaylistText
                        }
                        immersivePlaylistManifest={
                          editImmersivePlaylistManifest
                        }
                        onImmersivePlaylistManifestChange={
                          setEditImmersivePlaylistManifest
                        }
                        immersiveVolume={editImmersiveVolume}
                        onImmersiveVolumeChange={setEditImmersiveVolume}
                      />

                      <DevPanelFormSection title='Branding' divided>
                        <div className='flex flex-col gap-2'>
                          <label
                            className={devViewPanelFormCheckboxLabelClassName}
                          >
                            <input
                              className={devViewPanelFormCheckboxInputClassName}
                              type='radio'
                              name='edit-tour-branding-mode'
                              checked={editTourBrandingMode === 'client'}
                              onChange={() => setEditTourBrandingMode('client')}
                            />
                            <span className={devViewPanelToggleNameClassName}>
                              Use client branding (shared)
                            </span>
                          </label>
                          <label
                            className={devViewPanelFormCheckboxLabelClassName}
                          >
                            <input
                              className={devViewPanelFormCheckboxInputClassName}
                              type='radio'
                              name='edit-tour-branding-mode'
                              checked={editTourBrandingMode === 'custom'}
                              onChange={() => setEditTourBrandingMode('custom')}
                            />
                            <span className={devViewPanelToggleNameClassName}>
                              Custom branding for this tour only
                            </span>
                          </label>
                        </div>
                        <p className={devViewPanelSectionHintClassName}>
                          {editTourBrandingMode === 'client' ?
                            'Inherits shared branding from the Client tab. Switch to custom to override on this tour only.'
                          : 'Stored on this tour JSON only — overrides the client brand.'
                          }
                        </p>

                        {editTourBrandingMode === 'custom' ?
                          <>
                            <div className='flex flex-col gap-1'>
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'secondary',
                                  })}
                                  onClick={() => void suggestEditTourBranding()}
                                  disabled={
                                    !openCatalogClient?.website?.trim() ||
                                    editTourSuggestStatus === 'working'
                                  }
                                >
                                  {editTourSuggestStatus === 'working' ?
                                    'Suggesting…'
                                  : 'Suggest from website'}
                                </button>
                              </div>
                              <p className={devViewPanelSectionHintClassName}>
                                Uses the client website from the Client tab to
                                draft logo, favicon, and primary color — review
                                before saving.
                              </p>
                            </div>

                            {editTourSuggestNotes.length > 0 ?
                              <ul className={devViewPanelSectionHintClassName}>
                                {editTourSuggestNotes.map((note) => (
                                  <li key={note}>{note}</li>
                                ))}
                              </ul>
                            : null}

                            <DevPanelColorField
                              label='Primary color'
                              value={editTourPrimaryColor}
                              onChange={setEditTourPrimaryColor}
                              defaultColor={DEFAULT_NEW_TOUR_PRIMARY_COLOR}
                              pickerAriaLabel='Edit tour primary color picker'
                            />

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Logo alt
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={editTourLogoAlt}
                                onChange={(e) =>
                                  setEditTourLogoAlt(e.target.value)
                                }
                                placeholder='Accessible logo label'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Font family (CSS stack)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={editTourFontFamily}
                                onChange={(e) =>
                                  setEditTourFontFamily(e.target.value)
                                }
                                placeholder="'Montserrat', sans-serif"
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Google Fonts URL
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='url'
                                value={editTourFontSourceUrl}
                                onChange={(e) =>
                                  setEditTourFontSourceUrl(e.target.value)
                                }
                                placeholder='https://fonts.googleapis.com/css2?family=…'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Must be{' '}
                              <code>https://fonts.googleapis.com/…</code>. Clear
                              both font fields to revert to platform defaults.
                            </p>

                            <DevPanelFormRow>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Logo (replace)
                                </span>
                                <DevPanelFileField
                                  file={editTourLogoFile}
                                  preview={
                                    <DevLocalFilePreview
                                      file={editTourLogoFile}
                                      className={devViewPanelBrandLogoClassName}
                                      alt='Logo preview'
                                    />
                                  }
                                  onClearPreview={() =>
                                    setEditTourLogoFile(null)
                                  }
                                  showClear={Boolean(editTourLogoFile)}
                                >
                                  <DevPanelFileInput
                                    accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                                    file={editTourLogoFile}
                                    onChange={setEditTourLogoFile}
                                  />
                                </DevPanelFileField>
                              </label>

                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Favicon (replace)
                                </span>
                                <DevPanelFileField
                                  file={editTourFaviconFile}
                                  preview={
                                    <DevLocalFilePreview
                                      file={editTourFaviconFile}
                                      className={
                                        devViewPanelBrandFaviconClassName
                                      }
                                      alt='Favicon preview'
                                    />
                                  }
                                  onClearPreview={() =>
                                    setEditTourFaviconFile(null)
                                  }
                                  showClear={Boolean(editTourFaviconFile)}
                                >
                                  <DevPanelFileInput
                                    accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                                    file={editTourFaviconFile}
                                    onChange={setEditTourFaviconFile}
                                  />
                                </DevPanelFileField>
                              </label>
                            </DevPanelFormRow>
                          </>
                        : null}

                        {editTourError ?
                          <p className={devViewPanelSectionHintClassName}>
                            {editTourError}
                          </p>
                        : null}

                        <div className={devViewPanelActionsClassName}>
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'primary',
                            })}
                            onClick={() => void saveEditTour()}
                            disabled={
                              !canSaveEditTour || editTourStatus === 'working'
                            }
                          >
                            {editTourStatus === 'working' ?
                              'Saving…'
                            : editTourStatus === 'done' ?
                              'Saved!'
                            : 'Save tour'}
                          </button>
                        </div>
                      </DevPanelFormSection>
                    </DevPanelFormGroup>

                    <div
                      className={cn(
                        'flex flex-col gap-2.5 border border-[rgba(248,113,113,0.35)] bg-[rgba(69,10,10,0.35)] p-3',
                        devViewPanelControlRadiusClassName,
                      )}
                    >
                      <h4 className={devViewPanelFormGroupTitleClassName}>
                        Danger zone
                      </h4>
                      <p className={devViewPanelSectionHintClassName}>
                        Permanently deletes <code>tours/{tour.id}.json</code>,{' '}
                        <code>tours/{tour.id}-knowledge.json</code>, catalog
                        entry, and{' '}
                        <code>
                          assets/{tour.clientId ?? tour.id}/{tour.id}/
                        </code>
                        . This cannot be undone.
                      </p>

                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Type <code>{tour.id}</code> to confirm
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='text'
                          value={deleteTourConfirm}
                          onChange={(e) => setDeleteTourConfirm(e.target.value)}
                          placeholder={tour.id}
                          spellCheck={false}
                          autoComplete='off'
                          disabled={deleteTourStatus === 'working'}
                        />
                      </label>

                      <div className={devViewPanelActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'danger',
                          })}
                          onClick={() => void deleteCurrentTour()}
                          disabled={
                            !canDeleteTour || deleteTourStatus === 'working'
                          }
                        >
                          {deleteTourStatus === 'working' ?
                            'Deleting…'
                          : 'Delete tour permanently'}
                        </button>
                      </div>
                      {deleteTourError ?
                        <p className={devViewPanelSectionHintClassName}>
                          {deleteTourError}
                        </p>
                      : null}
                    </div>
                  </>
                : <>
                    <p className={devViewPanelTabHintClassName}>
                      Create a tour under an existing catalog client. Add new
                      clients on the Client tab first.
                    </p>

                    <DevPanelFormGroup stacked>
                      <DevPanelFormSection title='Client'>
                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Client
                          </span>
                          <select
                            className={devViewPanelSelectClassName}
                            value={newTourClientId}
                            onChange={(e) => setNewTourClientId(e.target.value)}
                          >
                            {catalogClients.length === 0 ?
                              <option value=''>Loading clients…</option>
                            : <>
                                <option value=''>Select client…</option>
                                {catalogClients.map((client) => (
                                  <option key={client.id} value={client.id}>
                                    {client.name} ({client.id}) ·{' '}
                                    {client.tourCount} tour
                                    {client.tourCount === 1 ? '' : 's'}
                                  </option>
                                ))}
                              </>
                            }
                          </select>
                        </label>
                        {catalogClients.length === 0 ?
                          <p className={devViewPanelSectionHintClassName}>
                            No clients yet — create one on the Client tab.
                          </p>
                        : null}
                      </DevPanelFormSection>

                      <DevPanelFormSection title='Tour details' divided>
                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Tour title
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={newTourTitle}
                              onChange={(e) => setNewTourTitle(e.target.value)}
                              placeholder='e.g. Main Campus'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>

                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Tour id (optional)
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={newTourIdInput}
                              onChange={(e) =>
                                setNewTourIdInput(e.target.value)
                              }
                              placeholder='Auto from title if empty'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        </DevPanelFormRow>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Tour summary (optional)
                          </span>
                          <textarea
                            className={devViewPanelTextareaClassName}
                            value={newTourSummary}
                            onChange={(e) => setNewTourSummary(e.target.value)}
                            placeholder='Short marketing blurb for gallery cards and share previews'
                            rows={2}
                            spellCheck={true}
                          />
                          <p className={devViewPanelSectionHintClassName}>
                            Saved to <code>catalog.json</code> with the tour
                            entry (1–2 sentences).
                          </p>
                        </label>

                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Category
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={newTourCategory}
                              onChange={(e) =>
                                setNewTourCategory(
                                  e.target.value as TourCategory,
                                )
                              }
                            >
                              {tourCategoryOptions.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Catalog visibility
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={newTourVisibility}
                              onChange={(e) =>
                                setNewTourVisibility(
                                  e.target.value as DevCatalogTourVisibility,
                                )
                              }
                            >
                              {DEV_CATALOG_VISIBILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </DevPanelFormRow>

                        <DevPanelFormRow>
                          <div className='col-span-2 flex flex-col gap-1'>
                            <label
                              className={devViewPanelFormCheckboxLabelClassName}
                            >
                              <input
                                className={
                                  devViewPanelFormCheckboxInputClassName
                                }
                                type='checkbox'
                                checked={newTourFeatured}
                                onChange={(e) =>
                                  setNewTourFeatured(e.target.checked)
                                }
                              />
                              <span className={devViewPanelToggleNameClassName}>
                                Featured on home gallery
                              </span>
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Badge on the card and listed first on{' '}
                              <code>/</code>. Use <code>?featured=1</code> for a
                              featured-only gallery.
                            </p>
                          </div>
                        </DevPanelFormRow>
                      </DevPanelFormSection>

                      <DevPanelExperienceSection
                        divided
                        transitionEffect={newTourTransitionEffect}
                        onTransitionEffectChange={setNewTourTransitionEffect}
                        transitionSpeed={newTourTransitionSpeed}
                        onTransitionSpeedChange={setNewTourTransitionSpeed}
                        immersiveMode={newTourImmersiveMode}
                        onImmersiveModeChange={setNewTourImmersiveMode}
                        immersiveAudio={newTourImmersiveAudio}
                        onImmersiveAudioChange={setNewTourImmersiveAudio}
                        immersivePlaylistText={newTourImmersivePlaylistText}
                        onImmersivePlaylistTextChange={
                          setNewTourImmersivePlaylistText
                        }
                        immersivePlaylistManifest={
                          newTourImmersivePlaylistManifest
                        }
                        onImmersivePlaylistManifestChange={
                          setNewTourImmersivePlaylistManifest
                        }
                        immersiveVolume={newTourImmersiveVolume}
                        onImmersiveVolumeChange={setNewTourImmersiveVolume}
                      />

                      {createTourBrandingSection}

                      <DevPanelFormSection title='First scene' divided>
                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            First scene title
                          </span>
                          <input
                            className={devViewPanelInputClassName}
                            type='text'
                            value={newFirstSceneTitle}
                            onChange={(e) =>
                              setNewFirstSceneTitle(e.target.value)
                            }
                            placeholder='e.g. Overview'
                            spellCheck={false}
                            autoComplete='off'
                          />
                        </label>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            First panorama
                          </span>
                          <DevPanelFileField
                            file={newTourPanoramaFile}
                            preview={
                              newTourPanoramaFile ?
                                <DevPanoramaFilePreview
                                  file={newTourPanoramaFile}
                                />
                              : null
                            }
                            onClearPreview={() => setNewTourPanoramaFile(null)}
                            showClear={Boolean(newTourPanoramaFile)}
                          >
                            <DevPanelFileInput
                              accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                              file={newTourPanoramaFile}
                              onChange={setNewTourPanoramaFile}
                            />
                          </DevPanelFileField>
                        </label>

                        {newTourSlug && newFirstSceneSlug ?
                          <p className={devViewPanelSlugPreviewClassName}>
                            tour <code>{newTourSlug}</code> · scene{' '}
                            <code>{newFirstSceneSlug}</code> ·{' '}
                            <code>
                              assets/{newTourClientId}/{newTourSlug}/panoramas/
                              {newFirstSceneSlug}.webp
                            </code>{' '}
                            · catalog <code>{newTourVisibility}</code>
                            {newTourFeatured ?
                              <>
                                {' '}
                                · <code>featured</code>
                              </>
                            : null}
                          </p>
                        : null}
                      </DevPanelFormSection>

                      <div className={devViewPanelStackedFormFooterClassName}>
                        {newTourError ?
                          <p className={devViewPanelSectionHintClassName}>
                            {newTourError}
                          </p>
                        : null}

                        <div className={devViewPanelActionsClassName}>
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'primary',
                            })}
                            onClick={() => void createNewTour()}
                            disabled={
                              !canCreateNewTour || newTourStatus === 'working'
                            }
                          >
                            {newTourStatus === 'working' ?
                              'Creating…'
                            : newTourStatus === 'done' ?
                              'Created!'
                            : 'Create tour'}
                          </button>
                        </div>
                      </div>
                    </DevPanelFormGroup>
                  </>
                }
              </DevPanelSection>

              {!isModel3dTour ?
                <DevPanelSection
                  title='Floor plan'
                  description={
                    <>
                      <p className={devViewPanelSectionLeadClassName}>
                        Tour-level minimap image and coordinate space for scene{' '}
                        <code>map</code> pins.
                      </p>
                      {tour.floorPlan ?
                        <p className={devViewPanelSectionHintClassName}>
                          Current: <code>{tour.floorPlan.image}</code> ·{' '}
                          {tour.floorPlan.width}×{tour.floorPlan.height}
                        </p>
                      : <p className={devViewPanelSectionHintClassName}>
                          No floor plan configured yet.
                        </p>
                      }
                    </>
                  }
                >
                  <DevPanelFormGroup hint='Raster images auto-detect dimensions. SVG needs width/height here (or a viewBox in the file).'>
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Floor plan image
                      </span>
                      <DevPanelFileField
                        file={floorPlanFile}
                        preview={
                          <DevLocalFilePreview
                            file={floorPlanFile}
                            className={devViewPanelBrandLogoClassName}
                            alt='Floor plan preview'
                          />
                        }
                        onClearPreview={() => setFloorPlanFile(null)}
                        showClear={Boolean(floorPlanFile)}
                      >
                        <DevPanelFileInput
                          accept='image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp'
                          file={floorPlanFile}
                          onChange={setFloorPlanFile}
                        />
                      </DevPanelFileField>
                    </label>

                    <DevPanelFormRow>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Width
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='number'
                          min='1'
                          step='1'
                          value={floorPlanWidth}
                          onChange={(e) => setFloorPlanWidth(e.target.value)}
                          placeholder='324'
                        />
                      </label>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Height
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='number'
                          min='1'
                          step='1'
                          value={floorPlanHeight}
                          onChange={(e) => setFloorPlanHeight(e.target.value)}
                          placeholder='216'
                        />
                      </label>
                    </DevPanelFormRow>

                    {floorPlanError ?
                      <p className={devViewPanelSectionHintClassName}>
                        {floorPlanError}
                      </p>
                    : null}

                    <div className={devViewPanelActionsClassName}>
                      <button
                        type='button'
                        className={devViewPanelBtnVariants({ tone: 'primary' })}
                        onClick={() => void saveFloorPlan()}
                        disabled={
                          !canSaveFloorPlan || floorPlanStatus === 'working'
                        }
                      >
                        {floorPlanStatus === 'working' ?
                          'Saving…'
                        : floorPlanStatus === 'done' ?
                          'Floor plan saved!'
                        : 'Save floor plan'}
                      </button>
                      {canClearFloorPlan ?
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'danger',
                          })}
                          onClick={() => void clearFloorPlan()}
                          disabled={floorPlanStatus === 'working'}
                        >
                          Remove floor plan
                        </button>
                      : null}
                    </div>
                  </DevPanelFormGroup>
                </DevPanelSection>
              : null}

              <DevPanelSection
                title='Knowledge (AI assistant)'
                description={
                  <>
                    Edits <code>{tour.id}-knowledge.json</code> — facts, FAQs,
                    and suggested questions for the chat assistant.
                  </>
                }
              >
                {knowledgeMissing ?
                  <p className={devViewPanelSectionHintClassName}>
                    No knowledge file yet — saving will create{' '}
                    <code>tours/{tour.id}-knowledge.json</code>.
                  </p>
                : null}
                {knowledgeLoadError ?
                  <p className={devViewPanelSectionHintClassName}>
                    {knowledgeLoadError}
                  </p>
                : null}

                <DevPanelFormGroup stacked>
                  <DevPanelFormSection title='Global'>
                    <DevPanelFormRow>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Website URL
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='url'
                          value={knowledgeUrl}
                          onChange={(e) => setKnowledgeUrl(e.target.value)}
                          placeholder='https://…'
                          spellCheck={false}
                          autoComplete='off'
                          disabled={knowledgeLoadStatus === 'working'}
                        />
                      </label>

                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Facility name
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='text'
                          value={knowledgeFacilityName}
                          onChange={(e) =>
                            setKnowledgeFacilityName(e.target.value)
                          }
                          spellCheck={false}
                          autoComplete='off'
                          disabled={knowledgeLoadStatus === 'working'}
                        />
                      </label>
                    </DevPanelFormRow>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Global summary
                      </span>
                      <textarea
                        className={devViewPanelTextareaClassName}
                        value={knowledgeSummary}
                        onChange={(e) => setKnowledgeSummary(e.target.value)}
                        rows={3}
                        spellCheck={true}
                        disabled={knowledgeLoadStatus === 'working'}
                      />
                    </label>
                  </DevPanelFormSection>

                  <DevPanelFormSection title='Scene content' divided>
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Scene
                      </span>
                      <select
                        className={devViewPanelSelectClassName}
                        value={knowledgeSceneId}
                        onChange={(e) =>
                          handleKnowledgeSceneChange(e.target.value)
                        }
                        disabled={knowledgeLoadStatus === 'working'}
                      >
                        {tourScenes.map((sceneOption) => (
                          <option key={sceneOption.id} value={sceneOption.id}>
                            {sceneOption.title} ({sceneOption.id})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Scene title
                      </span>
                      <input
                        className={devViewPanelInputClassName}
                        type='text'
                        value={knowledgeSceneTitle}
                        onChange={(e) => setKnowledgeSceneTitle(e.target.value)}
                        spellCheck={false}
                        autoComplete='off'
                        disabled={knowledgeLoadStatus === 'working'}
                      />
                    </label>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Scene description
                      </span>
                      <textarea
                        className={devViewPanelTextareaClassName}
                        value={knowledgeSceneDescription}
                        onChange={(e) =>
                          setKnowledgeSceneDescription(e.target.value)
                        }
                        rows={4}
                        spellCheck={true}
                        disabled={knowledgeLoadStatus === 'working'}
                      />
                    </label>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Facts (one per line)
                      </span>
                      <textarea
                        className={devViewPanelTextareaClassName}
                        value={knowledgeFactsText}
                        onChange={(e) => setKnowledgeFactsText(e.target.value)}
                        rows={4}
                        spellCheck={true}
                        disabled={knowledgeLoadStatus === 'working'}
                      />
                    </label>

                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Suggested questions (one per line)
                      </span>
                      <textarea
                        className={devViewPanelTextareaClassName}
                        value={knowledgeSuggestedText}
                        onChange={(e) =>
                          setKnowledgeSuggestedText(e.target.value)
                        }
                        rows={3}
                        spellCheck={true}
                        disabled={knowledgeLoadStatus === 'working'}
                      />
                    </label>
                  </DevPanelFormSection>

                  <DevPanelFormSection
                    title='FAQs'
                    divided
                    description={
                      knowledgeSceneId ?
                        <p className={devViewPanelSectionLeadClassName}>
                          Q&amp;A pairs for{' '}
                          <code>{knowledgeSceneTitle || knowledgeSceneId}</code>
                          .
                        </p>
                      : undefined
                    }
                  >
                    <DevPanelFormGroup inline className='mt-0'>
                      {knowledgeFaqs.length > 0 ?
                        <ul className={devViewPanelManageListClassName}>
                          {knowledgeFaqs.map((faq, index) => (
                            <li
                              key={`${knowledgeSceneId}-faq-${index}`}
                              className={devViewPanelManageListItemClassName}
                            >
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Question
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={faq.q}
                                  onChange={(e) => {
                                    const next = [...knowledgeFaqs];
                                    next[index] = {
                                      ...next[index],
                                      q: e.target.value,
                                    };
                                    setKnowledgeFaqs(next);
                                  }}
                                  placeholder='Question'
                                  spellCheck={true}
                                  disabled={knowledgeLoadStatus === 'working'}
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Answer
                                </span>
                                <textarea
                                  className={devViewPanelTextareaClassName}
                                  value={faq.a}
                                  onChange={(e) => {
                                    const next = [...knowledgeFaqs];
                                    next[index] = {
                                      ...next[index],
                                      a: e.target.value,
                                    };
                                    setKnowledgeFaqs(next);
                                  }}
                                  placeholder='Answer'
                                  rows={2}
                                  spellCheck={true}
                                  disabled={knowledgeLoadStatus === 'working'}
                                />
                              </label>
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'danger',
                                  })}
                                  onClick={() =>
                                    setKnowledgeFaqs((current) =>
                                      current.filter(
                                        (_, faqIndex) => faqIndex !== index,
                                      ),
                                    )
                                  }
                                  disabled={knowledgeLoadStatus === 'working'}
                                >
                                  Remove FAQ
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      : null}

                      <div className={devViewPanelManageListFooterClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'secondary',
                          })}
                          onClick={() =>
                            setKnowledgeFaqs((current) => [
                              ...current,
                              { q: '', a: '' },
                            ])
                          }
                          disabled={knowledgeLoadStatus === 'working'}
                        >
                          Add FAQ
                        </button>
                      </div>
                    </DevPanelFormGroup>
                  </DevPanelFormSection>

                  <div className={devViewPanelStackedFormFooterClassName}>
                    {knowledgeError ?
                      <p className={devViewPanelSectionHintClassName}>
                        {knowledgeError}
                      </p>
                    : null}

                    <div className={devViewPanelActionsClassName}>
                      <button
                        type='button'
                        className={devViewPanelBtnVariants({ tone: 'primary' })}
                        onClick={() => void saveKnowledge()}
                        disabled={
                          !canSaveKnowledge || knowledgeStatus === 'working'
                        }
                      >
                        {knowledgeStatus === 'working' ?
                          'Saving…'
                        : knowledgeStatus === 'done' ?
                          'Knowledge saved!'
                        : 'Save knowledge'}
                      </button>
                    </div>
                  </div>
                </DevPanelFormGroup>
              </DevPanelSection>
            </DevPanelSectionAccordion>
          </div>
        : <div
            id='dev-panel-debug'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-debug'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
              <DevPanelSection
                title='URL flags'
                description='Toggle preserved query params for QA — applies on the current page without a reload.'
              >
                <DevPanelFormGroup stacked>
                  <ul className={devViewPanelToggleListClassName}>
                    {DEV_URL_FLAG_TOGGLES.map((toggle) => {
                      const checked = toggle.isOn(appSearchParams);

                      return (
                        <li key={toggle.key}>
                          <label
                            className={
                              devViewPanelToggleLabelMultilineClassName
                            }
                          >
                            <input
                              type='checkbox'
                              className={devViewPanelToggleInputClassName}
                              checked={checked}
                              onChange={(event) =>
                                setDevUrlFlag(
                                  toggle,
                                  event.currentTarget.checked,
                                )
                              }
                            />
                            <span className={devViewPanelToggleTextClassName}>
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
                  {appSearchParams.embed ?
                    <DevPanelEmbedDebug
                      tourId={tour.id}
                      currentSceneId={currentSceneId}
                      firstSceneId={tour.firstScene}
                    />
                  : null}
                </DevPanelFormGroup>
              </DevPanelSection>
            </DevPanelSectionAccordion>
          </div>
        }
      </div>
    </div>
  );
}
