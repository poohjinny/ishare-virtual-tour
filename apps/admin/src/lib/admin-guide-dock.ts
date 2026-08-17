/**
 * Guide dock boot contract — shared by the pre-hydration script in the root
 * layout and the persisted store (`useAdminGuideDock`).
 *
 * The dock defaults to open at a default width, so the SSR HTML would paint
 * expanded (and at the wrong size) until hydration reads storage. The boot
 * script stamps the stored state on `<html>` before first paint: the attribute
 * drives the collapsed rule in `globals.css`, the custom property feeds the
 * rail's width utility. Both stay in sync from the write paths below, so the
 * markup and the boot mirror never disagree.
 */

export const GUIDE_DOCK_STORAGE_KEY = 'ishare.admin.guide.dockOpen';
export const GUIDE_DOCK_WIDTH_STORAGE_KEY = 'ishare.admin.guide.dockWidth';
export const GUIDE_DOCK_BOOT_ATTR = 'data-guide-dock';
export const GUIDE_DOCK_WIDTH_VAR = '--guide-dock-width';

/** Guide dock width bounds (px). Default matches the previous fixed 22rem. */
export const GUIDE_DOCK_WIDTH_MIN = 288;
export const GUIDE_DOCK_WIDTH_MAX = 512;
export const GUIDE_DOCK_WIDTH_DEFAULT = 352;

export function clampGuideDockWidth(width: number) {
  return Math.min(
    GUIDE_DOCK_WIDTH_MAX,
    Math.max(GUIDE_DOCK_WIDTH_MIN, Math.round(width)),
  );
}

export function syncGuideDockBootState(enabled: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(
    GUIDE_DOCK_BOOT_ATTR,
    enabled ? '1' : '0',
  );
}

export function syncGuideDockBootWidth(width: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    GUIDE_DOCK_WIDTH_VAR,
    `${clampGuideDockWidth(width)}px`,
  );
}

export const GUIDE_DOCK_BOOT_SCRIPT = `try{var d=document.documentElement;var o=localStorage.getItem('${GUIDE_DOCK_STORAGE_KEY}');d.setAttribute('${GUIDE_DOCK_BOOT_ATTR}',o==='0'?'0':'1');var w=parseInt(localStorage.getItem('${GUIDE_DOCK_WIDTH_STORAGE_KEY}'),10);if(w)d.style.setProperty('${GUIDE_DOCK_WIDTH_VAR}',Math.min(${GUIDE_DOCK_WIDTH_MAX},Math.max(${GUIDE_DOCK_WIDTH_MIN},w))+'px')}catch(e){}`;
