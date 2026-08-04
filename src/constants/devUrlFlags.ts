import type { AppSearchParams } from '../hooks/useAppSearchParams';
import type { PreservedSearchKey } from '../utils/tourPaths';
import { isAskGuideEnabled } from './branding';

/** Sample tour id shown on the dev not-found (404) screen. */
export const DEV_NOT_FOUND_SAMPLE_TOUR_ID = 'unknown-tour-id';

export type DevUrlFlagToggleContext = {
  /** Per-tour `askGuideEnabled` — used by the Show Tour Guide checkbox. */
  tourAskGuideEnabled?: boolean;
};

export interface DevUrlFlagToggle {
  /** Query param key — shown after the title (`Title · key`). */
  key: PreservedSearchKey;
  /** Human-readable checkbox title. */
  label: string;
  hint: string;
  isOn: (
    params: AppSearchParams,
    ctx?: DevUrlFlagToggleContext,
  ) => boolean;
  urlPatch: (
    enabled: boolean,
  ) => Partial<Record<PreservedSearchKey, string | null>>;
}

/** General QA URL flags — Debug → URL flags. */
export const DEV_URL_FLAG_TOGGLES: DevUrlFlagToggle[] = [
  {
    key: 'notFoundTest',
    label: 'Not-found screen',
    hint: 'Force tour not-found (404) screen',
    isOn: (params) => params.notFoundTest,
    urlPatch: (enabled) => ({ notFoundTest: enabled ? '1' : null }),
  },
  {
    key: 'loadErrorTest',
    label: 'Load-error overlay',
    hint: 'Force load-error overlay (panorama + 3D)',
    isOn: (params) => params.loadErrorTest,
    urlPatch: (enabled) => ({
      loadErrorTest: enabled ? '1' : null,
      panoramaErrorTest: null,
    }),
  },
  {
    key: 'disableNavPreview',
    label: 'Disable nav preview',
    hint: 'Disable nav hotspot mini viewer',
    isOn: (params) => params.disableNavPreview,
    urlPatch: (enabled) => ({ disableNavPreview: enabled ? '1' : null }),
  },
  {
    key: 'skipLanding',
    label: 'Skip landing',
    hint: 'Skip landing zoom — start at defaultView',
    isOn: (params) => params.skipLanding,
    urlPatch: (enabled) => ({ skipLanding: enabled ? '1' : null }),
  },
  {
    key: 'splashHold',
    label: 'Splash hold',
    hint: 'Hold load splash longer',
    isOn: (params) => params.splashHold,
    urlPatch: (enabled) => ({ splashHold: enabled ? '1' : null }),
  },
  {
    key: 'firstVisitHint',
    label: 'First-visit hint',
    hint: 'Show first-visit coach pill (ignores seen flag)',
    isOn: (params) => params.firstVisitHint,
    urlPatch: (enabled) => ({ firstVisitHint: enabled ? '1' : null }),
  },
];

/**
 * Tour Guide QA flags — Debug → Tour Guide.
 *
 * - `askGuide=1|0` — force FAB/panel on or off (overrides per-tour setting)
 * - `guideMock` — chat works with scripted replies (no OpenAI)
 * - `guideUiTest` — frozen UI fixtures only (scroll + thinking + markdown); no composing
 */
export const DEV_ASK_GUIDE_FLAG_TOGGLES: DevUrlFlagToggle[] = [
  {
    key: 'askGuide',
    label: 'Show Tour Guide',
    hint: 'Force on (`1`) or off (`0`). When unset, uses the tour’s Enable Ask Tour Guide setting',
    isOn: (params, ctx) =>
      isAskGuideEnabled(params.askGuide, ctx?.tourAskGuideEnabled === true),
    // Use 0 (not omit) so tours with askGuideEnabled can still be forced off.
    urlPatch: (enabled) => ({ askGuide: enabled ? '1' : '0' }),
  },
  {
    key: 'guideMock',
    label: 'Mock replies',
    hint: 'Chat with scripted mock replies + short think delay — no OpenAI tokens',
    isOn: (params) => params.guideMock,
    urlPatch: (enabled) => ({
      guideMock: enabled ? '1' : null,
      askGuideMock: null,
      // Surface must be on for mock chat to be reachable.
      ...(enabled ? { askGuide: '1' } : {}),
    }),
  },
  {
    key: 'guideUiTest',
    label: 'Frozen UI preview',
    hint: 'Markdown sample, scroll fixtures, thinking, FAB bubble, notice + error (no chat / no API)',
    isOn: (params) => params.guideUiTest,
    urlPatch: (enabled) => ({
      guideUiTest: enabled ? '1' : null,
      chatTest: null,
      // Open the guide surface so the fixture panel is visible immediately.
      ...(enabled ? { askGuide: '1' } : {}),
    }),
  },
];
