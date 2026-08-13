import {
  useCallback,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DEV_ASK_GUIDE_FLAG_TOGGLES,
  DEV_URL_FLAG_TOGGLES,
  type DevUrlFlagToggle,
  type DevUrlFlagToggleContext,
} from '../../constants/devUrlFlags';
import {
  DEV_SHELL_TOUR_ID,
  type DevPanelTheme,
} from '../../constants/devPanel';
import { tryLoadTour } from '../../data/loadTour';
import { useAppSearchParams } from '../../hooks/useAppSearchParams';
import { cn } from '../../lib/cn';
import { preservedSearchStringFrom } from '../../utils/tourPaths';
import {
  DEFAULT_MODEL3D_DEBUG_LIGHTS,
  getModel3dDebugLights,
  setModel3dDebugLights,
  subscribeModel3dDebugLights,
  type Model3dDebugLightsState,
} from '../../viewer-3d/model3dDebugLights';
import {
  formatModel3dLightToneKelvin,
  MODEL3D_LIGHT_INTENSITY_MAX,
  MODEL3D_LIGHT_INTENSITY_MIN,
  MODEL3D_LIGHT_TONE_MAX,
  MODEL3D_LIGHT_TONE_MIN,
} from '../../viewer-3d/model3dStudioLightLook';
import {
  bumpDevDevicePreviewReload,
  setDevPanelDeviceMode,
  setDevPanelEmbedPreviewMode,
  useDevPanelDevicePreviewFlags,
} from '../../utils/devPanelPrefs';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import {
  devViewPanelDebugMenuBodyClassName,
  devViewPanelDebugMenuClassName,
  devViewPanelPopoverCloseBtnClassName,
  devViewPanelRangeFieldClassName,
  devViewPanelRangeInputActiveClassName,
  devViewPanelRangeInputClassName,
  devViewPanelRangeLabelClassName,
  devViewPanelRangeValueActiveClassName,
  devViewPanelRangeValueClassName,
  devViewPanelSettingsGroupClassName,
  devViewPanelSettingsGroupLabelClassName,
  devViewPanelFormCheckboxFieldClassName,
  devViewPanelFormRadioInputClassName,
  devViewPanelToggleHintClassName,
  devViewPanelToggleInputClassName,
  devViewPanelToggleLabelMultilineClassName,
  devViewPanelToggleListClassName,
  devViewPanelToggleNameClassName,
  devViewPanelToggleParamClassName,
} from './devViewPanelVariants';

function DevUrlFlagToggleLabel({ toggle }: { toggle: DevUrlFlagToggle }) {
  return (
    <span className={devViewPanelFormCheckboxFieldClassName}>
      <span className={devViewPanelToggleNameClassName}>
        {toggle.label}
        <span className={devViewPanelToggleParamClassName}>
          {' '}
          · <code>{toggle.key}</code>
        </span>
      </span>
      <span className={devViewPanelToggleHintClassName}>{toggle.hint}</span>
    </span>
  );
}

const MODEL3D_LIGHT_TOGGLES: {
  key: keyof Pick<
    Model3dDebugLightsState,
    'directional' | 'rim' | 'contactShadow' | 'groundSurface' | 'lightHelpers'
  >;
  label: string;
  hint: string;
}[] = [
  { key: 'directional', label: 'Directional', hint: 'key + fill only' },
  {
    key: 'rim',
    label: 'Rim',
    hint: 'bright edge light from behind (toggle to A/B)',
  },
  {
    key: 'contactShadow',
    label: 'Contact shadow',
    hint: 'soft disc on the model footprint',
  },
  {
    key: 'groundSurface',
    label: 'Ground surface',
    hint: 'matte plane receiving real shadows',
  },
  {
    key: 'lightHelpers',
    label: 'Light helpers',
    hint: 'show where key / fill / rim shoot from',
  },
];

type DevPanelDebugMenuProps = {
  tourId: string;
  isModel3dTour: boolean;
  onClose: () => void;
  style?: CSSProperties;
  menuRef?: Ref<HTMLDivElement>;
  /** Mirrors panel theme so portaled tokens resolve off `<body>`. */
  theme?: DevPanelTheme;
};

