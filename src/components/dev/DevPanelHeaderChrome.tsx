import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import type { TourListItem } from '../../data/loadTour';
import type { DevPanelLayout, DevPanelTheme } from '../../constants/devPanel';
import {
  setDevPanelLayout,
  setDevPanelTheme,
  useDevPanelLayout,
  useDevPanelTheme,
} from '../../utils/devPanelPrefs';
import { withBaseUrl } from '../../utils/assetUrl';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import { cn } from '../../lib/cn';
import { DevPanelDebugMenu } from './DevPanelDebugMenu';
import {
  devViewPanelHeaderIconBtnActiveClassName,
  devViewPanelHeaderIconBtnClassName,
  devViewPanelHeaderPopoversClassName,
  devViewPanelPopoverCloseBtnClassName,
  devViewPanelSettingsGroupClassName,
  devViewPanelSettingsGroupLabelClassName,
  devViewPanelSettingsRadioListClassName,
  devViewPanelSettingsRadioMarkCheckedClassName,
  devViewPanelSettingsRadioMarkClassName,
  devViewPanelSettingsRadioOptionActiveClassName,
  devViewPanelSettingsRadioOptionClassName,
  devViewPanelStickyTourLogoClassName,
  devViewPanelStickyTourLogoWrapClassName,
  devViewPanelThemeMenuClassName,
  devViewPanelTourSwitchAnchorClassName,
  devViewPanelTourSwitchActionItemClassName,
  devViewPanelTourSwitchChevronClassName,
  devViewPanelTourSwitchGroupClassName,
  devViewPanelTourSwitchGroupHeadingClassName,
  devViewPanelTourSwitchMenuClassName,
  devViewPanelTourSwitchMenuItemActiveClassName,
  devViewPanelTourSwitchMenuItemClassName,
  devViewPanelTourSwitchMenuRuleClassName,
  devViewPanelTourSwitchTriggerClassName,
  devViewPanelTourSwitcherClassName,
} from './devViewPanelVariants';

export type DevTourSwitchGroup = {
  clientId: string;
  clientName: string;
  tours: TourListItem[];
};

type DevPanelHeaderChromeProps = {
  tourLogoSrc: string | null;
  tourLogoAlt: string;
  onTourLogoError: () => void;
  stickyTourName: string;
  tourGroups: DevTourSwitchGroup[];
  currentTourId: string;
  tourId: string;
  isModel3dTour: boolean;
  panelOpen: boolean;
  onClose?: () => void;
  onSwitchTour: (tourId: string) => void;
  onOpenIntroGallery: () => void;
};

/**
 * Sticky tour switcher + debug/settings. Local popover state so opening a menu
 * does not re-render Scene / Scenes / Naming / Tours tab bodies.
 */
export const DevPanelHeaderChrome = memo(function DevPanelHeaderChrome({
  tourLogoSrc,
  tourLogoAlt,
  onTourLogoError,
  stickyTourName,
  tourGroups,
  currentTourId,
  tourId,
  isModel3dTour,
  panelOpen,
  onClose,
  onSwitchTour,
  onOpenIntroGallery,
}: DevPanelHeaderChromeProps) {
  const devPanelTheme = useDevPanelTheme();
  const devPanelLayout = useDevPanelLayout();
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

  return (
    <div className={devViewPanelTourSwitcherClassName}>
      {tourLogoSrc ?
        <div className={devViewPanelStickyTourLogoWrapClassName}>
          <img
            className={devViewPanelStickyTourLogoClassName}
            src={withBaseUrl(tourLogoSrc)}
            alt={tourLogoAlt}
            onError={onTourLogoError}
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
                    onOpenIntroGallery();
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
                  <p className={devViewPanelTourSwitchGroupHeadingClassName}>
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
                              onSwitchTour(option.id);
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
              tourId={tourId}
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
  );
});
