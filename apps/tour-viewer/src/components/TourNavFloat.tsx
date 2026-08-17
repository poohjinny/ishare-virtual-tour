import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { TOUR_CHROME_COMPACT_MAX_PX } from '../constants/tourChrome';
import { isTypingTarget } from '../utils/isTypingTarget';
import {
  TOUR_BREADCRUMB_CURRENT_TOOLTIP,
  tourBreadcrumbGoToTooltip,
} from '../constants/tourDirectory';
import { isPlaceOverviewHotspot } from '../utils/placeOverview';
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
  tourNavIconButtonA11y,
} from '../constants/tourNavActions';
import {
  buildCurrentViewSharePayload,
  resolveSceneShareImageUrl,
} from '../utils/tourOpenGraph';
import { ShareTourPanel } from './ShareTourPanel';
import { ExploreSceneInfoButton } from './explore/ExploreSceneInfoButton';
import {
  resolveBreadcrumbSiblingOptions,
  TourBreadcrumbSiblingMenu,
} from './TourBreadcrumbSiblingMenu';
import { buildScenePath, listSceneSiblings } from '../viewer-shared/sceneDepth';
import type {
  Hotspot,
  NamingOpportunityRecord,
  Scene,
  Tour,
  TourClient,
  TourViewerType,
} from '../types/tour';
import { sortSceneIdsByTourOrder } from '../utils/sceneOrder';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from './ui/materialSymbolClasses';
import { TourHelpPanel } from './TourHelpPanel';
import { TourHelpFooter } from './TourHelpFooter';
import { TourGlassPanel, type TourGlassPanelAnimation } from './TourGlassPanel';
import { cn } from '../lib/cn';
import { ShareIcon } from './icons/ShareIcon';
import { ANCHORED_SHARE_MENU_ATTR } from './anchoredShareMenuVariants';
import { ExploreDock, type ExploreDockHandle } from './explore/ExploreDock';
import {
  tourNavActionsDockVariants,
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
  tourNavHistoryBtnIconClassName,
  tourNavHistoryGroupBtnClassName,
  tourNavHistoryGroupClassName,
  tourNavLogoClassName,
  tourNavLogoLinkClassName,
  tourNavPanelSlotVariants,
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
  /** Client tour product name — Help welcome (`{Client} Virtual Tour`). */
  tourTitle?: string;
  /**
   * Facility / catalog title (`tour.title`) — Share panel + OG-aligned copy.
   * Falls back to {@link tourTitle} when omitted.
   */
  facilityTitle?: string;
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
  openShare: () => void;
  /** Close any open dock panel, then run `action` after the exit animation. */
  closeDockThen: (action: () => void) => void;
}

type PanelMode = 'explore' | 'help' | 'share' | null;
type DisplayPanel = 'explore' | 'help' | 'share' | null;
type PanelAnimPhase = 'enter' | 'exit' | 'idle';

