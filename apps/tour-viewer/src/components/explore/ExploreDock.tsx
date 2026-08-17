import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TourPanelStack } from '../../hooks/useTourPanelStack';
import { useFlipListReorder } from '../../hooks/useFlipListReorder';
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
} from '../../constants/tourDirectory';
import {
  EXPLORE_LOCATIONS_SORT_DEFAULT,
  EXPLORE_NAMING_SORT_DEFAULT,
  exploreDirectorySortGroupsForContext,
  type ExploreDirectorySort,
  type ExploreDirectorySortContext,
} from '../../constants/tourDirectorySort';
import {
  ExploreDirectoryTabLabel,
  ExploreDirectoryTabIcon,
} from '../icons/ExploreDirectoryTabIcons';
import { TourMarkerIcon } from '../icons/TourMarkerIcon';
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
import { findNamingHotspotInTour } from '../../utils/findTourHotspot';
import { useExploreDirectoryScrollPins } from '../../hooks/useExploreDirectoryScrollPins';
import { notifyExploreDirectoryScroll } from '../../utils/exploreDirectoryScrollIdle';
import {
  tourNavExploreLayoutActionLabel,
  tourNavIconButtonA11y,
  type ExploreDirectoryLayout,
} from '../../constants/tourNavActions';
import { ExploreLocationGroup } from './ExploreLocationGroup';
import {
  buildSceneGroups,
  buildSceneGroupSecondaryById,
  sceneIdsWithTitleCollisions,
  SCENE_GROUP_OTHER_ID,
} from '../../viewer-shared/sceneDepth';
import type {
  Hotspot,
  NamingOpportunityRecord,
  Scene,
  Tour,
  TourViewerType,
} from '../../types/tour';
import {
  buildNamingSectorGroups,
  buildTourNamingDirectory,
  filterTourNamingDirectory,
  filterTourScenes,
  sortTourNamingDirectory,
  sortTourScenes,
  type NamingSceneSubgroup,
  type TourDirectoryNamingItem,
} from '../../utils/tourDirectory';
import { sortSceneGroupsByTourOrder } from '../../utils/sceneOrder';
import {
  computeNamingPriceBounds,
  filterTourNamingByPriceRange,
  formatNamingItemDisplayPrice,
  formatNamingSectorGroupTotalLabel,
  SHOW_SECTOR_NAMING_TOTAL,
} from '../../utils/namingPrice';
import { SegmentedTabs } from '../ui/SegmentedTabs';
import { SegmentedTabPanel } from '../ui/SegmentedTabPanel';
import { ExploreLayoutPanel } from '../ui/ExploreLayoutPanel';
import { IconTooltip } from '../ui/IconTooltip';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_20,
  MATERIAL_SYMBOL_SIZE_CHROME_HEADER,
} from '../ui/materialSymbolClasses';
import { TourGlassPanel, type TourGlassPanelAnimation } from '../TourGlassPanel';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
} from '../tourGlassPanelVariants';
import { cn } from '../../lib/cn';
import {
  tourNavDirectoryPanelClassName,
  tourNavDirectoryGroupedListClassName,
  tourNavDirectorySectionClassName,
  tourNavDirectoryTabsClassName,
  tourNavEmptyClassName,
  tourNavExploreHeaderActionsClassName,
  tourNavItemLocationIconClassName,
  tourNavListClassName,
  tourNavLocationGalleryListClassName,
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
} from '../tourNavFloatVariants';

const SEARCH_PILL_EXPAND_MS = 180;

export interface ExploreDockHandle {
  captureDirectoryScroll: () => void;
  closeSearch: () => void;
  getSceneDetailId: () => string | null;
  isShowingSceneDetail: (sceneId: string) => boolean;
  openSceneDetail: (sceneId: string) => void;
}

interface ExploreDockProps {
  open: boolean;
  targetOpen: boolean;
  animation: TourGlassPanelAnimation;
  onClose: () => void;
  closeDockThen: (action: () => void) => void;
  panelStack?: TourPanelStack;

  scenes: Scene[];
  tourId: string;
  tourHotspots?: Hotspot[];
  tourViewerType?: TourViewerType;
  namingOpportunities?: Record<string, NamingOpportunityRecord>;
  currentSceneId: string;
  firstSceneId: string;
  sceneOrder?: string[];
  tourTitle: string;
  facilityTitle?: string;
  exploreLead?: string;
  disabled?: boolean;
  namingOpportunityBusy?: boolean;
  isMobile: boolean;
  activeNamingHotspotId?: string | null;

  onSelectScene: (sceneId: string) => void;
  onVisitNamingPlace: (sceneId: string, hotspotId: string) => void;
  onRecenterCurrentScene?: () => void;
  onAskAboutScene?: (sceneId: string) => void;
  onAskAboutNaming?: (sceneId: string, namingName?: string) => void;
  onSceneDetailChange?: (sceneId: string | null) => void;
}

type ExploreNamingDetailTarget = { sceneId: string; hotspotId: string };

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

