import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import { isTypingTarget } from '../utils/isTypingTarget';
import {
  TOUR_DIRECTORY_PANEL_TITLE,
  TOUR_DIRECTORY_SECTION_LOCATIONS,
  TOUR_DIRECTORY_SECTION_NAMING,
  TOUR_DIRECTORY_TABS,
  TOUR_DIRECTORY_TAB_ORDER,
  TOUR_DIRECTORY_EMPTY_LOCATIONS,
  TOUR_DIRECTORY_EMPTY_NAMING,
  TOUR_DIRECTORY_EMPTY_NAMING_PRICE,
  TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL,
  TOUR_DIRECTORY_EMPTY_SEARCH,
  type TourDirectoryTab,
} from '../constants/tourDirectory';
import {
  EXPLORE_DIRECTORY_SORT_DEFAULT,
  exploreDirectorySortOptionsForContext,
  type ExploreDirectorySort,
} from '../constants/tourDirectorySort';
import { ExploreDirectoryTabLabel } from './icons/ExploreDirectoryTabIcons';
import { TourMarkerIcon } from './icons/TourMarkerIcon';
import { ExploreNamingGalleryCard } from './ExploreNamingGalleryCard';
import { ExplorePanelSearch } from './ExplorePanelSearch';
import { ExplorePanelSort } from './ExplorePanelSort';
import { ExploreSceneGalleryCard } from './ExploreSceneGalleryCard';
import { NamingPriceRangeFilter } from './NamingPriceRangeFilter';
import { TOUR_HELP_PANEL_TITLE } from '../constants/tourHelp';
import {
  TOUR_NAV_ACTION_SHARE,
  TOUR_SHARE_PANEL_TITLE,
} from '../constants/tourShare';
import {
  TOUR_NAV_ACTION_CONTROLS,
  TOUR_NAV_ACTION_EXPLORE,
  TOUR_NAV_ACTION_HELP,
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
import { Badge, type NamingStatusModifier } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import { TourHelpPanel } from './TourHelpPanel';
import { TourHelpFooter } from './TourHelpFooter';
import { TourGlassPanel, type TourGlassPanelAnimation } from './TourGlassPanel';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
} from './tourGlassPanelVariants';
import { ShareIcon } from './icons/ShareIcon';
import {
  tourNavActionsDockClassName,
  tourNavActionsRootClassName,
  tourNavBreadcrumbBarClassName,
  tourNavBreadcrumbClassName,
  tourNavBreadcrumbCurrentClassName,
  tourNavBreadcrumbCurrentLabelClassName,
  tourNavBreadcrumbItemClassName,
  tourNavBreadcrumbLinkClassName,
  tourNavBreadcrumbListClassName,
  tourNavBreadcrumbPulseDotClassName,
  tourNavBreadcrumbRootIconClassName,
  tourNavBreadcrumbRowVariants,
  tourNavBreadcrumbSepClassName,
  tourNavCircleBtnVariants,
  tourNavCircleIconClassName,
  scrollTourNavDirectoryToActiveItem,
  tourNavDirectoryItemVariants,
  tourNavDirectoryPanelClassName,
  tourNavDirectorySectionClassName,
  tourNavDirectoryTabsClassName,
  tourNavEmptyClassName,
  tourNavExploreHeaderActionsClassName,
  tourNavHistoryBtnClassName,
  tourNavHistoryBtnIconClassName,
  tourNavItemBadgeClassName,
  tourNavItemIconNamingVariants,
  tourNavItemLocationIconClassName,
  tourNavItemLabelClassName,
  tourNavItemLeadingClassName,
  tourNavItemNamingLabelClassName,
  tourNavItemNamingLocationClassName,
  tourNavItemNamingNameClassName,
  tourNavItemNamingSeparatorClassName,
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
  /** Fade breadcrumb during scene-to-scene navigation (not landing zoom). */
  breadcrumbHidden?: boolean;
  showHistoryBack?: boolean;
  showHistoryForward?: boolean;
  onHistoryBack?: () => void;
  onHistoryForward?: () => void;
  controlsVisible: boolean;
  onControlsToggle: () => void;
  onSelectScene: (sceneId: string) => void;
  onSelectNamingOpportunity: (sceneId: string, hotspotId: string) => void;
  onBreadcrumbNavigate: (sceneId: string) => void;
  /** Info hotspot id when a naming opportunity panel is open in-scene. */
  activeNamingHotspotId?: string | null;
  panelStack?: TourPanelStack;
}

