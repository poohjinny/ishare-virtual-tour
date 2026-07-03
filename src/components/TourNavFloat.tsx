import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { TOUR_CHROME_COMPACT_MAX_PX } from '../constants/tourChrome';
import {
  FLIP_LIST_KEY_ATTR,
  useFlipListReorder,
} from '../hooks/useFlipListReorder';
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
import { buildScenePath } from '../viewer/sceneDepth';
import type { Scene, TourClient } from '../types/tour';
import {
  buildTourNamingDirectory,
  filterTourNamingDirectory,
  filterTourScenes,
  sortTourNamingDirectory,
  sortTourScenes,
  type TourDirectoryNamingItem,
} from '../utils/tourDirectory';
import {
  computeNamingPriceBounds,
  filterTourNamingByPriceRange,
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
import { type NamingStatusModifier } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
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
  scrollTourNavDirectoryToActiveItem,
  tourNavDirectoryItemVariants,
  tourNavDirectoryPanelClassName,
  tourNavDirectorySectionClassName,
  tourNavDirectoryTabsClassName,
  tourNavDirectoryListItemBadgeColumnClassName,
  tourNavEmptyClassName,
  tourNavExploreHeaderActionsClassName,
  tourNavHistoryBtnIconClassName,
  tourNavHistoryGroupBtnClassName,
  tourNavHistoryGroupClassName,
  tourNavItemDescriptionClassName,
  tourNavItemBadgeClassName,
  tourNavItemIconNamingVariants,
  tourNavItemLocationIconClassName,
  tourNavItemLeadingLocationClassName,
  tourNavItemNamingHeadingClassName,
  tourNavItemNamingLocationClassName,
  tourNavItemNamingNameClassName,
  tourNavItemNamingSeparatorClassName,
  tourNavItemTextClassName,
  tourNavListClassName,
  tourNavLocationGalleryListClassName,
  tourNavLogoClassName,
  tourNavLogoLinkClassName,
  tourNavPanelScrollClassName,
  tourNavPanelScrollInnerClassName,
  tourNavPanelSlotVariants,
  tourNavSectionTitleClassName,
} from './tourNavFloatVariants';

