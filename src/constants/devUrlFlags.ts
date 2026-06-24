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

/** QA URL flags — toggled from the dev panel when `?dev=1`. */
export const DEV_URL_FLAG_TOGGLES: DevUrlFlagToggle[] = [
  {
    key: 'chatTest',
    label: 'chatTest',
    hint: 'AI chat scroll test messages',
    isOn: (params) => params.chatTest,
    urlPatch: (enabled) => ({ chatTest: enabled ? '1' : null }),
  },
  {
    key: 'notFoundTest',
    label: 'notFoundTest',
    hint: 'Force tour not-found (404) screen',
    isOn: (params) => params.notFoundTest,
    urlPatch: (enabled) => ({ notFoundTest: enabled ? '1' : null }),
  },
  {
    key: 'panoramaErrorTest',
    label: 'panoramaErrorTest',
    hint: 'Force panorama load-error overlay',
    isOn: (params) => params.panoramaErrorTest,
    urlPatch: (enabled) => ({ panoramaErrorTest: enabled ? '1' : null }),
  },
  {
    key: 'navPreview',
    label: 'navPreview',
    hint: 'Nav hotspot mini viewer',
    isOn: (params) => params.navPreview,
    urlPatch: (enabled) => ({ navPreview: enabled ? null : '0' }),
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