export const ExploreDock = forwardRef<ExploreDockHandle, ExploreDockProps>(
  function ExploreDock(
    {
      open,
      targetOpen,
      animation,
      onClose,
      closeDockThen,
      panelStack,
      scenes,
      tourId,
      tourHotspots,
      tourViewerType,
      namingOpportunities,
      currentSceneId,
      firstSceneId,
      sceneOrder,
      tourTitle,
      facilityTitle,
      exploreLead,
      disabled = false,
      namingOpportunityBusy = false,
      isMobile,
      activeNamingHotspotId = null,
      onSelectScene,
      onVisitNamingPlace,
      onRecenterCurrentScene,
      onAskAboutScene,
      onAskAboutNaming,
      onSceneDetailChange,
    },
    ref,
  ) {
    const locationNavDisabled = namingOpportunityBusy;
    const [exploreSearchOpen, setExploreSearchOpen] = useState(false);
    /**
     * Explore "You are here" for a naming row — set by Visit place (or detail Visit).
     * Survives panel close; cleared when leaving that NO's scene or visiting a place.
     * Pending holds a cross-scene Visit until `currentSceneId` catches up.
     */
    const [namingHereHotspotId, setNamingHereHotspotId] = useState<
      string | null
    >(null);
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
    const [exploreSearchFocusRequest, setExploreSearchFocusRequest] =
      useState(0);
    const exploreScrollRef = useRef<HTMLDivElement>(null);
    /** Directory list scroll — survives detail + Explore close/reopen. */
    const exploreDirectoryScrollTopRef = useRef(0);
    const exploreSearchScrollRef = useRef<HTMLDivElement>(null);
    const exploreSearchRef = useRef<HTMLInputElement>(null);

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
        title: facilityTitle?.trim() || tourTitle || '',
        firstScene: firstSceneId,
        scenes: tourDirectoryContext.scenes,
        hotspots: tourHotspots,
        viewerType: tourViewerType,
        namingOpportunities,
        ...(sceneOrder ? { sceneOrder } : {}),
      }),
      [
        facilityTitle,
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
      if (!open) return;
      if (exploreSceneDetailId != null || exploreNamingDetail != null) return;
      if (exploreSearch.trim().length > 0) return;

      const el = exploreScrollRef.current;
      if (!el) return;
      el.scrollTop = exploreDirectoryScrollTopRef.current;
    }, [
      open,
      exploreDirectoryEnterToken,
      exploreNamingDetail,
      exploreSceneDetailId,
      exploreSearch,
    ]);

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

    useEffect(() => {
      onSceneDetailChange?.(
        exploreSceneDetailId && !exploreSceneDetailExiting ?
          exploreSceneDetailId
        : null,
      );
    }, [
      exploreSceneDetailExiting,
      exploreSceneDetailId,
      onSceneDetailChange,
    ]);

    const isNamingItemHere = useCallback(
      (item: TourDirectoryNamingItem) =>
        currentSceneId === item.sceneId &&
        (activeNamingHotspotId === item.hotspotId ||
          namingHereHotspotId === item.hotspotId),
      [activeNamingHotspotId, currentSceneId, namingHereHotspotId],
    );

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

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
      new Set(),
    );
    const [expandedNamingGroups, setExpandedNamingGroups] = useState<
      Set<string>
    >(new Set());

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

    const {
      pins: exploreDirectoryPins,
      updatePins: updateExploreDirectoryPins,
    } = useExploreDirectoryScrollPins(
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
      if (!open) return;
      if (exploreSceneDetailId != null || exploreNamingDetail != null) return;
      if (isExploreSearchActive) {
        updateExploreSearchPins();
        return;
      }
      updateExploreDirectoryPins();
    }, [
      currentSceneId,
      open,
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
    const didIdleExpandExploreGroupsRef = useRef(false);
    useEffect(() => {
      if (!targetOpen || didIdleExpandExploreGroupsRef.current) return;
      const groupId = currentGroupIdRef.current;
      if (!groupId) return;

      didIdleExpandExploreGroupsRef.current = true;
      setExpandedGroups((prev) => {
        if (prev.has(groupId)) return prev;
        const next = new Set(prev);
        next.add(groupId);
        return next;
      });
    }, [targetOpen]);

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

    const requestExploreSearchFocus = () => {
      setExploreSearchFocusRequest((count) => count + 1);
    };

    const closeExploreSearch = useCallback(() => {
      exploreSearchRef.current?.blur();
      setExploreSearchOpen(false);
      panelStack?.closePanel('explore-search');
    }, [panelStack]);

    useImperativeHandle(
      ref,
      () => ({
        captureDirectoryScroll: captureExploreDirectoryScroll,
        closeSearch: closeExploreSearch,
        getSceneDetailId: () =>
          exploreSceneDetailId && !exploreSceneDetailExiting ?
            exploreSceneDetailId
          : null,
        isShowingSceneDetail: (sceneId: string) =>
          (open || targetOpen) &&
          exploreSceneDetailId === sceneId &&
          !exploreSceneDetailExiting,
        openSceneDetail: openExploreSceneDetail,
      }),
      [
        captureExploreDirectoryScroll,
        closeExploreSearch,
        exploreSceneDetailExiting,
        exploreSceneDetailId,
        open,
        openExploreSceneDetail,
        targetOpen,
      ],
    );

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
      if (exploreSearchOpen) return;

      setExploreSearch('');
    }, [exploreSearchOpen]);

    useEffect(() => {
      // Wait until Explore is fully off-screen — clearing detail when panelMode
      // flips would flash the directory list during the exit animation.
      if (open) return;

      closeExploreSearch();
      setExploreSceneDetailExiting(false);
      setExploreSceneDetailId(null);
      setExploreNamingDetailExiting(false);
      setExploreNamingDetail(null);
    }, [closeExploreSearch, open]);

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
      closeDockThen(() => {
        if (shouldRecenter) {
          onRecenterCurrentScene?.();
        } else {
          onSelectScene(sceneId);
        }
      });
    };

    const handleExploreSceneDetailVisit = useCallback(() => {
      if (!exploreSceneDetailId) return;

      const sceneId = exploreSceneDetailId;
      const shouldRecenter = sceneId === currentSceneId;
      // Keep detail mounted while Explore exits; detail resets when displayPanel
      // leaves 'explore'. Scene change waits until the panel is gone.
      closeDockThen(() => {
        if (shouldRecenter) {
          onRecenterCurrentScene?.();
        } else {
          onSelectScene(sceneId);
        }
      });
    }, [
      closeDockThen,
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

      closeDockThen(() => {
        onVisitNamingPlace(sceneId, hotspotId);
      });
    }, [closeDockThen, currentSceneId, exploreNamingDetail, onVisitNamingPlace]);

    const handleExploreSceneDetailAsk = useCallback(() => {
      if (!exploreSceneDetailId || !onAskAboutScene) return;
      const sceneId = exploreSceneDetailId;
      closeDockThen(() => {
        onAskAboutScene(sceneId);
      });
    }, [closeDockThen, exploreSceneDetailId, onAskAboutScene]);

    const handleExploreNamingDetailAsk = useCallback(() => {
      if (!exploreNamingDetail || !onAskAboutNaming) return;
      const { sceneId } = exploreNamingDetail;
      const namingName =
        exploreNamingDetailView?.hotspot.popup?.title?.trim() ||
        exploreNamingDetailView?.hotspot.label?.trim();
      closeDockThen(() => {
        onAskAboutNaming(sceneId, namingName);
      });
    }, [
      closeDockThen,
      exploreNamingDetail,
      exploreNamingDetailView,
      onAskAboutNaming,
    ]);

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

      closeDockThen(() => {
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
        /**
         * True while this section is mirrored in the sticky pin bar — collapse
         * in-flow via React so HMR remounts don’t leave a duplicate title.
         */
        pinned?: boolean;
        /** When set, the label cluster expands/collapses every group in the section. */
        groupsToggle?: {
          /** True when any group is open — Collapse all is the default action. */
          anyExpanded: boolean;
          onToggle: () => void;
        };
      },
    ) => {
      const groupsToggle = options?.groupsToggle;
      const pinned = Boolean(options?.pinned);
      const pinKey = `section-${tab}`;
      const tooltipLabel =
        groupsToggle?.anyExpanded ? `Collapse ${label}` : `Expand ${label}`;

      const titleBlock = (
        <h3 id={headingId} className={tourNavSectionTitleClassName}>
          <span className={tourNavSectionTitleIconClassName} aria-hidden='true'>
            <ExploreDirectoryTabIcon
              tab={tab}
              sizePx={MATERIAL_SYMBOL_SIZE_18}
            />
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
              groupsToggle.anyExpanded &&
                tourNavSectionTitleToggleOpenClassName,
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
          data-directory-pin-key={pinKey}
          {...(options?.denseBottom ?
            { 'data-directory-pin-dense-bottom': '' }
          : {})}
          {...(pinned ?
            {
              'data-directory-pin-active': '',
              'aria-hidden': true as const,
              'data-directory-pin-a11y-hidden': '1',
            }
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
                ref={
                  options?.suppressReorderRef ? undefined : locationsListRef
                }
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

    const renderGroupedLocations = (options?: {
      sectionGroupLead?: boolean;
    }) => (
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
                    formatNamingSectorGroupTotalLabel(group.total, exploreLayout)
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
                    pinned:
                      exploreDirectoryPins.section?.key === 'section-locations',
                    groupsToggle:
                      isLocationsGroupingActive && locationGroups?.length ?
                        {
                          anyExpanded: locationGroupsAnyExpanded,
                          onToggle: () =>
                            setLocationGroupsExpanded(
                              !locationGroupsAnyExpanded,
                            ),
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
                    pinned:
                      exploreDirectoryPins.section?.key === 'section-naming',
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
                {
                  pinned: exploreSearchPins.section?.key === 'section-locations',
                },
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
                { pinned: exploreSearchPins.section?.key === 'section-naming' },
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
          onClose={onClose}
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
          animation={animation}
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
                      namingHereHotspotId ===
                        exploreNamingDetailView.hotspotId)
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

    return open ? renderExplorePanel() : null;
  },
);
