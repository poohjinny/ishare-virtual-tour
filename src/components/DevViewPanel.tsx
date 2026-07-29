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
  DEV_ASK_GUIDE_FLAG_TOGGLES,
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
  listCatalogClients,
  resolveCatalogTourVisibility,
} from '../data/tourCatalog';
import {
  buildTourLocation,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../utils/tourPaths';
import { TOUR_PUBLIC_ORIGIN } from '../constants/tourOrigin';
import { copyToClipboard } from '../utils/clipboard';
import { getTourClientId } from '../utils/tourClientId';
import { appendCacheBust, withBaseUrl } from '../utils/assetUrl';
import {
  resolveTourBranding,
  tourUsesCustomBranding,
} from '../utils/resolveTourBranding';
import { getTourProductFullName } from '../utils/tourProductName';
import { resolveSceneVisibility } from '../utils/sceneVisibility';
import { resolveNamingVisibility } from '../utils/namingVisibility';
import {
  formatNamingPriceInput,
  parseNamingPriceInput,
} from '../utils/namingPrice';
import {
  DEV_HOTSPOT_MANAGE_FILTER_TABS,
  DEV_INFO_DISPLAY_OPTIONS,
  DEV_NAMING_DONOR_KIND_OPTIONS,
  DEV_NAMING_MANAGE_FILTER_TABS,
  DEV_NAMING_STATUS_OPTIONS,
  type DevHotspotManageFilter,
  type DevHotspotTab,
  type DevNamingManageFilter,
  getDevHotspotSectionConfig,
  getDevNamingCatalogSectionConfig,
  type DevHotspotManageScope,
} from '../constants/devHotspot';
import {
  namingOpportunityStatusConfig,
  namingOpportunityStatusShowsBadge,
  resolveNamingOpportunityStatus,
} from '../data/namingOpportunityStatus';
import {
  NAV_HOTSPOT_VARIANT_DEFAULT,
  NAV_HOTSPOT_VARIANT_OPTIONS,
  resolveNavHotspotVariant,
  serializeNavHotspotVariant,
} from '../constants/navHotspotVariant';
import {
  DEV_PANEL_TABS,
  DEV_CATALOG_VISIBILITY_OPTIONS,
  DEV_SCENE_VISIBILITY_OPTIONS,
  type DevCatalogTourVisibility,
  type DevPanelTab,
} from '../constants/devPanel';
import type { TourCategory } from '../constants/tourCategories';
import type {
  Hotspot,
  NamingDonorKind,
  NamingOpportunityStatus,
  NavHotspotVariant,
  PopupDisplay,
  Scene,
  Tour,
  ViewPosition,
} from '../types/tour';
import { isWorldPosition } from '../types/tour';
import { normalizeNamingDonor } from '../utils/namingDonor';
import {
  isNamingHotspot,
  resolveHotspotHostScene,
  resolveNamingPopup,
} from '../utils/namingSceneInherit';
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
  allocateOpaqueId,
  createOpaqueId,
  OPAQUE_SCENE_ID_PREFIX,
  OPAQUE_TOUR_ID_PREFIX,
} from '../utils/opaqueId';
import {
  DevTourApiError,
  devApplySceneDefaultView,
  devCreateInfoHotspot,
  devCreatePlaceOverviewHotspot,
  devCreateNamingHotspot,
  devCreateNamingOpportunity,
  devCreateNavHotspot,
  devCreateScene,
  devCreateTour,
  devDeleteHotspot,
  devDeleteScene,
  devDeleteTour,
  devFetchTour,
  refreshDevCatalogSnapshot,
  devFetchCatalogClients,
  devFetchTourRecord,
  devBase64ToImageFile,
  devReplaceScenePanorama,
  devSuggestBranding,
  devUpdateHotspotPosition,
  devUpdateInfoHotspot,
  devUpdateNavHotspot,
  devUpdateNamingHotspot,
  devUpdateScene,
  devUpdateTour,
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
  findHotspotInTour,
  findNamingHotspotByNamingId,
  listAllTourHotspotIds,
} from '../utils/findTourHotspot';
import { buildScenePlaceLeadFromNaming } from '../utils/resolveScenePlaceLead';
import { isPlaceOverviewHotspot } from '../utils/placeOverview';
import { isDefaultSceneDescription } from '../utils/sceneDescriptionPlaceholder';
import { TOUR_DIRECTORY_GROUP_OTHER } from '../constants/tourDirectory';
import {
  buildSceneGroups,
  buildSceneGroupSecondaryById,
  sceneIdsWithTitleCollisions,
} from '../viewer/sceneDepth';
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
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelStickyHeaderClassName,
  devViewPanelStickyTourLogoClassName,
  devViewPanelStickyTourLogoWrapClassName,
  devViewPanelStickyTourTitleClassName,
  devViewPanelFormGroupTitleClassName,
  devViewPanelPrimaryTabsClassName,
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
  devViewPanelStackedFormFooterClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemCopyClassName,
  devViewPanelManageListItemDescClassName,
  devViewPanelManageListItemHeadClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemLogoClassName,
  devViewPanelManageListItemLogoWrapClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelManageListItemBulletClassName,
  devViewPanelManageListItemIdClassName,
  devViewPanelManageListItemMetaClassName,
  devViewPanelManageListItemStackActionsClassName,
  devViewPanelManageListItemTextStackClassName,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemBadgesClassName,
  devViewPanelManageListItemSceneBadgesClassName,
  devViewPanelManageListItemTourBadgesStackClassName,
  devNamingManageStatusBadgeClassName,
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
  openNamingOpportunity?: (sceneId: string, hotspotId: string) => void;
  onClose?: () => void;
}

type ActionStatus = 'idle' | 'working' | 'done' | 'error';

function isNamingInfoHotspot(hotspot: Hotspot): boolean {
  return isNamingHotspot(hotspot);
}

