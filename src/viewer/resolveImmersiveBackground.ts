import { withBaseUrl } from '../utils/assetUrl';

export interface ImmersivePlaylistManifest {
  playlist: string[];
  volume?: number;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://');
}

export async function fetchImmersivePlaylistManifest(
  manifestUrl: string,
): Promise<ImmersivePlaylistManifest> {
  const url = withBaseUrl(manifestUrl);
  const response = await fetch(url, { cache: 'no-cache' });

  if (!response.ok) {
    throw new Error(
      `Immersive playlist manifest failed (${response.status}): ${url}`,
    );
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') {
    throw new Error(`Immersive playlist manifest is not an object: ${url}`);
  }

  const record = data as Record<string, unknown>;
  const playlist =
    Array.isArray(record.playlist) ?
      record.playlist.filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      )
    : [];

  if (playlist.length === 0) {
    throw new Error(`Immersive playlist manifest has no tracks: ${url}`);
  }

  return {
    playlist: playlist.map((track) =>
      isHttpUrl(track) ? track : withBaseUrl(track),
    ),
    volume: typeof record.volume === 'number' ? record.volume : undefined,
  };
}

export async function resolveImmersiveBackgroundTracks(config: {
  audio?: string;
  playlist?: string[];
  playlistManifest?: string;
}): Promise<{ tracks: string[]; volume?: number }> {
  if (config.playlistManifest) {
    try {
      const manifest = await fetchImmersivePlaylistManifest(
        config.playlistManifest,
      );
      return { tracks: manifest.playlist, volume: manifest.volume };
    } catch (error) {
      console.warn(
        '[immersive-bg] Manifest fetch failed; using inline fallback',
        error,
      );
    }
  }

  if (config.playlist?.length) {
    return {
      tracks: config.playlist.map((track) =>
        isHttpUrl(track) ? track : withBaseUrl(track),
      ),
    };
  }

  if (config.audio) {
    const audio =
      isHttpUrl(config.audio) ? config.audio : withBaseUrl(config.audio);
    return { tracks: [audio] };
  }

  return { tracks: [] };
}
