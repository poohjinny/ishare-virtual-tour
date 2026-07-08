import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { TOUR_CHROME_COMPACT_MAX_PX } from '../constants/tourChrome';
import { useFlipListReorder } from '../hooks/useFlipListReorder';
import { isTypingTarget } from '../utils/isTypingTarget';
import { withBaseUrl } from '../utils/assetUrl';
import {
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
  type TourDirectoryTab,
} from '../constants/tourDirectory';
import {
  EXPLORE_LOCATIONS_SORT_DEFAULT,
  EXPLORE_NAMING_SORT_DEFAULT,
  exploreDirectorySortGroupsForContext,
  type ExploreDirectorySort,
  type ExploreDirectorySortContext,
} from '../constants/tourDirectorySort';
import { ExploreDirectoryTabLabel } from './icons/ExploreDirectoryTabIcons';
import { TourMarkerIcon } from './icons/TourMarkerIcon';
import { ExploreDirectoryLead } from './ExploreDirectoryLead';
import { ExploreDirectoryPanel } from './ExploreDirectoryPanel';
import { ExploreNamingDirectoryListItem } from './ExploreNamingDirectoryListItem';
import { ExploreNamingGalleryCard } from './ExploreNamingGalleryCard';
import { ExplorePanelSearch } from './ExplorePanelSearch';
import { ExplorePanelRefine } from './ExplorePanelRefine';
import { ExploreSceneDirectoryListItem } from './ExploreSceneDirectoryListItem';
import { ExploreSceneDescriptionView } from './ExploreSceneDescriptionView';
import { ExploreSceneDetailPanel } from './ExploreSceneDetailPanel';
import { ExploreSceneGalleryCard } from './ExploreSceneGalleryCard';
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
import {
  buildScenePath,
  buildSceneGroups,
  SCENE_GROUP_OTHER_ID,
} from '../viewer/sceneDepth';
import type { Hotspot, Scene, TourClient, TourViewerType } from '../types/tour';
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
  MATERIAL_SYMBOL_SIZE_20,
  MATERIAL_SYMBOL_SIZE_22,
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
  tourExploreRefineMenuSelector,
  tourNavBreadcrumbAlignVariants,
  tourNavBreadcrumbBarClassName,
  tourNavBreadcrumbClassName,
  tourNavBreadcrumbCurrentClassName,
  tourNavBreadcrumbCurrentLabelClassName,
  tourNavBreadcrumbItemClassName,
  tourNavBreadcrumbLinkClassName,
  tourNavBreadcrumbListClassName,
  tourNavBreadcrumbPulseDotClassName,
  tourNavBreadcrumbRowClassName,
  tourNavBreadcrumbSepClassName,
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
  tourNavPanelScrollClassName,
  tourNavPanelScrollInnerClassName,
  tourNavPanelSlotVariants,
  tourNavSectionTitleClassName,
} from './tourNavFloatVariants';

interface TourNavFloatProps {
  scenes: Scene[];
  tourId: string;
  /** Tour-level hotspots — nav and info on `model3d` tours. */
  tourHotspots?: Hotspot[];
  tourViewerType?: TourViewerType;
  currentSceneId: string;
  firstSceneId: string;
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
  onBreadcrumbNavigate: (sceneId: string) => void;
  /** Recenter the live scene to its default view — used when "Visiting" the current place. */
  onRecenterCurrentScene?: () => void;
  /** Info hotspot id when a naming opportunity panel is open in-scene. */
  activeNamingHotspotId?: string | null;
  /** `?embed=1` — hide Share/Help FAB; PSV control pill stays on. */
  embed?: boolean;
  panelStack?: TourPanelStack;
  /** Close in-scene anchored nav/info panels (e.g. when opening explore chrome). */
  onDismissAnchoredPanels?: () => void;
}

type PanelMode = 'explore' | 'help' | 'share' | null;
type DisplayPanel = 'explore' | 'help' | 'share' | null;
type PanelAnimPhase = 'enter' | 'exit' | 'idle';

const PANEL_ENTER_MS = 150;
const PANEL_EXIT_MS = 140;
const SEARCH_PILL_EXPAND_MS = 180;

function panelAnimation(phase: PanelAnimPhase): TourGlassPanelAnimation {
  if (phase === 'enter') return 'enter';
  if (phase === 'exit') return 'exit';
  return 'none';
}

interface BreadcrumbItem {
  id: string;
  title: string;
  isCurrent: boolean;
}

