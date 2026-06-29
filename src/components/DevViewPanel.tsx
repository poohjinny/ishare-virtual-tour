import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DEV_URL_FLAG_TOGGLES,
  type DevUrlFlagToggle,
} from '../constants/devUrlFlags';
import { useAppSearchParams } from '../hooks/useAppSearchParams';
import { subscribeDevCatalogSnapshot } from '../data/devCatalogSnapshot';
import {
  listTours,
  loadTour,
  removeDevTourCache,
  setDevTourCache,
} from '../data/loadTour';
import { normalizeTourAssets } from '../services/normalizeTourAssets';
import { listTourCategories, findCatalogClient } from '../data/tourCatalog';
import {
  buildTourLocation,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../utils/tourPaths';
import { getTourClientId } from '../utils/tourClientId';
import { getTourProductFullName } from '../utils/tourProductName';
import { IMMERSIVE_PLAYLIST_MANIFEST } from '../constants/immersiveBackground';
import {
  DEV_HOTSPOT_TABS,
  DEV_INFO_DISPLAY_OPTIONS,
  DEV_NAMING_STATUS_OPTIONS,
  type DevHotspotTab,
} from '../constants/devHotspot';
import {
  DEV_CRUD_MODE_TABS,
  DEV_NEW_TOUR_CLIENT_TABS,
  DEV_PANEL_TABS,
  DEV_CATALOG_VISIBILITY_OPTIONS,
  type DevCatalogTourVisibility,
  type DevCrudModeTab,
  type DevNewTourClientMode,
  type DevPanelTab,
} from '../constants/devPanel';
import type { TourCategory } from '../constants/tourCategories';
import type {
  FaqEntry,
  Hotspot,
  NamingOpportunityStatus,
  PopupDisplay,
  Scene,
  Tour,
  TourKnowledge,
  ViewPosition,
} from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  DEV_NAV_NAME_STORAGE_KEY,
  DEV_NO_NAME_STORAGE_KEY,
  DEV_SCENE_TITLE_STORAGE_KEY,
  formatViewPosition,
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
  refreshDevCatalogSnapshot,
  devFetchCatalogClients,
  devFetchKnowledge,
  devFetchTourRecord,
  devUpdateKnowledge,
  devBase64ToImageFile,
  devReplaceScenePanorama,
  devSuggestBranding,
  devSuggestContact,
  devUpdateHotspotPosition,
  devUpdateInfoHotspot,
  devUpdateNavHotspot,
  devUpdateNamingHotspot,
  devUpdateScene,
  devUpdateTour,
  devUpdateTourFloorPlan,
  type DevCatalogClient,
  type DevTourMutateOptions,
} from '../utils/devTourApi';
import {
  buildDefaultPanoramaRelativePath,
  buildDefaultPanoramaWebPath,
} from '../utils/devScenePanoramaPath';
import {
  sceneKnowledgeFromForm,
  sceneKnowledgeToForm,
} from '../utils/devKnowledgeForm';
import { cn } from '../lib/cn';
import {
  devViewPanelActionsClassName,
  devViewPanelBodyClassName,
  devViewPanelBrandFaviconClassName,
  devViewPanelBrandFaviconWrapClassName,
  devViewPanelBrandLogoClassName,
  devViewPanelBrandPreviewWrapClassName,
  devViewPanelBtnVariants,
  devViewPanelCoordsClassName,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelFileInputClassName,
  devViewPanelInputClassName,
  devViewPanelRootClassName,
  devViewPanelSectionHintClassName,
  devViewPanelTabHintClassName,
  devViewPanelSectionLeadClassName,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelStickyHeaderClassName,
  devViewPanelStickyTourClientClassName,
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
  devViewPanelTourSwitchMenuItemActiveClassName,
  devViewPanelTourSwitchMenuItemClassName,
  devViewPanelTourSwitchTriggerClassName,
  devViewPanelTourSwitcherClassName,
  devViewPanelManageListClassName,
  devViewPanelStackedFormFooterClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemHeadClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelManageListItemBulletClassName,
  devViewPanelManageListItemIdClassName,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemBadgesClassName,
  devHotspotKindBadgeVariants,
  type DevHotspotKindBadgeKind,
  devViewPanelHotspotRowSelectedClassName,
} from './devViewPanelVariants';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import {
  DevPanelColorField,
  normalizeHexColorInput,
} from './DevPanelColorField';
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
}

type ActionStatus = 'idle' | 'working' | 'done' | 'error';

function isNamingInfoHotspot(hotspot: Hotspot): boolean {
  return hotspot.type === 'info' && Boolean(hotspot.popup?.namingOpportunity);
}

function hotspotKindLabel(hotspot: Hotspot): string {
  if (hotspot.type === 'nav') return 'Nav';
  if (isNamingInfoHotspot(hotspot)) return 'NO';
  if (hotspot.type === 'info') return 'Info';
  return hotspot.type;
}

function hotspotKindBadgeKind(hotspot: Hotspot): DevHotspotKindBadgeKind {
  if (hotspot.type === 'nav') return 'nav';
  if (isNamingInfoHotspot(hotspot)) return 'naming';
  return 'info';
}

function hotspotDisplayLabel(hotspot: Hotspot): string {
  if (hotspot.type === 'nav') return hotspot.label ?? hotspot.id;
  return hotspot.popup?.title ?? hotspot.id;
}

function confirmDevPanelDelete(message: string): boolean {
  return window.confirm(`${message}\n\nThis cannot be undone.`);
}

function formatHotspotPosition(hotspot: Hotspot): string {
  return formatViewPosition({ ...hotspot.position, zoom: 0 });
}

function hotspotManageKindOrder(hotspot: Hotspot): number {
  if (hotspot.type === 'nav') return 0;
  if (isNamingInfoHotspot(hotspot)) return 1;
  if (hotspot.type === 'info') return 2;
  return 3;
}

