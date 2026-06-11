import { useEffect, useMemo, useRef, useState } from 'react';
import type { Scene } from '../types/tour';
import { Badge } from './ui/Badge';
import './TourNavFloat.css';

interface TourNavFloatProps {
  scenes: Scene[];
  currentSceneId: string;
  sceneHistory: string[];
  breadcrumbRoot?: string;
  tourTitle?: string;
  clientLogo?: string;
  logoAlt?: string;
  websiteUrl?: string;
  disabled?: boolean;
  canGoBack: boolean;
  controlsVisible: boolean;
  onControlsToggle: () => void;
  onSelectScene: (sceneId: string) => void;
  onBreadcrumbNavigate: (target: 'root' | string) => void;
  onBack: () => void;
}

type PanelMode = 'menu' | 'search' | 'help' | null;
type PanelAnimPhase = 'enter' | 'exit' | 'idle';

const PANEL_ENTER_MS = 150;
const PANEL_EXIT_MS = 140;

function panelAnimClass(phase: PanelAnimPhase): string {
  return phase === 'idle' ? '' : ` tour-nav-actions__panel--${phase}`;
}

const VIEWER_CONTROLS = [
  'Drag to look around',
  'Scroll or pinch to zoom',
  'Use the control pill at the bottom for zoom, move, and fullscreen',
  'Arrow keys to rotate',
  '+ / − to zoom in and out',
] as const;

interface BreadcrumbItem {
  id: 'root' | string;
  title: string;
  isCurrent: boolean;
}

function filterScenes(scenes: Scene[], query: string): Scene[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return scenes.filter(
    (scene) =>
      scene.title.toLowerCase().includes(q) ||
      scene.id.toLowerCase().includes(q),
  );
}

function MenuIcon() {
  return (
    <svg
      className='tour-nav-actions__circle-icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.5 5.5H16.5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
      />
      <path
        d='M3.5 10H16.5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
      />
      <path
        d='M3.5 14.5H16.5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
      />
    </svg>
  );
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

function buildBreadcrumbItems(
  sceneHistory: string[],
  scenes: Scene[],
  rootLabel: string,
  currentSceneId: string,
): BreadcrumbItem[] {
  const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));
  const items: BreadcrumbItem[] = [
    { id: 'root', title: rootLabel, isCurrent: false },
  ];

  for (const sceneId of sceneHistory) {
    const scene = sceneMap.get(sceneId);
    if (!scene) continue;
    items.push({
      id: sceneId,
      title: scene.title,
      isCurrent: sceneId === currentSceneId,
    });
  }

  if (items.length > 1) {
    items[items.length - 1].isCurrent = true;
    items[0].isCurrent = false;
  } else {
    items[0].isCurrent = true;
  }

  return items;
}

