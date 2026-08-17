import type { TourImmersiveBackground } from '../types/tour';

/**
 * Platform-wide immersive bed — all tours unless a tour JSON overrides
 * `immersiveBackground`.
 *
 * Playlist is loaded at runtime from {@link IMMERSIVE_PLAYLIST_MANIFEST} (online
 * Mixkit URLs). Edit that JSON to add/remove tracks without a code deploy.
 *
 * Alternate manifest: `/assets/brand/immersive-playlist.json` (ambient bed).
 * Mixkit License: https://mixkit.co/license/
 */
export const IMMERSIVE_PLAYLIST_MANIFEST =
  '/assets/brand/immersive-playlist-tour.json';

export const GLOBAL_IMMERSIVE_BACKGROUND: TourImmersiveBackground = {
  playlistManifest: IMMERSIVE_PLAYLIST_MANIFEST,
  volume: 0.28,
};
