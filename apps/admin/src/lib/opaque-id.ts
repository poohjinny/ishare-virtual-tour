/** Lowercase alphanumeric — URL / file-path safe. Matches viewer `opaqueId`. */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Opaque entity id — not derived from display title. */
export function createOpaqueId(prefix: string, length = 10): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let body = '';
  for (let i = 0; i < length; i += 1) {
    body += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${prefix}${body}`;
}

export const OPAQUE_TOUR_ID_PREFIX = 't_';
export const OPAQUE_SCENE_ID_PREFIX = 's_';
