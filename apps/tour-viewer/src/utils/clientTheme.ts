const DEFAULT_PRIMARY = '#007b8b';

/** Minimum contrast for white label text on filled primary surfaces. */
const MIN_PRIMARY_ON_WHITE_CONTRAST = 3;

/** Runtime brand overrides — consumed by @theme in globals.css. */
const BRAND_VARS = [
  '--brand-primary',
  '--brand-primary-dark',
  '--brand-primary-light',
  '--brand-primary-rgb',
] as const;

export function normalizeHexColor(color: string): string | null {
  const raw = color.trim().replace(/^#/, '');
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toLowerCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex) ?? DEFAULT_PRIMARY;
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) =>
      Math.round(Math.max(0, Math.min(255, value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function mixRgb(
  base: [number, number, number],
  target: [number, number, number],
  weight: number,
): [number, number, number] {
  return [
    base[0] * (1 - weight) + target[0] * weight,
    base[1] * (1 - weight) + target[1] * weight,
    base[2] * (1 - weight) + target[2] * weight,
  ];
}

function srgbChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928 ?
      channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const rs = srgbChannel(r);
  const gs = srgbChannel(g);
  const bs = srgbChannel(b);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastWithWhite(hex: string): number {
  const primary = relativeLuminance(hex);
  const white = 1;
  const lighter = Math.max(primary, white);
  const darker = Math.min(primary, white);
  return (lighter + 0.05) / (darker + 0.05);
}

function darken(hex: string, amount: number): string {
  return rgbToHex(...mixRgb(hexToRgb(hex), [0, 0, 0], amount));
}

function lighten(hex: string, amount: number): string {
  return rgbToHex(...mixRgb(hexToRgb(hex), [255, 255, 255], amount));
}

/**
 * Darkens overly bright brand primaries so they work on buttons, badges, and text
 * accents. Tour JSON keeps the official brand hex; this runs at theme apply time.
 */
export function resolveUiPrimaryColor(primaryColor: string): string {
  const brand = normalizeHexColor(primaryColor) ?? DEFAULT_PRIMARY;

  if (contrastWithWhite(brand) >= MIN_PRIMARY_ON_WHITE_CONTRAST) {
    return brand;
  }

  let adjusted = brand;
  for (let step = 0; step < 16; step += 1) {
    adjusted = darken(brand, (step + 1) * 0.045);
    if (contrastWithWhite(adjusted) >= MIN_PRIMARY_ON_WHITE_CONTRAST) {
      return adjusted;
    }
  }

  return adjusted;
}

export function buildClientTheme(primaryColor: string) {
  const primary = resolveUiPrimaryColor(primaryColor);
  const [r, g, b] = hexToRgb(primary);

  return {
    primary,
    primaryDark: darken(primary, 0.18),
    primaryLight: lighten(primary, 0.14),
    primaryRgb: `${r}, ${g}, ${b}`,
  };
}

export function applyClientTheme(primaryColor?: string): void {
  const theme = buildClientTheme(primaryColor ?? DEFAULT_PRIMARY);
  const root = document.documentElement;

  root.style.setProperty('--brand-primary', theme.primary);
  root.style.setProperty('--brand-primary-dark', theme.primaryDark);
  root.style.setProperty('--brand-primary-light', theme.primaryLight);
  root.style.setProperty('--brand-primary-rgb', theme.primaryRgb);
}

export function resetClientTheme(): void {
  const root = document.documentElement;
  for (const name of BRAND_VARS) {
    root.style.removeProperty(name);
  }
}
