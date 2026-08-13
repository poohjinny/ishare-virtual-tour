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
import { subscribeDevCatalogSnapshot } from '../../data/devCatalogSnapshot';
import {
  listRoutableTourIds,
  listTours,
  loadTour,
  removeDevTourCache,
  setDevTourCache,
  tryLoadTour,
  type TourListItem,
} from '../../data/loadTour';
import { normalizeTourAssets } from '../../services/normalizeTourAssets';
import {
  buildTourLocation,
  isRootPathWithoutTour,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../../utils/tourPaths';
import { getTourClientId } from '../../utils/tourClientId';
import { withBaseUrl } from '../../utils/assetUrl';
import { useFallbackImageSrc } from '../../hooks/useFallbackImageSrc';
import {
  clientBrandFaviconCandidates,
  resolveTourBranding,
  tourBrandFaviconCandidates,
} from '../../utils/resolveTourBranding';
import {
  DEV_PANEL_TABS,
  DEV_PANEL_PRIMARY_TABS,
  DEV_SHELL_TOUR_ID,
  type DevPanelLayout,
  type DevPanelTab,
  type DevPanelTheme,
} from '../../constants/devPanel';
import {
  setDevPanelLayout,
  setDevPanelTheme,
  useDevPanelPrefs,
} from '../../utils/devPanelPrefs';
import type { Tour, ViewPosition } from '../../types/tour';
import type { ClickCoords, DevSceneRef } from '../../utils/devHotspotLogger';
import type { DevHotspotMovePosition } from '../../utils/devTourBridge';
import {
  devFetchCatalogClients,
  devFetchTour,
  refreshDevCatalogSnapshot,
  type DevCatalogClient,
  type DevTourMutateOptions,
} from '../../utils/devTourApi';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import { cn } from '../../lib/cn';
import {
  devViewPanelBodyClassName,
  devViewPanelRootFloatingClassName,
  devViewPanelRootVariants,
  devViewPanelTabLeadClassName,
  devViewPanelHeaderIconBtnActiveClassName,
  devViewPanelHeaderIconBtnClassName,
  devViewPanelHeaderPopoversClassName,
  devViewPanelThemeMenuClassName,
  devViewPanelPopoverCloseBtnClassName,
  devViewPanelSettingsGroupClassName,
  devViewPanelSettingsGroupLabelClassName,
  devViewPanelSettingsRadioListClassName,
  devViewPanelSettingsRadioMarkCheckedClassName,
  devViewPanelSettingsRadioMarkClassName,
  devViewPanelSettingsRadioOptionActiveClassName,
  devViewPanelSettingsRadioOptionClassName,
  devViewPanelStickyHeaderVariants,
  devViewPanelStickyTourLogoClassName,
  devViewPanelStickyTourLogoWrapClassName,
  devViewPanelPrimaryTabsVariants,
  devViewPanelTabPanelClassName,
  devViewPanelTabVariants,
  devViewPanelTourSwitchAnchorClassName,
  devViewPanelTourSwitchChevronClassName,
  devViewPanelTourSwitchMenuClassName,
  devViewPanelTourSwitchGroupClassName,
  devViewPanelTourSwitchGroupHeadingClassName,
  devViewPanelTourSwitchMenuItemActiveClassName,
  devViewPanelTourSwitchMenuItemClassName,
  devViewPanelTourSwitchActionItemClassName,
  devViewPanelTourSwitchMenuRuleClassName,
  devViewPanelTourSwitchTriggerClassName,
  devViewPanelTourSwitcherClassName,
} from './devViewPanelVariants';
import { DevPanelSectionPersistProvider } from './DevPanelSectionPersist';
import { DevClientPanel } from './DevClientPanel';
import { DevPanelDebugMenu } from './DevPanelDebugMenu';
import { DevSceneTabPanel } from './DevSceneTabPanel';
import { DevScenesListPanel } from './DevScenesListPanel';
import { DevNamingCatalogPanel } from './DevNamingCatalogPanel';
import { DevToursCatalogPanel } from './DevToursCatalogPanel';

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
  /** Restore the pre-hover camera after Manage list hover preview. */
  animateToView?: (view: ViewPosition) => Promise<void> | void;
  focusHotspot?: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
  /** Currently open naming / place-overview hotspot id (viewer selection). */
  activeNamingHotspotId?: string | null;
  openNamingOpportunity?: (sceneId: string, hotspotId: string) => void;
  /**
   * Fires when hotspot create is armed — 3D uses this to pause
   * floor click-to-move so placement clicks are not stolen.
   */
  onHotspotPlacementCaptureChange?: (active: boolean) => void;
  /** Manage → Move — which hotspot is armed for viewer drag-drop. */
  onHotspotMoveIdChange?: (hotspotId: string | null) => void;
  /** Register commit handler for viewer drag-drop saves. */
  registerHotspotMoveCommit?: (
    handler: ((position: DevHotspotMovePosition) => Promise<void>) | null,
  ) => void;
  onClose?: () => void;
  /** When false, close portaled header/tour menus (panel stays mounted). */
  panelOpen?: boolean;
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
  animateToView,
  focusHotspot,
  activeNamingHotspotId = null,
  openNamingOpportunity,
  onHotspotPlacementCaptureChange,
  onHotspotMoveIdChange,
  registerHotspotMoveCommit,
  onClose,
  panelOpen = true,
}: DevViewPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  const [manageClientId, setManageClientId] = useState('');
  const [catalogClients, setCatalogClients] = useState<DevCatalogClient[]>([]);
  const [selectedNamingId, setSelectedNamingId] = useState('');
  const [namingAddEnsureKey, setNamingAddEnsureKey] = useState(0);
  const [namingCatalogClearKey, setNamingCatalogClearKey] = useState(0);
  const [hotspotInteractionClearKey, setHotspotInteractionClearKey] =
    useState(0);
  const [deletedNamingId, setDeletedNamingId] = useState<string | null>(null);
  const [deletedNamingHotspotKey, setDeletedNamingHotspotKey] = useState(0);
  const [panelTab, setPanelTab] = useState<DevPanelTab>('scene');
  const { theme: devPanelTheme, layout: devPanelLayout } = useDevPanelPrefs();
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const headerPopoversRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const debugMenuRef = useRef<HTMLDivElement>(null);
  const [headerPopoverMenuStyle, setHeaderPopoverMenuStyle] =
    useState<CSSProperties>({});
  const [tourSwitchOpen, setTourSwitchOpen] = useState(false);
  const [tourSwitchMenuStyle, setTourSwitchMenuStyle] = useState<CSSProperties>(
    {},
  );
  const tourSwitchRef = useRef<HTMLDivElement>(null);
  const tourSwitchTriggerRef = useRef<HTMLButtonElement>(null);
  const tourSwitchMenuRef = useRef<HTMLUListElement>(null);
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const panelScrollTopRequestRef = useRef(false);

  const applyDevPanelTheme = useCallback((theme: DevPanelTheme) => {
    setDevPanelTheme(theme);
  }, []);

  const applyDevPanelLayout = useCallback((layout: DevPanelLayout) => {
    setDevPanelLayout(layout);
  }, []);

  const closeHeaderPopovers = useCallback(() => {
    setSettingsMenuOpen(false);
    setDebugMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!settingsMenuOpen && !debugMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (headerPopoversRef.current?.contains(target)) return;
      if (settingsMenuRef.current?.contains(target)) return;
      if (debugMenuRef.current?.contains(target)) return;
      closeHeaderPopovers();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeHeaderPopovers();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeHeaderPopovers, settingsMenuOpen, debugMenuOpen]);

  useLayoutEffect(() => {
    if (!settingsMenuOpen && !debugMenuOpen) return;

    const updatePosition = () => {
      const anchor = headerPopoversRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setHeaderPopoverMenuStyle({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [settingsMenuOpen, debugMenuOpen]);

  useEffect(() => {
    if (panelOpen) return;
    closeHeaderPopovers();
    setTourSwitchOpen(false);
  }, [panelOpen, closeHeaderPopovers]);

  const currentClientId = useMemo(() => {
    if (tour.id === DEV_SHELL_TOUR_ID || !tour.firstScene) return '';
    return getTourClientId(tour);
  }, [tour]);

  useEffect(() => {
    if (panelTab !== 'tour' && panelTab !== 'client') return;

    void devFetchCatalogClients()
      .then((clients) => {
        setCatalogClients(clients);
        setManageClientId((current) => {
          if (current && clients.some((client) => client.id === current)) {
            return current;
          }
          if (!tour.firstScene || tour.id === DEV_SHELL_TOUR_ID) {
            return '';
          }
          const openClientId = getTourClientId(tour);
          if (
            openClientId &&
            clients.some((client) => client.id === openClientId)
          ) {
            return openClientId;
          }
          return '';
        });
      })
      .catch(() => {
        setCatalogClients([]);
      });
  }, [panelTab, tour, catalogTick]);

  useLayoutEffect(() => {
    if (!panelScrollTopRequestRef.current) return;
    panelScrollTopRequestRef.current = false;
    panelBodyRef.current?.scrollTo({ top: 0, left: 0 });
  }, [panelTab]);

  const stickyTourBranding = useMemo(
    () => resolveTourBranding(tour),
    [tour, catalogTick],
  );
  const stickyIconCandidates = useMemo(() => {
    const clientId = getTourClientId(tour);
    return [
      ...tourBrandFaviconCandidates(tour),
      ...clientBrandFaviconCandidates(clientId, stickyTourBranding?.favicon),
      stickyTourBranding?.logo,
    ];
  }, [stickyTourBranding?.favicon, stickyTourBranding?.logo, tour]);
  const { src: stickyTourIcon, onError: onStickyTourIconError } =
    useFallbackImageSrc(stickyIconCandidates);
  const currentTourEntry = useMemo(
    () => tourOptions.find((option) => option.id === currentTourId),
    [currentTourId, tourOptions],
  );
  const isDevShellTour =
    tour.id === DEV_SHELL_TOUR_ID || currentTourId === DEV_SHELL_TOUR_ID;
  const stickyTourName =
    isDevShellTour ? 'Select a tour' : (
      (currentTourEntry?.facilityTitle ?? tour.title ?? currentTourId)
    );

  useEffect(() => {
    if (!isDevShellTour) return;
    setManageClientId('');
  }, [isDevShellTour]);

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

  useLayoutEffect(() => {
    if (!tourSwitchOpen) return;

    const updatePosition = () => {
      const trigger = tourSwitchTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setTourSwitchMenuStyle({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
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
      if (!nextTourId) return;
      const atRootWithoutTour = isRootPathWithoutTour(location.pathname);
      if (nextTourId === currentTourId && !atRootWithoutTour) return;
      const nextTour = loadTour(nextTourId);
      const nextSceneId = resolveSceneId(nextTourId, currentSceneId);
      navigate(
        buildTourLocation(
          nextTourId,
          nextSceneId,
          nextTour.firstScene,
          searchParams,
          { intro: null },
        ),
        { replace: true },
      );
    },
    [currentSceneId, currentTourId, location.pathname, navigate, searchParams],
  );

  const openIntroGallery = useCallback(() => {
    navigate(
      {
        pathname: '/',
        search: preservedSearchStringFrom(searchParams, { intro: '1' }),
      },
      { replace: true },
    );
  }, [navigate, searchParams]);

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

  const openCreateNamingTab = useCallback(() => {
    setHotspotInteractionClearKey((key) => key + 1);
    setPanelTab('naming');
    setNamingAddEnsureKey((key) => key + 1);
  }, []);

  const requestSceneTab = useCallback(() => {
    setPanelTab('scene');
  }, []);

  return (
    <DevPanelSectionPersistProvider>
      <div
        id={id}
        data-dev-theme={devPanelTheme}
        className={cn(
          devViewPanelRootVariants({ tab: panelTab }),
          devPanelLayout === 'floating' && devViewPanelRootFloatingClassName,
          // Push sits flush beside the stage — no edge border.
          devPanelLayout === 'push' && 'border-0',
        )}
      >
        <div className={devViewPanelStickyHeaderVariants({ tab: panelTab })}>
          <div className={devViewPanelTourSwitcherClassName}>
            {stickyTourIcon ?
              <div className={devViewPanelStickyTourLogoWrapClassName}>
                <img
                  className={devViewPanelStickyTourLogoClassName}
                  src={withBaseUrl(stickyTourIcon)}
                  alt={stickyTourBranding?.logoAlt ?? tour.title}
                  onError={onStickyTourIconError}
                />
              </div>
            : null}
            <div
              ref={tourSwitchRef}
              className={devViewPanelTourSwitchAnchorClassName}
            >
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
                    data-dev-theme={devPanelTheme}
                    role='listbox'
                    aria-label='Switch tour'
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <li role='presentation' className='flex flex-col gap-0.5'>
                      <button
                        type='button'
                        role='option'
                        aria-selected={false}
                        className={devViewPanelTourSwitchActionItemClassName}
                        onClick={() => {
                          setTourSwitchOpen(false);
                          openIntroGallery();
                        }}
                      >
                        <MaterialSymbol
                          name='grid_view'
                          filled
                          sizePx={MATERIAL_SYMBOL_SIZE_18}
                          className={materialSymbolLayoutClassName}
                        />
                        Intro gallery
                      </button>
                    </li>
                    {tourGroups.length > 0 ?
                      <li
                        role='separator'
                        className={devViewPanelTourSwitchMenuRuleClassName}
                      />
                    : null}
                    {tourGroups.map((group) => (
                      <li
                        key={group.clientId}
                        role='presentation'
                        className={devViewPanelTourSwitchGroupClassName}
                      >
                        <p
                          className={
                            devViewPanelTourSwitchGroupHeadingClassName
                          }
                        >
                          {group.clientName}
                        </p>
                        <ul
                          role='group'
                          aria-label={group.clientName}
                          className='flex flex-col gap-0.5 pl-1'
                        >
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
            </div>
            <div
              ref={headerPopoversRef}
              className={devViewPanelHeaderPopoversClassName}
            >
              <button
                type='button'
                className={cn(
                  devViewPanelHeaderIconBtnClassName,
                  debugMenuOpen && devViewPanelHeaderIconBtnActiveClassName,
                )}
                aria-label='Debug'
                aria-haspopup='dialog'
                aria-expanded={debugMenuOpen}
                title='Debug'
                onClick={() => {
                  setSettingsMenuOpen(false);
                  setDebugMenuOpen((open) => !open);
                }}
              >
                <MaterialSymbol
                  name='bug_report'
                  filled
                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                  className={materialSymbolLayoutClassName}
                />
              </button>
              <button
                type='button'
                className={cn(
                  devViewPanelHeaderIconBtnClassName,
                  settingsMenuOpen && devViewPanelHeaderIconBtnActiveClassName,
                )}
                aria-label='Dev panel settings'
                aria-haspopup='menu'
                aria-expanded={settingsMenuOpen}
                title='Settings'
                onClick={() => {
                  setDebugMenuOpen(false);
                  setSettingsMenuOpen((open) => !open);
                }}
              >
                <MaterialSymbol
                  name='settings'
                  filled
                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                  className={materialSymbolLayoutClassName}
                />
              </button>
              {onClose ?
                <button
                  type='button'
                  className={devViewPanelHeaderIconBtnClassName}
                  onClick={onClose}
                  aria-label='Close dev panel (`)'
                  title='Close dev panel (`)'
                >
                  <MaterialSymbol
                    name='close'
                    filled
                    sizePx={MATERIAL_SYMBOL_SIZE_18}
                    className={materialSymbolLayoutClassName}
                  />
                </button>
              : null}
              {debugMenuOpen && typeof document !== 'undefined' ?
                createPortal(
                  <DevPanelDebugMenu
                    menuRef={debugMenuRef}
                    style={headerPopoverMenuStyle}
                    theme={devPanelTheme}
                    tourId={tour.id}
                    isModel3dTour={isModel3dTour}
                    onClose={closeHeaderPopovers}
                  />,
                  document.body,
                )
              : null}
              {settingsMenuOpen && typeof document !== 'undefined' ?
                createPortal(
                  <div
                    ref={settingsMenuRef}
                    style={headerPopoverMenuStyle}
                    className={devViewPanelThemeMenuClassName}
                    data-dev-theme={devPanelTheme}
                    role='menu'
                    aria-label='Dev panel settings'
                  >
                    <button
                      type='button'
                      className={devViewPanelPopoverCloseBtnClassName}
                      aria-label='Close settings'
                      title='Close'
                      onClick={closeHeaderPopovers}
                    >
                      <MaterialSymbol
                        name='close'
                        filled
                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                        className={materialSymbolLayoutClassName}
                      />
                    </button>
                    <div
                      className={devViewPanelSettingsGroupClassName}
                      role='radiogroup'
                      aria-label='Theme'
                    >
                      <p className={devViewPanelSettingsGroupLabelClassName}>
                        Theme
                      </p>
                      <ul className={devViewPanelSettingsRadioListClassName}>
                        {(
                          [
                            { id: 'light', label: 'Light', icon: 'light_mode' },
                            { id: 'dark', label: 'Dark', icon: 'dark_mode' },
                          ] as const
                        ).map((option) => {
                          const checked = devPanelTheme === option.id;
                          return (
                            <li key={option.id}>
                              <button
                                type='button'
                                role='menuitemradio'
                                aria-checked={checked}
                                className={cn(
                                  devViewPanelSettingsRadioOptionClassName,
                                  checked &&
                                    devViewPanelSettingsRadioOptionActiveClassName,
                                )}
                                onClick={() => applyDevPanelTheme(option.id)}
                              >
                                <span
                                  className={cn(
                                    devViewPanelSettingsRadioMarkClassName,
                                    checked &&
                                      devViewPanelSettingsRadioMarkCheckedClassName,
                                  )}
                                  aria-hidden='true'
                                />
                                <MaterialSymbol
                                  name={option.icon}
                                  filled
                                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                                  className={materialSymbolLayoutClassName}
                                />
                                {option.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div
                      className={devViewPanelSettingsGroupClassName}
                      role='radiogroup'
                      aria-label='Panel layout'
                    >
                      <p className={devViewPanelSettingsGroupLabelClassName}>
                        Panel
                      </p>
                      <ul className={devViewPanelSettingsRadioListClassName}>
                        {(
                          [
                            {
                              id: 'floating',
                              label: 'Floating',
                              icon: 'select_window',
                            },
                            {
                              id: 'overlay',
                              label: 'Overlay',
                              icon: 'picture_in_picture',
                            },
                            { id: 'push', label: 'Push', icon: 'view_sidebar' },
                          ] as const
                        ).map((option) => {
                          const checked = devPanelLayout === option.id;
                          return (
                            <li key={option.id}>
                              <button
                                type='button'
                                role='menuitemradio'
                                aria-checked={checked}
                                className={cn(
                                  devViewPanelSettingsRadioOptionClassName,
                                  checked &&
                                    devViewPanelSettingsRadioOptionActiveClassName,
                                )}
                                onClick={() => applyDevPanelLayout(option.id)}
                              >
                                <span
                                  className={cn(
                                    devViewPanelSettingsRadioMarkClassName,
                                    checked &&
                                      devViewPanelSettingsRadioMarkCheckedClassName,
                                  )}
                                  aria-hidden='true'
                                />
                                <MaterialSymbol
                                  name={option.icon}
                                  filled
                                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                                  className={materialSymbolLayoutClassName}
                                />
                                {option.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>,
                  document.body,
                )
              : null}
            </div>
          </div>

          <div
            className={devViewPanelPrimaryTabsVariants({ tab: panelTab })}
            role='tablist'
            aria-label='Dev panel section'
          >
            {DEV_PANEL_PRIMARY_TABS.map((tab) => (
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
          <p className={devViewPanelTabLeadClassName}>
            {DEV_PANEL_TABS.find((tab) => tab.id === panelTab)?.description}
          </p>
          <div
            id='dev-panel-scene'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scene'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'scene'}
          >
            <DevSceneTabPanel
              tour={tour}
              onTourMutated={onTourMutated}
              scene={scene}
              sceneOptions={sceneOptions}
              view={view}
              clickCoords={clickCoords}
              captureSceneThumbnail={captureSceneThumbnail}
              getCurrentView={getCurrentView}
              animateToView={animateToView}
              focusHotspot={focusHotspot}
              openNamingOpportunity={openNamingOpportunity}
              onHotspotPlacementCaptureChange={onHotspotPlacementCaptureChange}
              onHotspotMoveIdChange={onHotspotMoveIdChange}
              registerHotspotMoveCommit={registerHotspotMoveCommit}
              selectedNamingId={selectedNamingId}
              onSelectedNamingIdChange={setSelectedNamingId}
              onOpenCreateNaming={openCreateNamingTab}
              onRequestSceneTab={requestSceneTab}
              onClearNamingCatalogEdit={() =>
                setNamingCatalogClearKey((key) => key + 1)
              }
              onNamingHotspotDeleted={(namingId) => {
                setDeletedNamingId(namingId);
                setDeletedNamingHotspotKey((key) => key + 1);
              }}
              hotspotInteractionClearKey={hotspotInteractionClearKey}
            />
          </div>
          {panelTab === 'client' ?
            <div
              id='dev-panel-client'
              role='tabpanel'
              aria-labelledby='dev-panel-tab-client'
              className={devViewPanelTabPanelClassName}
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
            </div>
          : null}
          <div
            id='dev-panel-scenes'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-scenes'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'scenes'}
          >
            <DevScenesListPanel
              tour={tour}
              onTourMutated={onTourMutated}
              scene={scene}
              view={view}
              captureSceneThumbnail={captureSceneThumbnail}
              getCurrentView={getCurrentView}
              isModel3dTour={isModel3dTour}
              onRequestSceneTab={requestSceneTab}
            />
          </div>
          <div
            id='dev-panel-naming'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-naming'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'naming'}
          >
            <DevNamingCatalogPanel
              tour={tour}
              onTourMutated={onTourMutated}
              scene={scene}
              openNamingOpportunity={openNamingOpportunity}
              activeNamingHotspotId={activeNamingHotspotId}
              getCurrentView={getCurrentView}
              animateToView={animateToView}
              focusHotspot={focusHotspot}
              ensureOpenKey={namingAddEnsureKey}
              catalogClearKey={namingCatalogClearKey}
              onSelectNamingId={setSelectedNamingId}
              onClearHotspotInteraction={() =>
                setHotspotInteractionClearKey((key) => key + 1)
              }
              deletedNamingId={deletedNamingId}
              deletedNamingHotspotKey={deletedNamingHotspotKey}
            />
          </div>
          <div
            id='dev-panel-tour'
            role='tabpanel'
            aria-labelledby='dev-panel-tab-tour'
            className={devViewPanelTabPanelClassName}
            hidden={panelTab !== 'tour'}
          >
            <DevToursCatalogPanel
              tour={tour}
              onTourMutated={onTourMutated}
              view={view}
              catalogTick={catalogTick}
              catalogClients={catalogClients}
              currentSceneId={currentSceneId}
              active={panelTab === 'tour'}
            />
          </div>
        </div>
      </div>
    </DevPanelSectionPersistProvider>
  );
}
