import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TOUR_DIRECTORY_PANEL_TITLE,
  TOUR_DIRECTORY_SEARCH_PLACEHOLDER,
  TOUR_DIRECTORY_SECTION_LOCATIONS,
  TOUR_DIRECTORY_SECTION_NAMING,
  TOUR_DIRECTORY_TABS,
  type TourDirectoryTab,
} from '../constants/tourDirectory';
import { TOUR_HELP_PANEL_TITLE } from '../constants/tourHelp';
import {
  TOUR_NAV_ACTION_SEARCH_CLOSE,
  TOUR_NAV_ACTION_SEARCH_OPEN,
  tourNavControlsActionLabel,
  tourNavExploreActionLabel,
  tourNavHelpActionLabel,
  tourNavIconButtonA11y,
} from '../constants/tourNavActions';
import { buildScenePath } from '../viewer/sceneDepth';
import type { Scene, TourOrganization } from '../types/tour';
import {
  buildTourNamingDirectory,
  filterTourNamingDirectory,
  filterTourScenes,
  type TourDirectoryNamingItem,
} from '../utils/tourDirectory';
import { Badge, type NamingStatusModifier } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import { TourHelpPanel } from './TourHelpPanel';
import {
  TourGlassPanel,
  GlassPanelCloseIcon,
  type TourGlassPanelAnimation,
} from './TourGlassPanel';
import './TourNavFloat.css';

interface TourNavFloatProps {
  scenes: Scene[];
  currentSceneId: string;
  firstSceneId: string;
  tourTitle?: string;
  organization?: TourOrganization;
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
}

type PanelMode = 'explore' | 'help' | null;
type DisplayPanel = 'explore' | 'help' | null;
type PanelAnimPhase = 'enter' | 'exit' | 'idle';

const PANEL_ENTER_MS = 150;
const PANEL_EXIT_MS = 140;
const SEARCH_PILL_EXPAND_MS = 220;
/** Match `.tour-nav-breadcrumb__row` transform duration in TourNavFloat.css */
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

function NamingHeartIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`tour-nav-actions__item-icon tour-nav-actions__item-icon--naming${active ? ' tour-nav-actions__item-icon--naming-active' : ''}`}
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
    </svg>
  );
}

function TourLayersIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M12 2L2 7l10 5 10-5-10-5z'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinejoin='round'
      />
      <path
        d='M2 12l10 5 10-5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinejoin='round'
      />
      <path
        d='M2 17l10 5 10-5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function ExploreTourIcon() {
  return <TourLayersIcon className='tour-nav-actions__circle-icon' />;
}

