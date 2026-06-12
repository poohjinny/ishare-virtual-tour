const DEFAULT_PRIMARY = '#007b8b';

const THEME_VARS = [
  '--ishare-primary',
  '--ishare-primary-dark',
  '--ishare-primary-light',
  '--ishare-primary-rgb',
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

function darken(hex: string, amount: number): string {
  return rgbToHex(...mixRgb(hexToRgb(hex), [0, 0, 0], amount));
}

function lighten(hex: string, amount: number): string {
  return rgbToHex(...mixRgb(hexToRgb(hex), [255, 255, 255], amount));
}

export function buildClientTheme(primaryColor: string) {
  const primary = normalizeHexColor(primaryColor) ?? DEFAULT_PRIMARY;
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

  root.style.setProperty('--ishare-primary', theme.primary);
  root.style.setProperty('--ishare-primary-dark', theme.primaryDark);
  root.style.setProperty('--ishare-primary-light', theme.primaryLight);
  root.style.setProperty('--ishare-primary-rgb', theme.primaryRgb);
}

export function resetClientTheme(): void {
  const root = document.documentElement;
  for (const name of THEME_VARS) {
    root.style.removeProperty(name);
  }
}
