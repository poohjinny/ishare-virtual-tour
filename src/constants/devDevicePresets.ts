/** Dev Debug — device viewport preview presets (CSS px). */

export type DevDevicePresetId =
  | 'responsive'
  | 'iphone-se'
  | 'iphone-14'
  | 'pixel-7'
  | 'ipad-mini'
  | 'ipad-pro-11'
  | 'ipad-pro-12'
  | 'laptop'
  | 'desktop';

export type DevDeviceOrientation = 'portrait' | 'landscape';

export type DevDevicePreset = {
  id: DevDevicePresetId;
  label: string;
  /**
   * CSS width in `nativeOrientation` (portrait for phones/tablets,
   * landscape for laptop/desktop).
   */
  width: number;
  /** CSS height in `nativeOrientation`. */
  height: number;
  /** Force coarse-pointer JS paths in the preview iframe. */
  touch: boolean;
  /** Material symbol for UI chrome. */
  icon: string;
  /** Orientation that matches the stored width×height. Default: portrait. */
  nativeOrientation?: DevDeviceOrientation;
};

export const DEV_DEVICE_DEFAULT_FRAME_PRESET: Exclude<
  DevDevicePresetId,
  'responsive'
> = 'iphone-14';

/** Default / clamp bounds for Responsive drag-resize (CSS px). */
export const DEV_DEVICE_RESPONSIVE_DEFAULT = {
  width: 1280,
  height: 800,
} as const;

export const DEV_DEVICE_RESPONSIVE_MIN = { width: 320, height: 480 } as const;

export const DEV_DEVICE_RESPONSIVE_MAX = { width: 2560, height: 1600 } as const;

/** Shared browser chrome bar height (outside the measured viewport). */
export const DEV_DEVICE_BROWSER_CHROME_HEIGHT_PX = 40;

export const DEV_DEVICE_PRESETS: readonly DevDevicePreset[] = [
  {
    id: 'responsive',
    label: 'Responsive',
    width: DEV_DEVICE_RESPONSIVE_DEFAULT.width,
    height: DEV_DEVICE_RESPONSIVE_DEFAULT.height,
    touch: false,
    icon: 'fit_screen',
  },
  {
    id: 'iphone-se',
    label: 'iPhone SE',
    width: 375,
    height: 667,
    touch: true,
    icon: 'smartphone',
  },
  {
    id: 'iphone-14',
    label: 'iPhone 14/15',
    width: 390,
    height: 844,
    touch: true,
    icon: 'smartphone',
  },
  {
    id: 'pixel-7',
    label: 'Pixel 7',
    width: 412,
    height: 915,
    touch: true,
    icon: 'smartphone',
  },
  {
    id: 'ipad-mini',
    label: 'iPad Mini',
    width: 768,
    height: 1024,
    touch: false,
    icon: 'tablet_mac',
  },
  {
    id: 'ipad-pro-11',
    label: 'iPad Pro 11″',
    width: 834,
    height: 1194,
    touch: false,
    icon: 'tablet_mac',
  },
  {
    id: 'ipad-pro-12',
    label: 'iPad Pro 12.9″',
    width: 1024,
    height: 1366,
    touch: false,
    icon: 'tablet_mac',
  },
  {
    id: 'laptop',
    label: 'Laptop',
    width: 1440,
    height: 900,
    touch: false,
    icon: 'laptop_mac',
    nativeOrientation: 'landscape',
  },
  {
    id: 'desktop',
    label: 'Desktop',
    width: 1920,
    height: 1080,
    touch: false,
    icon: 'desktop_windows',
    nativeOrientation: 'landscape',
  },
] as const;

/** Frame presets only — excludes Responsive (exit device mode). */
export const DEV_DEVICE_FRAME_PRESETS = DEV_DEVICE_PRESETS.filter(
  (preset) => preset.id !== 'responsive',
);

export type DevDevicePresetGroupId =
  | 'viewport'
  | 'phone'
  | 'tablet'
  | 'computer';

export type DevDevicePresetGroup = {
  id: DevDevicePresetGroupId;
  label: string;
  /** Material Symbol name for the group header. */
  icon: string;
  presetIds: readonly DevDevicePresetId[];
};

/** Toolbar picker groups — Responsive first, then by form factor. */
export const DEV_DEVICE_PRESET_GROUPS: readonly DevDevicePresetGroup[] = [
  {
    id: 'viewport',
    label: 'Viewport',
    icon: 'fit_screen',
    presetIds: ['responsive'],
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: 'smartphone',
    presetIds: ['iphone-se', 'iphone-14', 'pixel-7'],
  },
  {
    id: 'tablet',
    label: 'Tablet',
    icon: 'tablet_mac',
    presetIds: ['ipad-mini', 'ipad-pro-11', 'ipad-pro-12'],
  },
  {
    id: 'computer',
    label: 'Computer',
    icon: 'computer',
    presetIds: ['laptop', 'desktop'],
  },
] as const;

const PRESET_BY_ID = new Map(
  DEV_DEVICE_PRESETS.map((preset) => [preset.id, preset]),
);

const PRESET_GROUP_BY_PRESET_ID = new Map<
  DevDevicePresetId,
  DevDevicePresetGroup
>(
  DEV_DEVICE_PRESET_GROUPS.flatMap((group) =>
    group.presetIds.map((presetId) => [presetId, group] as const),
  ),
);

export function getDevDevicePreset(
  id: DevDevicePresetId,
): DevDevicePreset | undefined {
  return PRESET_BY_ID.get(id);
}

export function getDevDevicePresetGroup(
  id: DevDevicePresetId,
): DevDevicePresetGroup | undefined {
  return PRESET_GROUP_BY_PRESET_ID.get(id);
}

export function isDevDevicePresetId(value: string): value is DevDevicePresetId {
  return PRESET_BY_ID.has(value as DevDevicePresetId);
}

export function isDevDeviceFramePresetId(
  value: string,
): value is Exclude<DevDevicePresetId, 'responsive'> {
  return isDevDevicePresetId(value) && value !== 'responsive';
}

export function resolveDevDeviceSize(
  preset: DevDevicePreset,
  orientation: DevDeviceOrientation,
): { width: number; height: number } {
  if (preset.id === 'responsive') {
    return { width: preset.width, height: preset.height };
  }
  const native = preset.nativeOrientation ?? 'portrait';
  if (orientation === native) {
    return { width: preset.width, height: preset.height };
  }
  return { width: preset.height, height: preset.width };
}