function buildDevNamingDonorPayload(options: {
  status: NamingOpportunityStatus | '';
  name: string;
  kind: NamingDonorKind;
  affiliation: string;
  website: string;
}) {
  if (options.status !== 'sold') return null;
  return normalizeNamingDonor(
    {
      name: options.name,
      kind: options.kind,
      affiliation: options.affiliation,
      website: options.website,
    },
    { status: 'sold' },
  );
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

function hotspotDisplayLabel(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene | null,
): string {
  if (hotspot.type === 'nav') return resolveNavHotspotLabel(hotspot, tour);
  if (isPlaceOverviewHotspot(hotspot)) {
    const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
    return (
      scene?.title?.trim() || hotspot.popup?.title?.trim() || 'Place overview'
    );
  }
  if (isNamingInfoHotspot(hotspot)) {
    const found = findHotspotInTour(tour, hotspot.id);
    const scene =
      resolveHotspotHostScene(tour, hotspot, hostScene) ??
      (found?.sceneId ? tour.scenes[found.sceneId] : undefined);
    const resolved = resolveNamingPopup(tour, hotspot, scene);
    return (
      resolved?.namingOpportunity?.name?.trim() ||
      resolved?.title?.trim() ||
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
  openNamingOpportunity,
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
  const [catalogEditNamingId, setCatalogEditNamingId] = useState<string | null>(
    null,
  );
  const [catalogEditName, setCatalogEditName] = useState('');
  const [catalogEditPrice, setCatalogEditPrice] = useState('');
  const [catalogEditStatus, setCatalogEditStatus] = useState<
    NamingOpportunityStatus | ''
  >('');
  const [catalogEditVisibility, setCatalogEditVisibility] =
    useState<DevCatalogTourVisibility>('public');
  const [catalogEditBody, setCatalogEditBody] = useState('');
  const [catalogEditVideoUrl, setCatalogEditVideoUrl] = useState('');
  const [catalogEditImage, setCatalogEditImage] = useState('');
  const [catalogEditDonorName, setCatalogEditDonorName] = useState('');
  const [catalogEditDonorKind, setCatalogEditDonorKind] =
    useState<NamingDonorKind>('organization');
  const [catalogEditDonorAffiliation, setCatalogEditDonorAffiliation] =
    useState('');
  const [catalogEditDonorWebsite, setCatalogEditDonorWebsite] = useState('');
  const [catalogEditDonorLogoFile, setCatalogEditDonorLogoFile] =
    useState<File | null>(null);
  const [catalogEditDonorLogoPath, setCatalogEditDonorLogoPath] = useState('');
  const [catalogEditClearDonorLogo, setCatalogEditClearDonorLogo] =
    useState(false);
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
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneTitle, setEditSceneTitle] = useState('');
  const [editSceneDescription, setEditSceneDescription] = useState('');
  const [editScenePreviewVideoUrl, setEditScenePreviewVideoUrl] = useState('');
  const [editSceneVideoUrl, setEditSceneVideoUrl] = useState('');
  const [editSceneVisibility, setEditSceneVisibility] =
    useState<DevCatalogTourVisibility>('public');
  const [editSceneAsFirst, setEditSceneAsFirst] = useState(false);
  const [sceneManageStatus, setSceneManageStatus] =
    useState<ActionStatus>('idle');
  const [sceneManageError, setSceneManageError] = useState<string | null>(null);
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);
  const [tourLinkCopyState, setTourLinkCopyState] = useState<{
    id: string;
    status: 'copied' | 'failed';
  } | null>(null);
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
  const [replacePanoramaFile, setReplacePanoramaFile] = useState<File | null>(
    null,
  );
  const [replacePanoramaStatus, setReplacePanoramaStatus] =
    useState<ActionStatus>('idle');
  const [replacePanoramaError, setReplacePanoramaError] = useState<
    string | null
  >(null);

  const [sceneManageFilter, setSceneManageFilter] = useState('all');

  const tourScenes = useMemo(
    () =>
      Object.values(tour.scenes).sort((a, b) => a.title.localeCompare(b.title)),
    [tour.scenes],
  );

  /** Dev Manage secondary — floor / department title only (not scene id). */
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
  const sceneManageGroups = useMemo(
    () =>
      buildSceneGroups(
        tour,
        tour.scenes,
        tour.firstScene,
        TOUR_DIRECTORY_GROUP_OTHER,
      ),
    [tour],
  );
  const filteredTourScenes = useMemo(() => {
    if (sceneManageFilter === 'all') return tourScenes;
    const group = sceneManageGroups.find(
      (entry) => entry.id === sceneManageFilter,
    );
    if (!group) return tourScenes;
    return [...group.scenes].sort((a, b) => a.title.localeCompare(b.title));
  }, [sceneManageFilter, sceneManageGroups, tourScenes]);

  useEffect(() => {
    if (sceneManageFilter === 'all') return;
    if (sceneManageGroups.some((group) => group.id === sceneManageFilter)) {
      return;
    }
    setSceneManageFilter('all');
  }, [sceneManageFilter, sceneManageGroups]);

  const collidingSceneTitleIds = useMemo(
    () => sceneIdsWithTitleCollisions(tourScenes),
    [tourScenes],
  );

  const [sceneTitle, setSceneTitle] = useState(() =>
    readSessionValue(DEV_SCENE_TITLE_STORAGE_KEY),
  );
  const [scenePanoramaFile, setScenePanoramaFile] = useState<File | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [sceneCreatePlaceOverview, setSceneCreatePlaceOverview] =
    useState(false);
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
  const [noVisibility, setNoVisibility] =
    useState<DevCatalogTourVisibility>('public');
  const [noDonorName, setNoDonorName] = useState('');
  const [noDonorKind, setNoDonorKind] =
    useState<NamingDonorKind>('organization');
  const [noDonorAffiliation, setNoDonorAffiliation] = useState('');
  const [noDonorWebsite, setNoDonorWebsite] = useState('');
  const [noDonorLogoFile, setNoDonorLogoFile] = useState<File | null>(null);
  const [noBody, setNoBody] = useState('');
  const [noVideoUrl, setNoVideoUrl] = useState('');
  const [noImage, setNoImage] = useState('');
  const [selectedNamingId, setSelectedNamingId] = useState('');
  const [namingCatalogStatus, setNamingCatalogStatus] =
    useState<ActionStatus>('idle');
  const [namingCatalogError, setNamingCatalogError] = useState<string | null>(
    null,
  );
  const [namingCatalogCreateOpen, setNamingCatalogCreateOpen] = useState(false);
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
  const [panelTab, setPanelTab] = useState<DevPanelTab>('scene');
  const [hotspotCreateOpen, setHotspotCreateOpen] = useState(false);
  const [sceneCreateOpen, setSceneCreateOpen] = useState(false);
  const [pendingSceneId, setPendingSceneId] = useState(() =>
    createOpaqueId(OPAQUE_SCENE_ID_PREFIX),
  );
  const [pendingTourId, setPendingTourId] = useState(() =>
    createOpaqueId(OPAQUE_TOUR_ID_PREFIX),
  );
  const [pendingFirstSceneId, setPendingFirstSceneId] = useState(() =>
    createOpaqueId(OPAQUE_SCENE_ID_PREFIX),
  );
  const [pendingNavTargetSceneId, setPendingNavTargetSceneId] = useState(() =>
    createOpaqueId(OPAQUE_SCENE_ID_PREFIX),
  );
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
  const [hotspotManageFilter, setHotspotManageFilter] =
    useState<DevHotspotManageFilter>('all');
  const [namingManageFilter, setNamingManageFilter] =
    useState<DevNamingManageFilter>('all');

  const hotspotManageScope = useMemo((): DevHotspotManageScope => {
    return isModel3dTour ? 'model3d-tour' : 'panorama-scene';
  }, [isModel3dTour]);

  const hotspotSectionConfig = useMemo(
    () => getDevHotspotSectionConfig(hotspotManageScope),
    [hotspotManageScope],
  );

  const namingCatalogSectionConfig = useMemo(
    () => getDevNamingCatalogSectionConfig(hotspotManageScope),
    [hotspotManageScope],
  );

  const managedHotspots = useMemo(() => {
    const hostScene = tour.scenes[scene.id];
    if (isModel3dTour) {
      const fromTour = (tour.hotspots ?? []).filter(
        (hotspot) => !hotspot.sceneId || hotspot.sceneId === scene.id,
      );
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

  const filteredNamingCatalogRows = useMemo(() => {
    if (namingManageFilter === 'all') return namingCatalogRows;
    return namingCatalogRows.filter(
      (row) =>
        resolveNamingOpportunityStatus(row.record.status) ===
        namingManageFilter,
    );
  }, [namingCatalogRows, namingManageFilter]);

  const showHotspotDevPanel = panelTab === 'scene';
  const showNamingCatalogPanel = panelTab === 'naming';

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
  const infoHotspotIdPreview = useMemo(
    () =>
      infoSlug ? previewHotspotId(existingHotspotIds, `info-${infoSlug}`) : '',
    [existingHotspotIds, infoSlug],
  );
  const trimmedSceneTitle = sceneTitle.trim();
  const sceneSlug = pendingSceneId;
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
  const currentClientId = useMemo(() => getTourClientId(tour), [tour]);
  const catalogTourManageRows = useMemo(() => {
    return listCatalogClients()
      .flatMap((client) =>
        client.tours.map((entry) => {
          const loaded = tryLoadTour(entry.id);
          const branding =
            loaded ? resolveTourBranding(loaded) : client.branding;
          return {
            id: entry.id,
            title: entry.name,
            clientId: client.id,
            clientName: client.name,
            category: entry.category,
            visibility: resolveCatalogTourVisibility(entry),
            featured: entry.featured ?? false,
            logoPath:
              branding?.logo?.trim() || client.branding?.logo?.trim() || '',
          };
        }),
      )
      .sort((a, b) => {
        const byClient = a.clientName.localeCompare(b.clientName, 'en');
        if (byClient !== 0) return byClient;
        return a.title.localeCompare(b.title, 'en');
      });
  }, [catalogTick]);
  const [tourManageClientFilter, setTourManageClientFilter] = useState('all');
  const tourManageClientGroups = useMemo(() => {
    const byClient = new Map<
      string,
      { id: string; title: string; count: number }
    >();
    for (const row of catalogTourManageRows) {
      const existing = byClient.get(row.clientId);
      if (existing) {
        existing.count += 1;
        continue;
      }
      byClient.set(row.clientId, {
        id: row.clientId,
        title: row.clientName,
        count: 1,
      });
    }
    return [...byClient.values()].sort((a, b) =>
      a.title.localeCompare(b.title, 'en'),
    );
  }, [catalogTourManageRows]);
  const filteredCatalogTourManageRows = useMemo(() => {
    if (tourManageClientFilter === 'all') return catalogTourManageRows;
    return catalogTourManageRows.filter(
      (row) => row.clientId === tourManageClientFilter,
    );
  }, [catalogTourManageRows, tourManageClientFilter]);
  useEffect(() => {
    if (tourManageClientFilter === 'all') return;
    if (
      tourManageClientGroups.some(
        (group) => group.id === tourManageClientFilter,
      )
    ) {
      return;
    }
    setTourManageClientFilter('all');
  }, [tourManageClientFilter, tourManageClientGroups]);
  const newTourSlug = useMemo(() => {
    const manual = newTourIdInput.trim();
    if (!manual) return pendingTourId;
    return slugifyHotspotName(manual) || pendingTourId;
  }, [newTourIdInput, pendingTourId]);
  const newFirstSceneSlug = pendingFirstSceneId;

  const canCreateNav = Boolean(scene.tourId && clickCoords && navTargetSceneId);
  const canCreateNaming = Boolean(
    scene.tourId && clickCoords && selectedNamingId.trim(),
  );
  const canCreateNamingCatalog = Boolean(
    scene.tourId && parseNamingPriceInput(noPrice) != null && noStatus,
  );
  const canCreateInfo = Boolean(scene.tourId && clickCoords && trimmedInfoName);
  const canCreateOverview = Boolean(
    scene.tourId && clickCoords && !isModel3dTour && !sceneHasPlaceOverview,
  );
  const canCreateScene = Boolean(
    scene.tourId &&
    trimmedSceneTitle &&
    (isModel3dTour ? view : scenePanoramaFile),
  );
  const canCreateNewTour = Boolean(
    trimmedNewTourTitle &&
    newFirstSceneTitle.trim() &&
    newTourSlug &&
    newFirstSceneSlug &&
    newTourPanoramaFile &&
    newTourClientId,
  );

  const mintCreateSceneId = useCallback(() => {
    setPendingSceneId(
      allocateOpaqueId(OPAQUE_SCENE_ID_PREFIX, Object.keys(tour.scenes)),
    );
  }, [tour.scenes]);

  const mintNavTargetSceneId = useCallback(() => {
    setPendingNavTargetSceneId(
      allocateOpaqueId(OPAQUE_SCENE_ID_PREFIX, Object.keys(tour.scenes)),
    );
  }, [tour.scenes]);

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
    const takenTours = listRoutableTourIds();
    setPendingTourId(allocateOpaqueId(OPAQUE_TOUR_ID_PREFIX, takenTours));
    setPendingFirstSceneId(createOpaqueId(OPAQUE_SCENE_ID_PREFIX));
  }, []);

  const openCreateTourTab = useCallback(
    (preferredClientId?: string) => {
      resetNewTourForm(preferredClientId);
      setEditingTourId(null);
      setDeletingTourId(null);
      setDeleteTourConfirm('');
      setTourCreateOpen(true);
    },
    [resetNewTourForm],
  );

  const openCreateHotspotTab = useCallback(() => {
    setEditingHotspotId(null);
    setMovingHotspotId(null);
    setCatalogEditNamingId(null);
    setHotspotTab(hotspotSectionConfig.createTabs[0]?.id ?? 'nav');
    setHotspotCreateOpen(true);
  }, [hotspotSectionConfig.createTabs]);

  const openCreateNamingTab = useCallback(() => {
    setEditingHotspotId(null);
    setMovingHotspotId(null);
    setCatalogEditNamingId(null);
    setNamingCatalogCreateOpen(true);
    setNamingCatalogError(null);
    setNamingCatalogStatus('idle');
  }, []);

  const openCreateSceneTab = useCallback(() => {
    setEditingSceneId(null);
    mintCreateSceneId();
    setSceneCreateOpen(true);
  }, [mintCreateSceneId]);

  const canSaveEditTour = Boolean(editTourTitle.trim() && editTourCategory);
  const editingTourSource = useMemo(() => {
    if (!editingTourId) return tour;
    if (editingTourId === tour.id) return tour;
    return tryLoadTour(editingTourId) ?? tour;
  }, [editingTourId, tour, catalogTick]);
  const editTourProductNamePreview = useMemo(
    () =>
      getTourProductFullName({
        ...editingTourSource,
        title: editTourTitle.trim() || editingTourSource.title,
        productFullName: editTourProductFullName.trim() || undefined,
      }),
    [editTourProductFullName, editTourTitle, editingTourSource],
  );
  const canDeleteTour = Boolean(
    deletingTourId && deleteTourConfirm.trim() === deletingTourId,
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
  }, [panelTab, tour, catalogTick]);

  useEffect(() => {
    if (!editingTourId) return;

    const targetId = editingTourId;
    const loaded =
      targetId === tour.id ? tour : (tryLoadTour(targetId) ?? null);
    let clientId = loaded ? getTourClientId(loaded) : '';
    let catalogEntry =
      clientId ? findCatalogTour(clientId, targetId) : undefined;
    if (!catalogEntry) {
      for (const client of listCatalogClients()) {
        const entry = client.tours.find((item) => item.id === targetId);
        if (entry) {
          clientId = client.id;
          catalogEntry = entry;
          break;
        }
      }
    }
    const catalogClient = findCatalogClient(clientId);

    setEditTourTitle(loaded?.title ?? catalogEntry?.name ?? '');
    setEditTourSummary(catalogEntry?.summary ?? '');
    setEditTourCategory(
      (loaded?.category as TourCategory | undefined) ??
        catalogEntry?.category ??
        'Healthcare',
    );
    setEditTourVisibility(
      catalogEntry ? resolveCatalogTourVisibility(catalogEntry) : 'unlisted',
    );
    setEditTourFeatured(catalogEntry?.featured ?? false);

    const brandingTour = loaded ?? tour;
    const usesCustomBranding = loaded ? tourUsesCustomBranding(loaded) : false;
    setEditTourBrandingMode(usesCustomBranding ? 'custom' : 'client');
    const brandingSource =
      usesCustomBranding ? brandingTour.branding : catalogClient?.branding;
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

    if (panelTab !== 'tour') return;

    let cancelled = false;
    void devFetchTourRecord(targetId)
      .then(({ tour: rawTour, catalog }) => {
        if (cancelled) return;

        if (catalog) {
          setEditTourVisibility(catalog.visibility);
          setEditTourFeatured(catalog.featured);
          setEditTourSummary(catalog.summary);
        }

        setEditTourTitle(rawTour.title);
        setEditTourProductFullName(rawTour.productFullName ?? '');
        setEditTourCategory(
          (rawTour.category as TourCategory | undefined) ?? 'Healthcare',
        );
        setEditTransitionEffect(rawTour.defaultTransition?.effect ?? 'fade');
        setEditTransitionSpeed(rawTour.defaultTransition?.speed ?? '500ms');

        const fetchClient = findCatalogClient(getTourClientId(rawTour));
        const usesCustom = tourUsesCustomBranding(rawTour);
        setEditTourBrandingMode(usesCustom ? 'custom' : 'client');
        const fetchBranding =
          usesCustom ? rawTour.branding : fetchClient?.branding;
        setEditTourPrimaryColor(
          fetchBranding?.primaryColor ?? DEFAULT_NEW_TOUR_PRIMARY_COLOR,
        );
        setEditTourLogoAlt(fetchBranding?.logoAlt ?? fetchClient?.name ?? '');
        setEditTourFontFamily(fetchBranding?.fontFamily ?? '');
        setEditTourFontSourceUrl(fetchBranding?.fontSourceUrl ?? '');

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

    return () => {
      cancelled = true;
    };
  }, [editingTourId, panelTab]);

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

  const createNamingCatalogEntry = useCallback(async () => {
    const priceAmount = parseNamingPriceInput(noPrice);
    if (!scene.tourId || priceAmount == null || !noStatus) {
      return;
    }

    setNamingCatalogStatus('working');
    setNamingCatalogError(null);

    try {
      const result = await devCreateNamingOpportunity({
        tourId: scene.tourId,
        sceneId: scene.id,
        name: trimmedNoName,
        price: priceAmount,
        status: noStatus,
        visibility: noVisibility,
        body: noBody.trim() || undefined,
        videoUrl: noVideoUrl.trim() || undefined,
        image: noImage.trim() || undefined,
        donor: buildDevNamingDonorPayload({
          status: noStatus,
          name: noDonorName,
          kind: noDonorKind,
          affiliation: noDonorAffiliation,
          website: noDonorWebsite,
        }),
        donorLogoFile: noDonorLogoFile,
      });
      await onTourMutated?.({ keepCurrentScene: true });
      setSelectedNamingId(result.record.id);
      setNamingCatalogStatus('done');
      setNoName('');
      setNoPrice('');
      setNoStatus('');
      setNoVisibility('public');
      setNoDonorName('');
      setNoDonorKind('organization');
      setNoDonorAffiliation('');
      setNoDonorWebsite('');
      setNoDonorLogoFile(null);
      setNoBody('');
      setNoVideoUrl('');
      setNoImage('');
      setNamingCatalogCreateOpen(false);
    } catch (error) {
      setNamingCatalogStatus('error');
      setNamingCatalogError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create naming opportunity',
      );
    }
  }, [
    noBody,
    noDonorAffiliation,
    noDonorKind,
    noDonorLogoFile,
    noDonorName,
    noDonorWebsite,
    noImage,
    noPrice,
    noStatus,
    noVisibility,
    noVideoUrl,
    onTourMutated,
    scene.id,
    scene.tourId,
    trimmedNoName,
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
      setHotspotCreateOpen(false);
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
    isModel3dTour,
    onTourMutated,
    scene.id,
    scene.tourId,
  ]);

  const resolveModel3dSceneCreatePayload = useCallback(
    async (
      _title: string,
      manualThumbnailFile?: File | null,
      sceneIdForFile?: string,
    ) => {
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
          const slug = sceneIdForFile?.trim() || 'scene';
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
          await resolveModel3dSceneCreatePayload(
            trimmedSceneTitle,
            null,
            pendingSceneId,
          )
        : null;

      const result = await devCreateScene({
        tourId: scene.tourId,
        title: trimmedSceneTitle,
        sceneId: pendingSceneId,
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
            createPlaceOverview: sceneCreatePlaceOverview,
          }
        : {}),
      });
      setSceneTitle('');
      setSceneDescription('');
      setSceneCreatePlaceOverview(false);
      setScenePreviewVideoUrl('');
      setSceneVideoUrl('');
      setScenePanoramaFile(null);
      mintCreateSceneId();
      setSceneStatus('done');
      setSceneCreateOpen(false);
      await onTourMutated?.({ navigateToScene: result.scene.id });
      setPanelTab('scene');
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
    mintCreateSceneId,
    onTourMutated,
    pendingSceneId,
    resolveModel3dSceneCreatePayload,
    scene.tourId,
    sceneCreatePlaceOverview,
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
            pendingNavTargetSceneId,
          )
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
    resolveModel3dSceneCreatePayload,
    scene.tourId,
    trimmedNavName,
    trimmedNavTargetSceneTitle,
  ]);

  const suggestEditTourBranding = useCallback(async () => {
    const editClientId = getTourClientId(editingTourSource);
    const websiteUrl =
      findCatalogClient(editClientId)?.website?.trim() ??
      openCatalogClient?.website?.trim() ??
      '';
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
  }, [editingTourSource, openCatalogClient?.website]);

  const saveEditTour = useCallback(async () => {
    const targetTourId = editingTourId;
    if (!canSaveEditTour || !targetTourId) return;

    setEditTourStatus('working');
    setEditTourError(null);

    try {
      await devUpdateTour({
        tourId: targetTourId,
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
      if (targetTourId !== tour.id) {
        removeDevTourCache(targetTourId);
      } else {
        await onTourMutated?.();
      }
      await refreshDevCatalogSnapshot();
      setEditTourStatus('done');
      setEditingTourId(null);
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
    editingTourId,
    onTourMutated,
    tour.id,
  ]);

  const deleteManagedTour = useCallback(async () => {
    if (!canDeleteTour || !deletingTourId) return;

    const targetTourId = deletingTourId;
    setDeleteTourStatus('working');
    setDeleteTourError(null);

    try {
      const result = await devDeleteTour({
        tourId: targetTourId,
        confirmTourId: deleteTourConfirm.trim(),
      });

      removeDevTourCache(targetTourId);
      await refreshDevCatalogSnapshot();
      setDeletingTourId(null);
      setDeleteTourConfirm('');
      setEditingTourId((current) =>
        current === targetTourId ? null : current,
      );

      const wasOpenTour = targetTourId === tour.id;
      if (!wasOpenTour) {
        setDeleteTourStatus('done');
        return;
      }

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
  }, [
    canDeleteTour,
    deleteTourConfirm,
    deletingTourId,
    navigate,
    searchParams,
    tour.id,
  ]);

  const startDeleteTour = useCallback((tourId: string) => {
    setTourCreateOpen(false);
    setEditingTourId(null);
    setDeletingTourId(tourId);
    setDeleteTourConfirm('');
    setDeleteTourStatus('idle');
    setDeleteTourError(null);
  }, []);

  const cancelDeleteTour = useCallback(() => {
    setDeletingTourId(null);
    setDeleteTourConfirm('');
    setDeleteTourStatus('idle');
    setDeleteTourError(null);
  }, []);

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
        firstSceneId: newFirstSceneSlug,
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

      // Prefer the current scene's hotspot — place-overview pins share id
      // `info-place` across scenes, so a global find hits the wrong scene.
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
        if (
          found?.hotspot.namingId &&
          catalogEditNamingId === found.hotspot.namingId
        ) {
          setCatalogEditNamingId(null);
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
      catalogEditNamingId,
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
      setCatalogEditNamingId(null);
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
    [scene.id, tour],
  );

  const startCatalogNamingEdit = useCallback(
    (namingId: string) => {
      const record = tour.namingOpportunities?.[namingId];
      if (!record) return;
      const placement = findNamingHotspotByNamingId(tour, namingId);
      const hostScene =
        placement ? tour.scenes[placement.sceneId] : tour.scenes[scene.id];
      const sceneBody = hostScene?.description?.trim() ?? '';
      const sceneVideo = hostScene?.previewVideoUrl?.trim() ?? '';
      const storedBody = record.body?.trim() ?? '';
      const storedVideo = record.videoUrl?.trim() ?? '';
      setCatalogEditNamingId(namingId);
      setEditingHotspotId(null);
      setMovingHotspotId(null);
      setNamingCatalogCreateOpen(false);
      setCatalogEditName(record.name?.trim() ?? '');
      setCatalogEditPrice(formatNamingPriceInput(record.price));
      setCatalogEditStatus(record.status ?? '');
      setCatalogEditVisibility(resolveNamingVisibility(record));
      setCatalogEditBody(
        storedBody && storedBody !== sceneBody ? storedBody : '',
      );
      setCatalogEditVideoUrl(
        storedVideo && storedVideo !== sceneVideo ? storedVideo : '',
      );
      setCatalogEditImage(record.image?.trim() ?? '');
      setCatalogEditDonorName(record.donor?.name ?? '');
      setCatalogEditDonorKind(record.donor?.kind ?? 'organization');
      setCatalogEditDonorAffiliation(record.donor?.affiliation ?? '');
      setCatalogEditDonorWebsite(record.donor?.website ?? '');
      setCatalogEditDonorLogoFile(null);
      setCatalogEditDonorLogoPath(record.donor?.logo ?? '');
      setCatalogEditClearDonorLogo(false);
    },
    [scene.id, tour],
  );

  const saveCatalogNamingEdit = useCallback(async () => {
    if (!scene.tourId || !catalogEditNamingId) return;
    const placement = findNamingHotspotByNamingId(tour, catalogEditNamingId);
    if (!placement) {
      setHotspotManageStatus('error');
      setHotspotManageError('No placement hotspot for this naming opportunity');
      return;
    }

    setHotspotManageStatus('working');
    setHotspotManageError(null);

    try {
      await devUpdateNamingHotspot({
        tourId: scene.tourId,
        sceneId: placement.sceneId,
        hotspotId: placement.hotspot.id,
        title: catalogEditName.trim(),
        price: parseNamingPriceInput(catalogEditPrice) ?? undefined,
        status: catalogEditStatus || undefined,
        visibility: catalogEditVisibility,
        body: catalogEditBody.trim(),
        videoUrl: catalogEditVideoUrl.trim(),
        image: catalogEditImage,
        donor: buildDevNamingDonorPayload({
          status: catalogEditStatus,
          name: catalogEditDonorName,
          kind: catalogEditDonorKind,
          affiliation: catalogEditDonorAffiliation,
          website: catalogEditDonorWebsite,
        }),
        donorLogoFile: catalogEditDonorLogoFile,
        clearDonorLogo: catalogEditClearDonorLogo,
      });
      setCatalogEditNamingId(null);
      await onTourMutated?.({ keepCurrentScene: true });
      setHotspotManageStatus('done');
    } catch (error) {
      setHotspotManageStatus('error');
      setHotspotManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save naming opportunity',
      );
    }
  }, [
    catalogEditBody,
    catalogEditClearDonorLogo,
    catalogEditDonorAffiliation,
    catalogEditDonorKind,
    catalogEditDonorLogoFile,
    catalogEditDonorName,
    catalogEditDonorWebsite,
    catalogEditImage,
    catalogEditName,
    catalogEditNamingId,
    catalogEditPrice,
    catalogEditStatus,
    catalogEditVisibility,
    catalogEditVideoUrl,
    onTourMutated,
    scene.tourId,
    tour,
  ]);

  const deleteNamingCatalogEntry = useCallback(
    async (namingId: string) => {
      if (!scene.tourId) return;
      const placement = findNamingHotspotByNamingId(tour, namingId);
      const record = tour.namingOpportunities?.[namingId];
      const label =
        record?.name?.trim() ||
        (placement ? hotspotDisplayLabel(placement.hotspot, tour) : namingId);
      if (
        !confirmDevPanelDelete(
          `Delete naming opportunity “${label}” from the catalog? This also removes its hotspot(s).`,
        )
      ) {
        return;
      }
      if (!placement) {
        setHotspotManageStatus('error');
        setHotspotManageError(
          'No placement hotspot to delete for this naming id',
        );
        return;
      }

      setHotspotManageStatus('working');
      setHotspotManageError(null);

      try {
        await devDeleteHotspot({
          tourId: scene.tourId,
          sceneId: placement.sceneId,
          hotspotId: placement.hotspot.id,
        });
        if (catalogEditNamingId === namingId) {
          setCatalogEditNamingId(null);
        }
        if (editingHotspotId === placement.hotspot.id) {
          setEditingHotspotId(null);
        }
        await onTourMutated?.({ keepCurrentScene: true });
        setHotspotManageStatus('done');
      } catch (error) {
        setHotspotManageStatus('error');
        setHotspotManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not delete naming opportunity',
        );
      }
    },
    [catalogEditNamingId, editingHotspotId, onTourMutated, scene.tourId, tour],
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
      setPanelTab('scene');
    },
    [navigate, scene.tourId, searchParams, tour.firstScene],
  );

  const openNamingHotspot = useCallback(
    (sceneId: string, hotspotId: string) => {
      if (!openNamingOpportunity) return;
      openNamingOpportunity(sceneId, hotspotId);
      setPanelTab('scene');
    },
    [openNamingOpportunity],
  );

  const saveHotspotEdit = useCallback(async () => {
    if (!scene.tourId || !editingHotspotId) return;
    // Prefer current-scene hotspot — place-overview shares id `info-place`.
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
      setPanelTab('scene');
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
      setEditSceneVisibility(resolveSceneVisibility(entry));
      setEditSceneAsFirst(entry.id === tour.firstScene);
    },
    [tour.firstScene],
  );

  const saveSceneEdit = useCallback(async () => {
    if (!scene.tourId || !editingSceneId) return;

    const isAlreadyFirst = editingSceneId === tour.firstScene;

    setSceneManageStatus('working');
    setSceneManageError(null);

    try {
      await devUpdateScene({
        tourId: scene.tourId,
        sceneId: editingSceneId,
        title: editSceneTitle.trim() || undefined,
        description: editSceneDescription,
        visibility:
          isAlreadyFirst || editSceneAsFirst ? 'public' : editSceneVisibility,
        ...(!isModel3dTour ?
          {
            previewVideoUrl: editScenePreviewVideoUrl,
            videoUrl: editSceneVideoUrl,
          }
        : {}),
        setAsFirstScene: editSceneAsFirst && !isAlreadyFirst,
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
    editSceneTitle,
    editSceneVisibility,
    editingSceneId,
    isModel3dTour,
    onTourMutated,
    scene.tourId,
    tour.firstScene,
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

  const markerCoords = clickCoords ? formatCoords(clickCoords) : '—';

  const stickyTourBranding = useMemo(
    () => resolveTourBranding(tour),
    [tour, catalogTick],
  );
  const stickyTourIcon =
    stickyTourBranding?.favicon ?? stickyTourBranding?.logo;
  const catalogEditDonorLogoPreviewUrl = useMemo(() => {
    if (catalogEditDonorLogoFile || catalogEditClearDonorLogo) return null;
    const path = catalogEditDonorLogoPath.trim();
    if (!path) return null;
    return withBaseUrl(path);
  }, [
    catalogEditClearDonorLogo,
    catalogEditDonorLogoFile,
    catalogEditDonorLogoPath,
  ]);
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

  const startEditTour = useCallback((tourId: string) => {
    setTourCreateOpen(false);
    setDeletingTourId(null);
    setDeleteTourConfirm('');
    setDeleteTourStatus('idle');
    setDeleteTourError(null);
    setEditingTourId(tourId);
  }, []);

  const cancelEditTour = useCallback(() => {
    setEditingTourId(null);
    setEditTourStatus('idle');
    setEditTourError(null);
  }, []);

  const copyTourPublicLink = useCallback(async (tourId: string) => {
    const ok = await copyToClipboard(`${TOUR_PUBLIC_ORIGIN}/${tourId}`);
    setTourLinkCopyState({ id: tourId, status: ok ? 'copied' : 'failed' });
    window.setTimeout(
      () => {
        setTourLinkCopyState((prev) => (prev?.id === tourId ? null : prev));
      },
      ok ? 1600 : 2000,
    );
  }, []);

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
  }, [panelTab, tourCreateOpen]);

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

  const renderNamingCatalogSection = () => {
    if (!showNamingCatalogPanel) return null;

    return (
      <DevPanelSection
        title={namingCatalogSectionConfig.title}
        description={namingCatalogSectionConfig.description}
      >
        {namingCatalogCreateOpen ? null : (
          <div className={devViewPanelActionsClassName}>
            <button
              type='button'
              className={devViewPanelBtnVariants({ tone: 'naming' })}
              onClick={openCreateNamingTab}
              disabled={hotspotManageStatus === 'working'}
            >
              {namingCatalogSectionConfig.addButtonLabel}
            </button>
          </div>
        )}
        {namingCatalogCreateOpen ?
          <DevPanelFormGroup title='New naming opportunity'>
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
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Visibility
              </span>
              <select
                className={devViewPanelSelectClassName}
                value={noVisibility}
                onChange={(e) =>
                  setNoVisibility(e.target.value as DevCatalogTourVisibility)
                }
              >
                {DEV_SCENE_VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Price</span>
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
              <span className={devViewPanelFieldLabelClassName}>Status</span>
              <select
                className={devViewPanelSelectClassName}
                value={noStatus}
                onChange={(e) =>
                  setNoStatus(e.target.value as NamingOpportunityStatus | '')
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
            {noStatus === 'sold' ?
              <>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Donor kind
                  </span>
                  <select
                    className={devViewPanelSelectClassName}
                    value={noDonorKind}
                    onChange={(e) =>
                      setNoDonorKind(e.target.value as NamingDonorKind)
                    }
                  >
                    {DEV_NAMING_DONOR_KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Donor name
                  </span>
                  <input
                    className={devViewPanelInputClassName}
                    type='text'
                    value={noDonorName}
                    onChange={(e) => setNoDonorName(e.target.value)}
                    placeholder='e.g. Jane Smith'
                    spellCheck={false}
                    autoComplete='off'
                  />
                </label>
                {noDonorKind === 'person' ?
                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Affiliation (optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      value={noDonorAffiliation}
                      onChange={(e) => setNoDonorAffiliation(e.target.value)}
                      placeholder='e.g. ABC Foundation'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </label>
                : null}
                {(
                  noDonorKind === 'organization' ||
                  (noDonorKind === 'person' && noDonorAffiliation.trim())
                ) ?
                  <>
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        {noDonorKind === 'person' ?
                          'Affiliation website (optional)'
                        : 'Donor website (optional)'}
                      </span>
                      <input
                        className={devViewPanelInputClassName}
                        type='url'
                        value={noDonorWebsite}
                        onChange={(e) => setNoDonorWebsite(e.target.value)}
                        placeholder='https://…'
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </label>
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        {noDonorKind === 'person' ?
                          'Affiliation logo (optional)'
                        : 'Donor logo (optional)'}
                      </span>
                      <DevPanelFileField
                        {...(noDonorLogoFile != null ?
                          { file: noDonorLogoFile }
                        : {})}
                        preview={
                          noDonorLogoFile ?
                            <DevLocalFilePreview
                              file={noDonorLogoFile}
                              className={devViewPanelBrandLogoClassName}
                              alt='Donor logo preview'
                            />
                          : null
                        }
                        onClearPreview={() => setNoDonorLogoFile(null)}
                        showClear={Boolean(noDonorLogoFile)}
                      >
                        <DevPanelFileInput
                          accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                          file={noDonorLogoFile}
                          onChange={setNoDonorLogoFile}
                        />
                      </DevPanelFileField>
                    </label>
                  </>
                : null}
              </>
            : null}
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Body (optional)
              </span>
              <textarea
                className={devViewPanelTextareaClassName}
                value={noBody}
                onChange={(e) => setNoBody(e.target.value)}
                placeholder={inheritedNoBody || 'Uses scene description'}
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
                placeholder={inheritedNoVideo || 'Uses scene preview video URL'}
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
            {namingCatalogError ?
              <p className={devViewPanelSectionHintClassName}>
                {namingCatalogError}
              </p>
            : null}
            <div className={devViewPanelActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => {
                  setNamingCatalogCreateOpen(false);
                  setNamingCatalogError(null);
                  setNamingCatalogStatus('idle');
                }}
                disabled={namingCatalogStatus === 'working'}
              >
                Cancel
              </button>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'naming' })}
                onClick={() => void createNamingCatalogEntry()}
                disabled={
                  !canCreateNamingCatalog || namingCatalogStatus === 'working'
                }
              >
                {namingCatalogStatus === 'working' ?
                  'Creating…'
                : namingCatalogStatus === 'done' ?
                  'NO created!'
                : 'Create naming opportunity'}
              </button>
            </div>
          </DevPanelFormGroup>
        : <>
            <DevPanelTertiaryTabs
              aria-label='Filter naming opportunities by status'
              value={namingManageFilter}
              onChange={(filter) => {
                setNamingManageFilter(filter);
                setCatalogEditNamingId(null);
              }}
              tabs={DEV_NAMING_MANAGE_FILTER_TABS.map((tab) => ({
                id: tab.id,
                label: tab.label,
                kind: 'naming',
              }))}
            />
            <DevPanelFormGroup>
              {filteredNamingCatalogRows.length > 0 ?
                <ul className={devViewPanelManageListClassName}>
                  {filteredNamingCatalogRows.map((row) => {
                    const isEditing = catalogEditNamingId === row.record.id;
                    const hostSceneBody =
                      row.placement ?
                        tour.scenes[
                          row.placement.sceneId
                        ]?.description?.trim() || ''
                      : '';
                    const statusConfig =
                      (
                        row.record.status &&
                        namingOpportunityStatusShowsBadge(row.record.status)
                      ) ?
                        namingOpportunityStatusConfig(row.record.status)
                      : null;
                    const namingVisibility = resolveNamingVisibility(
                      row.record,
                    );
                    return (
                      <li
                        key={row.record.id}
                        className={cn(
                          devViewPanelManageListItemClassName,
                          isEditing &&
                            devViewPanelManageListItemActiveClassName,
                        )}
                        onMouseEnter={() => {
                          if (row.placement?.sceneId === currentSceneId) {
                            previewHotspotHighlight(row.placement.hotspot.id);
                          }
                        }}
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
                              {row.displayName}
                            </span>
                            {row.record.price ?
                              <>
                                <span
                                  className={
                                    devViewPanelManageListItemBulletClassName
                                  }
                                  aria-hidden='true'
                                >
                                  ·
                                </span>
                                <span
                                  className={
                                    devViewPanelManageListItemMetaClassName
                                  }
                                >
                                  {formatNamingPriceInput(row.record.price)}
                                </span>
                              </>
                            : null}
                          </div>
                          <div
                            className={
                              devViewPanelManageListItemSceneBadgesClassName
                            }
                          >
                            {statusConfig ?
                              <Badge
                                variant='fill'
                                size='sm'
                                statusModifier={statusConfig.cssModifier}
                                uppercase
                                className={devNamingManageStatusBadgeClassName}
                              >
                                {statusConfig.shortLabel}
                              </Badge>
                            : null}
                            <Badge
                              variant='fill'
                              size='sm'
                              tone='none'
                              className={devSceneManageBadgeVariants({
                                kind: namingVisibility,
                              })}
                            >
                              {namingVisibility === 'public' ?
                                'Public'
                              : namingVisibility === 'unlisted' ?
                                'Unlisted'
                              : 'Internal'}
                            </Badge>
                          </div>
                        </div>
                        {row.sceneTitle ?
                          <p className={devViewPanelSectionHintClassName}>
                            Hotspot in {row.sceneTitle}
                          </p>
                        : null}
                        <div className={devViewPanelActionsClassName}>
                          {row.placement && openNamingOpportunity ?
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              disabled={hotspotManageStatus === 'working'}
                              onClick={() =>
                                openNamingHotspot(
                                  row.placement!.sceneId,
                                  row.placement!.hotspot.id,
                                )
                              }
                            >
                              Open
                            </button>
                          : null}
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'secondary',
                            })}
                            disabled={
                              hotspotManageStatus === 'working' || isEditing
                            }
                            onClick={() =>
                              startCatalogNamingEdit(row.record.id)
                            }
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            className={devViewPanelBtnVariants({
                              tone: 'danger',
                            })}
                            disabled={hotspotManageStatus === 'working'}
                            onClick={() =>
                              void deleteNamingCatalogEntry(row.record.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                        {isEditing ?
                          <DevPanelFormGroup inline manageEdit>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Name (optional)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={catalogEditName}
                                onChange={(e) =>
                                  setCatalogEditName(e.target.value)
                                }
                                placeholder={
                                  row.sceneTitle || 'Uses scene title'
                                }
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Visibility
                              </span>
                              <select
                                className={devViewPanelSelectClassName}
                                value={catalogEditVisibility}
                                onChange={(e) =>
                                  setCatalogEditVisibility(
                                    e.target.value as DevCatalogTourVisibility,
                                  )
                                }
                              >
                                {DEV_SCENE_VISIBILITY_OPTIONS.map((option) => (
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
                                Price
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={catalogEditPrice}
                                onChange={(e) =>
                                  setCatalogEditPrice(e.target.value)
                                }
                              />
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Status
                              </span>
                              <select
                                className={devViewPanelSelectClassName}
                                value={catalogEditStatus}
                                onChange={(e) =>
                                  setCatalogEditStatus(
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
                            {catalogEditStatus === 'sold' ?
                              <>
                                <label className={devViewPanelFieldClassName}>
                                  <span
                                    className={devViewPanelFieldLabelClassName}
                                  >
                                    Donor kind
                                  </span>
                                  <select
                                    className={devViewPanelSelectClassName}
                                    value={catalogEditDonorKind}
                                    onChange={(e) =>
                                      setCatalogEditDonorKind(
                                        e.target.value as NamingDonorKind,
                                      )
                                    }
                                  >
                                    {DEV_NAMING_DONOR_KIND_OPTIONS.map(
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
                                <label className={devViewPanelFieldClassName}>
                                  <span
                                    className={devViewPanelFieldLabelClassName}
                                  >
                                    Donor name
                                  </span>
                                  <input
                                    className={devViewPanelInputClassName}
                                    type='text'
                                    value={catalogEditDonorName}
                                    onChange={(e) =>
                                      setCatalogEditDonorName(e.target.value)
                                    }
                                    placeholder='e.g. Jane Smith'
                                    spellCheck={false}
                                    autoComplete='off'
                                  />
                                </label>
                                {catalogEditDonorKind === 'person' ?
                                  <label className={devViewPanelFieldClassName}>
                                    <span
                                      className={
                                        devViewPanelFieldLabelClassName
                                      }
                                    >
                                      Affiliation (optional)
                                    </span>
                                    <input
                                      className={devViewPanelInputClassName}
                                      type='text'
                                      value={catalogEditDonorAffiliation}
                                      onChange={(e) =>
                                        setCatalogEditDonorAffiliation(
                                          e.target.value,
                                        )
                                      }
                                      placeholder='e.g. ABC Foundation'
                                      spellCheck={false}
                                      autoComplete='off'
                                    />
                                  </label>
                                : null}
                                {(
                                  catalogEditDonorKind === 'organization' ||
                                  (catalogEditDonorKind === 'person' &&
                                    catalogEditDonorAffiliation.trim())
                                ) ?
                                  <>
                                    <label
                                      className={devViewPanelFieldClassName}
                                    >
                                      <span
                                        className={
                                          devViewPanelFieldLabelClassName
                                        }
                                      >
                                        {catalogEditDonorKind === 'person' ?
                                          'Affiliation website (optional)'
                                        : 'Donor website (optional)'}
                                      </span>
                                      <input
                                        className={devViewPanelInputClassName}
                                        type='url'
                                        value={catalogEditDonorWebsite}
                                        onChange={(e) =>
                                          setCatalogEditDonorWebsite(
                                            e.target.value,
                                          )
                                        }
                                        placeholder='https://…'
                                        spellCheck={false}
                                        autoComplete='off'
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
                                        {catalogEditDonorLogoPreviewUrl ?
                                          catalogEditDonorKind === 'person' ?
                                            'Affiliation logo (replace)'
                                          : 'Donor logo (replace)'
                                        : catalogEditDonorKind === 'person' ?
                                          'Affiliation logo (optional)'
                                        : 'Donor logo (optional)'}
                                      </span>
                                      <DevPanelFileField
                                        {...(catalogEditDonorLogoFile != null ?
                                          { file: catalogEditDonorLogoFile }
                                        : {})}
                                        preview={
                                          catalogEditDonorLogoFile ?
                                            <DevLocalFilePreview
                                              file={catalogEditDonorLogoFile}
                                              className={
                                                devViewPanelBrandLogoClassName
                                              }
                                              alt='Donor logo preview'
                                            />
                                          : catalogEditDonorLogoPreviewUrl ?
                                            <img
                                              className={
                                                devViewPanelBrandLogoClassName
                                              }
                                              src={
                                                catalogEditDonorLogoPreviewUrl
                                              }
                                              alt='Current donor logo'
                                            />
                                          : null
                                        }
                                        onClearPreview={() => {
                                          if (catalogEditDonorLogoFile) {
                                            setCatalogEditDonorLogoFile(null);
                                            return;
                                          }
                                          if (catalogEditDonorLogoPath) {
                                            setCatalogEditClearDonorLogo(true);
                                          }
                                        }}
                                        showClear={Boolean(
                                          catalogEditDonorLogoFile ||
                                          catalogEditDonorLogoPreviewUrl,
                                        )}
                                        clearLabel={
                                          catalogEditDonorLogoFile ? 'Clear' : (
                                            'Remove'
                                          )
                                        }
                                      >
                                        <DevPanelFileInput
                                          accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                                          file={catalogEditDonorLogoFile}
                                          onChange={(file) => {
                                            setCatalogEditDonorLogoFile(file);
                                            if (file) {
                                              setCatalogEditClearDonorLogo(
                                                false,
                                              );
                                            }
                                          }}
                                        />
                                      </DevPanelFileField>
                                    </label>
                                  </>
                                : null}
                              </>
                            : null}
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Body (optional)
                              </span>
                              <textarea
                                className={devViewPanelTextareaClassName}
                                value={catalogEditBody}
                                onChange={(e) =>
                                  setCatalogEditBody(e.target.value)
                                }
                                placeholder={
                                  hostSceneBody || 'Uses scene description'
                                }
                                rows={3}
                              />
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Video URL (optional)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='url'
                                value={catalogEditVideoUrl}
                                onChange={(e) =>
                                  setCatalogEditVideoUrl(e.target.value)
                                }
                                placeholder={
                                  (row.placement ?
                                    tour.scenes[row.placement.sceneId]
                                      ?.previewVideoUrl
                                  : undefined) || 'Uses scene preview video URL'
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
                                value={catalogEditImage}
                                onChange={(e) =>
                                  setCatalogEditImage(e.target.value)
                                }
                                placeholder='/assets/…/photo.webp'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <div className={devViewPanelActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => setCatalogEditNamingId(null)}
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Cancel
                              </button>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'primary',
                                })}
                                onClick={() => void saveCatalogNamingEdit()}
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Save catalog
                              </button>
                            </div>
                          </DevPanelFormGroup>
                        : null}
                      </li>
                    );
                  })}
                </ul>
              : <p className={devViewPanelSectionHintClassName}>
                  {namingCatalogRows.length === 0 ?
                    namingCatalogSectionConfig.emptyMessage
                  : namingManageFilter === 'all' ?
                    namingCatalogSectionConfig.emptyMessage
                  : `No ${namingOpportunityStatusConfig(namingManageFilter).label.toLowerCase()} naming opportunities.`
                  }
                </p>
              }
              {hotspotManageError && catalogEditNamingId ?
                <p className={devViewPanelSectionHintClassName}>
                  {hotspotManageError}
                </p>
              : null}
            </DevPanelFormGroup>
          </>
        }
      </DevPanelSection>
    );
  };

  const renderHotspotDevSection = () => {
    if (!showHotspotDevPanel) return null;

    return (
      <DevPanelSection
        title={hotspotSectionConfig.title}
        description={hotspotSectionConfig.description}
      >
        {!hotspotCreateOpen ?
          <div className={devViewPanelActionsClassName}>
            <button
              type='button'
              className={devViewPanelBtnVariants({ tone: 'scene' })}
              onClick={openCreateHotspotTab}
              disabled={hotspotManageStatus === 'working'}
            >
              {hotspotSectionConfig.addButtonLabel}
            </button>
          </div>
        : null}

        {!hotspotCreateOpen ?
          <>
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
                <ul className={devViewPanelManageListClassName}>
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
                        onMouseLeave={restoreLockedHotspotHighlight}
                      >
                        <div
                          className={devViewPanelManageListItemHeadClassName}
                        >
                          <div
                            className={
                              devViewPanelManageListItemHeadMainClassName
                            }
                            title={hotspot.id}
                          >
                            <span
                              className={
                                devViewPanelManageListItemTitleClassName
                              }
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
                              devViewPanelManageListItemBadgesClassName
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
                          {(
                            (isNamingInfoHotspot(hotspot) ||
                              isPlaceOverviewHotspot(hotspot)) &&
                            openNamingOpportunity
                          ) ?
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={() => {
                                // Place-overview pins share id `info-place` —
                                // always use this manage row's scene.
                                const hostSceneId =
                                  isPlaceOverviewHotspot(hotspot) ?
                                    scene.id
                                  : (findHotspotInTour(tour, hotspot.id)
                                      ?.sceneId ?? scene.id);
                                openNamingHotspot(hostSceneId, hotspot.id);
                              }}
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
                                in Naming catalog. Use Move to reposition.
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
                                    Orbit to frame the opening shot — saved on
                                    Save with Explore <code>preview.image</code>
                                    . Scene landing unchanged.
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
          </>
        : <>
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
                        className={devViewPanelBtnVariants({
                          tone: 'secondary',
                        })}
                        onClick={() => setHotspotCreateOpen(false)}
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
                        {devViewerClickHint} — place a catalog naming
                        opportunity here.
                        {isModel3dTour ?
                          <>
                            {' '}
                            Saves the current camera as <code>
                              targetView
                            </code>{' '}
                            + Explore <code>preview.image</code>.
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
                        Naming opportunity
                      </span>
                      <select
                        className={devViewPanelSelectClassName}
                        value={selectedNamingId}
                        onChange={(e) => setSelectedNamingId(e.target.value)}
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
                      onClick={openCreateNamingTab}
                    >
                      + Create in Naming catalog
                    </button>

                    <div className={devViewPanelActionsClassName}>
                      <button
                        type='button'
                        className={devViewPanelBtnVariants({
                          tone: 'secondary',
                        })}
                        onClick={() => setHotspotCreateOpen(false)}
                        disabled={namingStatus === 'working'}
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        className={devViewPanelBtnVariants({ tone: 'primary' })}
                        onClick={() => void createNamingHotspot()}
                        disabled={
                          !canCreateNaming || namingStatus === 'working'
                        }
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
                            {collidingSceneTitleIds.has(entry.id) ?
                              `${entry.title} · id ${entry.id}`
                            : entry.title}
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
                        className={devViewPanelBtnVariants({
                          tone: 'secondary',
                        })}
                        onClick={() => setHotspotCreateOpen(false)}
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
                        {devViewerClickHint} — place overview pin for this
                        scene. Title/body inherit the scene (or first public
                        naming body). One per scene.
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
                        This scene already has a place overview hotspot. Delete
                        it first to place another.
                      </p>
                    : null}

                    <div className={devViewPanelActionsClassName}>
                      <button
                        type='button'
                        className={devViewPanelBtnVariants({
                          tone: 'secondary',
                        })}
                        onClick={() => setHotspotCreateOpen(false)}
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
      {!sceneCreateOpen ?
        <div className={devViewPanelActionsClassName}>
          <button
            type='button'
            className={devViewPanelBtnVariants({ tone: 'scenes' })}
            onClick={openCreateSceneTab}
            disabled={sceneManageStatus === 'working'}
          >
            Add scene to this tour
          </button>
        </div>
      : null}

      {!sceneCreateOpen ?
        <>
          {sceneManageGroups.length > 0 ?
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Filter by group
              </span>
              <select
                className={devViewPanelSelectClassName}
                value={sceneManageFilter}
                onChange={(e) => {
                  setSceneManageFilter(e.target.value);
                  setEditingSceneId(null);
                }}
                disabled={sceneManageStatus === 'working'}
              >
                <option value='all'>All scenes</option>
                {sceneManageGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title} ({group.scenes.length})
                  </option>
                ))}
              </select>
            </label>
          : null}
          <DevPanelFormGroup>
            {filteredTourScenes.length > 0 ?
              <ul className={devViewPanelManageListClassName}>
                {filteredTourScenes.map((entry) => {
                  const isCurrent = entry.id === scene.id;
                  const isFirst = entry.id === tour.firstScene;
                  const isEditing = editingSceneId === entry.id;
                  const canDelete = entry.id !== tour.firstScene;
                  const groupSecondary = sceneManageSecondaryById[entry.id];
                  const sceneVisibility = resolveSceneVisibility(entry);

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
                          {groupSecondary ?
                            <>
                              <span
                                className={
                                  devViewPanelManageListItemBulletClassName
                                }
                                aria-hidden='true'
                              >
                                ·
                              </span>
                              <span
                                className={
                                  devViewPanelManageListItemMetaClassName
                                }
                              >
                                {groupSecondary}
                              </span>
                            </>
                          : null}
                        </div>
                        <div
                          className={
                            devViewPanelManageListItemSceneBadgesClassName
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
                          <Badge
                            variant='fill'
                            size='sm'
                            tone='none'
                            className={devSceneManageBadgeVariants({
                              kind: sceneVisibility,
                            })}
                          >
                            {sceneVisibility === 'public' ?
                              'Public'
                            : sceneVisibility === 'unlisted' ?
                              'Unlisted'
                            : 'Internal'}
                          </Badge>
                        </div>
                      </div>
                      {(
                        entry.description &&
                        !isDefaultSceneDescription(
                          entry.description,
                          tour.title,
                          entry.title,
                        )
                      ) ?
                        <p
                          className={devViewPanelManageListItemDescClassName}
                          title={entry.description}
                        >
                          {entry.description}
                        </p>
                      : (() => {
                          const lead = buildScenePlaceLeadFromNaming(
                            tour,
                            entry,
                          );
                          return lead ?
                              <p
                                className={
                                  devViewPanelManageListItemDescClassName
                                }
                                title={lead}
                              >
                                From NO · {lead}
                              </p>
                            : null;
                        })()
                      }
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
                              Visibility
                            </span>
                            <select
                              className={devViewPanelSelectClassName}
                              value={
                                isFirst || editSceneAsFirst ? 'public' : (
                                  editSceneVisibility
                                )
                              }
                              onChange={(e) =>
                                setEditSceneVisibility(
                                  e.target.value as DevCatalogTourVisibility,
                                )
                              }
                              disabled={isFirst || editSceneAsFirst}
                            >
                              {DEV_SCENE_VISIBILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <p className={devViewPanelSectionHintClassName}>
                              {isFirst || editSceneAsFirst ?
                                'firstScene must stay Public.'
                              : 'Explore shows Public only. Unlisted is link/share. Internal needs ?dev=1.'
                              }
                            </p>
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
                              When set, Explore / nav and place overview use
                              this copy. Leave empty to inherit the first public
                              naming body (short in nav, full in place
                              overview).
                            </p>
                          </label>
                          <div className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Inherited place copy
                            </span>
                            {(() => {
                              const draftDesc = editSceneDescription.trim();
                              const usingRealDescription =
                                Boolean(draftDesc) &&
                                !isDefaultSceneDescription(
                                  draftDesc,
                                  tour.title,
                                  entry.title,
                                );
                              const autoLead =
                                buildScenePlaceLeadFromNaming(tour, entry) ||
                                '';
                              if (usingRealDescription) {
                                return (
                                  <p
                                    className={devViewPanelSectionHintClassName}
                                  >
                                    Using Description — naming inherit is
                                    ignored while Description is set.
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
                                      From NO (nav teaser) · {autoLead}
                                    </p>
                                    <p
                                      className={
                                        devViewPanelSectionHintClassName
                                      }
                                    >
                                      Updates automatically when NO copy
                                      changes. Place overview shows the full NO
                                      body.
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
                                  onChange={(e) => {
                                    const checked = e.currentTarget.checked;
                                    setEditSceneAsFirst(checked);
                                    if (checked) {
                                      setEditSceneVisibility('public');
                                    }
                                  }}
                                />
                                <span
                                  className={devViewPanelToggleTextClassName}
                                >
                                  Set as firstScene
                                </span>
                              </label>
                            : null}
                          </div>
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
                {tourScenes.length === 0 ?
                  'No scenes on this tour yet.'
                : sceneManageFilter === 'all' ?
                  'No scenes on this tour yet.'
                : 'No scenes in this group.'}
              </p>
            }
            {sceneManageError ?
              <p className={devViewPanelSectionHintClassName}>
                {sceneManageError}
              </p>
            : null}
          </DevPanelFormGroup>
        </>
      : <>
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
              {!isModel3dTour ?
                <p className={devViewPanelSectionHintClassName}>
                  Scene id is opaque and stays fixed if you rename later.
                </p>
              : <p className={devViewPanelSectionHintClassName}>
                  Orbit the model first — current camera is saved as{' '}
                  <code>defaultView</code> on create.
                </p>
              }
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
              {isModel3dTour ?
                <p className={devViewPanelSectionHintClassName}>
                  Optional upload; otherwise captures from the current 3D view.
                </p>
              : <p className={devViewPanelSectionHintClassName}>
                  Converts to webp under this tour&apos;s panoramas folder.
                </p>
              }
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
              <label className={devViewPanelToggleLabelMultilineClassName}>
                <input
                  type='checkbox'
                  className={devViewPanelToggleInputClassName}
                  checked={sceneCreatePlaceOverview}
                  onChange={(e) =>
                    setSceneCreatePlaceOverview(e.currentTarget.checked)
                  }
                />
                <span className={devViewPanelToggleTextClassName}>
                  <span className={devViewPanelToggleNameClassName}>
                    Create place overview hotspot
                  </span>
                  <span className={devViewPanelToggleHintClassName}>
                    {' '}
                    — Off by default. When off, this scene won&apos;t get an
                    auto overview pin (even after you add a description later).
                  </span>
                </span>
              </label>
            : null}

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
                stable id <code>{sceneSlug}</code> ·{' '}
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
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => setSceneCreateOpen(false)}
                disabled={sceneStatus === 'working'}
              >
                Cancel
              </button>
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
                title='Clients'
                description='Catalog clients — shared contact and branding. Tour settings stay on the Tour tab.'
              >
                <DevClientPanel
                  catalogClients={catalogClients}
                  catalogTick={catalogTick}
                  currentClientId={currentClientId}
                  manageClientId={manageClientId}
                  onManageClientIdChange={setManageClientId}
                  onCatalogRefresh={async () => {
                    await refreshDevCatalogSnapshot();
                  }}
                  onClientDeleted={handleClientDeleted}
                />
              </DevPanelSection>
            </DevPanelSectionAccordion>
          </div>
        : panelTab === 'scenes' ?
          <div
            id='dev-panel-scenes'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scenes'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
              {renderScenesDevSection()}
            </DevPanelSectionAccordion>
          </div>
        : panelTab === 'naming' ?
          <div
            id='dev-panel-naming'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-naming'
            className={devViewPanelTabPanelClassName}
          >
            <DevPanelSectionAccordion>
              {renderNamingCatalogSection()}
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
                title='Tours'
                description='All catalog tours — open one in the viewer, or edit settings inline. Add creates under a client.'
              >
                {!tourCreateOpen ?
                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'tour' })}
                      onClick={() => openCreateTourTab()}
                    >
                      Add tour
                    </button>
                  </div>
                : null}

                {!tourCreateOpen ?
                  <>
                    {tourManageClientGroups.length > 0 ?
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Filter by client
                        </span>
                        <select
                          className={devViewPanelSelectClassName}
                          value={tourManageClientFilter}
                          onChange={(e) => {
                            setTourManageClientFilter(e.target.value);
                            setEditingTourId(null);
                            setDeletingTourId(null);
                          }}
                          disabled={
                            editTourStatus === 'working' ||
                            deleteTourStatus === 'working'
                          }
                        >
                          <option value='all'>
                            All tours ({catalogTourManageRows.length})
                          </option>
                          {tourManageClientGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.title} ({group.count})
                            </option>
                          ))}
                        </select>
                      </label>
                    : null}
                    <DevPanelFormGroup>
                      {filteredCatalogTourManageRows.length > 0 ?
                        <ul className={devViewPanelManageListClassName}>
                          {filteredCatalogTourManageRows.map((entry) => {
                            const isCurrent = entry.id === tour.id;
                            const isEditing = editingTourId === entry.id;
                            const isDeleting = deletingTourId === entry.id;
                            const logoUrl =
                              entry.logoPath ?
                                withBaseUrl(
                                  appendCacheBust(entry.logoPath, catalogTick),
                                )
                              : null;
                            const busy =
                              editTourStatus === 'working' ||
                              deleteTourStatus === 'working';
                            return (
                              <li
                                key={entry.id}
                                className={cn(
                                  devViewPanelManageListItemClassName,
                                  (isEditing || isCurrent || isDeleting) &&
                                    devViewPanelManageListItemActiveClassName,
                                )}
                              >
                                <div
                                  className={cn(
                                    devViewPanelManageListItemHeadClassName,
                                    'items-start',
                                  )}
                                >
                                  <div
                                    className={cn(
                                      devViewPanelManageListItemHeadMainClassName,
                                      'flex-nowrap items-center gap-2.5',
                                    )}
                                    title={entry.id}
                                  >
                                    {logoUrl ?
                                      <span
                                        className={
                                          devViewPanelManageListItemLogoWrapClassName
                                        }
                                      >
                                        <img
                                          className={
                                            devViewPanelManageListItemLogoClassName
                                          }
                                          src={logoUrl}
                                          alt=''
                                        />
                                      </span>
                                    : null}
                                    <div
                                      className={
                                        devViewPanelManageListItemTextStackClassName
                                      }
                                    >
                                      <div
                                        className={
                                          devViewPanelManageListItemCopyClassName
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
                                          <span
                                            className={
                                              devViewPanelManageListItemIdClassName
                                            }
                                          >
                                            {entry.id}
                                          </span>
                                        </div>
                                        <p
                                          className={cn(
                                            devViewPanelManageListItemDescClassName,
                                            'm-0 line-clamp-1',
                                          )}
                                        >
                                          <span
                                            className={
                                              devViewPanelManageListItemMetaClassName
                                            }
                                          >
                                            {entry.clientName}
                                          </span>
                                        </p>
                                      </div>
                                      <div
                                        className={
                                          devViewPanelManageListItemStackActionsClassName
                                        }
                                      >
                                        <button
                                          type='button'
                                          className={devViewPanelBtnVariants({
                                            tone: 'secondary',
                                          })}
                                          onClick={() => {
                                            setDeletingTourId(null);
                                            setEditingTourId(null);
                                            handleSwitchTour(entry.id);
                                          }}
                                          disabled={busy}
                                        >
                                          Open
                                        </button>
                                        <button
                                          type='button'
                                          className={devViewPanelBtnVariants({
                                            tone: 'secondary',
                                          })}
                                          onClick={() =>
                                            void copyTourPublicLink(entry.id)
                                          }
                                          disabled={busy}
                                          title={`${TOUR_PUBLIC_ORIGIN}/${entry.id}`}
                                        >
                                          {(
                                            tourLinkCopyState?.id ===
                                              entry.id &&
                                            tourLinkCopyState.status ===
                                              'copied'
                                          ) ?
                                            'Copied!'
                                          : (
                                            tourLinkCopyState?.id ===
                                              entry.id &&
                                            tourLinkCopyState.status ===
                                              'failed'
                                          ) ?
                                            'Copy failed'
                                          : 'Copy link'}
                                        </button>
                                        <button
                                          type='button'
                                          className={devViewPanelBtnVariants({
                                            tone: 'secondary',
                                          })}
                                          onClick={() =>
                                            startEditTour(entry.id)
                                          }
                                          disabled={busy || isEditing}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type='button'
                                          className={devViewPanelBtnVariants({
                                            tone: 'danger',
                                          })}
                                          onClick={() =>
                                            startDeleteTour(entry.id)
                                          }
                                          disabled={busy || isDeleting}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className={
                                      devViewPanelManageListItemTourBadgesStackClassName
                                    }
                                  >
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
                                    {entry.featured ?
                                      <Badge
                                        variant='fill'
                                        size='sm'
                                        tone='none'
                                        className={devSceneManageBadgeVariants({
                                          kind: 'featured',
                                        })}
                                      >
                                        Featured
                                      </Badge>
                                    : null}
                                    <Badge
                                      variant='fill'
                                      size='sm'
                                      tone='none'
                                      className={devSceneManageBadgeVariants({
                                        kind: entry.visibility,
                                      })}
                                    >
                                      {entry.visibility === 'public' ?
                                        'Public'
                                      : entry.visibility === 'unlisted' ?
                                        'Unlisted'
                                      : 'Internal'}
                                    </Badge>
                                  </div>
                                </div>

                                {isDeleting ?
                                  <div
                                    className={cn(
                                      'mt-2 flex flex-col gap-2.5 border border-[rgba(248,113,113,0.35)] bg-[rgba(69,10,10,0.35)] p-3',
                                      devViewPanelControlRadiusClassName,
                                    )}
                                  >
                                    <h4
                                      className={
                                        devViewPanelFormGroupTitleClassName
                                      }
                                    >
                                      Danger zone
                                    </h4>
                                    <p
                                      className={
                                        devViewPanelSectionHintClassName
                                      }
                                    >
                                      Permanently deletes{' '}
                                      <code>tours/{entry.id}.json</code>,
                                      catalog entry, and{' '}
                                      <code>
                                        assets/{entry.clientId}/{entry.id}/
                                      </code>
                                      . This cannot be undone.
                                    </p>
                                    <label
                                      className={devViewPanelFieldClassName}
                                    >
                                      <span
                                        className={
                                          devViewPanelFieldLabelClassName
                                        }
                                      >
                                        Type <code>{entry.id}</code> to confirm
                                      </span>
                                      <input
                                        className={devViewPanelInputClassName}
                                        type='text'
                                        value={deleteTourConfirm}
                                        onChange={(e) =>
                                          setDeleteTourConfirm(e.target.value)
                                        }
                                        placeholder={entry.id}
                                        spellCheck={false}
                                        autoComplete='off'
                                        disabled={
                                          deleteTourStatus === 'working'
                                        }
                                      />
                                    </label>
                                    <div
                                      className={devViewPanelActionsClassName}
                                    >
                                      <button
                                        type='button'
                                        className={devViewPanelBtnVariants({
                                          tone: 'secondary',
                                        })}
                                        onClick={cancelDeleteTour}
                                        disabled={
                                          deleteTourStatus === 'working'
                                        }
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type='button'
                                        className={devViewPanelBtnVariants({
                                          tone: 'danger',
                                        })}
                                        onClick={() => void deleteManagedTour()}
                                        disabled={
                                          !canDeleteTour ||
                                          deleteTourStatus === 'working'
                                        }
                                      >
                                        {deleteTourStatus === 'working' ?
                                          'Deleting…'
                                        : 'Delete tour permanently'}
                                      </button>
                                    </div>
                                    {deleteTourError ?
                                      <p
                                        className={
                                          devViewPanelSectionHintClassName
                                        }
                                      >
                                        {deleteTourError}
                                      </p>
                                    : null}
                                  </div>
                                : null}

                                {isEditing ?
                                  <>
                                    <DevPanelFormGroup inline manageEdit>
                                      <DevPanelFormSection title='Basics'>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Tour title
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editTourTitle}
                                            onChange={(e) =>
                                              setEditTourTitle(e.target.value)
                                            }
                                            spellCheck={false}
                                            autoComplete='off'
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
                                            Tour summary (optional)
                                          </span>
                                          <textarea
                                            className={
                                              devViewPanelTextareaClassName
                                            }
                                            value={editTourSummary}
                                            onChange={(e) =>
                                              setEditTourSummary(e.target.value)
                                            }
                                            placeholder='Short marketing blurb for gallery cards and share previews'
                                            rows={2}
                                            spellCheck={true}
                                          />
                                          <p
                                            className={
                                              devViewPanelSectionHintClassName
                                            }
                                          >
                                            Stored in <code>catalog.json</code>{' '}
                                            (1–2 sentences). Not scene
                                            descriptions.
                                          </p>
                                        </label>

                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Product full name (optional)
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editTourProductFullName}
                                            onChange={(e) =>
                                              setEditTourProductFullName(
                                                e.target.value,
                                              )
                                            }
                                            placeholder='Leave empty for “{client} Virtual Tour”'
                                            spellCheck={false}
                                            autoComplete='off'
                                          />
                                        </label>
                                        <p
                                          className={
                                            devViewPanelSectionHintClassName
                                          }
                                        >
                                          Tab title, splash, and in-tour chrome
                                          preview:{' '}
                                          <strong>
                                            {editTourProductNamePreview}
                                          </strong>
                                        </p>

                                        <DevPanelFormRow>
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
                                              Category
                                            </span>
                                            <select
                                              className={
                                                devViewPanelSelectClassName
                                              }
                                              value={editTourCategory}
                                              onChange={(e) =>
                                                setEditTourCategory(
                                                  e.target
                                                    .value as TourCategory,
                                                )
                                              }
                                            >
                                              {tourCategoryOptions.map(
                                                (category) => (
                                                  <option
                                                    key={category}
                                                    value={category}
                                                  >
                                                    {category}
                                                  </option>
                                                ),
                                              )}
                                            </select>
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
                                              Catalog visibility
                                            </span>
                                            <select
                                              className={
                                                devViewPanelSelectClassName
                                              }
                                              value={editTourVisibility}
                                              onChange={(e) =>
                                                setEditTourVisibility(
                                                  e.target
                                                    .value as DevCatalogTourVisibility,
                                                )
                                              }
                                            >
                                              {DEV_CATALOG_VISIBILITY_OPTIONS.map(
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
                                        </DevPanelFormRow>

                                        <DevPanelFormRow>
                                          <div className='col-span-2 flex flex-col gap-1'>
                                            <label
                                              className={
                                                devViewPanelFormCheckboxLabelClassName
                                              }
                                            >
                                              <input
                                                className={
                                                  devViewPanelFormCheckboxInputClassName
                                                }
                                                type='checkbox'
                                                checked={editTourFeatured}
                                                onChange={(e) =>
                                                  setEditTourFeatured(
                                                    e.target.checked,
                                                  )
                                                }
                                              />
                                              <span
                                                className={
                                                  devViewPanelToggleNameClassName
                                                }
                                              >
                                                Featured on home gallery
                                              </span>
                                            </label>
                                            <p
                                              className={
                                                devViewPanelSectionHintClassName
                                              }
                                            >
                                              Badge on the card and listed first
                                              on <code>/</code>. Use{' '}
                                              <code>?featured=1</code> for a
                                              featured-only gallery.
                                            </p>
                                          </div>
                                        </DevPanelFormRow>
                                      </DevPanelFormSection>

                                      <DevPanelExperienceSection
                                        divided
                                        transitionEffect={editTransitionEffect}
                                        onTransitionEffectChange={
                                          setEditTransitionEffect
                                        }
                                        transitionSpeed={editTransitionSpeed}
                                        onTransitionSpeedChange={
                                          setEditTransitionSpeed
                                        }
                                        immersiveMode={editImmersiveMode}
                                        onImmersiveModeChange={
                                          setEditImmersiveMode
                                        }
                                        immersiveAudio={editImmersiveAudio}
                                        onImmersiveAudioChange={
                                          setEditImmersiveAudio
                                        }
                                        immersivePlaylistText={
                                          editImmersivePlaylistText
                                        }
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
                                        onImmersiveVolumeChange={
                                          setEditImmersiveVolume
                                        }
                                      />

                                      <DevPanelFormSection
                                        title='Branding'
                                        divided
                                      >
                                        <div className='flex flex-col gap-2'>
                                          <label
                                            className={
                                              devViewPanelFormCheckboxLabelClassName
                                            }
                                          >
                                            <input
                                              className={
                                                devViewPanelFormCheckboxInputClassName
                                              }
                                              type='radio'
                                              name='edit-tour-branding-mode'
                                              checked={
                                                editTourBrandingMode ===
                                                'client'
                                              }
                                              onChange={() =>
                                                setEditTourBrandingMode(
                                                  'client',
                                                )
                                              }
                                            />
                                            <span
                                              className={
                                                devViewPanelToggleNameClassName
                                              }
                                            >
                                              Use client branding (shared)
                                            </span>
                                          </label>
                                          <label
                                            className={
                                              devViewPanelFormCheckboxLabelClassName
                                            }
                                          >
                                            <input
                                              className={
                                                devViewPanelFormCheckboxInputClassName
                                              }
                                              type='radio'
                                              name='edit-tour-branding-mode'
                                              checked={
                                                editTourBrandingMode ===
                                                'custom'
                                              }
                                              onChange={() =>
                                                setEditTourBrandingMode(
                                                  'custom',
                                                )
                                              }
                                            />
                                            <span
                                              className={
                                                devViewPanelToggleNameClassName
                                              }
                                            >
                                              Custom branding for this tour only
                                            </span>
                                          </label>
                                        </div>
                                        <p
                                          className={
                                            devViewPanelSectionHintClassName
                                          }
                                        >
                                          {editTourBrandingMode === 'client' ?
                                            'Inherits shared branding from the Client tab. Switch to custom to override on this tour only.'
                                          : 'Stored on this tour JSON only — overrides the client brand.'
                                          }
                                        </p>

                                        {editTourBrandingMode === 'custom' ?
                                          <>
                                            <div className='flex flex-col gap-1'>
                                              <div
                                                className={
                                                  devViewPanelActionsClassName
                                                }
                                              >
                                                <button
                                                  type='button'
                                                  className={devViewPanelBtnVariants(
                                                    { tone: 'secondary' },
                                                  )}
                                                  onClick={() =>
                                                    void suggestEditTourBranding()
                                                  }
                                                  disabled={
                                                    !openCatalogClient?.website?.trim() ||
                                                    editTourSuggestStatus ===
                                                      'working'
                                                  }
                                                >
                                                  {(
                                                    editTourSuggestStatus ===
                                                    'working'
                                                  ) ?
                                                    'Suggesting…'
                                                  : 'Suggest from website'}
                                                </button>
                                              </div>
                                              <p
                                                className={
                                                  devViewPanelSectionHintClassName
                                                }
                                              >
                                                Uses the client website from the
                                                Client tab to draft logo,
                                                favicon, and primary color —
                                                review before saving.
                                              </p>
                                            </div>

                                            {editTourSuggestNotes.length > 0 ?
                                              <ul
                                                className={
                                                  devViewPanelSectionHintClassName
                                                }
                                              >
                                                {editTourSuggestNotes.map(
                                                  (note) => (
                                                    <li key={note}>{note}</li>
                                                  ),
                                                )}
                                              </ul>
                                            : null}

                                            <DevPanelColorField
                                              label='Primary color'
                                              value={editTourPrimaryColor}
                                              onChange={setEditTourPrimaryColor}
                                              defaultColor={
                                                DEFAULT_NEW_TOUR_PRIMARY_COLOR
                                              }
                                              pickerAriaLabel='Edit tour primary color picker'
                                            />

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
                                                Logo alt
                                              </span>
                                              <input
                                                className={
                                                  devViewPanelInputClassName
                                                }
                                                type='text'
                                                value={editTourLogoAlt}
                                                onChange={(e) =>
                                                  setEditTourLogoAlt(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder='Accessible logo label'
                                                spellCheck={false}
                                                autoComplete='off'
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
                                                Font family (CSS stack)
                                              </span>
                                              <input
                                                className={
                                                  devViewPanelInputClassName
                                                }
                                                type='text'
                                                value={editTourFontFamily}
                                                onChange={(e) =>
                                                  setEditTourFontFamily(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="'Montserrat', sans-serif"
                                                spellCheck={false}
                                                autoComplete='off'
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
                                                Google Fonts URL
                                              </span>
                                              <input
                                                className={
                                                  devViewPanelInputClassName
                                                }
                                                type='url'
                                                value={editTourFontSourceUrl}
                                                onChange={(e) =>
                                                  setEditTourFontSourceUrl(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder='https://fonts.googleapis.com/css2?family=…'
                                                spellCheck={false}
                                                autoComplete='off'
                                              />
                                            </label>
                                            <p
                                              className={
                                                devViewPanelSectionHintClassName
                                              }
                                            >
                                              Must be{' '}
                                              <code>
                                                https://fonts.googleapis.com/…
                                              </code>
                                              . Clear both font fields to revert
                                              to platform defaults.
                                            </p>

                                            <DevPanelFormRow>
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
                                                  Logo (replace)
                                                </span>
                                                <DevPanelFileField
                                                  file={editTourLogoFile}
                                                  preview={
                                                    <DevLocalFilePreview
                                                      file={editTourLogoFile}
                                                      className={
                                                        devViewPanelBrandLogoClassName
                                                      }
                                                      alt='Logo preview'
                                                    />
                                                  }
                                                  onClearPreview={() =>
                                                    setEditTourLogoFile(null)
                                                  }
                                                  showClear={Boolean(
                                                    editTourLogoFile,
                                                  )}
                                                >
                                                  <DevPanelFileInput
                                                    accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                                                    file={editTourLogoFile}
                                                    onChange={
                                                      setEditTourLogoFile
                                                    }
                                                  />
                                                </DevPanelFileField>
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
                                                  showClear={Boolean(
                                                    editTourFaviconFile,
                                                  )}
                                                >
                                                  <DevPanelFileInput
                                                    accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                                                    file={editTourFaviconFile}
                                                    onChange={
                                                      setEditTourFaviconFile
                                                    }
                                                  />
                                                </DevPanelFileField>
                                              </label>
                                            </DevPanelFormRow>
                                          </>
                                        : null}

                                        {editTourError ?
                                          <p
                                            className={
                                              devViewPanelSectionHintClassName
                                            }
                                          >
                                            {editTourError}
                                          </p>
                                        : null}

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
                                            onClick={cancelEditTour}
                                            disabled={
                                              editTourStatus === 'working'
                                            }
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'primary',
                                            })}
                                            onClick={() => void saveEditTour()}
                                            disabled={
                                              !canSaveEditTour ||
                                              editTourStatus === 'working'
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
                                    </DevPanelFormGroup>{' '}
                                  </>
                                : null}
                              </li>
                            );
                          })}
                        </ul>
                      : <p className={devViewPanelSectionHintClassName}>
                          {catalogTourManageRows.length === 0 ?
                            'No tours in the catalog yet — add one to get started.'
                          : tourManageClientFilter === 'all' ?
                            'No tours match this filter.'
                          : 'No tours for this client.'}
                        </p>
                      }
                    </DevPanelFormGroup>
                  </>
                : <>
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
                          <p className={devViewPanelSectionHintClassName}>
                            Tours belong to a catalog client. Create clients on
                            the Client tab first if needed.
                          </p>
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
                              placeholder={`Auto ${pendingTourId}`}
                              spellCheck={false}
                              autoComplete='off'
                            />
                            <p className={devViewPanelSectionHintClassName}>
                              Leave empty for an opaque id. Only fill this to
                              force a custom kebab id.
                            </p>
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
                            stable tour id <code>{newTourSlug}</code> · stable
                            scene id <code>{newFirstSceneSlug}</code> ·{' '}
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
                              tone: 'secondary',
                            })}
                            onClick={() => setTourCreateOpen(false)}
                            disabled={newTourStatus === 'working'}
                          >
                            Cancel
                          </button>
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
              <DevPanelSection
                title='Ask Guide'
                description='Show the guide, chat without OpenAI tokens, or preview frozen UI fixtures.'
              >
                <DevPanelFormGroup stacked>
                  <ul className={devViewPanelToggleListClassName}>
                    {DEV_ASK_GUIDE_FLAG_TOGGLES.map((toggle) => {
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
                </DevPanelFormGroup>
              </DevPanelSection>
            </DevPanelSectionAccordion>
          </div>
        }
      </div>
    </div>
  );
}