export function TourNavFloat({
  scenes,
  currentSceneId,
  sceneHistory,
  breadcrumbRoot = 'Home',
  tourTitle = 'Virtual Tour',
  clientLogo,
  logoAlt,
  websiteUrl,
  disabled = false,
  canGoBack,
  controlsVisible,
  onControlsToggle,
  onSelectScene,
  onBreadcrumbNavigate,
  onBack,
}: TourNavFloatProps) {
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [displayPanel, setDisplayPanel] = useState<PanelMode>(null);
  const [panelPhase, setPanelPhase] = useState<PanelAnimPhase>('idle');
  const [search, setSearch] = useState('');
  const actionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const breadcrumbItems = useMemo(
    () =>
      buildBreadcrumbItems(
        sceneHistory,
        scenes,
        breadcrumbRoot,
        currentSceneId,
      ),
    [sceneHistory, scenes, breadcrumbRoot, currentSceneId],
  );

  const filteredScenes = useMemo(
    () => filterScenes(scenes, search),
    [scenes, search],
  );

  const isOpen = panelMode !== null;

  useEffect(() => {
    if (panelMode === null) {
      if (!displayPanel) return;

      setPanelPhase('exit');
      const timer = window.setTimeout(() => {
        setDisplayPanel(null);
        setPanelPhase('idle');
      }, PANEL_EXIT_MS);

      return () => window.clearTimeout(timer);
    }

    if (panelMode !== displayPanel) {
      setDisplayPanel(panelMode);
      setPanelPhase('enter');
      const timer = window.setTimeout(() => setPanelPhase('idle'), PANEL_ENTER_MS);
      return () => window.clearTimeout(timer);
    }
  }, [panelMode, displayPanel]);

  useEffect(() => {
    if (panelMode !== 'search') return;

    const focusTimer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [panelMode]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(e.target as Node)
      ) {
        setPanelMode(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const closePanel = () => setPanelMode(null);

  const handleSelect = (sceneId: string) => {
    if (sceneId !== currentSceneId) {
      onSelectScene(sceneId);
    }
    closePanel();
  };

  const handleMenuClick = () => {
    setPanelMode((mode) => (mode === 'menu' ? null : 'menu'));
  };

  const handleSearchClick = () => {
    setPanelMode((mode) => (mode === 'search' ? null : 'search'));
  };

  const handleTuneClick = () => {
    closePanel();
    onControlsToggle();
  };

  const handleHelpClick = () => {
    setPanelMode((mode) => (mode === 'help' ? null : 'help'));
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

  const renderSceneList = (items: Scene[]) => (
    <>
      <ul
        className='tour-nav-actions__list'
        role='listbox'
        aria-label='Tour locations'
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
                <span
                  className='tour-nav-actions__item-dot'
                  aria-hidden='true'
                />
                <span className='tour-nav-actions__item-label'>
                  {scene.title}
                </span>
                {isActive && (
                  <Badge variant='soft' tone='primary' uppercase>
                    Current
                  </Badge>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {items.length === 0 && (
        <p className='tour-nav-actions__empty'>
          No locations match your search.
        </p>
      )}
    </>
  );

  return (
    <>
      <nav className='tour-nav-breadcrumb' aria-label='Tour location'>
        <div className='tour-nav-breadcrumb__bar'>
          <ol className='tour-nav-breadcrumb__list'>
            {breadcrumbItems.map((item, index) => (
              <li key={item.id} className='tour-nav-breadcrumb__item'>
                {index > 0 && (
                  <span className='tour-nav-breadcrumb__sep' aria-hidden='true'>
                    ›
                  </span>
                )}
                {item.isCurrent ?
                  <span
                    className='tour-nav-breadcrumb__current'
                    aria-current='location'
                  >
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
                    {item.title}
                  </button>
                }
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <div
        className={`tour-nav-actions${displayPanel ? ` tour-nav-actions--${displayPanel}-open` : ''}`}
        ref={actionsRef}
      >
        {displayPanel === 'menu' && (
          <div
            id='tour-nav-menu-panel'
            className={`tour-nav-actions__panel tour-nav-actions__panel--menu${panelAnimClass(panelPhase)}`}
            role='dialog'
            aria-labelledby='tour-nav-menu-title'
          >
            <div className='tour-nav-actions__panel-header'>
              <h2
                id='tour-nav-menu-title'
                className='tour-nav-actions__panel-title'
              >
                All locations
              </h2>
            </div>

            <div className='tour-nav-actions__panel-body ishare-scrollbar'>
              {logoNode && (
                <div className='tour-nav-actions__panel-logo'>{logoNode}</div>
              )}

              {renderSceneList(scenes)}

              <button
                type='button'
                className='tour-nav-actions__back'
                disabled={disabled || !canGoBack}
                onClick={() => {
                  onBack();
                  closePanel();
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {displayPanel === 'search' && (
          <div
            id='tour-nav-search-panel'
            className={`tour-nav-actions__panel tour-nav-actions__panel--search${panelAnimClass(panelPhase)}`}
            role='dialog'
            aria-labelledby='tour-nav-search-title'
          >
            <div className='tour-nav-actions__panel-header'>
              <h2
                id='tour-nav-search-title'
                className='tour-nav-actions__panel-title'
              >
                Search locations
              </h2>
            </div>

            <div className='tour-nav-actions__panel-body tour-nav-actions__panel-body--search'>
              <div className='tour-nav-actions__search-wrap'>
                <PanelSearchIcon />
                <input
                  ref={searchRef}
                  id='tour-scene-search'
                  type='search'
                  className='tour-nav-actions__search'
                  placeholder='Search locations…'
                  value={search}
                  disabled={disabled}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete='off'
                  aria-label='Search locations'
                />
              </div>

              <div className='tour-nav-actions__panel-scroll ishare-scrollbar'>
                {search.trim() ? renderSceneList(filteredScenes) : null}
              </div>
            </div>
          </div>
        )}

        {displayPanel === 'help' && (
          <div
            id='tour-nav-help-panel'
            className={`tour-nav-actions__panel tour-nav-actions__panel--help${panelAnimClass(panelPhase)}`}
            role='dialog'
            aria-labelledby='tour-nav-help-title'
          >
            <div className='tour-nav-actions__panel-header'>
              <h2
                id='tour-nav-help-title'
                className='tour-nav-actions__panel-title'
              >
                About this tour
              </h2>
            </div>

            <div className='tour-nav-actions__panel-body ishare-scrollbar'>
              <p className='tour-nav-actions__help-lead'>
                Welcome to {tourTitle}. Explore each location in 360°, move
                between scenes with hotspots, and use the tools below to find
                your way around.
              </p>

              <ul className='tour-nav-actions__help-list'>
                <li>
                  The breadcrumb at the top shows where you are — tap an earlier
                  stop to go back.
                </li>
                <li>
                  Open the menu to browse all locations, or search by name.
                </li>
                <li>
                  Tap hotspots in the scene for info or to move to a new area.
                </li>
                <li>
                  Use <strong>Ask Guide</strong> (bottom-right) to chat with the
                  iShare assistant about this facility.
                </li>
                <li>
                  Tap the tune icon to show or hide viewer controls at the
                  bottom.
                </li>
              </ul>

              <p className='tour-nav-actions__controls-title'>
                Viewer controls
              </p>
              <ul className='tour-nav-actions__controls-list'>
                {VIEWER_CONTROLS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className='tour-nav-actions__dock'>
          <button
            type='button'
            className={`tour-nav-actions__circle-btn${panelMode === 'menu' ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleMenuClick}
            aria-expanded={panelMode === 'menu'}
            aria-controls='tour-nav-menu-panel'
            aria-label={
              panelMode === 'menu' ?
                'Close locations menu'
              : 'Open locations menu'
            }
          >
            <MenuIcon />
          </button>

          <button
            type='button'
            className={`tour-nav-actions__circle-btn${panelMode === 'search' ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleSearchClick}
            aria-expanded={panelMode === 'search'}
            aria-controls='tour-nav-search-panel'
            aria-label={
              panelMode === 'search' ? 'Close search' : 'Search locations'
            }
          >
            <SearchIcon />
          </button>

          <button
            type='button'
            className={`tour-nav-actions__circle-btn${controlsVisible ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleTuneClick}
            aria-pressed={controlsVisible}
            aria-label={
              controlsVisible ? 'Hide viewer controls' : 'Show viewer controls'
            }
          >
            <ControlsIcon />
          </button>

          <button
            type='button'
            className={`tour-nav-actions__circle-btn${panelMode === 'help' ? ' tour-nav-actions__circle-btn--active' : ''}`}
            onClick={handleHelpClick}
            aria-expanded={panelMode === 'help'}
            aria-controls='tour-nav-help-panel'
            aria-label={panelMode === 'help' ? 'Close help' : 'Tour help'}
          >
            <HelpIcon />
          </button>
        </div>
      </div>
    </>
  );
}