export function DevPanelDebugMenu({
  tourId,
  isModel3dTour,
  onClose,
  style,
  menuRef,
  theme = 'dark',
}: DevPanelDebugMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const appSearchParams = useAppSearchParams();
  const { deviceMode, deviceEmbed } = useDevPanelDevicePreviewFlags();
  const deviceModeEnabled = deviceMode && !deviceEmbed;
  const embedModeEnabled = deviceMode && deviceEmbed;
  const hasRealTour = Boolean(tourId) && tourId !== DEV_SHELL_TOUR_ID;
  const tourAskGuideCtx: DevUrlFlagToggleContext = {
    tourAskGuideEnabled:
      hasRealTour && tryLoadTour(tourId)?.askGuideEnabled === true,
  };
  const model3dDebugLights = useSyncExternalStore(
    subscribeModel3dDebugLights,
    getModel3dDebugLights,
    getModel3dDebugLights,
  );

  const setDevUrlFlag = useCallback(
    (toggle: DevUrlFlagToggle, enabled: boolean) => {
      const source = new URLSearchParams(window.location.search);
      const search = preservedSearchStringFrom(
        source,
        toggle.urlPatch(enabled),
      );
      // String form — reliable with preserved `?…` search from tourPaths.
      navigate(`${location.pathname}${search}${location.hash}`, {
        replace: true,
      });
      if (deviceMode) {
        // Remount preview after history has the new flags.
        requestAnimationFrame(() => bumpDevDevicePreviewReload());
      }
    },
    [deviceMode, location.hash, location.pathname, navigate],
  );

  return (
    <div
      ref={menuRef}
      style={style}
      data-dev-theme={theme}
      className={devViewPanelDebugMenuClassName}
      role='dialog'
      aria-label='Debug'
    >
      <button
        type='button'
        className={devViewPanelPopoverCloseBtnClassName}
        aria-label='Close debug'
        title='Close'
        onClick={onClose}
      >
        <MaterialSymbol
          name='close'
          filled
          sizePx={MATERIAL_SYMBOL_SIZE_18}
          className={materialSymbolLayoutClassName}
        />
      </button>

      <div className={devViewPanelDebugMenuBodyClassName}>
        <div className={devViewPanelSettingsGroupClassName}>
          <p className={devViewPanelSettingsGroupLabelClassName}>URL flags</p>
          <ul className={devViewPanelToggleListClassName}>
            {DEV_URL_FLAG_TOGGLES.map((toggle) => {
              const checked = toggle.isOn(appSearchParams);

              return (
                <li key={toggle.key}>
                  <label className={devViewPanelToggleLabelMultilineClassName}>
                    <input
                      type='checkbox'
                      className={devViewPanelToggleInputClassName}
                      checked={checked}
                      onChange={(event) =>
                        setDevUrlFlag(toggle, event.currentTarget.checked)
                      }
                    />
                    <DevUrlFlagToggleLabel toggle={toggle} />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {isModel3dTour ?
          <div className={devViewPanelSettingsGroupClassName}>
            <p className={devViewPanelSettingsGroupLabelClassName}>
              Model3d lights
            </p>
            <div className='flex flex-col gap-1.5 pb-0.5'>
              <label className={devViewPanelRangeFieldClassName}>
                <span className={devViewPanelRangeLabelClassName}>
                  Intensity
                </span>
                <input
                  type='range'
                  min={MODEL3D_LIGHT_INTENSITY_MIN}
                  max={MODEL3D_LIGHT_INTENSITY_MAX}
                  step={0.05}
                  value={model3dDebugLights.intensity}
                  aria-label='Model3d light intensity'
                  className={cn(
                    devViewPanelRangeInputClassName,
                    model3dDebugLights.intensity !==
                      DEFAULT_MODEL3D_DEBUG_LIGHTS.intensity &&
                      devViewPanelRangeInputActiveClassName,
                  )}
                  onChange={(event) =>
                    setModel3dDebugLights({
                      intensity: Number(event.currentTarget.value),
                    })
                  }
                />
                <span
                  className={cn(
                    devViewPanelRangeValueClassName,
                    model3dDebugLights.intensity !==
                      DEFAULT_MODEL3D_DEBUG_LIGHTS.intensity &&
                      devViewPanelRangeValueActiveClassName,
                  )}
                >
                  {Math.round(model3dDebugLights.intensity * 100)}%
                </span>
              </label>
              <label className={devViewPanelRangeFieldClassName}>
                <span className={devViewPanelRangeLabelClassName}>Tone</span>
                <input
                  type='range'
                  min={MODEL3D_LIGHT_TONE_MIN}
                  max={MODEL3D_LIGHT_TONE_MAX}
                  step={0.01}
                  value={model3dDebugLights.tone}
                  aria-label='Model3d light tone warm to cool'
                  className={cn(
                    devViewPanelRangeInputClassName,
                    model3dDebugLights.tone !==
                      DEFAULT_MODEL3D_DEBUG_LIGHTS.tone &&
                      devViewPanelRangeInputActiveClassName,
                  )}
                  onChange={(event) =>
                    setModel3dDebugLights({
                      tone: Number(event.currentTarget.value),
                    })
                  }
                />
                <span
                  className={cn(
                    devViewPanelRangeValueClassName,
                    model3dDebugLights.tone !==
                      DEFAULT_MODEL3D_DEBUG_LIGHTS.tone &&
                      devViewPanelRangeValueActiveClassName,
                  )}
                >
                  {formatModel3dLightToneKelvin(model3dDebugLights.tone)}
                </span>
              </label>
            </div>
            <ul className={devViewPanelToggleListClassName}>
              {MODEL3D_LIGHT_TOGGLES.map((toggle) => {
                const checked = model3dDebugLights[toggle.key];

                return (
                  <li key={toggle.key}>
                    <label
                      className={devViewPanelToggleLabelMultilineClassName}
                    >
                      <input
                        type='checkbox'
                        className={devViewPanelToggleInputClassName}
                        checked={checked}
                        onChange={(event) =>
                          setModel3dDebugLights({
                            [toggle.key]: event.currentTarget.checked,
                          })
                        }
                      />
                      <span className={devViewPanelFormCheckboxFieldClassName}>
                        <span className={devViewPanelToggleNameClassName}>
                          {toggle.label}
                        </span>
                        <span className={devViewPanelToggleHintClassName}>
                          {toggle.hint}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        : null}

        <div className={devViewPanelSettingsGroupClassName}>
          <p className={devViewPanelSettingsGroupLabelClassName}>Viewport</p>
          <ul
            className={devViewPanelToggleListClassName}
            role='radiogroup'
            aria-label='Viewport'
          >
            <li>
              <label className={devViewPanelToggleLabelMultilineClassName}>
                <input
                  type='radio'
                  name='dev-viewport-mode'
                  className={devViewPanelFormRadioInputClassName}
                  checked={!deviceMode}
                  onChange={() => {
                    if (deviceMode) setDevPanelDeviceMode(false);
                  }}
                />
                <span className={devViewPanelFormCheckboxFieldClassName}>
                  <span className={devViewPanelToggleNameClassName}>Off</span>
                  <span className={devViewPanelToggleHintClassName}>
                    Live stage in the main window (no device / embed frame)
                  </span>
                </span>
              </label>
            </li>
            <li>
              <label className={devViewPanelToggleLabelMultilineClassName}>
                <input
                  type='radio'
                  name='dev-viewport-mode'
                  className={devViewPanelFormRadioInputClassName}
                  checked={deviceModeEnabled}
                  onChange={() => {
                    setDevPanelDeviceMode(true);
                  }}
                />
                <span className={devViewPanelFormCheckboxFieldClassName}>
                  <span className={devViewPanelToggleNameClassName}>
                    Device mode
                  </span>
                  <span className={devViewPanelToggleHintClassName}>
                    Device presets / Responsive — layout, rem, and breakpoint QA
                    (no embed delivery)
                  </span>
                </span>
              </label>
            </li>
            <li>
              <label className={devViewPanelToggleLabelMultilineClassName}>
                <input
                  type='radio'
                  name='dev-viewport-mode'
                  className={devViewPanelFormRadioInputClassName}
                  checked={embedModeEnabled}
                  disabled={!hasRealTour && !embedModeEnabled}
                  onChange={() => {
                    setDevPanelEmbedPreviewMode(true);
                  }}
                />
                <span className={devViewPanelFormCheckboxFieldClassName}>
                  <span className={devViewPanelToggleNameClassName}>
                    Embed mode
                  </span>
                  <span className={devViewPanelToggleHintClassName}>
                    Host iframe harness — embed=1 chrome, Messages log, copy URL
                    / iframe HTML
                    {!hasRealTour ? ' (open a tour first)' : ''}
                  </span>
                </span>
              </label>
            </li>
          </ul>
        </div>

        <div className={devViewPanelSettingsGroupClassName}>
          <p className={devViewPanelSettingsGroupLabelClassName}>Tour Guide</p>
          <ul className={devViewPanelToggleListClassName}>
            {DEV_ASK_GUIDE_FLAG_TOGGLES.map((toggle) => {
              const checked = toggle.isOn(appSearchParams, tourAskGuideCtx);

              return (
                <li key={toggle.key}>
                  <label className={devViewPanelToggleLabelMultilineClassName}>
                    <input
                      type='checkbox'
                      className={devViewPanelToggleInputClassName}
                      checked={checked}
                      onChange={(event) =>
                        setDevUrlFlag(toggle, event.currentTarget.checked)
                      }
                    />
                    <DevUrlFlagToggleLabel toggle={toggle} />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