function ExploreTourIcon() {
  return (
    <MaterialSymbol
      name='map_search'
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function HelpIcon() {
  return (
    <MaterialSymbol
      name='help'
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function MoreIcon() {
  return (
    <MaterialSymbol
      name='more_horiz'
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function ShareIconButton() {
  return (
    <ShareIcon
      className={tourNavCircleIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function HistoryBackIcon() {
  return (
    <MaterialSymbol
      name='chevron_left'
      className={tourNavHistoryBtnIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}

function HistoryForwardIcon() {
  return (
    <MaterialSymbol
      name='chevron_right'
      className={tourNavHistoryBtnIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
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
    return {
      id: sceneId,
      title: scene?.title ?? sceneId,
      isCurrent: index === pathIds.length - 1,
    };
  });
}

export function TourNavFloat({
  scenes,
  tourId,
  tourHotspots,
  tourViewerType,
  currentSceneId,
  firstSceneId,
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
  onSelectNamingOpportunity,
  onBreadcrumbNavigate,
  onRecenterCurrentScene,
  activeNamingHotspotId = null,
  embed = false,
  panelStack,
  onDismissAnchoredPanels,
}: TourNavFloatProps) {
  const { isMobile, isDesktop } = useTourChromeLayout();
  /** Location picks stay clickable during scene transitions (disabled only blocks chrome). */
  const locationNavDisabled = namingOpportunityBusy;
  const [dockOverflowOpen, setDockOverflowOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [displayPanel, setDisplayPanel] = useState<DisplayPanel>(null);
  const [panelPhase, setPanelPhase] = useState<PanelAnimPhase>('idle');
  const [exploreSearchOpen, setExploreSearchOpen] = useState(false);
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
  const [exploreDirectoryEnterToken, setExploreDirectoryEnterToken] =
    useState(0);
  const [exploreSearchFocusRequest, setExploreSearchFocusRequest] = useState(0);
  const actionsRef = useRef<HTMLDivElement>(null);
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const exploreSearchScrollRef = useRef<HTMLDivElement>(null);
  const exploreSearchRef = useRef<HTMLInputElement>(null);
  const targetPanelRef = useRef<DisplayPanel>(null);

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
    }),
    [scenes, tourHotspots, tourViewerType],
  );

  const namingItems = useMemo(
    () => buildTourNamingDirectory(tourDirectoryContext),
    [tourDirectoryContext],
  );

  const exploreSceneDetail = useMemo(() => {
    if (!exploreSceneDetailId) return null;
    return scenes.find((scene) => scene.id === exploreSceneDetailId) ?? null;
  }, [exploreSceneDetailId, scenes]);

  const openExploreSceneDetail = useCallback((sceneId: string) => {
    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(sceneId);
    exploreScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const requestCloseExploreSceneDetail = useCallback(() => {
    if (!exploreSceneDetailId || exploreSceneDetailExiting) return;
    setExploreSceneDetailExiting(true);
  }, [exploreSceneDetailExiting, exploreSceneDetailId]);

  const finishCloseExploreSceneDetail = useCallback(() => {
    setExploreSceneDetailId(null);
    setExploreSceneDetailExiting(false);
    setExploreDirectoryEnterToken((token) => token + 1);
  }, []);

  const currentSceneTitle = useMemo(() => {
    return (
      scenes.find((scene) => scene.id === currentSceneId)?.title ??
      currentSceneId
    );
  }, [currentSceneId, scenes]);

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
  const locationGroups = useMemo(() => {
    if (exploreLocationsSort !== 'tour-order') return null;
    return buildSceneGroups(
      tourDirectoryContext,
      scenesById,
      firstSceneId,
      TOUR_DIRECTORY_GROUP_OTHER,
    );
  }, [exploreLocationsSort, firstSceneId, scenesById, tourDirectoryContext]);

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

  const currentGroupIdRef = useRef(currentGroupId);
  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
  }, [currentGroupId]);

  // Expand the current scene's group only when Explore opens. Expanding on
  // every scene change (while open) would reflow the list and jump the scroll.
  const exploreOpen = panelMode === 'explore';
  useEffect(() => {
    if (!exploreOpen) return;
    const groupId = currentGroupIdRef.current;
    if (!groupId) return;
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

  const [collapsedNamingGroups, setCollapsedNamingGroups] = useState<
    Set<string>
  >(new Set());

  const toggleNamingGroup = useCallback((groupId: string) => {
    setCollapsedNamingGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const locationsGalleryListRef = useRef<HTMLUListElement>(null);
  const locationsListRef = useRef<HTMLUListElement>(null);
  const namingGalleryListRef = useRef<HTMLUListElement>(null);
  const namingListRef = useRef<HTMLUListElement>(null);

  const locationsOrderKey = exploreLocationsSort;
  const namingOrderKey = `${exploreNamingSort}:${namingPriceMin ?? ''}:${namingPriceMax ?? ''}`;

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
    exploreLayout === 'gallery',
  );
  useFlipListReorder(namingListRef, namingOrderKey, exploreLayout === 'list');

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

  const activatePanel = useCallback(
    (next: Exclude<PanelMode, null>) => {
      setPanelMode((current) => {
        if (current === next) {
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
    [onDismissAnchoredPanels, panelStack],
  );

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

  useEffect(() => {
    if (panelMode === null) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (actionsRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest(tourExploreRefineMenuSelector)
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
    if (panelMode === 'explore') return;

    closeExploreSearch();
    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
  }, [closeExploreSearch, panelMode]);

  useEffect(() => {
    if (!isExploreSearchActive) return;

    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
  }, [isExploreSearchActive]);

  useEffect(() => {
    if (panelMode !== null) return;

    setDirectoryTab('all');
  }, [panelMode]);

  const handleSelect = (sceneId: string) => {
    if (sceneId !== currentSceneId) {
      onSelectScene(sceneId);
    } else {
      // Already here — "Visit" recenters to the default view and reveals it.
      onRecenterCurrentScene?.();
      closePanel();
    }

    if (exploreSearchOpen) {
      closeExploreSearch();
    }

    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
  };

  const handleExploreSceneDetailVisit = useCallback(() => {
    if (!exploreSceneDetailId) return;

    if (exploreSceneDetailId !== currentSceneId) {
      onSelectScene(exploreSceneDetailId);
    } else {
      // Already here — "Visit" recenters to the default view and reveals it.
      onRecenterCurrentScene?.();
      closePanel();
    }

    if (exploreSearchOpen) {
      closeExploreSearch();
    }

    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
  }, [
    closePanel,
    closeExploreSearch,
    currentSceneId,
    exploreSceneDetailId,
    exploreSearchOpen,
    onRecenterCurrentScene,
    onSelectScene,
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
    onSelectNamingOpportunity(sceneId, hotspotId);

    if (exploreSearchOpen) {
      closeExploreSearch();
    }
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
    },
  ) => {
    const listBody =
      items.length > 0 ?
        <>
          {!options?.listOnly ?
            <ul
              ref={
                options?.suppressReorderRef ? undefined : (
                  locationsGalleryListRef
                )
              }
              hidden={exploreLayout !== 'gallery'}
              className={tourNavLocationGalleryListClassName}
              role='listbox'
              aria-label={TOUR_DIRECTORY_SECTION_LOCATIONS}
            >
              {items.map((scene) => (
                <ExploreSceneGalleryCard
                  key={scene.id}
                  tourId={tourId}
                  scene={scene}
                  active={scene.id === currentSceneId}
                  isTourStart={scene.id === firstSceneId}
                  disabled={locationNavDisabled}
                  onSelect={() => handleSelect(scene.id)}
                  onShowDescription={
                    scene.description?.trim() ?
                      () => openExploreSceneDetail(scene.id)
                    : undefined
                  }
                />
              ))}
            </ul>
          : null}
          <ul
            ref={options?.suppressReorderRef ? undefined : locationsListRef}
            hidden={!options?.listOnly && exploreLayout !== 'list'}
            className={tourNavListClassName}
            role='listbox'
            aria-label={TOUR_DIRECTORY_SECTION_LOCATIONS}
          >
            {items.map((scene) => (
              <ExploreSceneDirectoryListItem
                key={scene.id}
                scene={scene}
                active={scene.id === currentSceneId}
                isTourStart={scene.id === firstSceneId}
                disabled={locationNavDisabled}
                onSelect={() => handleSelect(scene.id)}
                onShowDescription={
                  scene.description?.trim() ?
                    () => openExploreSceneDetail(scene.id)
                  : undefined
                }
                locationIcon={
                  <TourLocationItemIcon active={scene.id === currentSceneId} />
                }
              />
            ))}
          </ul>
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
        {options?.showSectionTitle && (
          <h3
            id='tour-nav-directory-locations-heading'
            className={tourNavSectionTitleClassName}
          >
            {TOUR_DIRECTORY_SECTION_LOCATIONS}
          </h3>
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
        item={item}
        active={
          activeNamingHotspotId === item.hotspotId &&
          currentSceneId === item.sceneId
        }
        priceLabel={formatNamingItemDisplayPrice(item)}
        disabled={disabled || namingOpportunityBusy}
        showLocation={showLocation}
        onSelect={() => handleSelectNaming(item.sceneId, item.hotspotId)}
      />
    );

    const listHidden = !options?.listOnly && exploreLayout !== 'list';
    const subgroups = options?.sceneSubgroups;

    const listView =
      subgroups ?
        <div
          hidden={listHidden}
          className={tourNavNamingSceneSubgroupsClassName}
        >
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
          hidden={listHidden}
          className={tourNavListClassName}
          role='listbox'
          aria-label={TOUR_DIRECTORY_SECTION_NAMING}
        >
          {items.map((item) => renderNamingRow(item, true))}
        </ul>;

    const listBody =
      items.length > 0 ?
        <>
          {!options?.listOnly ?
            <ul
              ref={
                options?.suppressReorderRef ? undefined : namingGalleryListRef
              }
              hidden={exploreLayout !== 'gallery'}
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
                  active={
                    activeNamingHotspotId === item.hotspotId &&
                    currentSceneId === item.sceneId
                  }
                  disabled={disabled || namingOpportunityBusy}
                  onSelect={() =>
                    handleSelectNaming(item.sceneId, item.hotspotId)
                  }
                />
              ))}
            </ul>
          : null}
          {listView}
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
        {options?.showSectionTitle && (
          <h3
            id='tour-nav-directory-naming-heading'
            className={tourNavSectionTitleClassName}
          >
            {TOUR_DIRECTORY_SECTION_NAMING}
          </h3>
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
        <ExploreLayoutPanel
          layout={exploreLayout}
          className='mb-[var(--tour-directory-space,16px)]'
        >
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
              expanded={!collapsedNamingGroups.has(group.id)}
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
            {showSectionTitles && (
              <h3
                id='tour-nav-directory-locations-heading'
                className={tourNavSectionTitleClassName}
              >
                {TOUR_DIRECTORY_SECTION_LOCATIONS}
              </h3>
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
            {showSectionTitles && (
              <h3
                id='tour-nav-directory-naming-heading'
                className={tourNavSectionTitleClassName}
              >
                {TOUR_DIRECTORY_SECTION_NAMING}
              </h3>
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
            <h3
              id='tour-nav-search-locations-heading'
              className={tourNavSectionTitleClassName}
            >
              {TOUR_DIRECTORY_SECTION_LOCATIONS}
            </h3>
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
            <h3
              id='tour-nav-search-naming-heading'
              className={tourNavSectionTitleClassName}
            >
              {TOUR_DIRECTORY_SECTION_NAMING}
            </h3>
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
            <IconTooltip
              label={tourNavExploreLayoutActionLabel(exploreLayout)}
              placement='bottom'
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
                    sizePx={MATERIAL_SYMBOL_SIZE_22}
                  />
                : <MaterialSymbol
                    name='grid_view'
                    className={tourGlassPanelCloseIconClassName}
                    sizePx={MATERIAL_SYMBOL_SIZE_22}
                  />
                }
              </button>
            </IconTooltip>
          </div>
        }
        animation={panelAnimation(panelPhase)}
        bodyClassName='tour-glass-panel__body--directory'
      >
        {isExploreSearchActive ?
          <div
            id='tour-nav-explore-search-results'
            ref={exploreSearchScrollRef}
            className={tourNavPanelScrollClassName}
            role='region'
            aria-label='Search results'
          >
            <div className={tourNavPanelScrollInnerClassName}>
              {renderDirectorySearchResults(
                exploreSortedFilteredScenes,
                exploreSortedFilteredNamingItems,
              )}
            </div>
          </div>
        : exploreSceneDetail ?
          <div ref={exploreScrollRef} className={tourNavPanelScrollClassName}>
            <div className={tourNavPanelScrollInnerClassName}>
              <ExploreSceneDetailPanel
                sceneId={exploreSceneDetail.id}
                exiting={exploreSceneDetailExiting}
                onExitComplete={finishCloseExploreSceneDetail}
              >
                <ExploreSceneDescriptionView
                  tourId={tourId}
                  scene={exploreSceneDetail}
                  active={exploreSceneDetail.id === currentSceneId}
                  disabled={locationNavDisabled}
                  onBack={requestCloseExploreSceneDetail}
                  onVisit={handleExploreSceneDetailVisit}
                />
              </ExploreSceneDetailPanel>
            </div>
          </div>
        : <ExploreDirectoryPanel enterToken={exploreDirectoryEnterToken}>
            {exploreLead ?
              <ExploreDirectoryLead text={exploreLead} />
            : null}
            {renderDirectoryTabs()}

            <div ref={exploreScrollRef} className={tourNavPanelScrollClassName}>
              <div className={tourNavPanelScrollInnerClassName}>
                {renderDirectoryBody()}
              </div>
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

          <div className={tourNavBreadcrumbBarClassName}>
            <ol className={tourNavBreadcrumbListClassName}>
              {breadcrumbItems.map((item, index) => (
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
                      <span className={tourNavBreadcrumbCurrentLabelClassName}>
                        {item.title}
                      </span>
                      <span
                        key={currentSceneId}
                        className={tourNavBreadcrumbPulseDotClassName}
                        aria-hidden='true'
                      />
                    </span>
                  : <button
                      type='button'
                      className={tourNavBreadcrumbLinkClassName}
                      disabled={disabled}
                      onClick={() => onBreadcrumbNavigate(item.id)}
                    >
                      {item.title}
                    </button>
                  }
                </li>
              ))}
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
            (isDesktop ?
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
