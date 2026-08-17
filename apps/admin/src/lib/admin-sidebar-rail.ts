/**
 * Sidebar rail boot contract — shared by the pre-hydration script in the root
 * layout and the persisted width store in `components/ui/sidebar.tsx`.
 *
 * The expanded rail is one width: the stored value, clamped to the bounds
 * below. It is never sized from its content, so opening a catalog fold cannot
 * move it, and the resize ceiling is the same on every route and fold state.
 *
 * SSR cannot read storage, so the markup would paint at the default and jump
 * once hydration read the stored width. The boot script stamps that width on
 * `<html>` before first paint; `globals.css` carries the same default as the
 * no-script fallback, and every write path below keeps the mirror in sync.
 */

export const SIDEBAR_WIDTH_STORAGE_KEY = 'ishare.admin.sidebar.width';
export const SIDEBAR_WIDTH_VAR = '--sidebar-width';

/** Expanded rail width bounds (px). The default mirrors the CSS fallback. */
export const SIDEBAR_WIDTH_MIN = 200;
export const SIDEBAR_WIDTH_MAX = 320;
export const SIDEBAR_WIDTH_DEFAULT = 256;

export function clampSidebarWidth(width: number) {
  return Math.min(
    SIDEBAR_WIDTH_MAX,
    Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)),
  );
}

export function syncSidebarBootWidth(width: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    SIDEBAR_WIDTH_VAR,
    `${clampSidebarWidth(width)}px`,
  );
}

export const SIDEBAR_BOOT_SCRIPT = `try{var w=parseInt(localStorage.getItem('${SIDEBAR_WIDTH_STORAGE_KEY}'),10);if(w)document.documentElement.style.setProperty('${SIDEBAR_WIDTH_VAR}',Math.min(${SIDEBAR_WIDTH_MAX},Math.max(${SIDEBAR_WIDTH_MIN},w))+'px')}catch(e){}`;
