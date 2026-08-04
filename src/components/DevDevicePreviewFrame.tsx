import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  DEV_DEVICE_PRESET_GROUPS,
  getDevDevicePreset,
  getDevDevicePresetGroup,
  resolveDevDeviceSize,
  type DevDevicePresetId,
} from '../constants/devDevicePresets';
import { tryLoadTour } from '../data/loadTour';
import { resolveTourRoute } from '../utils/tourPaths';
import {
  MATERIAL_SYMBOL_SIZE_12,
  MATERIAL_SYMBOL_SIZE_14,
  materialSymbolLayoutClassName,
} from './ui/materialSymbolClasses';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { DevViewportPreviewShell } from './DevViewportPreviewShell';
import {
  buildDevDevicePreviewSrc,
  formatDevDeviceChromeUrl,
  resolveActiveDevDeviceFrame,
} from '../utils/devDevicePreview';
import {
  bumpDevDevicePreviewReload,
  setDevPanelDevice,
  setDevPanelDeviceMode,
  setDevPanelDeviceResponsiveSize,
  toggleDevPanelDeviceBrowserChrome,
  toggleDevPanelDeviceOrientation,
  useDevDevicePreviewReloadNonce,
  useDevPanelPrefs,
} from '../utils/devPanelPrefs';
import { cn } from '../lib/cn';
import {
  devDevicePreviewPickerGroupClassName,
  devDevicePreviewPickerGroupLabelClassName,
  devDevicePreviewPickerItemActiveClassName,
  devDevicePreviewPickerItemClassName,
  devDevicePreviewPickerItemMetaClassName,
  devDevicePreviewPickerMenuClassName,
  devDevicePreviewToolbarBtnActiveClassName,
  devDevicePreviewToolbarBtnClassName,
  devDevicePreviewToolbarIconClassName,
  devDevicePreviewToolbarSelectFaceClassName,
  devDevicePreviewToolbarSelectMetaClassName,
  devDevicePreviewToolbarSelectNameClassName,
  devDevicePreviewToolbarSelectWrapClassName,
} from './devViewPanelVariants';

/**
 * Device mode — preset/responsive viewport QA (no embed delivery).
 * Enter via Debug → Viewport → Device mode.
 */
