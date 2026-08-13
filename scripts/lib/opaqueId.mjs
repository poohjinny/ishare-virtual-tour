import { randomBytes } from 'node:crypto';

/** Lowercase alphanumeric — URL / file-path safe, no lookalike case issues. */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Opaque entity id — not derived from display title.
 * @param {string} prefix e.g. `s_` (scene), `t_` (tour)
 * @param {number} [length=10]
 */
export function createOpaqueId(prefix, length = 10) {
  const bytes = randomBytes(length);
  let body = '';
  for (let i = 0; i < length; i++) {
    body += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}${body}`;
}

/**
 * @param {string} prefix
 * @param {Iterable<string>} taken
 * @param {number} [length=10]
 */
export function allocateOpaqueId(prefix, taken, length = 10) {
  const used = taken instanceof Set ? taken : new Set(taken);
  for (let attempt = 0; attempt < 32; attempt++) {
    const id = createOpaqueId(prefix, length);
    if (!used.has(id)) return id;
  }
  throw new Error(`Could not allocate unique id with prefix ${prefix}`);
}

export const OPAQUE_SCENE_ID_PREFIX = 's_';
export const OPAQUE_TOUR_ID_PREFIX = 't_';
export const OPAQUE_NAMING_ID_PREFIX = 'no_';
export const OPAQUE_HOTSPOT_ID_PREFIX = 'h_';

export function isOpaqueHotspotId(value) {
  return /^h_[a-z0-9]+$/i.test(String(value || '').trim());
}

export function isOpaqueTourId(value) {
  return /^t_[a-z0-9]+$/i.test(String(value || '').trim());
}

export function isOpaqueSceneId(value) {
  return /^s_[a-z0-9]+$/i.test(String(value || '').trim());
}

export function assertOpaqueTourId(value, label = 'Tour id') {
  const id = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!isOpaqueTourId(id)) {
    throw new Error(`${label} must be an opaque t_* id`);
  }
  return id;
}

export function assertOpaqueSceneId(value, label = 'Scene id') {
  const id = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!isOpaqueSceneId(id)) {
    throw new Error(`${label} must be an opaque s_* id`);
  }
  return id;
}

/** Client ids stay hostname slugs (`qchfoundation`, `ishare-demos`). */
export function assertClientId(value, label = 'Client id') {
  const id = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!/^[a-z][a-z0-9_-]{1,63}$/.test(id)) {
    throw new Error(
      `${label} must be 2–64 chars: start with a letter; letters, numbers, _ or -`,
    );
  }
  return id;
}

/** @deprecated Use {@link assertClientId} or assertOpaqueTourId / assertOpaqueSceneId. */
export function assertEntityId(value, label) {
  return assertClientId(value, label);
}