type PanelMode = 'explore' | 'help' | 'share' | null;
type DisplayPanel = 'explore' | 'help' | 'share' | null;
type PanelAnimPhase = 'enter' | 'exit' | 'idle';

const PANEL_ENTER_MS = 150;
const PANEL_EXIT_MS = 140;
const SEARCH_PILL_EXPAND_MS = 180;
/** Match `tourNavBreadcrumbRowVariants` transform duration */
const BREADCRUMB_EXIT_MS = 280;

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

function ControlsIcon() {
  return (
    <MaterialSymbol
      name='tune'
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
  sold = false,
}: {
  active: boolean;
  sold?: boolean;
}) {
  return (
    <MaterialSymbol
      name='favorite'
      filled={active}
      data-tour-nav-naming-icon
      className={tourNavItemIconNamingVariants({ active, sold })}
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

function BreadcrumbRootIcon() {
  return (
    <MaterialSymbol
      name='home'
      className={tourNavBreadcrumbRootIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
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
  breadcrumbHidden = false,
  showHistoryBack = false,
  showHistoryForward = false,
  onHistoryBack,
  onHistoryForward,
  controlsVisible,
  onControlsToggle,
  onSelectScene,
  onSelectNamingOpportunity,
  onBreadcrumbNavigate,
  activeNamingHotspotId = null,
  panelStack,
}: TourNavFloatProps) {
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [displayPanel, setDisplayPanel] = useState<DisplayPanel>(null);
  const [panelPhase, setPanelPhase] = useState<PanelAnimPhase>('idle');
  const [exploreSearchOpen, setExploreSearchOpen] = useState(false);
  const [directoryTab, setDirectoryTab] = useState<TourDirectoryTab>('all');
  const [exploreLayout, setExploreLayout] =
    useState<ExploreDirectoryLayout>('gallery');
  const [exploreSort, setExploreSort] = useState<ExploreDirectorySort>(
    EXPLORE_DIRECTORY_SORT_DEFAULT,
  );
  const [exploreSearch, setExploreSearch] = useState('');
  const [exploreSearchFocusRequest, setExploreSearchFocusRequest] = useState(0);
  const actionsRef = useRef<HTMLDivElement>(null);
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const exploreSearchScrollRef = useRef<HTMLDivElement>(null);
  const exploreSearchRef = useRef<HTMLInputElement>(null);
  const targetPanelRef = useRef<DisplayPanel>(null);
  const [displaySceneId, setDisplaySceneId] = useState(currentSceneId);
  const [displayShowHistoryBack, setDisplayShowHistoryBack] =
    useState(showHistoryBack);
  const [displayShowHistoryForward, setDisplayShowHistoryForward] =
    useState(showHistoryForward);

  // Defer breadcrumb row updates until slide-out finishes (labels + ←/→ buttons).
  useEffect(() => {
    if (!breadcrumbHidden) {
      setDisplaySceneId(currentSceneId);
      setDisplayShowHistoryBack(showHistoryBack);
      setDisplayShowHistoryForward(showHistoryForward);
      return;
    }

    const timer = window.setTimeout(() => {
      setDisplaySceneId(currentSceneId);
      setDisplayShowHistoryBack(showHistoryBack);
      setDisplayShowHistoryForward(showHistoryForward);
    }, BREADCRUMB_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [breadcrumbHidden, currentSceneId, showHistoryBack, showHistoryForward]);

  const breadcrumbItems = useMemo(
    () => buildBreadcrumbItems(firstSceneId, scenes, displaySceneId),
    [displaySceneId, firstSceneId, scenes],
  );

  const namingItems = useMemo(() => buildTourNamingDirectory(scenes), [scenes]);

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

  const exploreSortOptions = useMemo(
    () => exploreDirectorySortOptionsForContext(exploreSortContext),
    [exploreSortContext],
  );

  useEffect(() => {
    if (exploreSortOptions.some((option) => option.id === exploreSort)) return;
    setExploreSort(EXPLORE_DIRECTORY_SORT_DEFAULT);
  }, [exploreSort, exploreSortOptions]);

  const exploreSortedScenes = useMemo(
    () => sortTourScenes(scenes, exploreSort),
    [exploreSort, scenes],
  );

  const exploreSortedNamingItems = useMemo(
    () => sortTourNamingDirectory(exploreNamingItems, exploreSort),
    [exploreNamingItems, exploreSort],
  );

  const exploreSortedFilteredScenes = useMemo(
    () => sortTourScenes(exploreFilteredScenes, exploreSort),
    [exploreFilteredScenes, exploreSort],
  );

  const exploreSortedFilteredNamingItems = useMemo(
    () => sortTourNamingDirectory(exploreFilteredNamingItems, exploreSort),
    [exploreFilteredNamingItems, exploreSort],
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
    if (!panelStack) return;

    const unregisterExplore = panelStack.registerPanel('explore', () => {
      setPanelMode((current) => (current === 'explore' ? null : current));
      closeExploreSearch();
    });
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
  }, [closeExploreSearch, panelStack]);

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
  }, [closeExploreSearch, panelMode]);

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
  };

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

  const handleTuneClick = useCallback(() => {
    onControlsToggle();
  }, [onControlsToggle]);

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
      if (key === 's') {
        event.preventDefault();
        handleShareClick();
        return;
      }
      if (key === 'c') {
        event.preventDefault();
        handleTuneClick();
        return;
      }
      if (key === 'h') {
        event.preventDefault();
        handleHelpClick();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    disabled,
    handleExploreClick,
    handleHelpClick,
    handleShareClick,
    handleTuneClick,
  ]);

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
    },
  ) => {
    const listBody =
      items.length > 0 ?
        <>
          <ul
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
                disabled={disabled}
                onSelect={() => handleSelect(scene.id)}
              />
            ))}
          </ul>
          <ul
            hidden={exploreLayout !== 'list'}
            className={tourNavListClassName}
            role='listbox'
            aria-label={TOUR_DIRECTORY_SECTION_LOCATIONS}
          >
            {items.map((scene) => {
              const isActive = scene.id === currentSceneId;
              return (
                <li key={scene.id} role='presentation'>
                  <button
                    type='button'
                    role='option'
                    aria-selected={isActive}
                    data-tour-nav-directory-kind='location'
                    className={tourNavDirectoryItemVariants({
                      kind: 'location',
                      active: isActive,
                    })}
                    disabled={disabled}
                    onClick={() => handleSelect(scene.id)}
                  >
                    <span className={tourNavItemLeadingClassName}>
                      <TourLocationItemIcon active={isActive} />
                    </span>
                    <span className={tourNavItemLabelClassName}>
                      {scene.title}
                    </span>
                    {isActive && (
                      <Badge variant='fill' size='sm' tone='primary' uppercase>
                        Current
                      </Badge>
                    )}
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
      showPriceFilter?: boolean;
      emptyMessage?: string;
      listBodyOnly?: boolean;
    },
  ) => {
    const listBody =
      items.length > 0 ?
        <>
          <ul
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
                disabled={disabled}
                onSelect={() =>
                  handleSelectNaming(item.sceneId, item.hotspotId)
                }
              />
            ))}
          </ul>
          <ul
            hidden={exploreLayout !== 'list'}
            className={tourNavListClassName}
            role='listbox'
            aria-label={TOUR_DIRECTORY_SECTION_NAMING}
          >
            {items.map((item) => {
              const isActive =
                activeNamingHotspotId === item.hotspotId &&
                currentSceneId === item.sceneId;
              const isSold = item.statusModifier === 'sold';

              return (
                <li
                  key={`${item.sceneId}:${item.hotspotId}`}
                  role='presentation'
                >
                  <button
                    type='button'
                    role='option'
                    aria-selected={isActive}
                    data-tour-nav-directory-kind='naming'
                    className={tourNavDirectoryItemVariants({
                      kind: 'naming',
                      active: isActive,
                      statusTone: isSold ? 'sold' : 'default',
                    })}
                    disabled={disabled}
                    onClick={() =>
                      handleSelectNaming(item.sceneId, item.hotspotId)
                    }
                  >
                    <span className={tourNavItemLeadingClassName}>
                      <NamingHeartIcon active={isActive} sold={isSold} />
                    </span>
                    <span className={tourNavItemNamingLabelClassName}>
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
                    <NamingStatusBadge
                      statusModifier={
                        item.statusModifier as NamingStatusModifier
                      }
                      label={item.statusLabel}
                      className={tourNavItemBadgeClassName}
                    />
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

        {options?.showPriceFilter &&
          namingPriceBounds &&
          namingPriceMin != null &&
          namingPriceMax != null && (
            <NamingPriceRangeFilter
              label={TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL}
              min={namingPriceBounds.min}
              max={namingPriceBounds.max}
              step={namingPriceBounds.step}
              valueMin={namingPriceMin}
              valueMax={namingPriceMax}
              disabled={disabled}
              onChange={handleNamingPriceRangeChange}
            />
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

            {namingPriceBounds &&
              namingPriceMin != null &&
              namingPriceMax != null && (
                <NamingPriceRangeFilter
                  label={TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL}
                  min={namingPriceBounds.min}
                  max={namingPriceBounds.max}
                  step={namingPriceBounds.step}
                  valueMin={namingPriceMin}
                  valueMax={namingPriceMax}
                  disabled={disabled}
                  onChange={handleNamingPriceRangeChange}
                />
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
            <ExploreLayoutPanel layout={exploreLayout}>
              {renderLocationsList(sceneResults, { listBodyOnly: true })}
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
            <ExploreLayoutPanel layout={exploreLayout}>
              {renderNamingList(namingResults, { listBodyOnly: true })}
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
            <ExplorePanelSort
              value={exploreSort}
              options={exploreSortOptions}
              disabled={disabled}
              onChange={setExploreSort}
            />
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
        : <>
            {renderDirectoryTabs()}

            <div ref={exploreScrollRef} className={tourNavPanelScrollClassName}>
              <div className={tourNavPanelScrollInnerClassName}>
                {renderDirectoryBody()}
              </div>
            </div>
          </>
        }
      </TourGlassPanel>
    </div>
  );

  const showBreadcrumbRootIcon = breadcrumbItems.length >= 2;

  return (
    <>
      <nav className={tourNavBreadcrumbClassName} aria-label='Tour location'>
        <div
          className={tourNavBreadcrumbRowVariants({ hidden: breadcrumbHidden })}
        >
          {displayShowHistoryBack && (
            <button
              type='button'
              className={tourNavHistoryBtnClassName}
              aria-label='Previous view'
              disabled={disabled}
              onClick={onHistoryBack}
            >
              <HistoryBackIcon />
            </button>
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
                      {index === 0 && showBreadcrumbRootIcon && (
                        <BreadcrumbRootIcon />
                      )}
                      <span className={tourNavBreadcrumbCurrentLabelClassName}>
                        {item.title}
                      </span>
                      <span
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
                      {index === 0 && showBreadcrumbRootIcon && (
                        <BreadcrumbRootIcon />
                      )}
                      {item.title}
                    </button>
                  }
                </li>
              ))}
            </ol>
          </div>

          {displayShowHistoryForward && (
            <button
              type='button'
              className={tourNavHistoryBtnClassName}
              aria-label='Next view'
              disabled={disabled}
              onClick={onHistoryForward}
            >
              <HistoryForwardIcon />
            </button>
          )}
        </div>
      </nav>

      <div className={tourNavActionsRootClassName} ref={actionsRef}>
        {displayPanel === 'explore' && renderExplorePanel()}

        {displayPanel === 'help' && (
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

        {displayPanel === 'share' && (
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

          <IconTooltip label={TOUR_NAV_ACTION_CONTROLS} placement='left'>
            <button
              type='button'
              className={tourNavCircleBtnVariants({ active: controlsVisible })}
              onClick={handleTuneClick}
              aria-pressed={controlsVisible}
              {...tourNavIconButtonA11y(TOUR_NAV_ACTION_CONTROLS)}
            >
              <ControlsIcon />
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
        </div>
      </div>
    </>
  );
}