function SearchIcon() {
  return (
    <svg
      className='tour-nav-actions__circle-icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='8.5'
        cy='8.5'
        r='5.5'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M13 13L17 17'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

function ControlsIcon() {
  return (
    <svg
      className='tour-nav-actions__circle-icon'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z' />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      className='tour-nav-actions__circle-icon tour-nav-actions__circle-icon--help'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='10'
        cy='10'
        r='8.25'
        stroke='currentColor'
        strokeWidth='1.75'
      />
      <path
        d='M7.5 7.35C7.85 5.95 9.05 5.15 10.45 5.15C12.05 5.15 13.25 6.35 13.25 7.95C13.25 9.35 12.2 10.15 11.05 10.8C10.35 11.15 9.95 11.7 9.95 12.35'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='10' cy='15.1' r='1' fill='currentColor' />
    </svg>
  );
}
function PanelSearchIcon() {
  return (
    <svg
      className='tour-nav-actions__search-icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='8.5'
        cy='8.5'
        r='5.5'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M13 13L17 17'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

function HistoryBackIcon() {
  return (
    <svg
      className='tour-nav-history-btn__icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M12.5 15L7.5 10L12.5 5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function HistoryForwardIcon() {
  return (
    <svg
      className='tour-nav-history-btn__icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M7.5 5L12.5 10L7.5 15'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function BreadcrumbLayerIcon() {
  return <TourLayersIcon className='tour-nav-breadcrumb__layer-icon' />;
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
  currentSceneId,
  firstSceneId,
  tourTitle = 'Virtual Tour',
  organization,
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
}: TourNavFloatProps) {
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [displayPanel, setDisplayPanel] = useState<DisplayPanel>(null);
  const [panelPhase, setPanelPhase] = useState<PanelAnimPhase>('idle');
  const [searchOpen, setSearchOpen] = useState(false);
  const [directoryTab, setDirectoryTab] = useState<TourDirectoryTab>('all');
  const [search, setSearch] = useState('');
  const [searchFocusRequest, setSearchFocusRequest] = useState(0);
  const actionsRef = useRef<HTMLDivElement>(null);
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const searchScrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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

  const filteredScenes = useMemo(
    () => filterTourScenes(scenes, search),
    [scenes, search],
  );

  const filteredNamingItems = useMemo(
    () => filterTourNamingDirectory(namingItems, search),
    [namingItems, search],
  );

  const isSearchActive = search.trim().length > 0;

  const targetPanel = panelMode;

  targetPanelRef.current = targetPanel;

  const requestSearchFocus = () => {
    setSearchFocusRequest((count) => count + 1);
  };

  const closeSearch = useCallback(() => {
    searchRef.current?.blur();
    setSearchOpen(false);
  }, []);

  const closePanel = useCallback(() => {
    setPanelMode(null);
  }, []);

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
    if (!searchOpen || searchFocusRequest === 0) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, SEARCH_PILL_EXPAND_MS);

    return () => window.clearTimeout(focusTimer);
  }, [searchOpen, searchFocusRequest]);

  useEffect(() => {
    if (!searchOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSearch();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (!searchOpen && panelMode !== 'help') return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(e.target as Node)
      ) {
        if (searchOpen) {
          closeSearch();
        }
        if (panelMode === 'help') {
          setPanelMode(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelMode, searchOpen, closeSearch]);

  useEffect(() => {
    if (panelMode !== 'explore') return;
    if (directoryTab === 'naming') return;

    const scrollRoot = exploreScrollRef.current;
    if (!scrollRoot) return;

    const activeItem = scrollRoot.querySelector<HTMLElement>(
      '.tour-nav-actions__item--active, .tour-nav-actions__item--naming-active',
    );
    activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeNamingHotspotId, currentSceneId, directoryTab, panelMode]);

  useEffect(() => {
    if (!searchOpen || !isSearchActive) return;

    const scrollRoot = searchScrollRef.current;
    if (!scrollRoot) return;

    const activeItem = scrollRoot.querySelector<HTMLElement>(
      '.tour-nav-actions__item--active, .tour-nav-actions__item--naming-active',
    );
    activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [
    activeNamingHotspotId,
    currentSceneId,
    isSearchActive,
    searchOpen,
    filteredScenes,
    filteredNamingItems,
  ]);

  useEffect(() => {
    if (searchOpen) return;

    setSearch('');
  }, [searchOpen]);

  useEffect(() => {
    if (panelMode !== null) return;

    setDirectoryTab('all');
  }, [panelMode]);

  const handleSelect = (sceneId: string) => {
    if (sceneId !== currentSceneId) {
      onSelectScene(sceneId);
    }

    if (searchOpen) {
      closeSearch();
    }
  };

  const handleExploreClick = () => {
    if (panelMode === 'explore') {
      closePanel();
      return;
    }

    closeSearch();
    setPanelMode('explore');
  };

  const openSearch = () => {
    closePanel();
    setSearchOpen(true);
    requestSearchFocus();
  };

  const handleHelpClick = () => {
    if (panelMode === 'help') {
      closePanel();
      return;
    }

    closeSearch();
    setPanelMode('help');
  };

  const handleTuneClick = () => {
    onControlsToggle();
  };

  const logoImage = clientLogo && (
    <img
      className='tour-nav-actions__logo'
      src={clientLogo}
      alt={logoAlt ?? ''}
    />
  );

  const logoNode =
    clientLogo ?
      websiteUrl ?
        <a
          className='tour-nav-actions__logo-link'
          href={websiteUrl}
          target='_blank'
          rel='noopener noreferrer'
          onClick={(e) => e.stopPropagation()}
        >
          {logoImage}
        </a>
      : <div className='tour-nav-actions__logo-link'>{logoImage}</div>
    : null;

  const handleSelectNaming = (sceneId: string, hotspotId: string) => {
    onSelectNamingOpportunity(sceneId, hotspotId);

    if (searchOpen) {
      closeSearch();
    }
  };

  const renderDirectoryTabs = () => (
    <div
      className='tour-nav-actions__directory-tabs'
      role='tablist'
      aria-label='Tour directory filters'
    >
      {TOUR_DIRECTORY_TABS.map((tab) => (
        <button
          key={tab.id}
          type='button'
          role='tab'
          id={`tour-nav-directory-tab-${tab.id}`}
          aria-selected={directoryTab === tab.id}
          aria-controls={`tour-nav-directory-panel-${tab.id}`}
          className={`tour-nav-actions__directory-tab${directoryTab === tab.id ? ' tour-nav-actions__directory-tab--active' : ''}`}
          disabled={disabled}
          onClick={() => setDirectoryTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderLocationsList = (
    items: Scene[],
    options?: { showSectionTitle?: boolean; emptyMessage?: string },
  ) => (
    <section
      className='tour-nav-actions__directory-section'
      aria-labelledby={
        options?.showSectionTitle ?
          'tour-nav-directory-locations-heading'
        : undefined
      }
    >
      {options?.showSectionTitle && (
        <h3
          id='tour-nav-directory-locations-heading'
          className='tour-nav-actions__section-title'
        >
          {TOUR_DIRECTORY_SECTION_LOCATIONS}
        </h3>
      )}

      {items.length > 0 ?
        <ul
          className='tour-nav-actions__list'
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
                  className={`tour-nav-actions__item${isActive ? ' tour-nav-actions__item--active' : ''}`}
                  disabled={disabled}
                  onClick={() => handleSelect(scene.id)}
                >
                  <span className='tour-nav-actions__item-leading'>
                    <span
                      className='tour-nav-actions__item-dot'
                      aria-hidden='true'
                    />
                  </span>
                  <span className='tour-nav-actions__item-label'>
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
      : options?.emptyMessage ?
        <p className='tour-nav-actions__empty'>{options.emptyMessage}</p>
      : null}
    </section>
  );

  const renderNamingList = (
    items: TourDirectoryNamingItem[],
    options?: { showSectionTitle?: boolean; emptyMessage?: string },
  ) => (
    <section
      className='tour-nav-actions__directory-section'
      aria-labelledby={
        options?.showSectionTitle ?
          'tour-nav-directory-naming-heading'
        : undefined
      }
    >
      {options?.showSectionTitle && (
        <h3
          id='tour-nav-directory-naming-heading'
          className='tour-nav-actions__section-title'
        >
          {TOUR_DIRECTORY_SECTION_NAMING}
        </h3>
      )}

      {items.length > 0 ?
        <ul
          className='tour-nav-actions__list'
          role='listbox'
          aria-label={TOUR_DIRECTORY_SECTION_NAMING}
        >
          {items.map((item) => {
            const isActive =
              activeNamingHotspotId === item.hotspotId &&
              currentSceneId === item.sceneId;

            return (
              <li key={`${item.sceneId}:${item.hotspotId}`} role='presentation'>
                <button
                  type='button'
                  role='option'
                  aria-selected={isActive}
                  className={`tour-nav-actions__item tour-nav-actions__item--naming${isActive ? ' tour-nav-actions__item--naming-active' : ''}`}
                  disabled={disabled}
                  onClick={() =>
                    handleSelectNaming(item.sceneId, item.hotspotId)
                  }
                >
                  <span className='tour-nav-actions__item-leading'>
                    <NamingHeartIcon active={isActive} />
                  </span>
                  <span className='tour-nav-actions__item-text'>
                    <span className='tour-nav-actions__item-label'>
                      {item.name}
                    </span>
                    <span className='tour-nav-actions__item-meta'>
                      {item.sceneTitle}
                    </span>
                  </span>
                  <NamingStatusBadge
                    statusModifier={item.statusModifier as NamingStatusModifier}
                    label={item.statusLabel}
                    className='tour-nav-actions__item-badge'
                  />
                </button>
              </li>
            );
          })}
        </ul>
      : options?.emptyMessage ?
        <p className='tour-nav-actions__empty'>{options.emptyMessage}</p>
      : null}
    </section>
  );

  const renderDirectoryBody = () => {
    return renderExploreDirectory();
  };

  const renderExploreDirectory = () => {
    const showLocations =
      directoryTab === 'all' || directoryTab === 'locations';
    const showNaming = directoryTab === 'all' || directoryTab === 'naming';
    const showSectionTitles = directoryTab === 'all';

    return (
      <div
        id={`tour-nav-directory-panel-${directoryTab}`}
        role='tabpanel'
        aria-labelledby={`tour-nav-directory-tab-${directoryTab}`}
        className='tour-nav-actions__directory-panel'
      >
        {showLocations &&
          renderLocationsList(scenes, {
            showSectionTitle: showSectionTitles,
            emptyMessage:
              directoryTab === 'locations' ?
                'No locations in this tour.'
              : undefined,
          })}

        {showNaming &&
          renderNamingList(namingItems, {
            showSectionTitle: showSectionTitles,
            emptyMessage:
              directoryTab === 'naming' ?
                'No naming opportunities in this tour.'
              : undefined,
          })}
      </div>
    );
  };

  const renderSearchResults = () => {
    const hasScenes = filteredScenes.length > 0;
    const hasNaming = filteredNamingItems.length > 0;

    if (!hasScenes && !hasNaming) {
      return (
        <p className='tour-nav-actions__empty'>
          No locations or naming opportunities match your search.
        </p>
      );
    }

    return (
      <div className='tour-nav-actions__directory-panel'>
        {hasScenes &&
          renderLocationsList(filteredScenes, { showSectionTitle: true })}
        {hasNaming &&
          renderNamingList(filteredNamingItems, { showSectionTitle: true })}
      </div>
    );
  };

  const renderExplorePanel = () => (
    <div id='tour-nav-explore-panel' className='tour-nav-actions__panel-slot'>
      <TourGlassPanel
        title={TOUR_DIRECTORY_PANEL_TITLE}
        titleId='tour-nav-explore-title'
        onClose={closePanel}
        animation={panelAnimation(panelPhase)}
        bodyClassName='tour-glass-panel__body--directory'
      >
        {renderDirectoryTabs()}

        <div
          ref={exploreScrollRef}
          className='tour-nav-actions__panel-scroll ishare-scrollbar'
        >
          <div className='tour-nav-actions__panel-scroll-inner'>
            {renderDirectoryBody()}
          </div>
        </div>
      </TourGlassPanel>
    </div>
  );

  const renderSearchSlot = () => (
    <div
      className={`tour-nav-actions__search-slot${searchOpen ? ' tour-nav-actions__search-slot--open' : ''}${isSearchActive ? ' tour-nav-actions__search-slot--results' : ''}`}
    >
      <div
        className={`tour-nav-actions__search-pill${searchOpen ? ' tour-nav-actions__search-pill--open' : ''}`}
      >
        {!searchOpen ?
          <button
            type='button'
            className='tour-nav-actions__search-pill-trigger'
            onClick={openSearch}
            aria-expanded={false}
            aria-controls='tour-scene-search'
            {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SEARCH_OPEN)}
          >
            <SearchIcon />
          </button>
        : <>
            <PanelSearchIcon />
            <input
              ref={searchRef}
              id='tour-scene-search'
              type='search'
              className='tour-nav-actions__search'
              placeholder={TOUR_DIRECTORY_SEARCH_PLACEHOLDER}
              value={search}
              disabled={disabled}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete='off'
              aria-label={TOUR_DIRECTORY_SEARCH_PLACEHOLDER}
              aria-controls='tour-nav-search-dropdown'
              aria-expanded={isSearchActive}
            />
            <button
              type='button'
              className='tour-nav-actions__search-pill-close'
              onClick={closeSearch}
              {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SEARCH_CLOSE)}
            >
              <GlassPanelCloseIcon />
            </button>
          </>
        }
      </div>

      {searchOpen && isSearchActive && (
        <div
          id='tour-nav-search-dropdown'
          ref={searchScrollRef}
          className='tour-nav-actions__search-dropdown ishare-scrollbar'
          role='region'
          aria-label='Search results'
        >
          {renderSearchResults()}
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav className='tour-nav-breadcrumb' aria-label='Tour location'>
        <div
          className={`tour-nav-breadcrumb__row${breadcrumbHidden ? ' tour-nav-breadcrumb__row--hidden' : ''}`}
        >
          {displayShowHistoryBack && (
            <button
              type='button'
              className='tour-nav-history-btn'
              aria-label='Previous view'
              disabled={disabled}
              onClick={onHistoryBack}
            >
              <HistoryBackIcon />
            </button>
          )}

          <div className='tour-nav-breadcrumb__bar'>
            <ol className='tour-nav-breadcrumb__list'>
              {breadcrumbItems.map((item, index) => (
                <li key={item.id} className='tour-nav-breadcrumb__item'>
                  {index > 0 && (
                    <span
                      className='tour-nav-breadcrumb__sep'
                      aria-hidden='true'
                    >
                      ›
                    </span>
                  )}
                  {item.isCurrent ?
                    <span
                      className='tour-nav-breadcrumb__current'
                      aria-current='location'
                    >
                      {index === 0 && <BreadcrumbLayerIcon />}
                      <span className='tour-nav-breadcrumb__current-label'>
                        {item.title}
                      </span>
                      <span
                        className='tour-nav-breadcrumb__pulse-dot'
                        aria-hidden='true'
                      />
                    </span>
                  : <button
                      type='button'
                      className='tour-nav-breadcrumb__link'
                      disabled={disabled}
                      onClick={() => onBreadcrumbNavigate(item.id)}
                    >
                      {index === 0 && <BreadcrumbLayerIcon />}
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
              className='tour-nav-history-btn'
              aria-label='Next view'
              disabled={disabled}
              onClick={onHistoryForward}
            >
              <HistoryForwardIcon />
            </button>
          )}
        </div>
      </nav>

      <div
        className={[
          'tour-nav-actions',
          displayPanel && `tour-nav-actions--${displayPanel}-open`,
          searchOpen && 'tour-nav-actions--search-pill-open',
        ]
          .filter(Boolean)
          .join(' ')}
        ref={actionsRef}
      >
        {displayPanel === 'explore' && renderExplorePanel()}

        {displayPanel === 'help' && (
          <div
            id='tour-nav-help-panel'
            className='tour-nav-actions__panel-slot tour-nav-actions__panel-slot--help'
          >
            <TourGlassPanel
              title={TOUR_HELP_PANEL_TITLE}
              titleId='tour-nav-help-title'
              onClose={closePanel}
              animation={panelAnimation(panelPhase)}
              bodyClassName='tour-glass-panel__body--help'
            >
              <TourHelpPanel
                tourTitle={tourTitle}
                organization={organization}
                logo={logoNode}
              />
            </TourGlassPanel>
          </div>
        )}

        <div className='tour-nav-actions__dock'>
          <button
            type='button'
            className={`tour-nav-actions__circle-btn${panelMode === 'explore' ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleExploreClick}
            aria-expanded={panelMode === 'explore'}
            aria-controls='tour-nav-explore-panel'
            {...tourNavIconButtonA11y(
              tourNavExploreActionLabel(panelMode === 'explore'),
            )}
          >
            <ExploreTourIcon />
          </button>

          {renderSearchSlot()}

          <button
            type='button'
            className={`tour-nav-actions__circle-btn${controlsVisible ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleTuneClick}
            aria-pressed={controlsVisible}
            {...tourNavIconButtonA11y(
              tourNavControlsActionLabel(controlsVisible),
            )}
          >
            <ControlsIcon />
          </button>

          <button
            type='button'
            className={`tour-nav-actions__circle-btn${panelMode === 'help' ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleHelpClick}
            aria-expanded={panelMode === 'help'}
            aria-controls='tour-nav-help-panel'
            {...tourNavIconButtonA11y(
              tourNavHelpActionLabel(panelMode === 'help'),
            )}
          >
            <HelpIcon />
          </button>
        </div>
      </div>
    </>
  );
}