const PANEL_ENTER_MS = 170;
const PANEL_EXIT_MS = 140;

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
  facilityTitle,
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
  const [dockOverflowOpen, setDockOverflowOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [displayPanel, setDisplayPanel] = useState<DisplayPanel>(null);
  const [panelPhase, setPanelPhase] = useState<PanelAnimPhase>('idle');
  /** Breadcrumb chrome mirror — ExploreDock owns the real detail state. */
  const [exploreSceneDetailId, setExploreSceneDetailId] = useState<
    string | null
  >(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const exploreDockRef = useRef<ExploreDockHandle | null>(null);
  const targetPanelRef = useRef<DisplayPanel>(null);
  /** Scene / NO navigation deferred until Explore finish exiting. */
  const pendingAfterDockExitRef = useRef<(() => void) | null>(null);

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

  const exploreTour = useMemo(
    (): Tour => ({
      id: tourId,
      title: facilityTitle?.trim() || tourTitle || '',
      firstScene: firstSceneId,
      scenes: Object.fromEntries(scenes.map((scene) => [scene.id, scene])),
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
      scenes,
      tourHotspots,
      tourId,
      tourTitle,
      tourViewerType,
    ],
  );

  const currentScene = useMemo(() => {
    return scenes.find((scene) => scene.id === currentSceneId) ?? null;
  }, [currentSceneId, scenes]);

  const placeOverviewOpen = Boolean(
    activeNamingHotspotId &&
    currentScene?.hotspots?.some(
      (hotspot) =>
        hotspot.id === activeNamingHotspotId && isPlaceOverviewHotspot(hotspot),
    ),
  );

  const sharePayload = useMemo(
    () =>
      buildCurrentViewSharePayload(exploreTour, currentSceneId, null, {
        tourTitle: facilityTitle?.trim() || tourTitle,
      }),
    [currentSceneId, exploreTour, facilityTitle, tourTitle],
  );
  const shareUrl = sharePayload.shareUrl;
  const shareMessage = sharePayload.message;
  const shareContextLabel = sharePayload.contextLabel;

  const sharePreviewImageUrl = useMemo(
    () => resolveSceneShareImageUrl(exploreTour, currentSceneId, clientLogo),
    [clientLogo, currentSceneId, exploreTour],
  );

  const targetPanel = panelMode;

  targetPanelRef.current = targetPanel;

  const closePanel = useCallback(() => {
    setPanelMode((current) => {
      if (current) panelStack?.closePanel(current);
      return null;
    });
    panelStack?.closePanel('explore-search');
    exploreDockRef.current?.closeSearch();
  }, [panelStack]);

  /**
   * Close any dock panel (Explore / Help / Share), then run `action` after the
   * exit animation so the panorama doesn't start moving under chrome.
   */
  const closeDockThen = useCallback(
    (action: () => void) => {
      const dockOpen = panelMode !== null || displayPanel !== null;
      if (!dockOpen) {
        pendingAfterDockExitRef.current = null;
        action();
        return;
      }

      if (panelMode === 'explore' || displayPanel === 'explore') {
        exploreDockRef.current?.captureDirectoryScroll();
      }
      pendingAfterDockExitRef.current = action;
      closePanel();
    },
    [closePanel, displayPanel, panelMode],
  );

  const activatePanel = useCallback(
    (next: Exclude<PanelMode, null>) => {
      setPanelMode((current) => {
        if (current === next) {
          if (current === 'explore') {
            exploreDockRef.current?.captureDirectoryScroll();
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
    [onDismissAnchoredPanels, panelStack],
  );

  /** Open a dock panel without toggling closed when already open. */
  const openDockPanel = useCallback(
    (next: Exclude<PanelMode, null>) => {
      if (embed && (next === 'help' || next === 'share')) return;
      setPanelMode((current) => {
        if (current === next) return current;
        onDismissAnchoredPanels?.();
        if (current === 'explore') {
          exploreDockRef.current?.captureDirectoryScroll();
        }
        if (current) panelStack?.closePanel(current);
        panelStack?.openPanel(next);
        return next;
      });
    },
    [embed, onDismissAnchoredPanels, panelStack],
  );

  /** Open Share dock for the current scene (does not dismiss anchored NO panels). */
  const openShareDockPanel = useCallback(() => {
    if (embed) return;
    setPanelMode((current) => {
      if (current === 'share') return current;
      if (current === 'explore') {
        exploreDockRef.current?.captureDirectoryScroll();
      }
      if (current) panelStack?.closePanel(current);
      panelStack?.openPanel('share');
      return 'share';
    });
  }, [embed, panelStack]);

  useEffect(() => {
    if (!dockActionsRef) return;
    dockActionsRef.current = {
      openExplore: () => openDockPanel('explore'),
      openHelp: () => openDockPanel('help'),
      openShare: openShareDockPanel,
      closeDockThen,
    };
    return () => {
      dockActionsRef.current = null;
    };
  }, [closeDockThen, dockActionsRef, openDockPanel, openShareDockPanel]);

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
        exploreVisible && exploreSceneDetailId === sceneId;

      if (showingSameDetail) {
        // Keep detail mounted through the panel exit — clearing it first flashes
        // the directory/gallery under the closing animation.
        closePanel();
        return;
      }

      exploreDockRef.current?.closeSearch();
      exploreDockRef.current?.openSceneDetail(sceneId);
      setPanelMode((current) => {
        if (current === 'explore') return 'explore';
        onDismissAnchoredPanels?.();
        if (current) panelStack?.closePanel(current);
        panelStack?.openPanel('explore');
        return 'explore';
      });
    },
    [
      closePanel,
      displayPanel,
      exploreSceneDetailId,
      onDismissAnchoredPanels,
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
      exploreSceneDetailId
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
    if (!embed) return;
    setPanelMode((current) =>
      current === 'help' || current === 'share' ? null : current,
    );
  }, [embed]);

  useEffect(() => {
    if (!panelStack) return;

    const unregisterExplore = panelStack.registerPanel('explore', () => {
      setPanelMode((current) => (current === 'explore' ? null : current));
      exploreDockRef.current?.closeSearch();
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
  }, [embed, panelStack]);

  // Ask Guide FAB bubble shares the right rail — hide it while dock chrome is up.
  useEffect(() => {
    onChromeDockOpenChange?.(panelMode !== null || displayPanel !== null);
  }, [displayPanel, onChromeDockOpenChange, panelMode]);

  // Panel owns the corner — drop overflow menus while the FAB dock is hidden.
  useEffect(() => {
    if (panelMode !== null || displayPanel !== null) {
      setDockOverflowOpen(false);
    }
  }, [displayPanel, panelMode]);

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
          target.closest(tourBreadcrumbSiblingMenuSelector) ||
          target.closest(`[${ANCHORED_SHARE_MENU_ATTR}]`))
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
    if (displayPanel !== null) return;

    const pending = pendingAfterDockExitRef.current;
    if (!pending) return;
    pendingAfterDockExitRef.current = null;
    pending();
  }, [displayPanel]);

  /** Breadcrumb jump — leave Explore so the panel doesn't outlive the move.
   *  Same scene re-snaps the camera to the place default view. */
  const handleBreadcrumbNavigate = useCallback(
    (sceneId: string) => {
      const shouldRecenter = sceneId === currentSceneId;
      closeDockThen(() => {
        if (shouldRecenter) {
          onRecenterCurrentScene?.();
        } else {
          onBreadcrumbNavigate(sceneId);
        }
      });
    },
    [
      closeDockThen,
      currentSceneId,
      onBreadcrumbNavigate,
      onRecenterCurrentScene,
    ],
  );

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
                              title={item.title}
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
                        title={item.title}
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
        <ExploreDock
          ref={exploreDockRef}
          open={displayPanel === 'explore'}
          targetOpen={panelMode === 'explore'}
          animation={panelAnimation(panelPhase)}
          onClose={closePanel}
          closeDockThen={closeDockThen}
          panelStack={panelStack}
          scenes={scenes}
          tourId={tourId}
          tourHotspots={tourHotspots}
          tourViewerType={tourViewerType}
          namingOpportunities={namingOpportunities}
          currentSceneId={currentSceneId}
          firstSceneId={firstSceneId}
          sceneOrder={sceneOrder}
          tourTitle={tourTitle}
          facilityTitle={facilityTitle}
          exploreLead={exploreLead}
          disabled={disabled}
          namingOpportunityBusy={namingOpportunityBusy}
          isMobile={isMobile}
          activeNamingHotspotId={activeNamingHotspotId}
          onSelectScene={onSelectScene}
          onVisitNamingPlace={onVisitNamingPlace}
          onRecenterCurrentScene={onRecenterCurrentScene}
          onAskAboutScene={onAskAboutScene}
          onAskAboutNaming={onAskAboutNaming}
          onSceneDetailChange={setExploreSceneDetailId}
        />

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

        <div
          className={tourNavActionsDockVariants({
            visibility:
              panelMode !== null || displayPanel !== null ? 'hidden' : 'shown',
          })}
          aria-hidden={panelMode !== null || displayPanel !== null}
          inert={panelMode !== null || displayPanel !== null ? true : undefined}
        >
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
