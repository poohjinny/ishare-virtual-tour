import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { TOUR_CHROME_COMPACT_MAX_PX } from '../constants/tourChrome';
import { useFlipListReorder } from '../hooks/useFlipListReorder';
import { isTypingTarget } from '../utils/isTypingTarget';
import { withBaseUrl } from '../utils/assetUrl';
import {
  TOUR_BREADCRUMB_CURRENT_TOOLTIP,
  TOUR_DIRECTORY_PANEL_TITLE,
  TOUR_DIRECTORY_SECTION_LOCATIONS,
  TOUR_DIRECTORY_SECTION_NAMING,
  TOUR_DIRECTORY_TABS,
  TOUR_DIRECTORY_TAB_ORDER,
  TOUR_DIRECTORY_EMPTY_LOCATIONS,
  TOUR_DIRECTORY_EMPTY_NAMING,
  TOUR_DIRECTORY_EMPTY_NAMING_PRICE,
  TOUR_DIRECTORY_EMPTY_SEARCH,
  TOUR_DIRECTORY_GROUP_OTHER,
  exploreLocationGroupCountLabel,
  tourBreadcrumbGoToTooltip,
  type TourDirectoryTab,
} from '../constants/tourDirectory';
import {
  EXPLORE_LOCATIONS_SORT_DEFAULT,
  EXPLORE_NAMING_SORT_DEFAULT,
  exploreDirectorySortGroupsForContext,
  type ExploreDirectorySort,
  type ExploreDirectorySortContext,
} from '../constants/tourDirectorySort';
import {
  ExploreDirectoryTabLabel,
  ExploreDirectoryTabIcon,
} from './icons/ExploreDirectoryTabIcons';
import { TourMarkerIcon } from './icons/TourMarkerIcon';
import { ExploreDirectoryLead } from './ExploreDirectoryLead';
import { ExploreDirectoryPanel } from './ExploreDirectoryPanel';
import { ExploreDirectoryScrollPins } from './ExploreDirectoryScrollPins';
import { ExploreDirectoryScrollToTop } from './ExploreDirectoryScrollToTop';
import { ExploreNamingDescriptionView } from './ExploreNamingDescriptionView';
import { ExploreNamingDirectoryListItem } from './ExploreNamingDirectoryListItem';
import { ExploreNamingGalleryCard } from './ExploreNamingGalleryCard';
import { ExplorePanelSearch } from './ExplorePanelSearch';
import { ExplorePanelRefine } from './ExplorePanelRefine';
import { ExploreSceneDirectoryListItem } from './ExploreSceneDirectoryListItem';
import { ExploreSceneDescriptionView } from './ExploreSceneDescriptionView';
import { ExploreSceneDetailPanel } from './ExploreSceneDetailPanel';
import { ExploreSceneGalleryCard } from './ExploreSceneGalleryCard';
import { isPlaceOverviewHotspot } from '../utils/placeOverview';
import { findNamingHotspotInTour } from '../utils/findTourHotspot';
import { useExploreDirectoryScrollPins } from '../hooks/useExploreDirectoryScrollPins';
import { notifyExploreDirectoryScroll } from '../utils/exploreDirectoryScrollIdle';
import { TOUR_HELP_PANEL_TITLE } from '../constants/tourHelp';
import {
  TOUR_NAV_ACTION_SHARE,
  TOUR_SHARE_PANEL_TITLE,
  TOUR_SHARE_KEYBOARD_KEY,
} from '../constants/tourShare';
import {
  TOUR_NAV_ACTION_EXPLORE,
  TOUR_NAV_ACTION_HELP,
  TOUR_NAV_ACTION_MORE,
  TOUR_NAV_HISTORY_BACK,
  TOUR_NAV_HISTORY_FORWARD,
  tourNavExploreLayoutActionLabel,
  tourNavIconButtonA11y,
  type ExploreDirectoryLayout,
} from '../constants/tourNavActions';
import {
  buildAbsoluteShareUrl,
  buildShareMessage,
} from '../utils/buildShareUrl';
import { ShareTourPanel } from './ShareTourPanel';
import { ExploreLocationGroup } from './ExploreLocationGroup';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import {
  resolveBreadcrumbSiblingOptions,
  TourBreadcrumbSiblingMenu,
} from './TourBreadcrumbSiblingMenu';
import {
  buildScenePath,
  buildSceneGroups,
  buildSceneGroupSecondaryById,
  listSceneSiblings,
  sceneIdsWithTitleCollisions,
  SCENE_GROUP_OTHER_ID,
} from '../viewer-shared/sceneDepth';
import type {
  Hotspot,
  NamingOpportunityRecord,
  Scene,
  Tour,
  TourClient,
  TourViewerType,
} from '../types/tour';
import {
  buildNamingSectorGroups,
  buildTourNamingDirectory,
  filterTourNamingDirectory,
  filterTourScenes,
  sortTourNamingDirectory,
  sortTourScenes,
  type NamingSceneSubgroup,
  type TourDirectoryNamingItem,
} from '../utils/tourDirectory';
import {
  sortSceneGroupsByTourOrder,
  sortSceneIdsByTourOrder,
} from '../utils/sceneOrder';
import {
  computeNamingPriceBounds,
  filterTourNamingByPriceRange,
  formatNamingItemDisplayPrice,
  formatNamingSectorGroupTotalLabel,
  SHOW_SECTOR_NAMING_TOTAL,
} from '../utils/namingPrice';
import { SegmentedTabs } from './ui/SegmentedTabs';
import { SegmentedTabPanel } from './ui/SegmentedTabPanel';
import { ExploreLayoutPanel } from './ui/ExploreLayoutPanel';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_20,
  MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
} from './ui/materialSymbolClasses';
import { TourHelpPanel } from './TourHelpPanel';
import { TourHelpFooter } from './TourHelpFooter';
import { TourGlassPanel, type TourGlassPanelAnimation } from './TourGlassPanel';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
} from './tourGlassPanelVariants';
import { cn } from '../lib/cn';
import { ShareIcon } from './icons/ShareIcon';
import {
  tourNavActionsDockClassName,
  tourNavActionsRootClassName,
  tourNavDockOverflowWrapClassName,
  TOUR_BREADCRUMB_ATTR,
  TOUR_BREADCRUMB_BAR_ATTR,
  tourBreadcrumbSelector,
  tourBreadcrumbSiblingMenuSelector,
  tourExploreRefineMenuSelector,
  tourNavBreadcrumbAlignVariants,
  tourNavBreadcrumbBarClassName,
  tourNavBreadcrumbClassName,
  tourNavBreadcrumbCurrentClassName,
  tourNavBreadcrumbCurrentLabelClassName,
  tourNavBreadcrumbCurrentLeadClassName,
  tourNavBreadcrumbItemClassName,
  tourNavBreadcrumbLinkClassName,
  tourNavBreadcrumbListClassName,
  tourNavBreadcrumbPulseDotClassName,
  tourNavBreadcrumbRowClassName,
  tourNavBreadcrumbSepClassName,
  tourNavBreadcrumbSplitClassName,
  tourNavCircleBtnVariants,
  tourNavCircleIconClassName,
  tourNavDockOverflowItemClassName,
  tourNavDockOverflowMenuClassName,
  tourNavDirectoryPanelClassName,
  tourNavDirectoryGroupedListClassName,
  tourNavDirectorySectionClassName,
  tourNavDirectoryTabsClassName,
  tourNavEmptyClassName,
  tourNavExploreHeaderActionsClassName,
  tourNavHistoryBtnIconClassName,
  tourNavHistoryGroupBtnClassName,
  tourNavHistoryGroupClassName,
  tourNavItemLocationIconClassName,
  tourNavListClassName,
  tourNavLocationGalleryListClassName,
  tourNavLogoClassName,
  tourNavLogoLinkClassName,
  tourNavNamingSceneSubgroupsClassName,
  tourNavNamingSceneSubheaderClassName,
  tourNavDirectoryPinScrollStackClassName,
  tourNavPanelScrollClassName,
  tourNavPanelScrollInnerClassName,
  tourNavSceneDetailShellClassName,
  tourNavPanelSlotVariants,
  tourNavSectionTitleClassName,
  tourNavSectionTitleDividerLineClassName,
  tourNavSectionTitleIconClassName,
  tourNavSectionTitleLabelClassName,
  tourNavSectionTitleRowClassName,
  tourNavSectionTitleToggleClassName,
  tourNavSectionTitleToggleOpenClassName,
  tourNavSectionTitleClusterClassName,
  tourNavSectionTitleClusterButtonClassName,
  tourNavSectionTitleChevronClassName,
} from './tourNavFloatVariants';

interface TourNavFloatProps {
  scenes: Scene[];
  tourId: string;
  /** Tour-level hotspots — nav and info on `model3d` tours. */
  tourHotspots?: Hotspot[];
  tourViewerType?: TourViewerType;
  /** Tour-level naming catalog — required for Explore naming list after migrate. */
  namingOpportunities?: Record<string, NamingOpportunityRecord>;
  currentSceneId: string;
  firstSceneId: string;
  /** Author Explore / Play order — when omitted, runtime fills via nav BFS. */
  sceneOrder?: string[];
  tourTitle?: string;
  client?: TourClient;
  clientLogo?: string;
  logoAlt?: string;
  websiteUrl?: string;
  disabled?: boolean;
  /** Block naming-opportunity picks while camera / scene / panel open is in flight. */
  namingOpportunityBusy?: boolean;
  /** Catalog summary (or overview fallback) — explore panel body lead. */
  exploreLead?: string;
  showHistoryBack?: boolean;
  showHistoryForward?: boolean;
  onHistoryBack?: () => void;
  onHistoryForward?: () => void;
  onSelectScene: (sceneId: string) => void;
  onSelectNamingOpportunity: (sceneId: string, hotspotId: string) => void;
  /** Visit the place aimed at this NO hotspot — no opportunity panel. */
  onVisitNamingPlace: (sceneId: string, hotspotId: string) => void;
  onBreadcrumbNavigate: (sceneId: string) => void;
  /** Recenter the live scene to its default view — used when "Visiting" the current place. */
  onRecenterCurrentScene?: () => void;
  /** Open Ask Guide and ask about the Explore place detail. */
  onAskAboutScene?: (sceneId: string) => void;
  /** Open Ask Guide and ask about the Explore naming detail. */
  onAskAboutNaming?: (sceneId: string, namingName?: string) => void;
  /**
   * Toggle in-scene place-overview panel. Returns false when no pin exists
   * (breadcrumb falls back to Explore detail).
   */
  onTogglePlaceOverview?: () => boolean;
  /** Info hotspot id when a naming opportunity panel is open in-scene. */
  activeNamingHotspotId?: string | null;
  /** `?embed=1` — hide Share/Help FAB; PSV control pill stays on. */
  embed?: boolean;
  /** Show Play tour tips in Help when the tour has a valid play sequence. */
  showPlayTour?: boolean;
  /** Show immersive ambience tips in Help when the tour has a music bed. */
  showImmersiveAmbience?: boolean;
  /** Show Ask Tour Guide tips in Help when Guide is enabled for this tour. */
  showAskGuide?: boolean;
  panelStack?: TourPanelStack;
  /** Close in-scene anchored nav/info panels (e.g. when opening explore chrome). */
  onDismissAnchoredPanels?: () => void;
  /** True while a top-right dock panel is open or exiting (Explore / Help / Share). */
  onChromeDockOpenChange?: (open: boolean) => void;
  /** Imperative open for Guide “Open Help” / similar chrome CTAs. */
  dockActionsRef?: RefObject<TourNavDockActions | null>;
  /** Open Ask Tour Guide from Help copy (closes Help via panel mutex). */
  onOpenAskGuide?: () => void;
}

