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

/** Tour / scene ids: classic kebab slugs or opaque `t_` / `s_` tokens. */
export function assertEntityId(value, label) {
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
