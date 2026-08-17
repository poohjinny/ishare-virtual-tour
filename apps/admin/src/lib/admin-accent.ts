export const ADMIN_ACCENT_IDS = ['blue', 'green', 'gold', 'red'] as const;

export type AdminAccentId = (typeof ADMIN_ACCENT_IDS)[number];

/**
 * The shipped primary colour. The root layout renders it on `<html>`, so this
 * is the single source of truth: the boot script and the store only override it
 * for someone who picked another accent in Settings.
 */
export const ADMIN_ACCENT_DEFAULT: AdminAccentId = 'green';
export const ADMIN_ACCENT_STORAGE_KEY = 'ishare.admin.primaryAccent';
export const ADMIN_ACCENT_BOOT_ATTR = 'data-admin-accent';
export const ADMIN_ACCENT_EVENT = 'ishare-admin-primary-accent';

/**
 * Paint color for one accent option. `globals.css` owns the palette — every
 * accent keeps a standing `--admin-accent-*` token so a picker can show all
 * four at once, in the mode the reader is in, instead of copying hexes.
 */
export function adminAccentColor(accent: AdminAccentId): string {
  return `var(--admin-accent-${accent})`;
}

export function isAdminAccentId(
  value: string | null,
): value is AdminAccentId {
  return ADMIN_ACCENT_IDS.some((accent) => accent === value);
}

export const ADMIN_ACCENT_BOOT_SCRIPT = `try{var d=document.documentElement;var a=localStorage.getItem('${ADMIN_ACCENT_STORAGE_KEY}');d.setAttribute('${ADMIN_ACCENT_BOOT_ATTR}',${JSON.stringify(ADMIN_ACCENT_IDS)}.indexOf(a)>-1?a:'${ADMIN_ACCENT_DEFAULT}')}catch(e){}`;