/** Force-open dock panels (does not toggle closed). */
export interface TourNavDockActions {
  openExplore: () => void;
  openHelp: () => void;
}

type PanelMode = 'explore' | 'help' | 'share' | null;
type DisplayPanel = 'explore' | 'help' | 'share' | null;
type PanelAnimPhase = 'enter' | 'exit' | 'idle';

const PANEL_ENTER_MS = 170;
const PANEL_EXIT_MS = 140;
const SEARCH_PILL_EXPAND_MS = 180;

function panelAnimation(phase: PanelAnimPhase): TourGlassPanelAnimation {
  if (phase === 'enter') return 'enter';
  if (phase === 'exit') return 'exit';
  return 'none';
}

interface BreadcrumbItem {
  id: string;
  /** Full scene title (tooltips, aria, details). */
  title: string;
  /** Visible trail label — may drop a repeated parent prefix. */
  displayTitle: string;
  isCurrent: boolean;
}

type ExploreNamingDetailTarget = { sceneId: string; hotspotId: string };

function ExploreTourIcon() {
  return (
    <MaterialSymbol
      name='map_search'
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function HelpIcon() {
  return (
    <MaterialSymbol
      name='help'
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function MoreIcon() {
  return (
    <MaterialSymbol
      name='more_horiz'
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function ShareIconButton() {
  return (
    <ShareIcon
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function HistoryBackIcon() {
  return (
    <MaterialSymbol
      name='chevron_left'
      className={tourNavHistoryBtnIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function HistoryForwardIcon() {
  return (
    <MaterialSymbol
      name='chevron_right'
      className={tourNavHistoryBtnIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function TourLocationItemIcon({ active }: { active: boolean }) {
  return (
    <TourMarkerIcon
      filled={active}
      data-tour-nav-location-icon
      className={tourNavItemLocationIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

function buildBreadcrumbItems(
  firstSceneId: string,
  scenes: Scene[],
  currentSceneId: string,
  tourHotspots?: Hotspot[],
): BreadcrumbItem[] {
  const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));
  const scenesById = Object.fromEntries(
    scenes.map((scene) => [scene.id, scene]),
  );
  const pathIds = buildScenePath(
    firstSceneId,
    scenesById,
    currentSceneId,
    tourHotspots,
  );

  return pathIds.map((sceneId, index) => {
    const scene = sceneMap.get(sceneId);
    const title = scene?.title ?? sceneId;
    return {
      id: sceneId,
      title,
      displayTitle: title,
      isCurrent: index === pathIds.length - 1,
    };
  });
}

export function TourNavFloat({
  scenes,
  tourId,
  tourHotspots,
  tourViewerType,
  namingOpportunities,
  currentSceneId,
  firstSceneId,
  sceneOrder,
  tourTitle = 'Virtual Tour',
  client,
  clientLogo,
  logoAlt,
  websiteUrl,
  disabled = false,
  namingOpportunityBusy = false,
  exploreLead,
  showHistoryBack = false,
  showHistoryForward = false,
  onHistoryBack,
  onHistoryForward,
  onSelectScene,
  onSelectNamingOpportunity: _onSelectNamingOpportunity,
  onVisitNamingPlace,
  onBreadcrumbNavigate,
  onRecenterCurrentScene,
  onAskAboutScene,
  onAskAboutNaming,
  onTogglePlaceOverview,
  activeNamingHotspotId = null,
  embed = false,
  showPlayTour = true,
  showImmersiveAmbience = true,
  showAskGuide = false,
  panelStack,
  onDismissAnchoredPanels,
  onChromeDockOpenChange,
  dockActionsRef,
  onOpenAskGuide,
}: TourNavFloatProps) {
  const { isMobile, isDesktop } = useTourChromeLayout();
  /** Location picks stay clickable during scene transitions (disabled only blocks chrome). */
  const locationNavDisabled = namingOpportunityBusy;
  const [dockOverflowOpen, setDockOverflowOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [displayPanel, setDisplayPanel] = useState<DisplayPanel>(null);
  const [panelPhase, setPanelPhase] = useState<PanelAnimPhase>('idle');
  const [exploreSearchOpen, setExploreSearchOpen] = useState(false);
  /**
   * Explore "You are here" for a naming row — set by Visit place (or detail Visit).
   * Survives panel close; cleared when leaving that NO's scene or visiting a place.
   * Pending holds a cross-scene Visit until `currentSceneId` catches up.
   */
  const [namingHereHotspotId, setNamingHereHotspotId] = useState<string | null>(
    null,
  );
  const pendingNamingHereRef = useRef<{
    sceneId: string;
    hotspotId: string;
  } | null>(null);
  const [directoryTab, setDirectoryTab] = useState<TourDirectoryTab>('all');
  const [exploreLayout, setExploreLayout] =
    useState<ExploreDirectoryLayout>('gallery');
  const [exploreLocationsSort, setExploreLocationsSort] =
    useState<ExploreDirectorySort>(EXPLORE_LOCATIONS_SORT_DEFAULT);
  const [exploreNamingSort, setExploreNamingSort] =
    useState<ExploreDirectorySort>(EXPLORE_NAMING_SORT_DEFAULT);
  const [exploreSearch, setExploreSearch] = useState('');
  const [exploreSceneDetailId, setExploreSceneDetailId] = useState<
    string | null
  >(null);
  const [exploreSceneDetailExiting, setExploreSceneDetailExiting] =
    useState(false);
  const [exploreNamingDetail, setExploreNamingDetail] =
    useState<ExploreNamingDetailTarget | null>(null);
  const [exploreNamingDetailExiting, setExploreNamingDetailExiting] =
    useState(false);
  const [exploreDirectoryEnterToken, setExploreDirectoryEnterToken] =
    useState(0);
  const [exploreSearchFocusRequest, setExploreSearchFocusRequest] = useState(0);
  const actionsRef = useRef<HTMLDivElement>(null);
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  /** Directory list scroll — survives detail + Explore close/reopen. */
  const exploreDirectoryScrollTopRef = useRef(0);
  const exploreSearchScrollRef = useRef<HTMLDivElement>(null);
  const exploreSearchRef = useRef<HTMLInputElement>(null);
  const targetPanelRef = useRef<DisplayPanel>(null);
  /** Scene / NO navigation deferred until Explore finish exiting. */
  const pendingAfterExploreExitRef = useRef<(() => void) | null>(null);

  const breadcrumbItems = useMemo(() => {
    const items = buildBreadcrumbItems(
      firstSceneId,
      scenes,
      currentSceneId,
      tourHotspots,
    );
    if (isMobile && items.length > 1) {
      return [items[items.length - 1]];
    }
    return items;
  }, [isMobile, currentSceneId, firstSceneId, scenes, tourHotspots]);

  const breadcrumbScenesById = useMemo(
    () => Object.fromEntries(scenes.map((scene) => [scene.id, scene])),
    [scenes],
  );

  const breadcrumbSiblingsById = useMemo(() => {
    const map: Record<
      string,
      ReturnType<typeof resolveBreadcrumbSiblingOptions>
    > = {};
    const orderTour = {
      scenes: breadcrumbScenesById,
      hotspots: tourHotspots,
      firstScene: firstSceneId,
      ...(sceneOrder ? { sceneOrder } : {}),
    };
    for (let index = 0; index < breadcrumbItems.length; index++) {
      const item = breadcrumbItems[index];
      const ids = sortSceneIdsByTourOrder(
        orderTour,
        listSceneSiblings(
          firstSceneId,
          breadcrumbScenesById,
          item.id,
          tourHotspots,
        ),
      );
      map[item.id] = resolveBreadcrumbSiblingOptions(ids, breadcrumbScenesById);
    }
    return map;
  }, [
    breadcrumbItems,
    breadcrumbScenesById,
    firstSceneId,
    sceneOrder,
    tourHotspots,
  ]);

  const [siblingMenuCrumbId, setSiblingMenuCrumbId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSiblingMenuCrumbId(null);
  }, [currentSceneId, isMobile, disabled]);

  useEffect(() => {
    setDockOverflowOpen(false);
  }, [panelMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const compactMq = window.matchMedia(
      `(max-width: ${TOUR_CHROME_COMPACT_MAX_PX}px)`,
    );
    const onBreakpointChange = () => setDockOverflowOpen(false);
    compactMq.addEventListener('change', onBreakpointChange);
    return () => compactMq.removeEventListener('change', onBreakpointChange);
  }, []);

  useEffect(() => {
    if (!dockOverflowOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (actionsRef.current?.contains(target)) return;
      setDockOverflowOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [dockOverflowOpen]);

  const tourDirectoryContext = useMemo(
    () => ({
      scenes: Object.fromEntries(scenes.map((scene) => [scene.id, scene])),
      hotspots: tourHotspots,
      viewerType: tourViewerType,
      namingOpportunities,
      firstScene: firstSceneId,
      sceneOrder,
    }),
    [
      firstSceneId,
      namingOpportunities,
      sceneOrder,
      scenes,
      tourHotspots,
      tourViewerType,
    ],
  );

  const exploreTour = useMemo(
    (): Tour => ({
      id: tourId,
      title: tourTitle ?? '',
      firstScene: firstSceneId,
      scenes: tourDirectoryContext.scenes,
      hotspots: tourHotspots,
      viewerType: tourViewerType,
      namingOpportunities,
      ...(sceneOrder ? { sceneOrder } : {}),
    }),
    [
      firstSceneId,
      namingOpportunities,
      sceneOrder,
      tourDirectoryContext.scenes,
      tourHotspots,
      tourId,
      tourTitle,
      tourViewerType,
    ],
  );

  const namingItems = useMemo(
    () => buildTourNamingDirectory(tourDirectoryContext),
    [tourDirectoryContext],
  );

  const exploreSceneDetail = useMemo(() => {
    if (!exploreSceneDetailId) return null;
    return scenes.find((scene) => scene.id === exploreSceneDetailId) ?? null;
  }, [exploreSceneDetailId, scenes]);

  const exploreNamingDetailView = useMemo(() => {
    if (!exploreNamingDetail) return null;
    const found = findNamingHotspotInTour(
      exploreTour,
      exploreNamingDetail.hotspotId,
    );
    if (!found) return null;
    const scene =
      exploreTour.scenes[exploreNamingDetail.sceneId] ??
      exploreTour.scenes[found.sceneId];
    if (!scene) return null;
    return {
      sceneId: exploreNamingDetail.sceneId,
      hotspotId: exploreNamingDetail.hotspotId,
      scene,
      hotspot: found.hotspot,
      detailKey: `${exploreNamingDetail.sceneId}:${exploreNamingDetail.hotspotId}`,
    };
  }, [exploreNamingDetail, exploreTour]);

  const exploreDetailOpen = Boolean(
    exploreSceneDetail || exploreNamingDetailView,
  );

  const captureExploreDirectoryScroll = useCallback(() => {
    // Detail / search use other scroll roots — keep the last directory offset.
    if (exploreSceneDetailId != null || exploreNamingDetail != null) return;
    const scrollEl = exploreScrollRef.current;
    if (!scrollEl) return;
    exploreDirectoryScrollTopRef.current = scrollEl.scrollTop;
  }, [exploreNamingDetail, exploreSceneDetailId]);

  const openExploreSceneDetail = useCallback(
    (sceneId: string) => {
      // Capture list scroll only when leaving the directory — not when swapping details.
      if (exploreSceneDetailId == null && exploreNamingDetail == null) {
        captureExploreDirectoryScroll();
      }
      setExploreNamingDetail(null);
      setExploreNamingDetailExiting(false);
      setExploreSceneDetailExiting(false);
      setExploreSceneDetailId(sceneId);
    },
    [captureExploreDirectoryScroll, exploreNamingDetail, exploreSceneDetailId],
  );

  const openExploreNamingDetail = useCallback(
    (sceneId: string, hotspotId: string) => {
      if (exploreSceneDetailId == null && exploreNamingDetail == null) {
        captureExploreDirectoryScroll();
      }
      setExploreSceneDetailId(null);
      setExploreSceneDetailExiting(false);
      setExploreNamingDetailExiting(false);
      setExploreNamingDetail({ sceneId, hotspotId });
    },
    [captureExploreDirectoryScroll, exploreNamingDetail, exploreSceneDetailId],
  );

  const requestCloseExploreSceneDetail = useCallback(() => {
    if (!exploreSceneDetailId || exploreSceneDetailExiting) return;
    setExploreSceneDetailExiting(true);
  }, [exploreSceneDetailExiting, exploreSceneDetailId]);

  const finishCloseExploreSceneDetail = useCallback(() => {
    setExploreSceneDetailId(null);
    setExploreSceneDetailExiting(false);
    setExploreDirectoryEnterToken((token) => token + 1);
  }, []);

  const requestCloseExploreNamingDetail = useCallback(() => {
    if (!exploreNamingDetail || exploreNamingDetailExiting) return;
    setExploreNamingDetailExiting(true);
  }, [exploreNamingDetail, exploreNamingDetailExiting]);

  const finishCloseExploreNamingDetail = useCallback(() => {
    setExploreNamingDetail(null);
    setExploreNamingDetailExiting(false);
    setExploreDirectoryEnterToken((token) => token + 1);
  }, []);

  // Restore directory scroll after remount (detail back or Explore reopen).
  useLayoutEffect(() => {
    if (displayPanel !== 'explore') return;
    if (exploreSceneDetailId != null || exploreNamingDetail != null) return;
    if (exploreSearch.trim().length > 0) return;

    const el = exploreScrollRef.current;
    if (!el) return;
    el.scrollTop = exploreDirectoryScrollTopRef.current;
  }, [
    displayPanel,
    exploreDirectoryEnterToken,
    exploreNamingDetail,
    exploreSceneDetailId,
    exploreSearch,
  ]);

  const currentScene = useMemo(() => {
    return scenes.find((scene) => scene.id === currentSceneId) ?? null;
  }, [currentSceneId, scenes]);

  const currentSceneTitle = currentScene?.title ?? currentSceneId;

  const placeOverviewOpen = Boolean(
    activeNamingHotspotId &&
    currentScene?.hotspots?.some(
      (hotspot) =>
        hotspot.id === activeNamingHotspotId && isPlaceOverviewHotspot(hotspot),
    ),
  );

  const activeNamingItem = useMemo(() => {
    if (!activeNamingHotspotId) return null;

    return (
      namingItems.find(
        (item) =>
          item.hotspotId === activeNamingHotspotId &&
          item.sceneId === currentSceneId,
      ) ?? null
    );
  }, [activeNamingHotspotId, currentSceneId, namingItems]);

  // Keep Explore naming "You are here" in sync with an open panel.
  useEffect(() => {
    if (!activeNamingHotspotId) return;

    setNamingHereHotspotId(activeNamingHotspotId);
    const item = namingItems.find(
      (entry) => entry.hotspotId === activeNamingHotspotId,
    );
    pendingNamingHereRef.current =
      item ? { sceneId: item.sceneId, hotspotId: item.hotspotId } : null;
  }, [activeNamingHotspotId, namingItems]);

  // Apply a pending Visit once the scene arrives; clear here after leaving it.
  useEffect(() => {
    const pending = pendingNamingHereRef.current;
    if (pending && pending.sceneId === currentSceneId) {
      setNamingHereHotspotId(pending.hotspotId);
      pendingNamingHereRef.current = null;
      return;
    }

    if (!namingHereHotspotId) return;

    const stillHere = namingItems.some(
      (item) =>
        item.hotspotId === namingHereHotspotId &&
        item.sceneId === currentSceneId,
    );
    if (!stillHere) {
      setNamingHereHotspotId(null);
    }
  }, [currentSceneId, namingHereHotspotId, namingItems]);

  const isNamingItemHere = useCallback(
    (item: TourDirectoryNamingItem) =>
      currentSceneId === item.sceneId &&
      (activeNamingHotspotId === item.hotspotId ||
        namingHereHotspotId === item.hotspotId),
    [activeNamingHotspotId, currentSceneId, namingHereHotspotId],
  );

  const shareUrl = useMemo(
    () =>
      buildAbsoluteShareUrl({
        tourId,
        sceneId: currentSceneId,
        firstSceneId,
        namingHotspotId: activeNamingHotspotId,
      }),
    [activeNamingHotspotId, currentSceneId, firstSceneId, tourId],
  );

  const shareMessage = useMemo(
    () =>
      buildShareMessage(tourTitle, currentSceneTitle, activeNamingItem?.name),
    [activeNamingItem?.name, currentSceneTitle, tourTitle],
  );

  const sharePreviewImageUrl = useMemo(() => {
    const scene = scenes.find((entry) => entry.id === currentSceneId);
    const thumbnail = scene?.thumbnail?.trim();
    if (thumbnail) return withBaseUrl(thumbnail);
    if (clientLogo?.trim()) return withBaseUrl(clientLogo);
    return undefined;
  }, [clientLogo, currentSceneId, scenes]);

  const shareContextLabel = activeNamingItem?.name ?? currentSceneTitle;

  const namingPriceBounds = useMemo(
    () => computeNamingPriceBounds(namingItems),
    [namingItems],
  );

  const [namingPriceMin, setNamingPriceMin] = useState<number | null>(null);
  const [namingPriceMax, setNamingPriceMax] = useState<number | null>(null);

  useEffect(() => {
    if (!namingPriceBounds) {
      setNamingPriceMin(null);
      setNamingPriceMax(null);
      return;
    }

    setNamingPriceMin(namingPriceBounds.min);
    setNamingPriceMax(namingPriceBounds.max);
  }, [namingPriceBounds]);

  const exploreNamingItems = useMemo(() => {
    if (
      namingPriceMin == null ||
      namingPriceMax == null ||
      !namingPriceBounds
    ) {
      return namingItems;
    }

    return filterTourNamingByPriceRange(
      namingItems,
      namingPriceMin,
      namingPriceMax,
    );
  }, [namingItems, namingPriceBounds, namingPriceMin, namingPriceMax]);

  const handleNamingPriceRangeChange = useCallback(
    (nextMin: number, nextMax: number) => {
      setNamingPriceMin(nextMin);
      setNamingPriceMax(nextMax);
    },
    [],
  );

  const exploreFilteredScenes = useMemo(
    () => filterTourScenes(scenes, exploreSearch),
    [exploreSearch, scenes],
  );

  const exploreFilteredNamingItems = useMemo(
    () => filterTourNamingDirectory(namingItems, exploreSearch),
    [exploreSearch, namingItems],
  );

  const isExploreSearchActive = exploreSearch.trim().length > 0;

  const exploreSortContext = useMemo(() => {
    if (isExploreSearchActive) return 'mixed' as const;
    if (directoryTab === 'locations') return 'locations' as const;
    if (directoryTab === 'naming') return 'naming' as const;
    return 'mixed' as const;
  }, [directoryTab, isExploreSearchActive]);

  const exploreRefineNamingAvailable = useMemo(
    () =>
      isExploreSearchActive ?
        exploreFilteredNamingItems.length > 0
      : namingItems.length > 0,
    [
      exploreFilteredNamingItems.length,
      isExploreSearchActive,
      namingItems.length,
    ],
  );

  const exploreSortGroups = useMemo(
    () =>
      exploreDirectorySortGroupsForContext(exploreSortContext).filter(
        (group) => group.id !== 'naming' || exploreRefineNamingAvailable,
      ),
    [exploreSortContext, exploreRefineNamingAvailable],
  );

  const exploreRefineContext = useMemo((): ExploreDirectorySortContext => {
    if (!exploreRefineNamingAvailable && exploreSortContext !== 'locations') {
      return 'locations';
    }
    return exploreSortContext;
  }, [exploreRefineNamingAvailable, exploreSortContext]);

  const namingPriceFilterActive = useMemo(() => {
    if (
      !namingPriceBounds ||
      namingPriceMin == null ||
      namingPriceMax == null
    ) {
      return false;
    }

    return (
      namingPriceMin > namingPriceBounds.min ||
      namingPriceMax < namingPriceBounds.max
    );
  }, [namingPriceBounds, namingPriceMax, namingPriceMin]);

  const exploreSortedScenes = useMemo(
    () =>
      sortTourScenes(
        tourDirectoryContext,
        scenes,
        exploreLocationsSort,
        firstSceneId,
      ),
    [exploreLocationsSort, firstSceneId, scenes, tourDirectoryContext],
  );

  const exploreSortedNamingItems = useMemo(
    () => sortTourNamingDirectory(exploreNamingItems, exploreNamingSort),
    [exploreNamingItems, exploreNamingSort],
  );

  const namingSectorGroups = useMemo(
    () =>
      buildNamingSectorGroups(
        { ...tourDirectoryContext, firstScene: firstSceneId },
        exploreSortedNamingItems,
        TOUR_DIRECTORY_GROUP_OTHER,
      ),
    [exploreSortedNamingItems, firstSceneId, tourDirectoryContext],
  );

  const exploreSortedFilteredScenes = useMemo(
    () =>
      sortTourScenes(
        tourDirectoryContext,
        exploreFilteredScenes,
        exploreLocationsSort,
        firstSceneId,
      ),
    [
      exploreFilteredScenes,
      exploreLocationsSort,
      firstSceneId,
      tourDirectoryContext,
    ],
  );

  const exploreSortedFilteredNamingItems = useMemo(
    () =>
      sortTourNamingDirectory(exploreFilteredNamingItems, exploreNamingSort),
    [exploreFilteredNamingItems, exploreNamingSort],
  );

  const scenesById = useMemo(
    () => Object.fromEntries(scenes.map((scene) => [scene.id, scene])),
    [scenes],
  );

  const firstScene = scenesById[firstSceneId];

  // Department groups from the nav graph — only when sorted by tour order.
  // Membership stays nav-based; member + group order follows authored sceneOrder.
  const locationGroups = useMemo(() => {
    if (exploreLocationsSort !== 'tour-order') return null;
    return sortSceneGroupsByTourOrder(
      { ...tourDirectoryContext, firstScene: firstSceneId },
      buildSceneGroups(
        tourDirectoryContext,
        scenesById,
        firstSceneId,
        TOUR_DIRECTORY_GROUP_OTHER,
      ),
    );
  }, [exploreLocationsSort, firstSceneId, scenesById, tourDirectoryContext]);

  const sceneGroupSecondaryById = useMemo(
    () =>
      buildSceneGroupSecondaryById(
        tourDirectoryContext,
        scenesById,
        firstSceneId,
        TOUR_DIRECTORY_GROUP_OTHER,
      ),
    [firstSceneId, scenesById, tourDirectoryContext],
  );

  const collidingSceneTitleIds = useMemo(
    () => sceneIdsWithTitleCollisions(scenes),
    [scenes],
  );

  const isLocationsGroupingActive =
    !isExploreSearchActive &&
    locationGroups !== null &&
    locationGroups.some((group) => group.id !== SCENE_GROUP_OTHER_ID);

  const currentGroupId = useMemo(() => {
    if (!locationGroups) return null;
    return (
      locationGroups.find((group) =>
        group.scenes.some((scene) => scene.id === currentSceneId),
      )?.id ?? null
    );
  }, [locationGroups, currentSceneId]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedNamingGroups, setExpandedNamingGroups] = useState<Set<string>>(
    new Set(),
  );

  const exploreDirectoryPinContentKey = useMemo(
    () =>
      [
        exploreSceneDetailId ?? '',
        exploreNamingDetail ?
          `${exploreNamingDetail.sceneId}:${exploreNamingDetail.hotspotId}`
        : '',
        currentSceneId,
        isExploreSearchActive ? 's' : 'd',
        directoryTab,
        exploreLayout,
        exploreLocationsSort,
        exploreNamingSort,
        exploreSortedScenes.length,
        exploreSortedNamingItems.length,
        isLocationsGroupingActive ? 'g' : 'f',
        [...expandedGroups].join(','),
        [...expandedNamingGroups].join(','),
      ].join('|'),
    [
      exploreSceneDetailId,
      exploreNamingDetail,
      currentSceneId,
      isExploreSearchActive,
      directoryTab,
      exploreLayout,
      exploreLocationsSort,
      exploreNamingSort,
      exploreSortedScenes.length,
      exploreSortedNamingItems.length,
      isLocationsGroupingActive,
      expandedGroups,
      expandedNamingGroups,
    ],
  );

  const exploreSearchPinContentKey = useMemo(
    () =>
      [
        exploreSearch,
        exploreSortedFilteredScenes.length,
        exploreSortedFilteredNamingItems.length,
      ].join('|'),
    [
      exploreSearch,
      exploreSortedFilteredScenes.length,
      exploreSortedFilteredNamingItems.length,
    ],
  );

  const { pins: exploreDirectoryPins, updatePins: updateExploreDirectoryPins } =
    useExploreDirectoryScrollPins(
      exploreScrollRef,
      exploreDirectoryPinContentKey,
    );

  const { pins: exploreSearchPins, updatePins: updateExploreSearchPins } =
    useExploreDirectoryScrollPins(
      exploreSearchScrollRef,
      exploreSearchPinContentKey,
    );

  // After scroll restore / scene changes, remeasure pins against live DOM.
  useLayoutEffect(() => {
    if (displayPanel !== 'explore') return;
    if (exploreSceneDetailId != null || exploreNamingDetail != null) return;
    if (isExploreSearchActive) {
      updateExploreSearchPins();
      return;
    }
    updateExploreDirectoryPins();
  }, [
    currentSceneId,
    displayPanel,
    exploreDirectoryEnterToken,
    exploreNamingDetail,
    exploreSceneDetailId,
    isExploreSearchActive,
    updateExploreDirectoryPins,
    updateExploreSearchPins,
  ]);

  const currentGroupIdRef = useRef(currentGroupId);
  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
  }, [currentGroupId]);

  // Idle only: first Explore open expands the current Places group. Naming
  // groups stay collapsed — sharing sector ids must not auto-open NO sections.
  const exploreOpen = panelMode === 'explore';
  const didIdleExpandExploreGroupsRef = useRef(false);
  useEffect(() => {
    if (!exploreOpen || didIdleExpandExploreGroupsRef.current) return;
    const groupId = currentGroupIdRef.current;
    if (!groupId) return;

    didIdleExpandExploreGroupsRef.current = true;
    setExpandedGroups((prev) => {
      if (prev.has(groupId)) return prev;
      const next = new Set(prev);
      next.add(groupId);
      return next;
    });
  }, [exploreOpen]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const toggleNamingGroup = useCallback((groupId: string) => {
    setExpandedNamingGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const setLocationGroupsExpanded = useCallback(
    (expanded: boolean) => {
      if (!locationGroups?.length) return;
      setExpandedGroups(() => {
        if (!expanded) return new Set();
        return new Set(locationGroups.map((group) => group.id));
      });
    },
    [locationGroups],
  );

  const setNamingGroupsExpanded = useCallback(
    (expanded: boolean) => {
      if (!namingSectorGroups.length) return;
      setExpandedNamingGroups(() => {
        if (!expanded) return new Set();
        return new Set(namingSectorGroups.map((group) => group.id));
      });
    },
    [namingSectorGroups],
  );

  const locationGroupsAnyExpanded =
    Boolean(locationGroups?.length) &&
    locationGroups!.some((group) => expandedGroups.has(group.id));

  const namingGroupsAnyExpanded =
    namingSectorGroups.length > 0 &&
    namingSectorGroups.some((group) => expandedNamingGroups.has(group.id));

  const locationsGalleryListRef = useRef<HTMLUListElement>(null);
  const locationsListRef = useRef<HTMLUListElement>(null);
  const namingGalleryListRef = useRef<HTMLUListElement>(null);
  const namingListRef = useRef<HTMLUListElement>(null);
  /** Sector-grouped naming — FLIP across nested lists (shared flat refs are suppressed). */
  const namingGroupedRootRef = useRef<HTMLDivElement>(null);

  const locationsOrderKey = exploreLocationsSort;
  const namingOrderKey = `${exploreNamingSort}:${namingPriceMin ?? ''}:${namingPriceMax ?? ''}`;
  const namingGroupedFlipEnabled =
    !isExploreSearchActive &&
    exploreSceneDetailId == null &&
    exploreNamingDetail == null &&
    (directoryTab === 'all' || directoryTab === 'naming');

  useFlipListReorder(
    locationsGalleryListRef,
    locationsOrderKey,
    exploreLayout === 'gallery',
  );
  useFlipListReorder(
    locationsListRef,
    locationsOrderKey,
    exploreLayout === 'list',
  );
  useFlipListReorder(
    namingGalleryListRef,
    namingOrderKey,
    exploreLayout === 'gallery' && !namingGroupedFlipEnabled,
  );
  useFlipListReorder(
    namingListRef,
    namingOrderKey,
    exploreLayout === 'list' && !namingGroupedFlipEnabled,
  );
  useFlipListReorder(
    namingGroupedRootRef,
    namingOrderKey,
    namingGroupedFlipEnabled,
  );
  const targetPanel = panelMode;

  targetPanelRef.current = targetPanel;

  const requestExploreSearchFocus = () => {
    setExploreSearchFocusRequest((count) => count + 1);
  };

  const closeExploreSearch = useCallback(() => {
    exploreSearchRef.current?.blur();
    setExploreSearchOpen(false);
    panelStack?.closePanel('explore-search');
  }, [panelStack]);

  const closePanel = useCallback(() => {
    setPanelMode((current) => {
      if (current) panelStack?.closePanel(current);
      return null;
    });
    panelStack?.closePanel('explore-search');
    closeExploreSearch();
  }, [closeExploreSearch, panelStack]);

  /**
   * Close Explore (if open), then run `action` after the exit animation so the
   * panorama doesn't start moving under a still-visible panel.
   */
  const closeExploreThen = useCallback(
    (action: () => void) => {
      const exploreOpen = panelMode === 'explore' || displayPanel === 'explore';
      if (!exploreOpen) {
        pendingAfterExploreExitRef.current = null;
        action();
        return;
      }

      captureExploreDirectoryScroll();
      pendingAfterExploreExitRef.current = action;
      closePanel();
    },
    [captureExploreDirectoryScroll, closePanel, displayPanel, panelMode],
  );

  const activatePanel = useCallback(
    (next: Exclude<PanelMode, null>) => {
      setPanelMode((current) => {
        if (current === next) {
          if (current === 'explore') {
            captureExploreDirectoryScroll();
          }
          panelStack?.closePanel(next);
          panelStack?.closePanel('explore-search');
          return null;
        }

        onDismissAnchoredPanels?.();
        if (current) panelStack?.closePanel(current);
        panelStack?.openPanel(next);
        return next;
      });
    },
    [captureExploreDirectoryScroll, onDismissAnchoredPanels, panelStack],
  );

  /** Open a dock panel without toggling closed when already open. */
  const openDockPanel = useCallback(
    (next: Exclude<PanelMode, null>) => {
      if (embed && (next === 'help' || next === 'share')) return;
      setPanelMode((current) => {
        if (current === next) return current;
        onDismissAnchoredPanels?.();
        if (current === 'explore') {
          captureExploreDirectoryScroll();
        }
        if (current) panelStack?.closePanel(current);
        panelStack?.openPanel(next);
        return next;
      });
    },
    [captureExploreDirectoryScroll, embed, onDismissAnchoredPanels, panelStack],
  );

  useEffect(() => {
    if (!dockActionsRef) return;
    dockActionsRef.current = {
      openExplore: () => openDockPanel('explore'),
      openHelp: () => openDockPanel('help'),
    };
    return () => {
      dockActionsRef.current = null;
    };
  }, [dockActionsRef, openDockPanel]);

  /**
   * Open Explore to the place-detail view for a scene — used by the breadcrumb
   * so current-scene copy is one tap away without browsing the directory first.
   * Toggles closed when that same detail is already showing.
   */
  const openExploreWithSceneDetail = useCallback(
    (sceneId: string) => {
      const exploreVisible =
        panelMode === 'explore' || displayPanel === 'explore';
      const showingSameDetail =
        exploreVisible &&
        exploreSceneDetailId === sceneId &&
        !exploreSceneDetailExiting;

      if (showingSameDetail) {
        // Keep detail mounted through the panel exit — clearing it first flashes
        // the directory/gallery under the closing animation.
        closePanel();
        return;
      }

      closeExploreSearch();
      openExploreSceneDetail(sceneId);
      setPanelMode((current) => {
        if (current === 'explore') return 'explore';
        onDismissAnchoredPanels?.();
        if (current) panelStack?.closePanel(current);
        panelStack?.openPanel('explore');
        return 'explore';
      });
    },
    [
      closeExploreSearch,
      closePanel,
      displayPanel,
      exploreSceneDetailExiting,
      exploreSceneDetailId,
      onDismissAnchoredPanels,
      openExploreSceneDetail,
      panelMode,
      panelStack,
    ],
  );

  /**
   * Breadcrumb info — prefer in-scene place-overview; fall back to Explore detail
   * when the scene has no auto pin (e.g. no description / NO body, or suppressed).
   */
  const handleBreadcrumbSceneDetails = useCallback(() => {
    if (onTogglePlaceOverview?.()) {
      if (panelMode === 'explore' || displayPanel === 'explore') {
        closePanel();
      }
      return;
    }
    openExploreWithSceneDetail(currentSceneId);
  }, [
    closePanel,
    currentSceneId,
    displayPanel,
    onTogglePlaceOverview,
    openExploreWithSceneDetail,
    panelMode,
  ]);

  /** Sibling-menu info — current scene prefers place-overview; others open Explore detail. */
  const handleSiblingMenuShowDetails = useCallback(
    (sceneId: string) => {
      if (sceneId === currentSceneId) {
        handleBreadcrumbSceneDetails();
        return;
      }
      openExploreWithSceneDetail(sceneId);
    },
    [currentSceneId, handleBreadcrumbSceneDetails, openExploreWithSceneDetail],
  );

  const siblingMenuDetailSceneId =
    (
      (panelMode === 'explore' || displayPanel === 'explore') &&
      exploreSceneDetailId &&
      !exploreSceneDetailExiting
    ) ?
      exploreSceneDetailId
    : placeOverviewOpen ? currentSceneId
    : null;

  useEffect(() => {
    if (targetPanel === displayPanel) {
      return;
    }

    if (targetPanel === null) {
      if (!displayPanel) return;

      setPanelPhase('exit');
      const timer = window.setTimeout(() => {
        setDisplayPanel(null);
        setPanelPhase('idle');
      }, PANEL_EXIT_MS);

      return () => window.clearTimeout(timer);
    }

    if (displayPanel !== null) {
      setPanelPhase('exit');
      const nextPanel = targetPanel;
      const timer = window.setTimeout(() => {
        if (targetPanelRef.current !== nextPanel) return;

        setDisplayPanel(nextPanel);
        setPanelPhase('enter');
      }, PANEL_EXIT_MS);

      return () => window.clearTimeout(timer);
    }

    setDisplayPanel(targetPanel);
    setPanelPhase('enter');
  }, [targetPanel, displayPanel]);

  useEffect(() => {
    if (panelPhase !== 'enter') return;

    const timer = window.setTimeout(
      () => setPanelPhase('idle'),
      PANEL_ENTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [panelPhase]);

  useEffect(() => {
    if (!exploreSearchOpen || exploreSearchFocusRequest === 0) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      exploreSearchRef.current?.focus();
    }, SEARCH_PILL_EXPAND_MS);

    return () => window.clearTimeout(focusTimer);
  }, [exploreSearchOpen, exploreSearchFocusRequest]);

  useEffect(() => {
    if (!panelStack) return;

    return panelStack.registerPanel('explore-search', closeExploreSearch);
  }, [closeExploreSearch, panelStack]);

  useEffect(() => {
    if (!embed) return;
    setPanelMode((current) =>
      current === 'help' || current === 'share' ? null : current,
    );
  }, [embed]);

  useEffect(() => {
    if (!panelStack) return;

    const unregisterExplore = panelStack.registerPanel('explore', () => {
      setPanelMode((current) => (current === 'explore' ? null : current));
      closeExploreSearch();
    });

    if (embed) {
      return unregisterExplore;
    }

    const unregisterHelp = panelStack.registerPanel('help', () => {
      setPanelMode((current) => (current === 'help' ? null : current));
    });
    const unregisterShare = panelStack.registerPanel('share', () => {
      setPanelMode((current) => (current === 'share' ? null : current));
    });

    return () => {
      unregisterExplore();
      unregisterHelp();
      unregisterShare();
    };
  }, [closeExploreSearch, embed, panelStack]);

  // Ask Guide FAB bubble shares the right rail — hide it while dock chrome is up.
  useEffect(() => {
    onChromeDockOpenChange?.(panelMode !== null || displayPanel !== null);
  }, [displayPanel, onChromeDockOpenChange, panelMode]);

  useEffect(() => {
    if (panelMode === null) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (actionsRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        (target.closest(tourExploreRefineMenuSelector) ||
          target.closest(tourBreadcrumbSelector) ||
          target.closest(tourBreadcrumbSiblingMenuSelector))
      ) {
        return;
      }

      closePanel();
    };

    // Capture phase so anchored viewer panels (nav/NO popups) that
    // stopPropagation on bubble still dismiss this panel like any outside click.
    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () =>
      document.removeEventListener(
        'pointerdown',
        handlePointerDownOutside,
        true,
      );
  }, [closePanel, panelMode]);

  useEffect(() => {
    if (exploreSearchOpen) return;

    setExploreSearch('');
  }, [exploreSearchOpen]);

  useEffect(() => {
    // Wait until Explore is fully off-screen — clearing detail when panelMode
    // flips would flash the directory list during the exit animation.
    if (displayPanel === 'explore') return;

    const pending = pendingAfterExploreExitRef.current;
    if (pending) {
      pendingAfterExploreExitRef.current = null;
      pending();
    }

    closeExploreSearch();
    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
    setExploreNamingDetailExiting(false);
    setExploreNamingDetail(null);
  }, [closeExploreSearch, displayPanel]);

  useEffect(() => {
    if (!isExploreSearchActive) return;

    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
    setExploreNamingDetailExiting(false);
    setExploreNamingDetail(null);
  }, [isExploreSearchActive]);

  const handleSelect = (sceneId: string) => {
    pendingNamingHereRef.current = null;
    setNamingHereHotspotId(null);

    const shouldRecenter = sceneId === currentSceneId;
    closeExploreThen(() => {
      if (shouldRecenter) {
        onRecenterCurrentScene?.();
      } else {
        onSelectScene(sceneId);
      }
    });
  };

  /** Breadcrumb jump — leave Explore so the panel doesn't outlive the move.
   *  Same scene re-snaps the camera to the place default view. */
  const handleBreadcrumbNavigate = useCallback(
    (sceneId: string) => {
      const shouldRecenter = sceneId === currentSceneId;
      closeExploreThen(() => {
        if (shouldRecenter) {
          onRecenterCurrentScene?.();
        } else {
          onBreadcrumbNavigate(sceneId);
        }
      });
    },
    [
      closeExploreThen,
      currentSceneId,
      onBreadcrumbNavigate,
      onRecenterCurrentScene,
    ],
  );

  const handleExploreSceneDetailVisit = useCallback(() => {
    if (!exploreSceneDetailId) return;

    const sceneId = exploreSceneDetailId;
    const shouldRecenter = sceneId === currentSceneId;
    // Keep detail mounted while Explore exits; detail resets when displayPanel
    // leaves 'explore'. Scene change waits until the panel is gone.
    closeExploreThen(() => {
      if (shouldRecenter) {
        onRecenterCurrentScene?.();
      } else {
        onSelectScene(sceneId);
      }
    });
  }, [
    closeExploreThen,
    currentSceneId,
    exploreSceneDetailId,
    onRecenterCurrentScene,
    onSelectScene,
  ]);

  const handleExploreNamingDetailVisit = useCallback(() => {
    if (!exploreNamingDetail) return;

    const { sceneId, hotspotId } = exploreNamingDetail;
    pendingNamingHereRef.current = { sceneId, hotspotId };
    if (sceneId === currentSceneId) {
      setNamingHereHotspotId(hotspotId);
      pendingNamingHereRef.current = null;
    }

    closeExploreThen(() => {
      onVisitNamingPlace(sceneId, hotspotId);
    });
  }, [
    closeExploreThen,
    currentSceneId,
    exploreNamingDetail,
    onVisitNamingPlace,
  ]);

  const handleExploreSceneDetailAsk = useCallback(() => {
    if (!exploreSceneDetailId || !onAskAboutScene) return;
    const sceneId = exploreSceneDetailId;
    closeExploreThen(() => {
      onAskAboutScene(sceneId);
    });
  }, [closeExploreThen, exploreSceneDetailId, onAskAboutScene]);

  const handleExploreNamingDetailAsk = useCallback(() => {
    if (!exploreNamingDetail || !onAskAboutNaming) return;
    const { sceneId } = exploreNamingDetail;
    const namingName =
      exploreNamingDetailView?.hotspot.popup?.title?.trim() ||
      exploreNamingDetailView?.hotspot.label?.trim();
    closeExploreThen(() => {
      onAskAboutNaming(sceneId, namingName);
    });
  }, [
    closeExploreThen,
    exploreNamingDetail,
    exploreNamingDetailView,
    onAskAboutNaming,
  ]);

  const handleExploreClick = useCallback(() => {
    activatePanel('explore');
  }, [activatePanel]);

  const handleHelpClick = useCallback(() => {
    activatePanel('help');
  }, [activatePanel]);

  const handleShareClick = useCallback(() => {
    activatePanel('share');
  }, [activatePanel]);

  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 'e') {
        event.preventDefault();
        handleExploreClick();
        return;
      }
      if (!embed && key === TOUR_SHARE_KEYBOARD_KEY) {
        event.preventDefault();
        handleShareClick();
        return;
      }
      if (!embed && key === 'h') {
        event.preventDefault();
        handleHelpClick();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, embed, handleExploreClick, handleHelpClick, handleShareClick]);

  const logoImage = clientLogo && (
    <img
      className={tourNavLogoClassName}
      src={clientLogo}
      alt={logoAlt ?? ''}
    />
  );

  const logoNode =
    clientLogo ?
      websiteUrl ?
        <a
          className={tourNavLogoLinkClassName}
          href={websiteUrl}
          target='_blank'
          rel='noopener noreferrer'
          onClick={(e) => e.stopPropagation()}
        >
          {logoImage}
        </a>
      : <div className={tourNavLogoLinkClassName}>{logoImage}</div>
    : null;

  const handleSelectNaming = (sceneId: string, hotspotId: string) => {
    if (disabled || namingOpportunityBusy) return;
    openExploreNamingDetail(sceneId, hotspotId);
  };

  const handleVisitNamingPlace = (sceneId: string, hotspotId: string) => {
    if (disabled || namingOpportunityBusy) return;

    pendingNamingHereRef.current = { sceneId, hotspotId };
    if (sceneId === currentSceneId) {
      setNamingHereHotspotId(hotspotId);
      pendingNamingHereRef.current = null;
    }

    closeExploreThen(() => {
      onVisitNamingPlace(sceneId, hotspotId);
    });
  };

  const openExploreSearch = useCallback(() => {
    setExploreSearchOpen(true);
    panelStack?.openPanel('explore-search');
    requestExploreSearchFocus();
  }, [panelStack]);

  const toggleExploreLayout = useCallback(() => {
    setExploreLayout((layout) => (layout === 'gallery' ? 'list' : 'gallery'));
  }, []);

  const renderDirectoryTabs = () => (
    <SegmentedTabs
      className={tourNavDirectoryTabsClassName}
      aria-label='Tour directory filters'
      tabs={TOUR_DIRECTORY_TABS.map((tab) => ({
        id: tab.id,
        label: (
          <ExploreDirectoryTabLabel
            tab={tab.id}
            label={isMobile && tab.shortLabel ? tab.shortLabel : tab.label}
          />
        ),
        htmlId: `tour-nav-directory-tab-${tab.id}`,
        ariaControls: `tour-nav-directory-panel-${tab.id}`,
      }))}
      value={directoryTab}
      onChange={setDirectoryTab}
      disabled={disabled}
      scrollable
      scrollToStartKey='all'
    />
  );

  const renderDirectorySectionHeading = (
    headingId: string,
    tab: 'locations' | 'naming',
    label: string,
    options?: {
      denseBottom?: boolean;
      /** When set, the label cluster expands/collapses every group in the section. */
      groupsToggle?: {
        /** True when any group is open — Collapse all is the default action. */
        anyExpanded: boolean;
        onToggle: () => void;
      };
    },
  ) => {
    const groupsToggle = options?.groupsToggle;
    const tooltipLabel =
      groupsToggle?.anyExpanded ? `Collapse ${label}` : `Expand ${label}`;

    const titleBlock = (
      <h3 id={headingId} className={tourNavSectionTitleClassName}>
        <span className={tourNavSectionTitleIconClassName} aria-hidden='true'>
          <ExploreDirectoryTabIcon tab={tab} sizePx={MATERIAL_SYMBOL_SIZE_18} />
        </span>
        <span
          className={tourNavSectionTitleLabelClassName}
          data-directory-pin-label=''
        >
          {label}
        </span>
      </h3>
    );

    const chevron =
      groupsToggle ?
        <span
          className={cn(
            tourNavSectionTitleToggleClassName,
            groupsToggle.anyExpanded && tourNavSectionTitleToggleOpenClassName,
          )}
          aria-hidden='true'
        >
          <MaterialSymbol
            name='chevron_right'
            sizePx={MATERIAL_SYMBOL_SIZE_20}
            className={tourNavSectionTitleChevronClassName}
          />
        </span>
      : null;

    const cluster =
      groupsToggle ?
        <IconTooltip label={tooltipLabel} placement='top' disabled={disabled}>
          <button
            type='button'
            className={tourNavSectionTitleClusterButtonClassName}
            data-directory-pin-section-toggle=''
            aria-expanded={groupsToggle.anyExpanded}
            aria-label={tooltipLabel}
            disabled={disabled}
            onClick={groupsToggle.onToggle}
          >
            {titleBlock}
            {chevron}
          </button>
        </IconTooltip>
      : <span className={tourNavSectionTitleClusterClassName}>
          {titleBlock}
        </span>;

    return (
      <div
        className={cn(
          tourNavSectionTitleRowClassName,
          options?.denseBottom && 'mb-0',
        )}
        data-directory-pin-source='section'
        data-directory-pin-row=''
        data-directory-pin-tab={tab}
        data-directory-pin-key={`section-${tab}`}
        {...(options?.denseBottom ?
          { 'data-directory-pin-dense-bottom': '' }
        : {})}
      >
        <span
          className={tourNavSectionTitleDividerLineClassName}
          aria-hidden='true'
        />
        {cluster}
        <span
          className={tourNavSectionTitleDividerLineClassName}
          aria-hidden='true'
        />
      </div>
    );
  };

  const renderLocationsList = (
    items: Scene[],
    options?: {
      showSectionTitle?: boolean;
      emptyMessage?: string;
      listBodyOnly?: boolean;
      /** Search results — list rows only (no gallery cards). */
      listOnly?: boolean;
      /** Grouped mode renders many lists — skip the shared FLIP reorder refs. */
      suppressReorderRef?: boolean;
      /**
       * When false, skip floor/department secondary (rows already under a group
       * header). Default true — show context when titles collide.
       */
      showGroupContext?: boolean;
    },
  ) => {
    const showGroupContext = options?.showGroupContext !== false;

    const showGallery = !options?.listOnly && exploreLayout === 'gallery';
    const showList = options?.listOnly || exploreLayout === 'list';

    const listBody =
      items.length > 0 ?
        <>
          {showGallery ?
            <ul
              ref={
                options?.suppressReorderRef ? undefined : (
                  locationsGalleryListRef
                )
              }
              className={tourNavLocationGalleryListClassName}
              role='listbox'
              aria-label={TOUR_DIRECTORY_SECTION_LOCATIONS}
            >
              {items.map((scene) => {
                const contextLabel =
                  showGroupContext && collidingSceneTitleIds.has(scene.id) ?
                    sceneGroupSecondaryById[scene.id]
                  : undefined;

                return (
                  <ExploreSceneGalleryCard
                    key={scene.id}
                    tourId={tourId}
                    scene={scene}
                    tourTitle={tourTitle}
                    tourHotspots={tourHotspots}
                    tourViewerType={tourViewerType}
                    namingOpportunities={namingOpportunities}
                    active={scene.id === currentSceneId}
                    isTourStart={scene.id === firstSceneId}
                    contextLabel={contextLabel}
                    disabled={locationNavDisabled}
                    onSelect={() => handleSelect(scene.id)}
                    onShowDescription={() => openExploreSceneDetail(scene.id)}
                  />
                );
              })}
            </ul>
          : null}
          {showList ?
            <ul
              ref={options?.suppressReorderRef ? undefined : locationsListRef}
              className={tourNavListClassName}
              role='listbox'
              aria-label={TOUR_DIRECTORY_SECTION_LOCATIONS}
            >
              {items.map((scene) => {
                const contextLabel =
                  showGroupContext && collidingSceneTitleIds.has(scene.id) ?
                    sceneGroupSecondaryById[scene.id]
                  : undefined;

                return (
                  <ExploreSceneDirectoryListItem
                    key={scene.id}
                    tourId={tourId}
                    scene={scene}
                    tourTitle={tourTitle}
                    tourHotspots={tourHotspots}
                    tourViewerType={tourViewerType}
                    namingOpportunities={namingOpportunities}
                    active={scene.id === currentSceneId}
                    isTourStart={scene.id === firstSceneId}
                    contextLabel={contextLabel}
                    disabled={locationNavDisabled}
                    onSelect={() => handleSelect(scene.id)}
                    onShowDescription={() => openExploreSceneDetail(scene.id)}
                    locationIcon={
                      <TourLocationItemIcon
                        active={scene.id === currentSceneId}
                      />
                    }
                  />
                );
              })}
            </ul>
          : null}
        </>
      : options?.emptyMessage ?
        <p className={tourNavEmptyClassName}>{options.emptyMessage}</p>
      : null;

    if (options?.listBodyOnly) {
      return listBody;
    }

    return (
      <section
        className={tourNavDirectorySectionClassName}
        aria-labelledby={
          options?.showSectionTitle ?
            'tour-nav-directory-locations-heading'
          : undefined
        }
      >
        {options?.showSectionTitle &&
          renderDirectorySectionHeading(
            'tour-nav-directory-locations-heading',
            'locations',
            TOUR_DIRECTORY_SECTION_LOCATIONS,
          )}

        {listBody}
      </section>
    );
  };

  const renderNamingList = (
    items: TourDirectoryNamingItem[],
    options?: {
      showSectionTitle?: boolean;
      emptyMessage?: string;
      listBodyOnly?: boolean;
      /** Search results — list rows only (no gallery cards). */
      listOnly?: boolean;
      suppressReorderRef?: boolean;
      /** List view only: split rows under per-scene subheaders (place names). */
      sceneSubgroups?: NamingSceneSubgroup[];
    },
  ) => {
    const renderNamingRow = (
      item: TourDirectoryNamingItem,
      showLocation: boolean,
    ) => (
      <ExploreNamingDirectoryListItem
        key={`${item.sceneId}:${item.hotspotId}`}
        tourId={tourId}
        item={item}
        scene={scenesById[item.sceneId]}
        tourViewerType={tourViewerType}
        active={isNamingItemHere(item)}
        priceLabel={formatNamingItemDisplayPrice(item)}
        disabled={disabled || namingOpportunityBusy}
        showLocation={showLocation}
        onSelect={() => handleSelectNaming(item.sceneId, item.hotspotId)}
        onVisitPlace={() =>
          handleVisitNamingPlace(item.sceneId, item.hotspotId)
        }
      />
    );

    const showGallery = !options?.listOnly && exploreLayout === 'gallery';
    const showList = options?.listOnly || exploreLayout === 'list';
    const subgroups = options?.sceneSubgroups;

    const listView =
      subgroups ?
        <div className={tourNavNamingSceneSubgroupsClassName}>
          {subgroups.map((subgroup) => (
            <div key={subgroup.sceneId}>
              <p className={tourNavNamingSceneSubheaderClassName}>
                {subgroup.sceneTitle}
              </p>
              <ul
                className={tourNavListClassName}
                role='listbox'
                aria-label={subgroup.sceneTitle}
              >
                {subgroup.items.map((item) => renderNamingRow(item, false))}
              </ul>
            </div>
          ))}
        </div>
      : <ul
          ref={options?.suppressReorderRef ? undefined : namingListRef}
          className={tourNavListClassName}
          role='listbox'
          aria-label={TOUR_DIRECTORY_SECTION_NAMING}
        >
          {items.map((item) => renderNamingRow(item, true))}
        </ul>;

    const listBody =
      items.length > 0 ?
        <>
          {showGallery ?
            <ul
              ref={
                options?.suppressReorderRef ? undefined : namingGalleryListRef
              }
              className={tourNavLocationGalleryListClassName}
              role='listbox'
              aria-label={TOUR_DIRECTORY_SECTION_NAMING}
            >
              {items.map((item) => (
                <ExploreNamingGalleryCard
                  key={`${item.sceneId}:${item.hotspotId}`}
                  tourId={tourId}
                  tourViewerType={tourViewerType}
                  directoryTour={{
                    ...tourDirectoryContext,
                    firstScene: firstSceneId,
                  }}
                  scenes={scenes}
                  item={item}
                  active={isNamingItemHere(item)}
                  disabled={disabled || namingOpportunityBusy}
                  onSelect={() =>
                    handleSelectNaming(item.sceneId, item.hotspotId)
                  }
                  onVisitPlace={() =>
                    handleVisitNamingPlace(item.sceneId, item.hotspotId)
                  }
                />
              ))}
            </ul>
          : null}
          {showList ? listView : null}
        </>
      : options?.emptyMessage ?
        <p className={tourNavEmptyClassName}>{options.emptyMessage}</p>
      : null;

    if (options?.listBodyOnly) {
      return listBody;
    }

    return (
      <section
        className={tourNavDirectorySectionClassName}
        aria-labelledby={
          options?.showSectionTitle ?
            'tour-nav-directory-naming-heading'
          : undefined
        }
      >
        {options?.showSectionTitle &&
          renderDirectorySectionHeading(
            'tour-nav-directory-naming-heading',
            'naming',
            TOUR_DIRECTORY_SECTION_NAMING,
          )}

        {listBody}
      </section>
    );
  };

  const renderDirectoryBody = () => {
    return renderExploreDirectory();
  };

  const renderGroupedLocations = (options?: { sectionGroupLead?: boolean }) => (
    <>
      {firstScene ?
        <ExploreLayoutPanel layout={exploreLayout} className='mb-6'>
          {renderLocationsList([firstScene], {
            listBodyOnly: true,
            suppressReorderRef: true,
          })}
        </ExploreLayoutPanel>
      : null}
      <div
        className={tourNavDirectoryGroupedListClassName({
          sectionLead: options?.sectionGroupLead,
        })}
      >
        {locationGroups?.map((group) => (
          <ExploreLocationGroup
            key={group.id}
            title={group.title}
            metaLabel={exploreLocationGroupCountLabel(group.scenes.length)}
            expanded={expandedGroups.has(group.id)}
            regionId={`tour-nav-loc-group-${group.id}`}
            headingId={`tour-nav-loc-group-heading-${group.id}`}
            disabled={disabled}
            onToggle={() => toggleGroup(group.id)}
          >
            <ExploreLayoutPanel layout={exploreLayout}>
              {renderLocationsList(group.scenes, {
                listBodyOnly: true,
                suppressReorderRef: true,
                showGroupContext: false,
              })}
            </ExploreLayoutPanel>
          </ExploreLocationGroup>
        ))}
      </div>
    </>
  );

  const renderGroupedNaming = (options?: {
    emptyMessage?: string;
    sectionGroupLead?: boolean;
  }) => {
    if (exploreSortedNamingItems.length === 0) {
      return options?.emptyMessage ?
          <p className={tourNavEmptyClassName}>{options.emptyMessage}</p>
        : null;
    }

    return (
      <>
        <div
          ref={namingGroupedRootRef}
          className={tourNavDirectoryGroupedListClassName({
            sectionLead: options?.sectionGroupLead,
          })}
        >
          {namingSectorGroups.map((group) => (
            <ExploreLocationGroup
              key={group.id}
              title={group.title}
              metaLabel={
                SHOW_SECTOR_NAMING_TOTAL ?
                  formatNamingSectorGroupTotalLabel(group.total)
                : undefined
              }
              expanded={expandedNamingGroups.has(group.id)}
              regionId={`tour-nav-naming-group-${group.id}`}
              headingId={`tour-nav-naming-group-heading-${group.id}`}
              disabled={disabled}
              onToggle={() => toggleNamingGroup(group.id)}
            >
              <ExploreLayoutPanel layout={exploreLayout}>
                {renderNamingList(group.items, {
                  listBodyOnly: true,
                  suppressReorderRef: true,
                  sceneSubgroups: group.sceneSubgroups,
                })}
              </ExploreLayoutPanel>
            </ExploreLocationGroup>
          ))}
        </div>
      </>
    );
  };

  const renderExploreDirectory = () => {
    const showLocations =
      directoryTab === 'all' || directoryTab === 'locations';
    const showNaming = directoryTab === 'all' || directoryTab === 'naming';
    const showSectionTitles = directoryTab === 'all';

    return (
      <SegmentedTabPanel
        panelKey={directoryTab}
        tabOrder={TOUR_DIRECTORY_TAB_ORDER}
        id={`tour-nav-directory-panel-${directoryTab}`}
        aria-labelledby={`tour-nav-directory-tab-${directoryTab}`}
        className={tourNavDirectoryPanelClassName}
        scrollRef={exploreScrollRef}
      >
        {showLocations && (
          <section
            className={tourNavDirectorySectionClassName}
            aria-labelledby={
              showSectionTitles ?
                'tour-nav-directory-locations-heading'
              : undefined
            }
          >
            {showSectionTitles &&
              renderDirectorySectionHeading(
                'tour-nav-directory-locations-heading',
                'locations',
                TOUR_DIRECTORY_SECTION_LOCATIONS,
                {
                  groupsToggle:
                    isLocationsGroupingActive && locationGroups?.length ?
                      {
                        anyExpanded: locationGroupsAnyExpanded,
                        onToggle: () =>
                          setLocationGroupsExpanded(!locationGroupsAnyExpanded),
                      }
                    : undefined,
                },
              )}
            {isLocationsGroupingActive ?
              renderGroupedLocations({
                sectionGroupLead: showSectionTitles && !firstScene,
              })
            : <ExploreLayoutPanel layout={exploreLayout}>
                {renderLocationsList(exploreSortedScenes, {
                  listBodyOnly: true,
                  emptyMessage: TOUR_DIRECTORY_EMPTY_LOCATIONS,
                })}
              </ExploreLayoutPanel>
            }
          </section>
        )}

        {showNaming && (
          <section
            className={tourNavDirectorySectionClassName}
            aria-labelledby={
              showSectionTitles ?
                'tour-nav-directory-naming-heading'
              : undefined
            }
          >
            {showSectionTitles &&
              renderDirectorySectionHeading(
                'tour-nav-directory-naming-heading',
                'naming',
                TOUR_DIRECTORY_SECTION_NAMING,
                {
                  groupsToggle:
                    namingSectorGroups.length > 0 ?
                      {
                        anyExpanded: namingGroupsAnyExpanded,
                        onToggle: () =>
                          setNamingGroupsExpanded(!namingGroupsAnyExpanded),
                      }
                    : undefined,
                },
              )}

            <ExploreLayoutPanel layout={exploreLayout}>
              {renderGroupedNaming({
                sectionGroupLead: showSectionTitles,
                emptyMessage:
                  namingItems.length === 0 ?
                    TOUR_DIRECTORY_EMPTY_NAMING
                  : TOUR_DIRECTORY_EMPTY_NAMING_PRICE,
              })}
            </ExploreLayoutPanel>
          </section>
        )}
      </SegmentedTabPanel>
    );
  };

  const renderDirectorySearchResults = (
    sceneResults: Scene[],
    namingResults: TourDirectoryNamingItem[],
  ) => {
    const hasScenes = sceneResults.length > 0;
    const hasNaming = namingResults.length > 0;

    if (!hasScenes && !hasNaming) {
      return (
        <p className={tourNavEmptyClassName}>{TOUR_DIRECTORY_EMPTY_SEARCH}</p>
      );
    }

    return (
      <div className={tourNavDirectoryPanelClassName}>
        {hasScenes && (
          <section
            className={tourNavDirectorySectionClassName}
            aria-labelledby='tour-nav-search-locations-heading'
          >
            {renderDirectorySectionHeading(
              'tour-nav-search-locations-heading',
              'locations',
              TOUR_DIRECTORY_SECTION_LOCATIONS,
            )}
            <ExploreLayoutPanel layout='list'>
              {renderLocationsList(sceneResults, {
                listBodyOnly: true,
                listOnly: true,
              })}
            </ExploreLayoutPanel>
          </section>
        )}

        {hasNaming && (
          <section
            className={tourNavDirectorySectionClassName}
            aria-labelledby='tour-nav-search-naming-heading'
          >
            {renderDirectorySectionHeading(
              'tour-nav-search-naming-heading',
              'naming',
              TOUR_DIRECTORY_SECTION_NAMING,
            )}
            <ExploreLayoutPanel layout='list'>
              {renderNamingList(namingResults, {
                listBodyOnly: true,
                listOnly: true,
              })}
            </ExploreLayoutPanel>
          </section>
        )}
      </div>
    );
  };

  const renderExplorePanel = () => (
    <div
      id='tour-nav-explore-panel'
      className={tourNavPanelSlotVariants({ panel: 'explore' })}
    >
      <TourGlassPanel
        className='tour-glass-panel--directory'
        title={TOUR_DIRECTORY_PANEL_TITLE}
        titleId='tour-nav-explore-title'
        onClose={closePanel}
        headerActions={
          <div className={tourNavExploreHeaderActionsClassName}>
            {!exploreDetailOpen ?
              <>
                <ExplorePanelSearch
                  open={exploreSearchOpen}
                  value={exploreSearch}
                  disabled={disabled}
                  inputRef={exploreSearchRef}
                  onOpen={openExploreSearch}
                  onClose={closeExploreSearch}
                  onChange={setExploreSearch}
                />
                {exploreSortGroups.length > 0 ?
                  <ExplorePanelRefine
                    context={exploreRefineContext}
                    locationsSort={exploreLocationsSort}
                    namingSort={exploreNamingSort}
                    groups={exploreSortGroups}
                    namingPriceBounds={namingPriceBounds}
                    namingPriceMin={namingPriceMin}
                    namingPriceMax={namingPriceMax}
                    namingPriceFilterActive={
                      exploreRefineNamingAvailable && namingPriceFilterActive
                    }
                    showGroupHeadings={exploreSortContext === 'mixed'}
                    disabled={disabled}
                    onLocationsSortChange={setExploreLocationsSort}
                    onNamingSortChange={setExploreNamingSort}
                    onNamingPriceRangeChange={handleNamingPriceRangeChange}
                  />
                : null}
                {!isExploreSearchActive ?
                  <IconTooltip
                    label={tourNavExploreLayoutActionLabel(exploreLayout)}
                    placement='left'
                  >
                    <button
                      type='button'
                      className={tourGlassPanelCloseClassName}
                      onClick={toggleExploreLayout}
                      aria-pressed={exploreLayout === 'list'}
                      {...tourNavIconButtonA11y(
                        tourNavExploreLayoutActionLabel(exploreLayout),
                      )}
                    >
                      {exploreLayout === 'gallery' ?
                        <MaterialSymbol
                          name='view_list'
                          className={tourGlassPanelCloseIconClassName}
                          sizePx={MATERIAL_SYMBOL_SIZE_CHROME_HEADER}
                        />
                      : <MaterialSymbol
                          name='grid_view'
                          className={tourGlassPanelCloseIconClassName}
                          sizePx={MATERIAL_SYMBOL_SIZE_CHROME_HEADER}
                        />
                      }
                    </button>
                  </IconTooltip>
                : null}
              </>
            : null}
          </div>
        }
        animation={panelAnimation(panelPhase)}
        bodyClassName='tour-glass-panel__body--directory'
      >
        {exploreSceneDetail ?
          <div
            ref={exploreScrollRef}
            className={tourNavSceneDetailShellClassName}
          >
            <ExploreSceneDetailPanel
              detailKey={exploreSceneDetail.id}
              exiting={exploreSceneDetailExiting}
              onExitComplete={finishCloseExploreSceneDetail}
            >
              <ExploreSceneDescriptionView
                tourId={tourId}
                scene={exploreSceneDetail}
                tourTitle={tourTitle}
                tourHotspots={tourHotspots}
                tourViewerType={tourViewerType}
                namingOpportunities={namingOpportunities}
                active={exploreSceneDetail.id === currentSceneId}
                disabled={locationNavDisabled}
                onBack={requestCloseExploreSceneDetail}
                onVisit={handleExploreSceneDetailVisit}
                onAskGuide={
                  onAskAboutScene ? handleExploreSceneDetailAsk : undefined
                }
              />
            </ExploreSceneDetailPanel>
          </div>
        : exploreNamingDetailView ?
          <div
            ref={exploreScrollRef}
            className={tourNavSceneDetailShellClassName}
          >
            <ExploreSceneDetailPanel
              detailKey={exploreNamingDetailView.detailKey}
              exiting={exploreNamingDetailExiting}
              onExitComplete={finishCloseExploreNamingDetail}
            >
              <ExploreNamingDescriptionView
                tour={exploreTour}
                scene={exploreNamingDetailView.scene}
                hotspot={exploreNamingDetailView.hotspot}
                active={
                  currentSceneId === exploreNamingDetailView.sceneId &&
                  (activeNamingHotspotId ===
                    exploreNamingDetailView.hotspotId ||
                    namingHereHotspotId === exploreNamingDetailView.hotspotId)
                }
                disabled={disabled || namingOpportunityBusy}
                onBack={requestCloseExploreNamingDetail}
                onVisit={handleExploreNamingDetailVisit}
                onAskGuide={
                  onAskAboutNaming ? handleExploreNamingDetailAsk : undefined
                }
              />
            </ExploreSceneDetailPanel>
          </div>
        : isExploreSearchActive ?
          <div className={tourNavDirectoryPinScrollStackClassName}>
            <ExploreDirectoryScrollPins
              pins={exploreSearchPins}
              scrollRef={exploreSearchScrollRef}
            />
            <div
              id='tour-nav-explore-search-results'
              ref={exploreSearchScrollRef}
              className={tourNavPanelScrollClassName}
              role='region'
              aria-label='Search results'
              onScroll={() => {
                notifyExploreDirectoryScroll();
                updateExploreSearchPins();
              }}
            >
              <div className={tourNavPanelScrollInnerClassName}>
                {renderDirectorySearchResults(
                  exploreSortedFilteredScenes,
                  exploreSortedFilteredNamingItems,
                )}
              </div>
            </div>
            <ExploreDirectoryScrollToTop scrollRef={exploreSearchScrollRef} />
          </div>
        : <ExploreDirectoryPanel enterToken={exploreDirectoryEnterToken}>
            {exploreLead ?
              <ExploreDirectoryLead text={exploreLead} />
            : null}
            {renderDirectoryTabs()}

            <div className={tourNavDirectoryPinScrollStackClassName}>
              <ExploreDirectoryScrollPins
                pins={exploreDirectoryPins}
                scrollRef={exploreScrollRef}
              />
              <div
                ref={exploreScrollRef}
                className={tourNavPanelScrollClassName}
                onScroll={(event) => {
                  exploreDirectoryScrollTopRef.current =
                    event.currentTarget.scrollTop;
                  notifyExploreDirectoryScroll();
                  updateExploreDirectoryPins();
                }}
              >
                <div className={tourNavPanelScrollInnerClassName}>
                  {renderDirectoryBody()}
                </div>
              </div>
              <ExploreDirectoryScrollToTop scrollRef={exploreScrollRef} />
            </div>
          </ExploreDirectoryPanel>
        }
      </TourGlassPanel>
    </div>
  );

  return (
    <>
      <nav
        {...{ [TOUR_BREADCRUMB_ATTR]: '' }}
        className={cn(
          tourNavBreadcrumbClassName,
          tourNavBreadcrumbAlignVariants({
            align: isDesktop ? 'center' : 'start',
          }),
        )}
        aria-label='Tour location'
      >
        <div className={tourNavBreadcrumbRowClassName}>
          {(showHistoryBack || showHistoryForward) && (
            <div
              className={tourNavHistoryGroupClassName}
              role='group'
              aria-label='View history'
            >
              {showHistoryBack ?
                <IconTooltip
                  label={TOUR_NAV_HISTORY_BACK}
                  placement='bottom'
                  disabled={disabled}
                >
                  <button
                    type='button'
                    className={tourNavHistoryGroupBtnClassName}
                    disabled={disabled}
                    onClick={onHistoryBack}
                    {...tourNavIconButtonA11y(TOUR_NAV_HISTORY_BACK)}
                  >
                    <HistoryBackIcon />
                  </button>
                </IconTooltip>
              : null}
              {showHistoryForward ?
                <IconTooltip
                  label={TOUR_NAV_HISTORY_FORWARD}
                  placement='bottom'
                  disabled={disabled}
                >
                  <button
                    type='button'
                    className={tourNavHistoryGroupBtnClassName}
                    disabled={disabled}
                    onClick={onHistoryForward}
                    {...tourNavIconButtonA11y(TOUR_NAV_HISTORY_FORWARD)}
                  >
                    <HistoryForwardIcon />
                  </button>
                </IconTooltip>
              : null}
            </div>
          )}

          <div
            {...{ [TOUR_BREADCRUMB_BAR_ATTR]: '' }}
            className={tourNavBreadcrumbBarClassName}
          >
            <ol className={tourNavBreadcrumbListClassName}>
              {breadcrumbItems.map((item, index) => {
                const siblings = breadcrumbSiblingsById[item.id] ?? [];
                const showSiblingMenu = siblings.length > 1;
                const siblingMenuOpen = siblingMenuCrumbId === item.id;

                return (
                  <li key={item.id} className={tourNavBreadcrumbItemClassName}>
                    {index > 0 && (
                      <span
                        className={tourNavBreadcrumbSepClassName}
                        aria-hidden='true'
                      >
                        ›
                      </span>
                    )}
                    {item.isCurrent ?
                      <span
                        className={tourNavBreadcrumbCurrentClassName}
                        aria-current='location'
                      >
                        <span className={tourNavBreadcrumbCurrentLeadClassName}>
                          <span
                            key={currentSceneId}
                            className={tourNavBreadcrumbPulseDotClassName}
                            aria-hidden='true'
                          />
                          {showSiblingMenu ?
                            <TourBreadcrumbSiblingMenu
                              crumbId={item.id}
                              label={item.displayTitle}
                              siblings={siblings}
                              variant='current'
                              open={siblingMenuOpen}
                              disabled={disabled}
                              detailSceneId={siblingMenuDetailSceneId}
                              onOpenChange={(open) =>
                                setSiblingMenuCrumbId(open ? item.id : null)
                              }
                              onSelect={handleBreadcrumbNavigate}
                              onShowDetails={handleSiblingMenuShowDetails}
                            />
                          : <span
                              className={cn(
                                tourNavBreadcrumbSplitClassName,
                                'gap-0.5',
                              )}
                            >
                              <IconTooltip
                                label={
                                  item.displayTitle !== item.title ?
                                    item.title
                                  : TOUR_BREADCRUMB_CURRENT_TOOLTIP
                                }
                                placement='bottom'
                              >
                                <span
                                  className={
                                    tourNavBreadcrumbCurrentLabelClassName
                                  }
                                >
                                  {item.displayTitle}
                                </span>
                              </IconTooltip>
                              <ExploreSceneInfoButton
                                sceneTitle={item.title}
                                variant='breadcrumb'
                                disabled={disabled}
                                expanded={siblingMenuDetailSceneId === item.id}
                                tooltipPlacement='bottom'
                                onShow={() =>
                                  handleSiblingMenuShowDetails(item.id)
                                }
                              />
                            </span>
                          }
                        </span>
                      </span>
                    : showSiblingMenu ?
                      <TourBreadcrumbSiblingMenu
                        crumbId={item.id}
                        label={item.displayTitle}
                        siblings={siblings}
                        variant='ancestor'
                        open={siblingMenuOpen}
                        disabled={disabled}
                        detailSceneId={siblingMenuDetailSceneId}
                        onOpenChange={(open) =>
                          setSiblingMenuCrumbId(open ? item.id : null)
                        }
                        onSelect={handleBreadcrumbNavigate}
                        onShowDetails={handleSiblingMenuShowDetails}
                      />
                    : <span
                        className={cn(
                          tourNavBreadcrumbSplitClassName,
                          'gap-0.5',
                        )}
                      >
                        <IconTooltip
                          label={tourBreadcrumbGoToTooltip(item.title)}
                          placement='bottom'
                          disabled={disabled}
                        >
                          <button
                            type='button'
                            className={tourNavBreadcrumbLinkClassName}
                            disabled={disabled}
                            onClick={() => handleBreadcrumbNavigate(item.id)}
                          >
                            {item.displayTitle}
                          </button>
                        </IconTooltip>
                        <ExploreSceneInfoButton
                          sceneTitle={item.title}
                          variant='breadcrumb'
                          disabled={disabled}
                          expanded={siblingMenuDetailSceneId === item.id}
                          tooltipPlacement='bottom'
                          onShow={() => handleSiblingMenuShowDetails(item.id)}
                        />
                      </span>
                    }
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </nav>

      <div className={tourNavActionsRootClassName} ref={actionsRef}>
        {displayPanel === 'explore' && renderExplorePanel()}

        {displayPanel === 'help' && !embed && (
          <div
            id='tour-nav-help-panel'
            className={tourNavPanelSlotVariants({ panel: 'help' })}
          >
            <TourGlassPanel
              title={TOUR_HELP_PANEL_TITLE}
              titleId='tour-nav-help-title'
              onClose={closePanel}
              animation={panelAnimation(panelPhase)}
              bodyClassName='tour-glass-panel__body--help'
              footer={<TourHelpFooter />}
            >
              <TourHelpPanel
                tourTitle={tourTitle}
                client={client}
                logo={logoNode}
                viewerType={tourViewerType}
                showPlayTour={showPlayTour}
                showImmersiveAmbience={showImmersiveAmbience}
                showAskGuide={showAskGuide}
                onOpenExplore={() => openDockPanel('explore')}
                onOpenAskGuide={onOpenAskGuide}
              />
            </TourGlassPanel>
          </div>
        )}

        {displayPanel === 'share' && !embed && (
          <div
            id='tour-nav-share-panel'
            className={tourNavPanelSlotVariants({ panel: 'share' })}
          >
            <TourGlassPanel
              title={TOUR_SHARE_PANEL_TITLE}
              titleId='tour-nav-share-title'
              onClose={closePanel}
              animation={panelAnimation(panelPhase)}
              bodyClassName='tour-glass-panel__body--share'
            >
              <ShareTourPanel
                contextLabel={shareContextLabel}
                shareUrl={shareUrl}
                message={shareMessage}
                previewImageUrl={sharePreviewImageUrl}
              />
            </TourGlassPanel>
          </div>
        )}

        <div className={tourNavActionsDockClassName}>
          <IconTooltip label={TOUR_NAV_ACTION_EXPLORE} placement='left'>
            <button
              type='button'
              className={tourNavCircleBtnVariants({
                active: panelMode === 'explore',
              })}
              onClick={handleExploreClick}
              aria-expanded={panelMode === 'explore'}
              aria-controls='tour-nav-explore-panel'
              {...tourNavIconButtonA11y(TOUR_NAV_ACTION_EXPLORE)}
            >
              <ExploreTourIcon />
            </button>
          </IconTooltip>

          {!embed &&
            (!isMobile ?
              <>
                <IconTooltip label={TOUR_NAV_ACTION_SHARE} placement='left'>
                  <button
                    type='button'
                    className={tourNavCircleBtnVariants({
                      active: panelMode === 'share',
                    })}
                    onClick={handleShareClick}
                    aria-expanded={panelMode === 'share'}
                    aria-controls='tour-nav-share-panel'
                    {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SHARE)}
                  >
                    <ShareIconButton />
                  </button>
                </IconTooltip>

                <IconTooltip label={TOUR_NAV_ACTION_HELP} placement='left'>
                  <button
                    type='button'
                    className={tourNavCircleBtnVariants({
                      active: panelMode === 'help',
                    })}
                    onClick={handleHelpClick}
                    aria-expanded={panelMode === 'help'}
                    aria-controls='tour-nav-help-panel'
                    {...tourNavIconButtonA11y(TOUR_NAV_ACTION_HELP)}
                  >
                    <HelpIcon />
                  </button>
                </IconTooltip>
              </>
            : <div className={tourNavDockOverflowWrapClassName}>
                <IconTooltip label={TOUR_NAV_ACTION_MORE} placement='left'>
                  <button
                    type='button'
                    className={tourNavCircleBtnVariants({
                      active: dockOverflowOpen,
                    })}
                    onClick={() => setDockOverflowOpen((open) => !open)}
                    aria-expanded={dockOverflowOpen}
                    aria-haspopup='menu'
                    {...tourNavIconButtonA11y(TOUR_NAV_ACTION_MORE)}
                  >
                    <MoreIcon />
                  </button>
                </IconTooltip>

                {dockOverflowOpen && (
                  <ul
                    className={tourNavDockOverflowMenuClassName}
                    role='menu'
                    aria-label={TOUR_NAV_ACTION_MORE}
                  >
                    <li role='none'>
                      <button
                        type='button'
                        role='menuitem'
                        className={tourNavDockOverflowItemClassName}
                        onClick={() => {
                          setDockOverflowOpen(false);
                          handleShareClick();
                        }}
                      >
                        <ShareIconButton />
                        {TOUR_NAV_ACTION_SHARE}
                      </button>
                    </li>
                    <li role='none'>
                      <button
                        type='button'
                        role='menuitem'
                        className={tourNavDockOverflowItemClassName}
                        onClick={() => {
                          setDockOverflowOpen(false);
                          handleHelpClick();
                        }}
                      >
                        <HelpIcon />
                        {TOUR_NAV_ACTION_HELP}
                      </button>
                    </li>
                  </ul>
                )}
              </div>)}
        </div>
      </div>
    </>
  );
}
