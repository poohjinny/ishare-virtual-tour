/** Semantic color tokens shared by charts, badges, and future status surfaces. */

export const VISIBILITY_COLORS = {
  public: 'var(--visibility-public)',
  unlisted: 'var(--visibility-unlisted)',
  internal: 'var(--visibility-internal)',
} as const;

export const LICENSE_COLORS = {
  licensed: 'var(--license-licensed)',
  unlicensed: 'var(--license-unlicensed)',
} as const;

export const VIEWER_COLORS = {
  panorama: 'var(--viewer-panorama)',
  model3d: 'var(--viewer-model3d)',
} as const;

/** Staff chart series — listed in badge order, not mapped to badge variants. */
export const STAFF_ROLE_COLORS = {
  Master: 'var(--chart-1)',
  Editor: 'var(--chart-2)',
  Viewer: 'var(--chart-3)',
} as const;

export const STAFF_STATUS_COLORS = {
  local: 'var(--chart-1)',
  active: 'var(--chart-2)',
  invited: 'var(--chart-3)',
  inactive: 'var(--chart-4)',
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  healthcare: 'var(--category-healthcare)',
  education: 'var(--category-education)',
  culture: 'var(--category-culture)',
  'sporting-venues': 'var(--category-sporting)',
  'international-aid': 'var(--category-aid)',
  'social-services': 'var(--category-social)',
  tourism: 'var(--category-tourism)',
  demo: 'var(--category-demo)',
};

const FALLBACK_CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

export function semanticSlug(label: string) {
  return label.trim().toLowerCase().replaceAll(/\s+/g, '-');
}

export function categoryChartColor(label: string, fallbackIndex = 0) {
  return (
    CATEGORY_COLORS[semanticSlug(label)] ??
    FALLBACK_CATEGORY_COLORS[fallbackIndex % FALLBACK_CATEGORY_COLORS.length]
  );
}
