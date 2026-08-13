/** Lowercase alphanumeric — URL / file-path safe. */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Opaque entity id — not derived from display title. */
export function createOpaqueId(prefix: string, length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let body = '';
  for (let i = 0; i < length; i++) {
    body += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${prefix}${body}`;
}

export function allocateOpaqueId(
  prefix: string,
  taken: Iterable<string>,
  length = 10,
): string {
  const used = taken instanceof Set ? taken : new Set(taken);
  for (let attempt = 0; attempt < 32; attempt++) {
    const id = createOpaqueId(prefix, length);
    if (!used.has(id)) return id;
  }
  throw new Error(`Could not allocate unique id with prefix ${prefix}`);
}

export const OPAQUE_SCENE_ID_PREFIX = 's_';
export const OPAQUE_TOUR_ID_PREFIX = 't_';
/** Catalog naming id — also the canonical `?no=` search value. */
export const OPAQUE_NAMING_ID_PREFIX = 'no_';
/** Pin / nav hotspot id — not derived from the display title. */
export const OPAQUE_HOTSPOT_ID_PREFIX = 'h_';

export function isOpaqueHotspotId(value?: string | null): boolean {
  return /^h_[a-z0-9]+$/i.test(String(value || '').trim());
}

export function isOpaqueTourId(value?: string | null): boolean {
  return /^t_[a-z0-9]+$/i.test(String(value || '').trim());
}

export function isOpaqueSceneId(value?: string | null): boolean {
  return /^s_[a-z0-9]+$/i.test(String(value || '').trim());
}
