import knownFaviconPaths from '../data/knownFaviconPaths.json';

/**
 * Conventional favicon paths that exist under `assets/` (written by sync-assets).
 * Runtime uses these instead of probing missing png/ico.
 */
export const KNOWN_FAVICON_PATHS = new Set<string>(knownFaviconPaths);

export function isKnownFaviconPath(path: string): boolean {
  return KNOWN_FAVICON_PATHS.has(path);
}
