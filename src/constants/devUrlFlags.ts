import type { AppSearchParams } from '../hooks/useAppSearchParams';
import type { PreservedSearchKey } from '../utils/tourPaths';

/** Sample tour id shown on the dev not-found (404) screen. */
export const DEV_NOT_FOUND_SAMPLE_TOUR_ID = 'unknown-tour-id';

export interface DevUrlFlagToggle {
  key: PreservedSearchKey;
  label: string;
  hint: string;
  isOn: (params: AppSearchParams) => boolean;
  urlPatch: (
    enabled: boolean,
  ) => Partial<Record<PreservedSearchKey, string | null>>;
}

/** General QA URL flags — Debug → URL flags. */
export const DEV_URL_FLAG_TOGGLES: DevUrlFlagToggle[] = [
  {
    key: 'embed',
    label: 'embed',
    hint: 'Iframe delivery — trim Share/Help, lighter splash, postMessage',
    isOn: (params) => params.embed,
    urlPatch: (enabled) => ({ embed: enabled ? '1' : null }),
  },
  {
    key: 'notFoundTest',
    label: 'notFoundTest',
    hint: 'Force tour not-found (404) screen',
    isOn: (params) => params.notFoundTest,
    urlPatch: (enabled) => ({ notFoundTest: enabled ? '1' : null }),
  },
  {
    key: 'loadErrorTest',
    label: 'loadErrorTest',
    hint: 'Force load-error overlay (panorama + 3D)',
    isOn: (params) => params.loadErrorTest,
    urlPatch: (enabled) => ({
      loadErrorTest: enabled ? '1' : null,
      panoramaErrorTest: null,
    }),
  },
  {
    key: 'disableNavPreview',
    label: 'disableNavPreview',
    hint: 'Disable nav hotspot mini viewer',
    isOn: (params) => params.disableNavPreview,
    urlPatch: (enabled) => ({ disableNavPreview: enabled ? '1' : null }),
  },
  {
    key: 'skipLanding',
    label: 'skipLanding',
    hint: 'Skip landing zoom — start at defaultView',
    isOn: (params) => params.skipLanding,
    urlPatch: (enabled) => ({ skipLanding: enabled ? '1' : null }),
  },
  {
    key: 'splashHold',
    label: 'splashHold',
    hint: 'Hold load splash longer',
    isOn: (params) => params.splashHold,
    urlPatch: (enabled) => ({ splashHold: enabled ? '1' : null }),
  },
  {
    key: 'firstVisitHint',
    label: 'firstVisitHint',
    hint: 'Show first-visit coach pill (ignores seen flag)',
    isOn: (params) => params.firstVisitHint,
    urlPatch: (enabled) => ({ firstVisitHint: enabled ? '1' : null }),
  },
];

/**
 * Ask Guide QA flags — Debug → Ask Guide.
 *
 * - `askGuide` — show the FAB/panel
 * - `guideMock` — chat works with scripted replies (no OpenAI)
 * - `guideUiTest` — frozen UI fixtures only (scroll + thinking); no composing
 */
export const DEV_ASK_GUIDE_FLAG_TOGGLES: DevUrlFlagToggle[] = [
  {
    key: 'askGuide',
    label: 'askGuide',
    hint: 'Show Ask Guide FAB + panel (product default is off)',
    isOn: (params) => params.askGuide,
    urlPatch: (enabled) => ({ askGuide: enabled ? '1' : null }),
  },
  {
    key: 'guideMock',
    label: 'guideMock',
    hint: 'Chat with scripted mock replies + short think delay — no OpenAI tokens',
    isOn: (params) => params.guideMock,
    urlPatch: (enabled) => ({
      guideMock: enabled ? '1' : null,
      askGuideMock: null,
    }),
  },
  {
    key: 'guideUiTest',
    label: 'guideUiTest',
    hint: 'Frozen UI preview — scroll fixtures + thinking dots (no chat / no API)',
    isOn: (params) => params.guideUiTest,
    urlPatch: (enabled) => ({
      guideUiTest: enabled ? '1' : null,
      chatTest: null,
    }),
  },
];