export function DevDevicePreviewFrame() {
  const location = useLocation();
  const {
    tourOrScene,
    tourId,
    sceneId: sceneParam,
  } = useParams<{ tourOrScene?: string; tourId?: string; sceneId?: string }>();
  const route = useMemo(
    () => resolveTourRoute(tourOrScene ?? tourId, sceneParam),
    [sceneParam, tourId, tourOrScene],
  );
  const tourTitle = useMemo(() => {
    if (!route.tourId) return '';
    const tour = tryLoadTour(route.tourId);
    return tour?.title?.trim() || route.tourId;
  }, [route.tourId]);
  const {
    device,
    deviceOrientation,
    deviceResponsiveSize,
    deviceBrowserChrome,
  } = useDevPanelPrefs();
  const reloadNonce = useDevDevicePreviewReloadNonce();
  const frame = resolveActiveDevDeviceFrame(
    device,
    deviceOrientation,
    deviceResponsiveSize,
  );
  const deviceGroup =
    frame ? getDevDevicePresetGroup(frame.presetId) : undefined;

  const pickerRef = useRef<HTMLDivElement>(null);
  const scaleLabelRef = useRef<HTMLSpanElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isResponsive = frame?.presetId === 'responsive';

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pickerRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pickerOpen]);

  if (!frame) return null;

  const iframeSrc = buildDevDevicePreviewSrc(
    `${location.pathname}${location.search}${location.hash}`,
    { touch: frame.touch, embed: false },
  );
  // Path stays out of the key — iframe→parent sync must not remount/reload.
  const iframeKey = `${frame.touch ? 'touch' : 'mouse'}::${reloadNonce}`;
  const chromeUrl = formatDevDeviceChromeUrl(
    location.pathname,
    location.search,
  );

  const pickDevice = (next: DevDevicePresetId) => {
    setPickerOpen(false);
    setDevPanelDevice(next);
  };

  return (
    <DevViewportPreviewShell
      dataDevice={frame.presetId}
      width={frame.width}
      height={frame.height}
      iframeSrc={iframeSrc}
      iframeKey={iframeKey}
      iframeTitle={`Device preview — ${frame.label}`}
      browserChrome={
        deviceBrowserChrome ? { url: chromeUrl, badgeLabel: tourTitle } : null
      }
      resizable={isResponsive}
      onResizeCommit={setDevPanelDeviceResponsiveSize}
      scaleLabelRef={scaleLabelRef}
      toolbar={
        <>
          <div ref={pickerRef} className='relative'>
            <button
              type='button'
              className={devDevicePreviewToolbarSelectWrapClassName}
              aria-label='Device preset'
              aria-haspopup='listbox'
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <span className={devDevicePreviewToolbarSelectFaceClassName}>
                {deviceGroup ?
                  <span className={devDevicePreviewToolbarIconClassName}>
                    <MaterialSymbol
                      name={deviceGroup.icon}
                      sizePx={MATERIAL_SYMBOL_SIZE_14}
                      className={materialSymbolLayoutClassName}
                      aria-hidden
                    />
                  </span>
                : null}
                <span className={devDevicePreviewToolbarSelectNameClassName}>
                  {frame.label}
                </span>
                <span className={devDevicePreviewToolbarSelectMetaClassName}>
                  {frame.width}×{frame.height}
                  <span ref={scaleLabelRef} />
                </span>
                <span className={devDevicePreviewToolbarIconClassName}>
                  <MaterialSymbol
                    name='expand_more'
                    sizePx={MATERIAL_SYMBOL_SIZE_14}
                    className={materialSymbolLayoutClassName}
                    aria-hidden
                  />
                </span>
              </span>
            </button>
            {pickerOpen ?
              <div
                className={devDevicePreviewPickerMenuClassName}
                role='listbox'
                aria-label='Device presets'
              >
                {DEV_DEVICE_PRESET_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    className={devDevicePreviewPickerGroupClassName}
                    role='group'
                    aria-label={group.label}
                  >
                    <p className={devDevicePreviewPickerGroupLabelClassName}>
                      <MaterialSymbol
                        name={group.icon}
                        sizePx={MATERIAL_SYMBOL_SIZE_12}
                        className={materialSymbolLayoutClassName}
                        aria-hidden
                      />
                      {group.label}
                    </p>
                    {group.presetIds.map((presetId) => {
                      const preset = getDevDevicePreset(presetId);
                      if (!preset) return null;
                      const size =
                        preset.id === 'responsive' ?
                          deviceResponsiveSize
                        : resolveDevDeviceSize(preset, deviceOrientation);
                      const active = frame.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type='button'
                          role='option'
                          aria-selected={active}
                          className={cn(
                            devDevicePreviewPickerItemClassName,
                            active && devDevicePreviewPickerItemActiveClassName,
                          )}
                          onClick={() => pickDevice(preset.id)}
                        >
                          <span className='min-w-0 truncate'>
                            {preset.label}
                          </span>
                          <span
                            className={devDevicePreviewPickerItemMetaClassName}
                          >
                            {size.width}×{size.height}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            : null}
          </div>
          <button
            type='button'
            className={cn(
              devDevicePreviewToolbarBtnClassName,
              deviceBrowserChrome && devDevicePreviewToolbarBtnActiveClassName,
            )}
            onClick={() => toggleDevPanelDeviceBrowserChrome()}
            aria-pressed={deviceBrowserChrome}
            aria-label={
              deviceBrowserChrome ?
                'Hide browser chrome'
              : 'Show browser chrome'
            }
            title='Browser chrome'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='web_asset'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            Chrome
          </button>
          <button
            type='button'
            className={devDevicePreviewToolbarBtnClassName}
            onClick={() => toggleDevPanelDeviceOrientation()}
            aria-label={
              deviceOrientation === 'portrait' ?
                'Switch to landscape'
              : 'Switch to portrait'
            }
            title='Rotate'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='screen_rotation'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            {deviceOrientation === 'portrait' ? 'Landscape' : 'Portrait'}
          </button>
          <button
            type='button'
            className={devDevicePreviewToolbarBtnClassName}
            onClick={() => bumpDevDevicePreviewReload()}
            aria-label='Reload device preview'
            title='Reload preview'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='refresh'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            Reload
          </button>
          <button
            type='button'
            className={devDevicePreviewToolbarBtnClassName}
            onClick={() => setDevPanelDeviceMode(false)}
            aria-label='Exit device mode'
            title='Exit device mode'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='close'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            Exit
          </button>
        </>
      }
    />
  );
}