interface TourNavFloatProps {
  scenes: Scene[];
  tourId: string;
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
  /** Info hotspot id when a naming opportunity panel is open in-scene. */
  activeNamingHotspotId?: string | null;
  /** `?embed=1` — hide Share/Help FAB; PSV control pill stays on. */
  embed?: boolean;
  panelStack?: TourPanelStack;
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

function NamingHeartIcon({
  active,
  closed = false,
}: {
  active: boolean;
  closed?: boolean;
}) {
  return (
    <MaterialSymbol
      name='favorite'
      filled={active}
      data-tour-nav-naming-icon
      className={tourNavItemIconNamingVariants({ active, closed })}
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
): BreadcrumbItem[] {
  const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));
  const scenesById = Object.fromEntries(
    scenes.map((scene) => [scene.id, scene]),
  );
  const pathIds = buildScenePath(firstSceneId, scenesById, currentSceneId);

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
  activeNamingHotspotId = null,
  embed = false,
  panelStack,
}: TourNavFloatProps) {
  const { isMobile, isDesktop } = useTourChromeLayout();
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
    const items = buildBreadcrumbItems(firstSceneId, scenes, currentSceneId);
    if (isMobile && items.length > 1) {
      return [items[items.length - 1]];
    }
    return items;
  }, [isMobile, currentSceneId, firstSceneId, scenes]);

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

  const namingItems = useMemo(() => buildTourNamingDirectory(scenes), [scenes]);

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
    () => sortTourScenes(scenes, exploreLocationsSort, firstSceneId),
    [exploreLocationsSort, firstSceneId, scenes],
  );

  const exploreSortedNamingItems = useMemo(
    () => sortTourNamingDirectory(exploreNamingItems, exploreNamingSort),
    [exploreNamingItems, exploreNamingSort],
  );

  const exploreSortedFilteredScenes = useMemo(
    () =>
      sortTourScenes(exploreFilteredScenes, exploreLocationsSort, firstSceneId),
    [exploreFilteredScenes, exploreLocationsSort, firstSceneId],
  );

  const exploreSortedFilteredNamingItems = useMemo(
    () =>
      sortTourNamingDirectory(exploreFilteredNamingItems, exploreNamingSort),
    [exploreFilteredNamingItems, exploreNamingSort],
  );

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

        if (current) panelStack?.closePanel(current);
        panelStack?.openPanel(next);
        return next;
      });
    },
    [panelStack],
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
    if (panelMode !== 'help' && panelMode !== 'share') return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(e.target as Node)
      ) {
        if (panelMode === 'help' || panelMode === 'share') {
          setPanelMode(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelMode]);

  useEffect(() => {
    if (panelMode !== 'explore') return;

    const scrollRoot = exploreScrollRef.current;
    if (!scrollRoot) return;

    scrollTourNavDirectoryToActiveItem(scrollRoot, {
      preferNaming: activeNamingItem !== null,
    });
  }, [
    activeNamingItem,
    currentSceneId,
    directoryTab,
    exploreLayout,
    panelMode,
  ]);

  useEffect(() => {
    if (!isExploreSearchActive) return;

    const scrollRoot = exploreSearchScrollRef.current;
    if (!scrollRoot) return;

    scrollTourNavDirectoryToActiveItem(scrollRoot, {
      preferNaming: activeNamingItem !== null,
    });
  }, [
    activeNamingItem,
    currentSceneId,
    isExploreSearchActive,
    exploreFilteredScenes,
    exploreFilteredNamingItems,
  ]);

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
    }

    if (exploreSearchOpen) {
      closeExploreSearch();
    }

    setExploreSceneDetailExiting(false);
    setExploreSceneDetailId(null);
  }, [
    closeExploreSearch,
    currentSceneId,
    exploreSceneDetailId,
    exploreSearchOpen,
    onSelectScene,
  ]);

  const handleExploreClick = useCallback(() => {
    if (activeNamingItem) {
      setDirectoryTab('naming');
    }
    activatePanel('explore');
  }, [activatePanel, activeNamingItem]);

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
      if (!embed && key === 's') {
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
        label: <ExploreDirectoryTabLabel tab={tab.id} label={tab.label} />,
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
    },
  ) => {
    const listBody =
      items.length > 0 ?
        <>
          {!options?.listOnly ?
            <ul
              ref={locationsGalleryListRef}
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
                  disabled={disabled}
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
            ref={locationsListRef}
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
                disabled={disabled}
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
    },
  ) => {
    const listBody =
      items.length > 0 ?
        <>
          {!options?.listOnly ?
            <ul
              ref={namingGalleryListRef}
              hidden={exploreLayout !== 'gallery'}
              className={tourNavLocationGalleryListClassName}
              role='listbox'
              aria-label={TOUR_DIRECTORY_SECTION_NAMING}
            >
              {items.map((item) => (
                <ExploreNamingGalleryCard
                  key={`${item.sceneId}:${item.hotspotId}`}
                  tourId={tourId}
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
          <ul
            ref={namingListRef}
            hidden={!options?.listOnly && exploreLayout !== 'list'}
            className={tourNavListClassName}
            role='listbox'
            aria-label={TOUR_DIRECTORY_SECTION_NAMING}
          >
            {items.map((item) => {
              const isActive =
                activeNamingHotspotId === item.hotspotId &&
                currentSceneId === item.sceneId;
              const isClosed = item.statusModifier === 'closed';
              const description = item.description?.trim();
              const ariaLabel =
                isActive ?
                  description ?
                    `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${description}`
                  : `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}.`
                : description ?
                  `${item.name}, ${item.sceneTitle}. ${item.statusLabel}. ${description}`
                : `${item.name}, ${item.sceneTitle}. ${item.statusLabel}.`;

              return (
                <li
                  key={`${item.sceneId}:${item.hotspotId}`}
                  role='presentation'
                  {...{
                    [FLIP_LIST_KEY_ATTR]: `${item.sceneId}:${item.hotspotId}`,
                  }}
                >
                  <button
                    type='button'
                    role='option'
                    aria-selected={isActive}
                    data-tour-nav-directory-kind='naming'
                    className={tourNavDirectoryItemVariants({
                      kind: 'naming',
                      active: isActive,
                      statusTone: isClosed ? 'closed' : 'default',
                    })}
                    disabled={disabled || namingOpportunityBusy}
                    onClick={() =>
                      handleSelectNaming(item.sceneId, item.hotspotId)
                    }
                    aria-label={ariaLabel}
                  >
                    <span className={tourNavItemLeadingLocationClassName}>
                      <NamingHeartIcon active={isActive} closed={isClosed} />
                    </span>
                    <span className={tourNavItemTextClassName}>
                      <span className={tourNavItemNamingHeadingClassName}>
                        <span className={tourNavItemNamingNameClassName}>
                          {item.name}
                        </span>
                        <span
                          className={tourNavItemNamingSeparatorClassName}
                          aria-hidden='true'
                        >
                          |
                        </span>
                        <span className={tourNavItemNamingLocationClassName}>
                          {item.sceneTitle}
                        </span>
                      </span>
                      {description ?
                        <span className={tourNavItemDescriptionClassName}>
                          {description}
                        </span>
                      : null}
                    </span>
                    <span
                      className={tourNavDirectoryListItemBadgeColumnClassName}
                    >
                      <NamingStatusBadge
                        statusModifier={
                          item.statusModifier as NamingStatusModifier
                        }
                        label={item.statusLabel}
                        className={cn(tourNavItemBadgeClassName, 'ml-0')}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
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
            <ExploreLayoutPanel layout={exploreLayout}>
              {renderLocationsList(exploreSortedScenes, {
                listBodyOnly: true,
                emptyMessage: TOUR_DIRECTORY_EMPTY_LOCATIONS,
              })}
            </ExploreLayoutPanel>
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
              {renderNamingList(exploreSortedNamingItems, {
                listBodyOnly: true,
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
                  disabled={disabled}
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
        className={cn(
          tourNavBreadcrumbClassName,
          tourNavBreadcrumbAlignVariants({
            align: isDesktop ? 'center' : 'start',
          }),
        )}
        aria-label='Tour location'
      >
        <div className={tourNavBreadcrumbRowClassName}>
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
