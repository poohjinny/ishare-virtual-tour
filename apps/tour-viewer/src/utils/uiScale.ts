/**
 * App UI scale — a read-only view of the CSS-driven root font-size.
 *
 * The scale itself is owned by CSS (`--ishare-font-size-base`, a viewport
 * `clamp()` in globals.css); this module just derives the numeric factor for
 * non-CSS consumers (PSV panel width/hero height, camera fit math). No resize
 * listener needed — the value is read on demand (panels are built per open).
 */

/** Root rem base at scale 1 — keep in sync with globals.css clamp ceiling. */
const BASE_FONT_PX = 16;

/** Current UI scale = computed root font-size / base. Falls back to 1 (SSR). */
export function getUiScale(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 1;
  }

  const rootFontPx = parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  );
  if (!Number.isFinite(rootFontPx) || rootFontPx <= 0) return 1;

  return rootFontPx / BASE_FONT_PX;
}