function sortSceneHotspotsForManage(hotspots: Hotspot[]): Hotspot[] {
  return [...hotspots].sort((a, b) => {
    const kindDiff = hotspotManageKindOrder(a) - hotspotManageKindOrder(b);
    if (kindDiff !== 0) return kindDiff;

    const labelDiff = hotspotDisplayLabel(a).localeCompare(
      hotspotDisplayLabel(b),
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
  const currentTourId = scene.tourId ?? '';
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
  const [editNavPreviewImage, setEditNavPreviewImage] = useState('');
  const [editNoTitle, setEditNoTitle] = useState('');
  const [editNoPrice, setEditNoPrice] = useState('');
  const [editNoStatus, setEditNoStatus] = useState<
    NamingOpportunityStatus | ''
  >('');
  const [editNoBody, setEditNoBody] = useState('');
  const [editNoVideoUrl, setEditNoVideoUrl] = useState('');
  const [editNoImage, setEditNoImage] = useState('');
  const [editInfoTitle, setEditInfoTitle] = useState('');
  const [editInfoBody, setEditInfoBody] = useState('');
  const [editInfoDisplay, setEditInfoDisplay] =
    useState<PopupDisplay>('anchored');
  const [editInfoVideoUrl, setEditInfoVideoUrl] = useState('');
  const [editInfoImage, setEditInfoImage] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneTitle, setEditSceneTitle] = useState('');
  const [editSceneDescription, setEditSceneDescription] = useState('');
  const [editSceneAsFirst, setEditSceneAsFirst] = useState(false);
  const [editSceneMapEnabled, setEditSceneMapEnabled] = useState(false);
  const [editSceneMapX, setEditSceneMapX] = useState('');
  const [editSceneMapY, setEditSceneMapY] = useState('');
  const [editSceneMapHeading, setEditSceneMapHeading] = useState('');
  const [sceneManageStatus, setSceneManageStatus] =
    useState<ActionStatus>('idle');
  const [sceneManageError, setSceneManageError] = useState<string | null>(null);
  const [tourModeTab, setTourModeTab] = useState<DevCrudModeTab>('manage');
  const [newTourClientMode, setNewTourClientMode] =
    useState<DevNewTourClientMode>('existing');
  const [catalogClients, setCatalogClients] = useState<DevCatalogClient[]>([]);
  const [newTourClientId, setNewTourClientId] = useState('');
  const [newTourClientName, setNewTourClientName] = useState('');
  const [newClientIdInput, setNewClientIdInput] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPhoneLabel, setNewClientPhoneLabel] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourIdInput, setNewTourIdInput] = useState('');
  const [newTourCategory, setNewTourCategory] =
    useState<TourCategory>('Healthcare');
  const [newTourVisibility, setNewTourVisibility] =
    useState<DevCatalogTourVisibility>('unlisted');
  const [newTourFeatured, setNewTourFeatured] = useState(false);
  const [newTourWebsite, setNewTourWebsite] = useState('');
  const [newTourPrimaryColor, setNewTourPrimaryColor] = useState(
    DEFAULT_NEW_TOUR_PRIMARY_COLOR,
  );
  const [newTourLogoFile, setNewTourLogoFile] = useState<File | null>(null);
  const [newTourFaviconFile, setNewTourFaviconFile] = useState<File | null>(
    null,
  );
  const [newTourLogoPreviewUrl, setNewTourLogoPreviewUrl] = useState<
    string | null
  >(null);
  const [newTourFaviconPreviewUrl, setNewTourFaviconPreviewUrl] = useState<
    string | null
  >(null);
  const [suggestBrandingStatus, setSuggestBrandingStatus] =
    useState<ActionStatus>('idle');
  const [suggestBrandingNotes, setSuggestBrandingNotes] = useState<string[]>(
    [],
  );
  const [suggestContactStatus, setSuggestContactStatus] =
    useState<ActionStatus>('idle');
  const [suggestContactNotes, setSuggestContactNotes] = useState<string[]>([]);
  const [newFirstSceneTitle, setNewFirstSceneTitle] = useState('Overview');
  const [newTourPanoramaFile, setNewTourPanoramaFile] = useState<File | null>(
    null,
  );
  const [newTourStatus, setNewTourStatus] = useState<ActionStatus>('idle');
  const [newTourError, setNewTourError] = useState<string | null>(null);
  const [editTourTitle, setEditTourTitle] = useState('');
  const [editTourCategory, setEditTourCategory] =
    useState<TourCategory>('Healthcare');
  const [editTourWebsite, setEditTourWebsite] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientPhoneLabel, setEditClientPhoneLabel] = useState('');
  const [editClientFax, setEditClientFax] = useState('');
  const [editClientFaxLabel, setEditClientFaxLabel] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editTourVisibility, setEditTourVisibility] =
    useState<DevCatalogTourVisibility>('unlisted');
  const [editTourFeatured, setEditTourFeatured] = useState(false);
  const [editTourPrimaryColor, setEditTourPrimaryColor] = useState(
    DEFAULT_NEW_TOUR_PRIMARY_COLOR,
  );
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
  const [editTourLogoPreviewUrl, setEditTourLogoPreviewUrl] = useState<
    string | null
  >(null);
  const [editTourFaviconPreviewUrl, setEditTourFaviconPreviewUrl] = useState<
    string | null
  >(null);
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
  const [floorPlanPreviewUrl, setFloorPlanPreviewUrl] = useState<string | null>(
    null,
  );
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

  const currentSceneHotspots = useMemo(
    () => sortSceneHotspotsForManage(tour.scenes[scene.id]?.hotspots ?? []),
    [scene.id, tour],
  );
  const tourScenes = useMemo(
    () =>
      Object.values(tour.scenes).sort((a, b) => a.title.localeCompare(b.title)),
    [tour.scenes],
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

  const [navName, setNavName] = useState(() =>
    readSessionValue(DEV_NAV_NAME_STORAGE_KEY),
  );
  const [navTargetSceneId, setNavTargetSceneId] = useState('');
  const [navTargetTouched, setNavTargetTouched] = useState(false);
  const [navInstant, setNavInstant] = useState(false);
  const [navPreviewImage, setNavPreviewImage] = useState('');

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
  const [infoStatus, setInfoStatus] = useState<ActionStatus>('idle');
  const [infoError, setInfoError] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<DevPanelTab>('scene');
  const [hotspotModeTab, setHotspotModeTab] =
    useState<DevCrudModeTab>('manage');
  const [sceneModeTab, setSceneModeTab] = useState<DevCrudModeTab>('manage');
  const [tourSwitchOpen, setTourSwitchOpen] = useState(false);
  const tourSwitchRef = useRef<HTMLDivElement>(null);
  const [hotspotTab, setHotspotTab] = useState<DevHotspotTab>('nav');

  const canWriteTour = Boolean(scene.tourId && view);
  const trimmedNavName = navName.trim();
  const trimmedNoName = noName.trim();
  const trimmedInfoName = infoName.trim();
  const navSlug = useMemo(
    () => (trimmedNavName ? slugifyHotspotName(trimmedNavName) : ''),
    [trimmedNavName],
  );
  const noSlug = useMemo(
    () => (trimmedNoName ? slugifyHotspotName(trimmedNoName) : ''),
    [trimmedNoName],
  );
  const infoSlug = useMemo(
    () => (trimmedInfoName ? slugifyHotspotName(trimmedInfoName) : ''),
    [trimmedInfoName],
  );
  const existingHotspotIds = useMemo(
    () => currentSceneHotspots.map((hotspot) => hotspot.id),
    [currentSceneHotspots],
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
  const newTourSlug = useMemo(
    () =>
      newTourIdInput.trim() ? slugifyHotspotName(newTourIdInput)
      : trimmedNewTourTitle ? slugifyHotspotName(trimmedNewTourTitle)
      : '',
    [newTourIdInput, trimmedNewTourTitle],
  );
  const newClientSlug = useMemo(
    () => (newClientIdInput.trim() ? slugifyHotspotName(newClientIdInput) : ''),
    [newClientIdInput],
  );
  const newFirstSceneSlug = useMemo(
    () =>
      newFirstSceneTitle.trim() ? slugifyHotspotName(newFirstSceneTitle) : '',
    [newFirstSceneTitle],
  );

  const canCreateNav = Boolean(
    scene.tourId && clickCoords && trimmedNavName && navTargetSceneId,
  );
  const canCreateNaming = Boolean(
    scene.tourId && clickCoords && trimmedNoName && noPrice.trim() && noStatus,
  );
  const canCreateInfo = Boolean(scene.tourId && clickCoords && trimmedInfoName);
  const canCreateScene = Boolean(
    scene.tourId && trimmedSceneTitle && scenePanoramaFile,
  );
  const canCreateNewTour = Boolean(
    newTourSlug &&
    newFirstSceneSlug &&
    newTourPanoramaFile &&
    (newTourClientMode === 'existing' ? newTourClientId : (
      newTourClientName.trim() && newClientIdInput.trim() && newClientSlug
    )),
  );
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
      buildDefaultPanoramaWebPath(tour.clientId ?? tour.id, tour.id, sceneSlug)
    : '';

  const sortedSceneOptions = useMemo(
    () => [...sceneOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [sceneOptions],
  );

  useEffect(() => {
    if (panelTab !== 'tour') return;

    void devFetchCatalogClients()
      .then((clients) => {
        setCatalogClients(clients);
        setNewTourClientId((current) => current || clients[0]?.id || '');
      })
      .catch(() => {
        setCatalogClients([]);
      });
  }, [panelTab]);

  useEffect(() => {
    if (panelTab !== 'tour' || !tour.id) return;

    void devFetchTourRecord(tour.id)
      .then(({ tour: rawTour, catalog }) => {
        if (catalog) {
          setEditTourVisibility(catalog.visibility);
          setEditTourFeatured(catalog.featured);
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
    const primaryPhone =
      catalogClient?.phone ?? catalogClient?.phones?.[0]?.number ?? '';
    const primaryPhoneLabel =
      catalogClient?.phoneLabel ?? catalogClient?.phones?.[0]?.label ?? '';

    setEditTourTitle(tour.title);
    setEditTourCategory((tour.category as TourCategory) ?? 'Healthcare');
    setEditTourWebsite(catalogClient?.website ?? '');
    setEditClientEmail(catalogClient?.email ?? '');
    setEditClientPhone(primaryPhone);
    setEditClientPhoneLabel(primaryPhoneLabel);
    setEditClientFax(catalogClient?.fax ?? '');
    setEditClientFaxLabel(catalogClient?.faxLabel ?? '');
    setEditClientAddress(catalogClient?.address ?? '');
    setEditTourPrimaryColor(
      tour.branding?.primaryColor ?? DEFAULT_NEW_TOUR_PRIMARY_COLOR,
    );
    setEditTourLogoAlt(tour.branding?.logoAlt ?? '');
    setEditTourFontFamily(tour.branding?.fontFamily ?? '');
    setEditTourFontSourceUrl(tour.branding?.fontSourceUrl ?? '');
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
    if (!floorPlanFile) {
      setFloorPlanPreviewUrl(tour.floorPlan?.image ?? null);
      return;
    }
    const url = URL.createObjectURL(floorPlanFile);
    setFloorPlanPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [floorPlanFile, tour.floorPlan?.image]);

  useEffect(() => {
    if (!newTourLogoFile) {
      setNewTourLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newTourLogoFile);
    setNewTourLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newTourLogoFile]);

  useEffect(() => {
    if (!editTourLogoFile) {
      setEditTourLogoPreviewUrl(tour.branding?.logo ?? null);
      return;
    }
    const url = URL.createObjectURL(editTourLogoFile);
    setEditTourLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editTourLogoFile, tour.branding?.logo]);

  useEffect(() => {
    if (!editTourFaviconFile) {
      setEditTourFaviconPreviewUrl(tour.branding?.favicon ?? null);
      return;
    }
    const url = URL.createObjectURL(editTourFaviconFile);
    setEditTourFaviconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editTourFaviconFile, tour.branding?.favicon]);

  useEffect(() => {
    if (!newTourFaviconFile) {
      setNewTourFaviconPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newTourFaviconFile);
    setNewTourFaviconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newTourFaviconFile]);

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
    setNavInstant(false);
    setNavPreviewImage('');
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
      await onTourMutated?.();
      setLandingStatus('done');
    } catch (error) {
      setLandingStatus('error');
      setLandingError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save defaultView',
      );
    }
  }, [buildScenePayload, onTourMutated, scene, view]);

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
        instant: navInstant || undefined,
        previewImage: navPreviewImage.trim() || undefined,
      });
      await onTourMutated?.();
      setNavStatus('done');
      setNavName('');
      setNavTargetSceneId('');
      setNavTargetTouched(false);
      setNavInstant(false);
      setNavPreviewImage('');
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
    navPreviewImage,
    scene.id,
    scene.tourId,
    trimmedNavName,
    onTourMutated,
  ]);

  const createNamingHotspot = useCallback(async () => {
    const position = buildHotspotPosition();
    if (
      !scene.tourId ||
      !position ||
      !trimmedNoName ||
      !noPrice.trim() ||
      !noStatus
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
        body: noBody.trim() || undefined,
        videoUrl: noVideoUrl.trim() || undefined,
        image: noImage.trim() || undefined,
      });
      await onTourMutated?.();
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
      });
      await onTourMutated?.();
      setInfoStatus('done');
      setInfoName('');
      setInfoBody('');
      setInfoVideoUrl('');
      setInfoImage('');
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

  const createScene = useCallback(async () => {
    if (!scene.tourId || !trimmedSceneTitle || !scenePanoramaFile) return;

    setSceneStatus('working');
    setSceneError(null);

    try {
      const result = await devCreateScene({
        tourId: scene.tourId,
        title: trimmedSceneTitle,
        panoramaFile: scenePanoramaFile,
        description: sceneDescription.trim() || undefined,
        defaultView:
          view ?
            toViewPosition(view.yaw, view.pitch, view.zoom ?? 0)
          : undefined,
      });
      setSceneTitle('');
      setSceneDescription('');
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
    onTourMutated,
    scene.tourId,
    sceneDescription,
    scenePanoramaFile,
    trimmedSceneTitle,
    view,
  ]);

  const suggestEditTourBranding = useCallback(async () => {
    const websiteUrl = editTourWebsite.trim();
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
  }, [editTourWebsite]);

  const saveEditTour = useCallback(async () => {
    if (!canSaveEditTour || !tour.id) return;

    setEditTourStatus('working');
    setEditTourError(null);

    try {
      await devUpdateTour({
        tourId: tour.id,
        tourTitle: editTourTitle.trim(),
        category: editTourCategory,
        websiteUrl: editTourWebsite.trim() || undefined,
        clientEmail: editClientEmail,
        clientPhone: editClientPhone,
        clientPhoneLabel: editClientPhoneLabel,
        clientFax: editClientFax,
        clientFaxLabel: editClientFaxLabel,
        clientAddress: editClientAddress,
        primaryColor: normalizeHexColorInput(editTourPrimaryColor),
        logoAlt: editTourLogoAlt.trim() || undefined,
        fontFamily: editTourFontFamily,
        fontSourceUrl: editTourFontSourceUrl,
        productFullName: editTourProductFullName,
        transitionEffect: editTransitionEffect,
        transitionSpeed: editTransitionSpeed.trim() || undefined,
        clearImmersiveBackground: editImmersiveMode === 'platform',
        immersiveAudio:
          editImmersiveMode === 'audio' ? editImmersiveAudio : undefined,
        immersivePlaylist:
          editImmersiveMode === 'playlist' ?
            editImmersivePlaylistText
          : undefined,
        immersivePlaylistManifest:
          editImmersiveMode === 'manifest' ?
            editImmersivePlaylistManifest
          : undefined,
        immersiveVolume:
          editImmersiveMode !== 'platform' && editImmersiveVolume.trim() ?
            Number(editImmersiveVolume)
          : undefined,
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
    editClientAddress,
    editClientEmail,
    editClientFax,
    editClientFaxLabel,
    editClientPhone,
    editClientPhoneLabel,
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
    editTourPrimaryColor,
    editTourTitle,
    editTourVisibility,
    editTourWebsite,
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

      if (result.redirectTourId) {
        const nextTour = loadTour(result.redirectTourId);
        navigate(
          buildTourLocation(
            result.redirectTourId,
            nextTour.firstScene,
            nextTour.firstScene,
            searchParams,
          ),
        );
      } else {
        navigate('/');
      }
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
    const websiteUrl = newTourWebsite.trim();
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
  }, [newTourWebsite]);

  const suggestNewTourContact = useCallback(async () => {
    const websiteUrl = newTourWebsite.trim();
    if (!websiteUrl) return;

    setSuggestContactStatus('working');
    setSuggestContactNotes([]);

    try {
      const result = await devSuggestContact(websiteUrl);
      if (result.email) setNewClientEmail(result.email);
      if (result.phone) setNewClientPhone(result.phone);
      if (result.phoneLabel) setNewClientPhoneLabel(result.phoneLabel);
      if (result.address) setNewClientAddress(result.address);
      setSuggestContactNotes(result.notes);
      setSuggestContactStatus('done');
    } catch (error) {
      setSuggestContactStatus('error');
      setSuggestContactNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest contact from website',
      ]);
    }
  }, [newTourWebsite]);

  const createNewTour = useCallback(async () => {
    if (!canCreateNewTour || !newTourPanoramaFile || !newTourSlug) return;

    setNewTourStatus('working');
    setNewTourError(null);

    try {
      const result = await devCreateTour({
        mode: newTourClientMode,
        clientId:
          newTourClientMode === 'existing' ? newTourClientId : newClientSlug,
        clientName:
          newTourClientMode === 'new' ? newTourClientName.trim() : undefined,
        tourId: newTourSlug,
        tourTitle: trimmedNewTourTitle || newTourSlug,
        category: newTourCategory,
        websiteUrl: newTourWebsite.trim() || undefined,
        clientEmail: newClientEmail.trim() || undefined,
        clientPhone: newClientPhone.trim() || undefined,
        clientPhoneLabel: newClientPhoneLabel.trim() || undefined,
        clientAddress: newClientAddress.trim() || undefined,
        firstSceneTitle: newFirstSceneTitle.trim(),
        panoramaFile: newTourPanoramaFile,
        logoFile: newTourLogoFile,
        faviconFile: newTourFaviconFile,
        primaryColor: normalizeHexColorInput(newTourPrimaryColor),
        defaultView:
          view ?
            toViewPosition(view.yaw, view.pitch, view.zoom ?? 0)
          : undefined,
        visibility: newTourVisibility,
        featured: newTourFeatured,
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
    newClientSlug,
    newFirstSceneTitle,
    newClientAddress,
    newClientEmail,
    newClientPhone,
    newClientPhoneLabel,
    newTourCategory,
    newTourClientId,
    newTourClientMode,
    newTourClientName,
    newTourFaviconFile,
    newTourLogoFile,
    newTourPanoramaFile,
    newTourPrimaryColor,
    newTourFeatured,
    newTourSlug,
    newTourVisibility,
    newTourWebsite,
    searchParams,
    trimmedNewTourTitle,
    view,
  ]);

  const deleteHotspot = useCallback(
    async (hotspotId: string) => {
      if (!scene.tourId) return;

      const hotspot = tour.scenes[scene.id]?.hotspots?.find(
        (entry) => entry.id === hotspotId,
      );
      const label = hotspot ? hotspotDisplayLabel(hotspot) : hotspotId;
      if (
        !confirmDevPanelDelete(
          `Delete hotspot “${label}” (${hotspotId}) from scene “${scene.id}”?`,
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
      movingHotspotId,
      onTourMutated,
      scene.id,
      scene.tourId,
      tour.scenes,
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

  const startEditHotspot = useCallback((hotspot: Hotspot) => {
    setEditingHotspotId(hotspot.id);
    setMovingHotspotId(null);
    if (hotspot.type === 'nav') {
      setEditNavLabel(hotspot.label ?? '');
      setEditNavTarget(hotspot.targetScene ?? '');
      setEditNavInstant(Boolean(hotspot.instant));
      setEditNavPreviewImage(hotspot.preview?.image ?? '');
      return;
    }
    if (isNamingInfoHotspot(hotspot)) {
      setEditNoTitle(hotspot.popup?.title ?? '');
      setEditNoPrice(hotspot.popup?.namingOpportunity?.price ?? '');
      setEditNoStatus(hotspot.popup?.namingOpportunity?.status ?? '');
      setEditNoBody(hotspot.popup?.body ?? '');
      setEditNoVideoUrl(hotspot.popup?.videoUrl ?? '');
      setEditNoImage(hotspot.popup?.image ?? '');
      return;
    }
    setEditInfoTitle(hotspot.popup?.title ?? '');
    setEditInfoBody(hotspot.popup?.body ?? '');
    setEditInfoDisplay(hotspot.popup?.display ?? 'anchored');
    setEditInfoVideoUrl(hotspot.popup?.videoUrl ?? '');
    setEditInfoImage(hotspot.popup?.image ?? '');
  }, []);

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
    const hotspot = currentSceneHotspots.find(
      (entry) => entry.id === editingHotspotId,
    );
    if (!hotspot) return;

    setHotspotManageStatus('working');
    setHotspotManageError(null);

    try {
      if (hotspot.type === 'nav') {
        await devUpdateNavHotspot({
          tourId: scene.tourId,
          sceneId: scene.id,
          hotspotId: editingHotspotId,
          label: editNavLabel.trim() || undefined,
          targetSceneId: editNavTarget.trim() || undefined,
          syncTargetViewFromScene: true,
          instant: editNavInstant,
          previewImage: editNavPreviewImage.trim() || undefined,
        });
      } else if (isNamingInfoHotspot(hotspot)) {
        await devUpdateNamingHotspot({
          tourId: scene.tourId,
          sceneId: scene.id,
          hotspotId: editingHotspotId,
          title: editNoTitle.trim() || undefined,
          price: editNoPrice.trim() || undefined,
          status: editNoStatus || undefined,
          body: editNoBody.trim() || undefined,
          videoUrl: editNoVideoUrl,
          image: editNoImage,
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
    currentSceneHotspots,
    editInfoBody,
    editInfoDisplay,
    editInfoImage,
    editInfoTitle,
    editInfoVideoUrl,
    editNavInstant,
    editNavPreviewImage,
    editNavLabel,
    editNavTarget,
    editNoBody,
    editNoImage,
    editNoPrice,
    editNoStatus,
    editNoTitle,
    editNoVideoUrl,
    editingHotspotId,
    onTourMutated,
    scene.id,
    scene.tourId,
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
        setAsFirstScene: editSceneAsFirst && !isAlreadyFirst,
        clearMap: !editSceneMapEnabled && hadMap,
        map:
          editSceneMapEnabled ?
            {
              x: Number(editSceneMapX),
              y: Number(editSceneMapY),
              heading: Number(editSceneMapHeading),
            }
          : undefined,
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
    editSceneMapEnabled,
    editSceneMapHeading,
    editSceneMapX,
    editSceneMapY,
    editSceneTitle,
    editingSceneId,
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
      await onTourMutated?.();
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

  const markerCoords =
    clickCoords ? formatViewPosition({ ...clickCoords, zoom: 0 }) : '—';

  const stickyTourIcon = tour.branding?.favicon ?? tour.branding?.logo;
  const currentTourEntry = useMemo(
    () => tourOptions.find((option) => option.id === currentTourId),
    [currentTourId, tourOptions],
  );
  const stickyTourName =
    currentTourEntry?.facilityTitle ?? tour.title ?? currentTourId;
  const stickyClientName =
    currentTourEntry?.label ??
    findCatalogClient(getTourClientId(tour))?.name ??
    tour.clientId ??
    '';

  useEffect(() => {
    if (!tourSwitchOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (tourSwitchRef.current?.contains(event.target as Node)) return;
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
    <div id={id} className={devViewPanelRootClassName}>
      <div className={devViewPanelStickyHeaderClassName}>
        <div className={devViewPanelTourSwitcherClassName}>
          {stickyTourIcon ?
            <div className={devViewPanelStickyTourLogoWrapClassName}>
              <img
                className={devViewPanelStickyTourLogoClassName}
                src={stickyTourIcon}
                alt={tour.branding?.logoAlt ?? tour.title}
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
                  type='button'
                  className={devViewPanelTourSwitchTriggerClassName}
                  aria-label='Switch tour'
                  aria-haspopup='listbox'
                  aria-expanded={tourSwitchOpen}
                  onClick={() => setTourSwitchOpen((open) => !open)}
                >
                  <span className='min-w-0 truncate'>
                    {stickyTourName}
                    {stickyClientName ?
                      <>
                        {' '}
                        <span className={devViewPanelStickyTourClientClassName}>
                          | {stickyClientName}
                        </span>
                      </>
                    : null}
                  </span>
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

                {tourSwitchOpen ?
                  <ul
                    className={devViewPanelTourSwitchMenuClassName}
                    role='listbox'
                    aria-label='Switch tour'
                  >
                    {tourOptions.map((option) => {
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
                            {option.facilityTitle} | {option.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                : null}
              </>
            : <p className={devViewPanelStickyTourTitleClassName}>
                {stickyTourName}
                {stickyClientName ?
                  <>
                    {' '}
                    <span className={devViewPanelStickyTourClientClassName}>
                      | {stickyClientName}
                    </span>
                  </>
                : null}
              </p>
            }
          </div>
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

      <div className={devViewPanelBodyClassName}>
        {panelTab === 'scene' ?
          <div
            id='dev-panel-scene'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scene'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
              <DevPanelSection
                title='Panorama'
                description='Set the landing view and thumbnail, or replace the scene image.'
              >
                <DevPanelFormGroup
                  title='Landing view'
                  hint={
                    <p className={devViewPanelSectionHintClassName}>
                      Pan the scene — saves <code>defaultView</code> + bakes{' '}
                      <code>thumbnail</code>
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

                <DevPanelFormGroup
                  title='Replace panorama'
                  hint={
                    <p className={devViewPanelSectionHintClassName}>
                      Overwrites <code>{scene.id}.webp</code> for this scene and
                      rebakes the thumbnail.
                    </p>
                  }
                >
                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Panorama file
                    </span>
                    <input
                      className={devViewPanelFileInputClassName}
                      type='file'
                      accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                      onChange={(e) =>
                        setReplacePanoramaFile(e.target.files?.[0] ?? null)
                      }
                    />
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
              </DevPanelSection>

              <DevPanelSection
                title='Hotspots'
                description='Manage markers on this scene or add nav, naming, and info hotspots.'
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

                {hotspotModeTab === 'manage' ?
                  <>
                    <p className={devViewPanelTabHintClassName}>
                      Move, edit, or delete existing markers on this scene.
                    </p>
                    {currentSceneHotspots.length > 0 ?
                      <>
                        <DevPanelFormGroup>
                          <ul className={devViewPanelManageListClassName}>
                            {currentSceneHotspots.map((hotspot) => {
                              const isMoving = movingHotspotId === hotspot.id;
                              const isEditing = editingHotspotId === hotspot.id;

                              return (
                                <li
                                  key={hotspot.id}
                                  className={`${devViewPanelManageListItemClassName}${isMoving || isEditing ? ` ${devViewPanelHotspotRowSelectedClassName}` : ''}`}
                                >
                                  <div
                                    className={
                                      devViewPanelManageListItemHeadClassName
                                    }
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
                                        {hotspotDisplayLabel(hotspot)}
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
                                        className={
                                          devViewPanelManageListItemIdClassName
                                        }
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
                                  <p
                                    className={devViewPanelSectionHintClassName}
                                  >
                                    {formatHotspotPosition(hotspot)}
                                  </p>
                                  <div className={devViewPanelActionsClassName}>
                                    {(
                                      hotspot.type === 'nav' &&
                                      hotspot.targetScene
                                    ) ?
                                      <button
                                        type='button'
                                        className={devViewPanelBtnVariants({
                                          tone: 'secondary',
                                        })}
                                        onClick={() =>
                                          openNavTargetScene(
                                            hotspot.targetScene!,
                                          )
                                        }
                                        disabled={
                                          hotspotManageStatus === 'working'
                                        }
                                      >
                                        Open
                                      </button>
                                    : null}
                                    <button
                                      type='button'
                                      className={devViewPanelBtnVariants({
                                        tone:
                                          isMoving ? 'primary' : 'secondary',
                                      })}
                                      onClick={() => {
                                        setEditingHotspotId(null);
                                        setMovingHotspotId(
                                          isMoving ? null : hotspot.id,
                                        );
                                      }}
                                      disabled={
                                        hotspotManageStatus === 'working'
                                      }
                                    >
                                      {isMoving ? 'Cancel move' : 'Move'}
                                    </button>
                                    <button
                                      type='button'
                                      className={devViewPanelBtnVariants({
                                        tone: 'secondary',
                                      })}
                                      onClick={() => startEditHotspot(hotspot)}
                                      disabled={
                                        hotspotManageStatus === 'working' ||
                                        isEditing
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type='button'
                                      className={devViewPanelBtnVariants({
                                        tone: 'danger',
                                      })}
                                      onClick={() =>
                                        void deleteHotspot(hotspot.id)
                                      }
                                      disabled={
                                        hotspotManageStatus === 'working'
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>

                                  {isEditing ?
                                    hotspot.type === 'nav' ?
                                      <DevPanelFormGroup inline manageEdit>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Label
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editNavLabel}
                                            onChange={(e) =>
                                              setEditNavLabel(e.target.value)
                                            }
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Target scene
                                          </span>
                                          <select
                                            className={
                                              devViewPanelSelectClassName
                                            }
                                            value={editNavTarget}
                                            onChange={(e) =>
                                              setEditNavTarget(e.target.value)
                                            }
                                          >
                                            <option value=''>
                                              Select scene…
                                            </option>
                                            {sortedSceneOptions.map((entry) => (
                                              <option
                                                key={entry.id}
                                                value={entry.id}
                                              >
                                                {entry.title} ({entry.id})
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                        <p
                                          className={
                                            devViewPanelSectionHintClassName
                                          }
                                        >
                                          Arrival camera uses the target scene
                                          landing view. Open the target scene,
                                          frame the shot, Apply landing view,
                                          then Save nav to copy it into{' '}
                                          <code>targetView</code>.
                                        </p>
                                        <label
                                          className={
                                            devViewPanelToggleLabelClassName
                                          }
                                        >
                                          <input
                                            className={
                                              devViewPanelToggleInputClassName
                                            }
                                            type='checkbox'
                                            checked={editNavInstant}
                                            onChange={(e) =>
                                              setEditNavInstant(
                                                e.target.checked,
                                              )
                                            }
                                          />
                                          <span
                                            className={
                                              devViewPanelToggleNameClassName
                                            }
                                          >
                                            Instant (skip preview card)
                                          </span>
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Preview image
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editNavPreviewImage}
                                            onChange={(e) =>
                                              setEditNavPreviewImage(
                                                e.target.value,
                                              )
                                            }
                                            placeholder='/assets/…/preview.jpg'
                                            spellCheck={false}
                                            autoComplete='off'
                                          />
                                        </label>
                                        <p
                                          className={
                                            devViewPanelSectionHintClassName
                                          }
                                        >
                                          Clear the field to remove{' '}
                                          <code>preview.image</code> and fall
                                          back to the target scene panorama.
                                        </p>
                                        <div
                                          className={
                                            devViewPanelActionsClassName
                                          }
                                        >
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'secondary',
                                            })}
                                            onClick={() =>
                                              setEditingHotspotId(null)
                                            }
                                            disabled={
                                              hotspotManageStatus === 'working'
                                            }
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'primary',
                                            })}
                                            onClick={() =>
                                              void saveHotspotEdit()
                                            }
                                            disabled={
                                              hotspotManageStatus === 'working'
                                            }
                                          >
                                            Save nav
                                          </button>
                                        </div>
                                      </DevPanelFormGroup>
                                    : isNamingInfoHotspot(hotspot) ?
                                      <DevPanelFormGroup inline manageEdit>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Title
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editNoTitle}
                                            onChange={(e) =>
                                              setEditNoTitle(e.target.value)
                                            }
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Price
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editNoPrice}
                                            onChange={(e) =>
                                              setEditNoPrice(e.target.value)
                                            }
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Status
                                          </span>
                                          <select
                                            className={
                                              devViewPanelSelectClassName
                                            }
                                            value={editNoStatus}
                                            onChange={(e) =>
                                              setEditNoStatus(
                                                e.target.value as
                                                  | NamingOpportunityStatus
                                                  | '',
                                              )
                                            }
                                          >
                                            <option value=''>
                                              Select status…
                                            </option>
                                            {DEV_NAMING_STATUS_OPTIONS.map(
                                              (option) => (
                                                <option
                                                  key={option.value}
                                                  value={option.value}
                                                >
                                                  {option.label}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Body
                                          </span>
                                          <textarea
                                            className={
                                              devViewPanelTextareaClassName
                                            }
                                            value={editNoBody}
                                            onChange={(e) =>
                                              setEditNoBody(e.target.value)
                                            }
                                            rows={3}
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Video URL (optional)
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='url'
                                            value={editNoVideoUrl}
                                            onChange={(e) =>
                                              setEditNoVideoUrl(e.target.value)
                                            }
                                            placeholder='https://youtube.com/… or Synthesia embed'
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Image path (optional)
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editNoImage}
                                            onChange={(e) =>
                                              setEditNoImage(e.target.value)
                                            }
                                            placeholder='/assets/…/photo.webp'
                                          />
                                        </label>
                                        <div
                                          className={
                                            devViewPanelActionsClassName
                                          }
                                        >
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'secondary',
                                            })}
                                            onClick={() =>
                                              setEditingHotspotId(null)
                                            }
                                            disabled={
                                              hotspotManageStatus === 'working'
                                            }
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'primary',
                                            })}
                                            onClick={() =>
                                              void saveHotspotEdit()
                                            }
                                            disabled={
                                              hotspotManageStatus ===
                                                'working' ||
                                              (!editNoTitle.trim() &&
                                                !editNoPrice.trim() &&
                                                !editNoStatus &&
                                                !editNoBody.trim() &&
                                                !editNoVideoUrl.trim() &&
                                                !editNoImage.trim())
                                            }
                                          >
                                            Save NO
                                          </button>
                                        </div>
                                      </DevPanelFormGroup>
                                    : <DevPanelFormGroup inline manageEdit>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Title
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editInfoTitle}
                                            onChange={(e) =>
                                              setEditInfoTitle(e.target.value)
                                            }
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Display
                                          </span>
                                          <select
                                            className={
                                              devViewPanelSelectClassName
                                            }
                                            value={editInfoDisplay}
                                            onChange={(e) =>
                                              setEditInfoDisplay(
                                                e.target.value as PopupDisplay,
                                              )
                                            }
                                          >
                                            {DEV_INFO_DISPLAY_OPTIONS.map(
                                              (option) => (
                                                <option
                                                  key={option.value}
                                                  value={option.value}
                                                >
                                                  {option.label}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Body
                                          </span>
                                          <textarea
                                            className={
                                              devViewPanelTextareaClassName
                                            }
                                            value={editInfoBody}
                                            onChange={(e) =>
                                              setEditInfoBody(e.target.value)
                                            }
                                            rows={3}
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Video URL (optional)
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='url'
                                            value={editInfoVideoUrl}
                                            onChange={(e) =>
                                              setEditInfoVideoUrl(
                                                e.target.value,
                                              )
                                            }
                                            placeholder='https://youtube.com/…'
                                          />
                                        </label>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Image path (optional)
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editInfoImage}
                                            onChange={(e) =>
                                              setEditInfoImage(e.target.value)
                                            }
                                            placeholder='/assets/…/photo.webp'
                                          />
                                        </label>
                                        <div
                                          className={
                                            devViewPanelActionsClassName
                                          }
                                        >
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'secondary',
                                            })}
                                            onClick={() =>
                                              setEditingHotspotId(null)
                                            }
                                            disabled={
                                              hotspotManageStatus === 'working'
                                            }
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'primary',
                                            })}
                                            onClick={() =>
                                              void saveHotspotEdit()
                                            }
                                            disabled={
                                              hotspotManageStatus ===
                                                'working' ||
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
                          {movingHotspotId ?
                            <>
                              <p className={devViewPanelCoordsClassName}>
                                click {markerCoords}
                              </p>
                              <div className={devViewPanelActionsClassName}>
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
                            </>
                          : null}
                          {hotspotManageError ?
                            <p className={devViewPanelSectionHintClassName}>
                              {hotspotManageError}
                            </p>
                          : null}
                        </DevPanelFormGroup>
                      </>
                    : <p className={devViewPanelTabHintClassName}>
                        No hotspots on this scene yet.
                      </p>
                    }
                  </>
                : <>
                    <p className={devViewPanelTabHintClassName}>
                      Add nav, naming opportunity, or info hotspots from a
                      panorama click.
                    </p>
                    <div className={devViewPanelTabPanelBodyClassName}>
                      <DevPanelTertiaryTabs
                        aria-label='Hotspot type'
                        value={hotspotTab}
                        onChange={setHotspotTab}
                        tabs={DEV_HOTSPOT_TABS.map((tab) => ({
                          id: tab.id,
                          label: tab.label,
                          kind: tab.id,
                          htmlId: `dev-hotspot-tab-${tab.id}`,
                          ariaControls: `dev-hotspot-panel-${tab.id}`,
                        }))}
                      />

                      {hotspotTab === 'nav' ?
                        <div
                          id='dev-hotspot-panel-nav'
                          role='tabpanel'
                          aria-labelledby='dev-hotspot-tab-nav'
                        >
                          <DevPanelFormGroup>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Marker position
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                readOnly
                                tabIndex={-1}
                                value={
                                  clickCoords ?
                                    formatViewPosition({
                                      ...clickCoords,
                                      zoom: 0,
                                    })
                                  : ''
                                }
                                placeholder='Click the panorama…'
                              />
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Click the panorama for marker position —
                              navigation to another scene.
                            </p>

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Name
                              </span>
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
                                  const nextId = e.target.value;
                                  setNavTargetSceneId(nextId);
                                  const matchedScene = sortedSceneOptions.find(
                                    (entry) => entry.id === nextId,
                                  );
                                  if (matchedScene) {
                                    setNavName(matchedScene.title);
                                  }
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

                            {navHotspotIdPreview ?
                              <p className={devViewPanelSlugPreviewClassName}>
                                id <code>{navHotspotIdPreview}</code>
                                {navHotspotIdPreview !== `nav-to-${navSlug}` ?
                                  <>
                                    {' '}
                                    · suffix added — name slug already used on
                                    this scene
                                  </>
                                : null}{' '}
                                · copies target <code>defaultView</code> on
                                create and save
                              </p>
                            : null}

                            <label className={devViewPanelToggleLabelClassName}>
                              <input
                                className={devViewPanelToggleInputClassName}
                                type='checkbox'
                                checked={navInstant}
                                onChange={(e) =>
                                  setNavInstant(e.target.checked)
                                }
                              />
                              <span className={devViewPanelToggleNameClassName}>
                                Instant (skip preview card)
                              </span>
                            </label>

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Preview image (optional)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={navPreviewImage}
                                onChange={(e) =>
                                  setNavPreviewImage(e.target.value)
                                }
                                placeholder='/assets/…/preview.jpg'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Overrides the nav preview card image. Leave empty
                              to use the target scene panorama.
                            </p>

                            <div className={devViewPanelActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => void createNavHotspot()}
                                disabled={
                                  !canCreateNav || navStatus === 'working'
                                }
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
                      : hotspotTab === 'naming' ?
                        <div
                          id='dev-hotspot-panel-naming'
                          role='tabpanel'
                          aria-labelledby='dev-hotspot-tab-naming'
                        >
                          <DevPanelFormGroup>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Marker position
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                readOnly
                                tabIndex={-1}
                                value={
                                  clickCoords ?
                                    formatViewPosition({
                                      ...clickCoords,
                                      zoom: 0,
                                    })
                                  : ''
                                }
                                placeholder='Click the panorama…'
                              />
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Click the panorama for marker position — naming
                              opportunity popup on this scene.
                            </p>

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Name
                              </span>
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
                              <span className={devViewPanelFieldLabelClassName}>
                                Body (optional)
                              </span>
                              <textarea
                                className={devViewPanelTextareaClassName}
                                value={noBody}
                                onChange={(e) => setNoBody(e.target.value)}
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
                                value={noVideoUrl}
                                onChange={(e) => setNoVideoUrl(e.target.value)}
                                placeholder='https://youtube.com/… or Synthesia embed'
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
                                    · suffix added — name slug already used on
                                    this scene
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
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
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
                      : <div
                          id='dev-hotspot-panel-info'
                          role='tabpanel'
                          aria-labelledby='dev-hotspot-tab-info'
                        >
                          <DevPanelFormGroup>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Marker position
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                readOnly
                                tabIndex={-1}
                                value={
                                  clickCoords ?
                                    formatViewPosition({
                                      ...clickCoords,
                                      zoom: 0,
                                    })
                                  : ''
                                }
                                placeholder='Click the panorama…'
                              />
                            </label>
                            <p className={devViewPanelSectionHintClassName}>
                              Click the panorama for marker position — general
                              info popup (not a naming opportunity).
                            </p>

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
                                onChange={(e) =>
                                  setInfoVideoUrl(e.target.value)
                                }
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

                            {infoHotspotIdPreview ?
                              <p className={devViewPanelSlugPreviewClassName}>
                                id <code>{infoHotspotIdPreview}</code>
                                {infoHotspotIdPreview !== `info-${infoSlug}` ?
                                  <>
                                    {' '}
                                    · suffix added — name slug already used on
                                    this scene
                                  </>
                                : null}
                              </p>
                            : null}

                            <div className={devViewPanelActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => void createInfoHotspotHandler()}
                                disabled={
                                  !canCreateInfo || infoStatus === 'working'
                                }
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
                      }
                    </div>
                  </>
                }
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
                      onClick={() => setTourModeTab(tab.id)}
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

                      <DevPanelFormSection title='Experience' divided>
                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Scene transition
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={editTransitionEffect}
                              onChange={(e) =>
                                setEditTransitionEffect(
                                  e.target.value as 'fade' | 'black',
                                )
                              }
                            >
                              <option value='fade'>Fade</option>
                              <option value='black'>Black</option>
                            </select>
                          </label>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Transition speed
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editTransitionSpeed}
                              onChange={(e) =>
                                setEditTransitionSpeed(e.target.value)
                              }
                              placeholder='500ms'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        </DevPanelFormRow>
                        <p className={devViewPanelSectionHintClassName}>
                          Applied when navigating between scenes in the panorama
                          viewer.
                        </p>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Immersive background (BGM)
                          </span>
                          <select
                            className={devViewPanelSelectClassName}
                            value={editImmersiveMode}
                            onChange={(e) =>
                              setEditImmersiveMode(
                                e.target.value as
                                  | 'platform'
                                  | 'manifest'
                                  | 'audio'
                                  | 'playlist',
                              )
                            }
                          >
                            <option value='platform'>
                              Platform default playlist
                            </option>
                            <option value='manifest'>
                              Playlist manifest JSON
                            </option>
                            <option value='audio'>Single audio track</option>
                            <option value='playlist'>
                              Inline playlist (one URL per line)
                            </option>
                          </select>
                        </label>

                        {editImmersiveMode === 'platform' ?
                          <p className={devViewPanelSectionHintClassName}>
                            Uses platform manifest{' '}
                            <code>{IMMERSIVE_PLAYLIST_MANIFEST}</code> — no{' '}
                            <code>immersiveBackground</code> in tour JSON.
                          </p>
                        : null}

                        {editImmersiveMode === 'manifest' ?
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Playlist manifest path
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editImmersivePlaylistManifest}
                              onChange={(e) =>
                                setEditImmersivePlaylistManifest(e.target.value)
                              }
                              placeholder={IMMERSIVE_PLAYLIST_MANIFEST}
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        : null}

                        {editImmersiveMode === 'audio' ?
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Audio path or URL
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editImmersiveAudio}
                              onChange={(e) =>
                                setEditImmersiveAudio(e.target.value)
                              }
                              placeholder='/assets/…/ambient.mp3'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        : null}

                        {editImmersiveMode === 'playlist' ?
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Playlist tracks
                            </span>
                            <textarea
                              className={devViewPanelInputClassName}
                              rows={4}
                              value={editImmersivePlaylistText}
                              onChange={(e) =>
                                setEditImmersivePlaylistText(e.target.value)
                              }
                              placeholder={
                                'https://…/track-a.mp3\nhttps://…/track-b.mp3'
                              }
                              spellCheck={false}
                            />
                          </label>
                        : null}

                        {editImmersiveMode !== 'platform' ?
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Volume (0–1)
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='number'
                              min='0'
                              max='1'
                              step='0.01'
                              value={editImmersiveVolume}
                              onChange={(e) =>
                                setEditImmersiveVolume(e.target.value)
                              }
                              placeholder='0.28'
                            />
                          </label>
                        : null}
                      </DevPanelFormSection>

                      <DevPanelFormSection
                        title='Client contact'
                        divided
                        description='Shared across all tours for this client — shown in tour chrome, share panel, and footer contact blocks.'
                      >
                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Website
                          </span>
                          <input
                            className={devViewPanelInputClassName}
                            type='url'
                            value={editTourWebsite}
                            onChange={(e) => setEditTourWebsite(e.target.value)}
                            placeholder='https://…'
                            spellCheck={false}
                            autoComplete='off'
                          />
                        </label>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Email
                          </span>
                          <input
                            className={devViewPanelInputClassName}
                            type='email'
                            value={editClientEmail}
                            onChange={(e) => setEditClientEmail(e.target.value)}
                            placeholder='info@example.org'
                            spellCheck={false}
                            autoComplete='off'
                          />
                        </label>

                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Phone
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editClientPhone}
                              onChange={(e) =>
                                setEditClientPhone(e.target.value)
                              }
                              placeholder='825-412-4130'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Phone label
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editClientPhoneLabel}
                              onChange={(e) =>
                                setEditClientPhoneLabel(e.target.value)
                              }
                              placeholder='Telephone'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        </DevPanelFormRow>

                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Fax
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editClientFax}
                              onChange={(e) => setEditClientFax(e.target.value)}
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Fax label
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={editClientFaxLabel}
                              onChange={(e) =>
                                setEditClientFaxLabel(e.target.value)
                              }
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        </DevPanelFormRow>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Address
                          </span>
                          <textarea
                            className={devViewPanelInputClassName}
                            rows={2}
                            value={editClientAddress}
                            onChange={(e) =>
                              setEditClientAddress(e.target.value)
                            }
                            placeholder='Street, city, province, postal code'
                            spellCheck={false}
                          />
                        </label>
                      </DevPanelFormSection>

                      <DevPanelFormSection title='Branding' divided>
                        <div className='flex flex-col gap-1'>
                          <div className={devViewPanelActionsClassName}>
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() => void suggestEditTourBranding()}
                              disabled={
                                !editTourWebsite.trim() ||
                                editTourSuggestStatus === 'working'
                              }
                            >
                              {editTourSuggestStatus === 'working' ?
                                'Suggesting…'
                              : 'Suggest from website'}
                            </button>
                          </div>
                          <p className={devViewPanelSectionHintClassName}>
                            Uses the Basics website URL to draft logo, favicon,
                            and primary color — review before saving.
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
                            onChange={(e) => setEditTourLogoAlt(e.target.value)}
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
                          Must be <code>https://fonts.googleapis.com/…</code>.
                          Clear both font fields to revert to platform defaults.
                        </p>

                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Logo (replace)
                            </span>
                            <input
                              className={devViewPanelFileInputClassName}
                              type='file'
                              accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                              onChange={(e) =>
                                setEditTourLogoFile(e.target.files?.[0] ?? null)
                              }
                            />
                            {editTourLogoPreviewUrl ?
                              <div
                                className={
                                  devViewPanelBrandPreviewWrapClassName
                                }
                              >
                                <img
                                  className={devViewPanelBrandLogoClassName}
                                  src={editTourLogoPreviewUrl}
                                  alt='Current logo preview'
                                />
                              </div>
                            : null}
                          </label>

                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Favicon (replace)
                            </span>
                            <input
                              className={devViewPanelFileInputClassName}
                              type='file'
                              accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                              onChange={(e) =>
                                setEditTourFaviconFile(
                                  e.target.files?.[0] ?? null,
                                )
                              }
                            />
                            {editTourFaviconPreviewUrl ?
                              <div
                                className={
                                  devViewPanelBrandFaviconWrapClassName
                                }
                              >
                                <img
                                  className={devViewPanelBrandFaviconClassName}
                                  src={editTourFaviconPreviewUrl}
                                  alt='Current favicon preview'
                                />
                              </div>
                            : null}
                          </label>
                        </DevPanelFormRow>

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

                    <div className='flex flex-col gap-2.5 rounded-md border border-[rgba(248,113,113,0.35)] bg-[rgba(69,10,10,0.35)] p-3'>
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
                      Create under an existing or new client.
                    </p>
                    <DevPanelTertiaryTabs
                      aria-label='New tour client'
                      value={newTourClientMode}
                      onChange={setNewTourClientMode}
                      tabs={DEV_NEW_TOUR_CLIENT_TABS.map((tab) => ({
                        id: tab.id,
                        label: tab.label,
                        kind: tab.id === 'existing' ? 'tour' : 'scene',
                      }))}
                    />

                    {newTourClientMode === 'existing' ?
                      <p className={devViewPanelTabHintClassName}>
                        Pick a client already in the catalog.
                      </p>
                    : <p className={devViewPanelTabHintClassName}>
                        New client — catalog display name and a unique client
                        id.
                      </p>
                    }

                    <DevPanelFormGroup stacked>
                      <DevPanelFormSection
                        title='Client'
                        description={
                          newTourClientMode === 'new' ?
                            'Catalog identity and contact details shown in tour chrome, share panel, and footer.'
                          : undefined
                        }
                      >
                        {newTourClientMode === 'existing' ?
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Client
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={newTourClientId}
                              onChange={(e) =>
                                setNewTourClientId(e.target.value)
                              }
                            >
                              {catalogClients.length === 0 ?
                                <option value=''>Loading clients…</option>
                              : catalogClients.map((client) => (
                                  <option key={client.id} value={client.id}>
                                    {client.name} ({client.id}) ·{' '}
                                    {client.tourCount} tour
                                    {client.tourCount === 1 ? '' : 's'}
                                  </option>
                                ))
                              }
                            </select>
                          </label>
                        : <>
                            <DevPanelFormRow>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Client name
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={newTourClientName}
                                  onChange={(e) =>
                                    setNewTourClientName(e.target.value)
                                  }
                                  placeholder='e.g. Example Foundation'
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                              </label>

                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Client id
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={newClientIdInput}
                                  onChange={(e) =>
                                    setNewClientIdInput(e.target.value)
                                  }
                                  placeholder='e.g. example-foundation'
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                              </label>
                            </DevPanelFormRow>

                            {newClientSlug ?
                              <p className={devViewPanelSlugPreviewClassName}>
                                client id <code>{newClientSlug}</code>
                              </p>
                            : null}

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Website
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='url'
                                value={newTourWebsite}
                                onChange={(e) =>
                                  setNewTourWebsite(e.target.value)
                                }
                                placeholder='https://…'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>

                            <div className='flex flex-col gap-1'>
                              <div className={devViewPanelActionsClassName}>
                                <button
                                  type='button'
                                  className={devViewPanelBtnVariants({
                                    tone: 'secondary',
                                  })}
                                  onClick={() => void suggestNewTourContact()}
                                  disabled={
                                    !newTourWebsite.trim() ||
                                    suggestContactStatus === 'working'
                                  }
                                >
                                  {suggestContactStatus === 'working' ?
                                    'Suggesting…'
                                  : 'Suggest from website'}
                                </button>
                              </div>
                              <p className={devViewPanelSectionHintClassName}>
                                Uses the client website URL to draft email,
                                phone, and address — review before creating.
                              </p>
                            </div>

                            {suggestContactNotes.length > 0 ?
                              <ul className={devViewPanelSectionHintClassName}>
                                {suggestContactNotes.map((note) => (
                                  <li key={note}>{note}</li>
                                ))}
                              </ul>
                            : null}

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Email
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='email'
                                value={newClientEmail}
                                onChange={(e) =>
                                  setNewClientEmail(e.target.value)
                                }
                                placeholder='info@example.org'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>

                            <DevPanelFormRow>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Phone
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={newClientPhone}
                                  onChange={(e) =>
                                    setNewClientPhone(e.target.value)
                                  }
                                  placeholder='825-412-4130'
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                              </label>
                              <label className={devViewPanelFieldClassName}>
                                <span
                                  className={devViewPanelFieldLabelClassName}
                                >
                                  Phone label
                                </span>
                                <input
                                  className={devViewPanelInputClassName}
                                  type='text'
                                  value={newClientPhoneLabel}
                                  onChange={(e) =>
                                    setNewClientPhoneLabel(e.target.value)
                                  }
                                  placeholder='Telephone'
                                  spellCheck={false}
                                  autoComplete='off'
                                />
                              </label>
                            </DevPanelFormRow>

                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Address
                              </span>
                              <textarea
                                className={devViewPanelTextareaClassName}
                                value={newClientAddress}
                                onChange={(e) =>
                                  setNewClientAddress(e.target.value)
                                }
                                placeholder='Street, city, province'
                                rows={2}
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                          </>
                        }
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

                        {newTourClientMode === 'existing' ?
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Website (optional)
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='url'
                              value={newTourWebsite}
                              onChange={(e) =>
                                setNewTourWebsite(e.target.value)
                              }
                              placeholder='https://…'
                              spellCheck={false}
                              autoComplete='off'
                            />
                          </label>
                        : null}
                      </DevPanelFormSection>

                      <DevPanelFormSection
                        title='Branding (optional)'
                        divided
                        description='Upload logo and favicon manually, or suggest drafts below — review before creating the tour.'
                      >
                        <div className='flex flex-col gap-1'>
                          <div className={devViewPanelActionsClassName}>
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() => void suggestNewTourBranding()}
                              disabled={
                                !newTourWebsite.trim() ||
                                suggestBrandingStatus === 'working'
                              }
                            >
                              {suggestBrandingStatus === 'working' ?
                                'Suggesting…'
                              : 'Suggest from website'}
                            </button>
                          </div>
                          <p className={devViewPanelSectionHintClassName}>
                            Uses the client website URL to draft logo, favicon,
                            and primary color.
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

                        <DevPanelFormRow>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Logo
                            </span>
                            <input
                              className={devViewPanelFileInputClassName}
                              type='file'
                              accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                              onChange={(e) =>
                                setNewTourLogoFile(e.target.files?.[0] ?? null)
                              }
                            />
                            {newTourLogoPreviewUrl ?
                              <div
                                className={
                                  devViewPanelBrandPreviewWrapClassName
                                }
                              >
                                <img
                                  className={devViewPanelBrandLogoClassName}
                                  src={newTourLogoPreviewUrl}
                                  alt='Logo preview'
                                />
                              </div>
                            : null}
                          </label>

                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Favicon (optional)
                            </span>
                            <input
                              className={devViewPanelFileInputClassName}
                              type='file'
                              accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                              onChange={(e) =>
                                setNewTourFaviconFile(
                                  e.target.files?.[0] ?? null,
                                )
                              }
                            />
                            {newTourFaviconPreviewUrl ?
                              <div
                                className={
                                  devViewPanelBrandFaviconWrapClassName
                                }
                              >
                                <img
                                  className={devViewPanelBrandFaviconClassName}
                                  src={newTourFaviconPreviewUrl}
                                  alt='Favicon preview'
                                />
                              </div>
                            : null}
                            <p className={devViewPanelSectionHintClassName}>
                              If omitted, a 32×32 favicon is generated from the
                              logo on create.
                            </p>
                          </label>
                        </DevPanelFormRow>
                      </DevPanelFormSection>

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
                          <input
                            className={devViewPanelFileInputClassName}
                            type='file'
                            accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                            onChange={(e) =>
                              setNewTourPanoramaFile(
                                e.target.files?.[0] ?? null,
                              )
                            }
                          />
                        </label>

                        {newTourSlug && newFirstSceneSlug ?
                          <p className={devViewPanelSlugPreviewClassName}>
                            tour <code>{newTourSlug}</code> · scene{' '}
                            <code>{newFirstSceneSlug}</code> ·{' '}
                            <code>
                              assets/
                              {newTourClientMode === 'existing' ?
                                newTourClientId
                              : newClientSlug || '…'}
                              /{newTourSlug}/panoramas/{newFirstSceneSlug}.webp
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
                    <input
                      className={devViewPanelFileInputClassName}
                      type='file'
                      accept='image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp'
                      onChange={(e) =>
                        setFloorPlanFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {floorPlanPreviewUrl ?
                      <div className={devViewPanelBrandPreviewWrapClassName}>
                        <img
                          className={devViewPanelBrandLogoClassName}
                          src={floorPlanPreviewUrl}
                          alt='Floor plan preview'
                        />
                      </div>
                    : null}
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
                        className={devViewPanelBtnVariants({ tone: 'danger' })}
                        onClick={() => void clearFloorPlan()}
                        disabled={floorPlanStatus === 'working'}
                      >
                        Remove floor plan
                      </button>
                    : null}
                  </div>
                </DevPanelFormGroup>
              </DevPanelSection>

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

                      <div className={devViewPanelActionsClassName}>
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

              <DevPanelSection
                title='Scenes'
                description='Open and edit tour scenes, or upload a new panorama.'
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
                    {tourScenes.length > 0 ?
                      <>
                        <DevPanelFormGroup>
                          <ul className={devViewPanelManageListClassName}>
                            {tourScenes.map((entry) => {
                              const isCurrent = entry.id === scene.id;
                              const isFirst = entry.id === tour.firstScene;
                              const isEditing = editingSceneId === entry.id;
                              const canDelete = entry.id !== tour.firstScene;

                              return (
                                <li
                                  key={entry.id}
                                  className={`${devViewPanelManageListItemClassName}${isEditing || isCurrent ? ` ${devViewPanelHotspotRowSelectedClassName}` : ''}`}
                                >
                                  <div
                                    className={
                                      devViewPanelManageListItemHeadClassName
                                    }
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
                                      <code
                                        className={
                                          devViewPanelManageListItemIdClassName
                                        }
                                      >
                                        {entry.id}
                                      </code>
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
                                            className={devSceneManageBadgeVariants(
                                              { kind: 'first' },
                                            )}
                                          >
                                            First
                                          </Badge>
                                        : null}
                                        {isCurrent ?
                                          <Badge
                                            variant='fill'
                                            size='sm'
                                            tone='none'
                                            className={devSceneManageBadgeVariants(
                                              { kind: 'current' },
                                            )}
                                          >
                                            Current
                                          </Badge>
                                        : null}
                                      </div>
                                    : null}
                                  </div>
                                  {entry.description ?
                                    <p
                                      className={
                                        devViewPanelSectionHintClassName
                                      }
                                    >
                                      {entry.description}
                                    </p>
                                  : null}
                                  <div className={devViewPanelActionsClassName}>
                                    <button
                                      type='button'
                                      className={devViewPanelBtnVariants({
                                        tone: 'secondary',
                                      })}
                                      onClick={() =>
                                        void openTourScene(entry.id)
                                      }
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
                                        sceneManageStatus === 'working' ||
                                        isEditing
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type='button'
                                      className={devViewPanelBtnVariants({
                                        tone: 'danger',
                                      })}
                                      onClick={() =>
                                        void deleteTourScene(entry.id)
                                      }
                                      disabled={
                                        !canDelete ||
                                        sceneManageStatus === 'working'
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>

                                  {isEditing ?
                                    <DevPanelFormGroup inline manageEdit>
                                      <label
                                        className={devViewPanelFieldClassName}
                                      >
                                        <span
                                          className={
                                            devViewPanelFieldLabelClassName
                                          }
                                        >
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
                                      <label
                                        className={devViewPanelFieldClassName}
                                      >
                                        <span
                                          className={
                                            devViewPanelFieldLabelClassName
                                          }
                                        >
                                          Description
                                        </span>
                                        <textarea
                                          className={
                                            devViewPanelTextareaClassName
                                          }
                                          value={editSceneDescription}
                                          onChange={(e) =>
                                            setEditSceneDescription(
                                              e.target.value,
                                            )
                                          }
                                          rows={2}
                                          placeholder='Optional — leave empty to remove'
                                        />
                                      </label>
                                      <div
                                        className={
                                          devViewPanelToggleListClassName
                                        }
                                      >
                                        {!isFirst ?
                                          <label
                                            className={
                                              devViewPanelToggleLabelClassName
                                            }
                                          >
                                            <input
                                              type='checkbox'
                                              className={
                                                devViewPanelToggleInputClassName
                                              }
                                              checked={editSceneAsFirst}
                                              onChange={(e) =>
                                                setEditSceneAsFirst(
                                                  e.currentTarget.checked,
                                                )
                                              }
                                            />
                                            <span
                                              className={
                                                devViewPanelToggleTextClassName
                                              }
                                            >
                                              Set as firstScene
                                            </span>
                                          </label>
                                        : null}
                                        <label
                                          className={
                                            devViewPanelToggleLabelClassName
                                          }
                                        >
                                          <input
                                            type='checkbox'
                                            className={
                                              devViewPanelToggleInputClassName
                                            }
                                            checked={editSceneMapEnabled}
                                            onChange={(e) =>
                                              setEditSceneMapEnabled(
                                                e.currentTarget.checked,
                                              )
                                            }
                                          />
                                          <span
                                            className={
                                              devViewPanelToggleTextClassName
                                            }
                                          >
                                            Floor plan map position
                                          </span>
                                        </label>
                                      </div>
                                      {editSceneMapEnabled ?
                                        <DevPanelFormRow cols={3}>
                                          <label
                                            className={
                                              devViewPanelFieldClassName
                                            }
                                          >
                                            <span
                                              className={
                                                devViewPanelFieldLabelClassName
                                              }
                                            >
                                              Map X (0–1)
                                            </span>
                                            <input
                                              className={
                                                devViewPanelInputClassName
                                              }
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
                                          <label
                                            className={
                                              devViewPanelFieldClassName
                                            }
                                          >
                                            <span
                                              className={
                                                devViewPanelFieldLabelClassName
                                              }
                                            >
                                              Map Y (0–1)
                                            </span>
                                            <input
                                              className={
                                                devViewPanelInputClassName
                                              }
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
                                          <label
                                            className={
                                              devViewPanelFieldClassName
                                            }
                                          >
                                            <span
                                              className={
                                                devViewPanelFieldLabelClassName
                                              }
                                            >
                                              Map heading (°)
                                            </span>
                                            <input
                                              className={
                                                devViewPanelInputClassName
                                              }
                                              type='number'
                                              step='0.1'
                                              value={editSceneMapHeading}
                                              onChange={(e) =>
                                                setEditSceneMapHeading(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          </label>
                                        </DevPanelFormRow>
                                      : null}
                                      <div
                                        className={devViewPanelActionsClassName}
                                      >
                                        <button
                                          type='button'
                                          className={devViewPanelBtnVariants({
                                            tone: 'secondary',
                                          })}
                                          onClick={() =>
                                            setEditingSceneId(null)
                                          }
                                          disabled={
                                            sceneManageStatus === 'working'
                                          }
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
                          {sceneManageError ?
                            <p className={devViewPanelSectionHintClassName}>
                              {sceneManageError}
                            </p>
                          : null}
                        </DevPanelFormGroup>
                      </>
                    : <p className={devViewPanelTabHintClassName}>
                        No scenes on this tour yet.
                      </p>
                    }
                  </>
                : <>
                    <p className={devViewPanelTabHintClassName}>
                      Upload a panorama — title becomes scene id, image converts
                      to{' '}
                      <code>
                        assets/&lt;client&gt;/{currentTourId}
                        /panoramas/&lt;id&gt;.webp
                      </code>{' '}
                      automatically.
                    </p>
                    <DevPanelFormGroup>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Title
                        </span>
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
                          Panorama file
                        </span>
                        <input
                          className={devViewPanelFileInputClassName}
                          type='file'
                          accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                          onChange={(e) =>
                            setScenePanoramaFile(e.target.files?.[0] ?? null)
                          }
                        />
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

                      {sceneSlug ?
                        <p className={devViewPanelSlugPreviewClassName}>
                          id <code>{sceneSlug}</code> ·{' '}
                          <code>
                            {buildDefaultPanoramaRelativePath(sceneSlug)}
                          </code>
                          {view ?
                            <> · defaultView {formatViewPosition(view)}</>
                          : ' · defaultView 0, 0, 17'}
                        </p>
                      : null}
                      {scenePanoramaAutoPath ?
                        <p className={devViewPanelSectionHintClassName}>
                          saves to <code>{scenePanoramaAutoPath}</code>
                        </p>
                      : null}

                      {sceneError ?
                        <p className={devViewPanelSectionHintClassName}>
                          {sceneError}
                        </p>
                      : null}

                      <div className={devViewPanelActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'primary',
                          })}
                          onClick={() => void createScene()}
                          disabled={
                            !canCreateScene || sceneStatus === 'working'
                          }
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
                <ul className={devViewPanelToggleListClassName}>
                  {DEV_URL_FLAG_TOGGLES.map((toggle) => {
                    const checked = toggle.isOn(appSearchParams);

                    return (
                      <li key={toggle.key}>
                        <label
                          className={devViewPanelToggleLabelMultilineClassName}
                        >
                          <input
                            type='checkbox'
                            className={devViewPanelToggleInputClassName}
                            checked={checked}
                            onChange={(event) =>
                              setDevUrlFlag(toggle, event.currentTarget.checked)
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
              </DevPanelSection>
            </DevPanelSectionAccordion>
          </div>
        }
      </div>
    </div>
  );
}
