import type { TourImmersiveBackground } from '../types/tour';
import { resolveImmersiveBackgroundTracks } from './resolveImmersiveBackground';

export type ImmersiveBgButtonState = 'off' | 'loading' | 'playing' | 'muted';

export interface ImmersiveBackgroundController {
  isPlaying: () => boolean;
  isEnabled: () => boolean;
  isLoading: () => boolean;
  isMutedByForeground: () => boolean;
  getButtonState: () => ImmersiveBgButtonState;
  toggle: () => Promise<boolean>;
  pause: () => void;
  muteForForegroundMedia: () => void;
  unmuteAfterForegroundMedia: () => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

const DEFAULT_VOLUME = 0.35;

function isAudioPlaying(audio: HTMLAudioElement): boolean {
  return !audio.paused && !audio.ended;
}

function pickRandomTrack(tracks: string[], exclude?: string): string {
  if (tracks.length === 1) {
    return tracks[0];
  }

  let next = tracks[Math.floor(Math.random() * tracks.length)];
  while (next === exclude) {
    next = tracks[Math.floor(Math.random() * tracks.length)];
  }
  return next;
}

export function createImmersiveBackgroundController(
  config: TourImmersiveBackground,
): ImmersiveBackgroundController {
  let tracks: string[] = [];
  let playlistMode = false;
  let volume = config.volume ?? DEFAULT_VOLUME;
  let tracksPromise: Promise<boolean> | null = null;

  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = volume;

  let currentTrack: string | undefined;
  let destroyed = false;
  let userEnabled = false;
  let mutedByForeground = false;
  let loading = false;

  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setLoading = (next: boolean) => {
    if (loading === next) return;
    loading = next;
    notify();
  };

  const applyForegroundMute = () => {
    audio.muted = mutedByForeground;
  };

  const loadTrack = (url: string) => {
    currentTrack = url;
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
  };

  const ensureTracksReady = (): Promise<boolean> => {
    if (tracks.length > 0) {
      return Promise.resolve(true);
    }

    tracksPromise ??= (async () => {
      setLoading(true);
      try {
        const resolved = await resolveImmersiveBackgroundTracks(config);
        if (destroyed) return false;

        tracks = resolved.tracks;
        playlistMode = tracks.length > 1;
        audio.loop = !playlistMode;

        if (resolved.volume != null) {
          volume = resolved.volume;
          audio.volume = volume;
        }

        return tracks.length > 0;
      } finally {
        setLoading(false);
      }
    })();

    return tracksPromise;
  };

  const playCurrent = async (): Promise<boolean> => {
    if (document.hidden) {
      notify();
      return false;
    }

    applyForegroundMute();

    try {
      await audio.play();
      notify();
      return true;
    } catch {
      userEnabled = false;
      audio.pause();
      notify();
      return false;
    }
  };

  const startRandomTrack = async (exclude?: string): Promise<boolean> => {
    if (!(await ensureTracksReady())) {
      return false;
    }

    setLoading(true);
    loadTrack(pickRandomTrack(tracks, exclude));
    try {
      return await playCurrent();
    } finally {
      setLoading(false);
    }
  };

  const handleTrackEnded = () => {
    if (!userEnabled) {
      notify();
      return;
    }

    if (!playlistMode) {
      notify();
      return;
    }

    void startRandomTrack(currentTrack);
  };

  const handleVisibility = () => {
    if (document.hidden) {
      audio.pause();
      notify();
      return;
    }

    if (userEnabled) {
      applyForegroundMute();
      void playCurrent();
    }
  };

  const handlePlaybackChange = () => {
    notify();
  };

  const handleWaiting = () => {
    if (!userEnabled) return;
    setLoading(true);
  };

  const handleCanPlay = () => {
    setLoading(false);
  };

  document.addEventListener('visibilitychange', handleVisibility);
  audio.addEventListener('play', handlePlaybackChange);
  audio.addEventListener('pause', handlePlaybackChange);
  audio.addEventListener('ended', handleTrackEnded);
  audio.addEventListener('waiting', handleWaiting);
  audio.addEventListener('canplay', handleCanPlay);
  audio.addEventListener('playing', handleCanPlay);

  return {
    isPlaying() {
      return isAudioPlaying(audio);
    },

    isEnabled() {
      return userEnabled;
    },

    isLoading() {
      return loading;
    },

    isMutedByForeground() {
      return mutedByForeground;
    },

    getButtonState(): ImmersiveBgButtonState {
      if (!userEnabled) return 'off';
      if (loading) return 'loading';
      if (mutedByForeground) return 'muted';
      if (isAudioPlaying(audio)) return 'playing';
      return 'loading';
    },

    async toggle() {
      if (userEnabled) {
        userEnabled = false;
        mutedByForeground = false;
        audio.muted = false;
        audio.pause();
        setLoading(false);
        notify();
        return false;
      }

      userEnabled = true;
      setLoading(true);

      if (!(await ensureTracksReady())) {
        userEnabled = false;
        setLoading(false);
        notify();
        return false;
      }

      applyForegroundMute();

      try {
        if (playlistMode || !currentTrack || audio.ended) {
          return await startRandomTrack(currentTrack);
        }

        return await playCurrent();
      } finally {
        setLoading(false);
      }
    },

    pause() {
      userEnabled = false;
      mutedByForeground = false;
      audio.muted = false;
      audio.pause();
      setLoading(false);
      notify();
    },

    muteForForegroundMedia() {
      if (!userEnabled) return;

      mutedByForeground = true;
      applyForegroundMute();

      if (!isAudioPlaying(audio) && currentTrack && !document.hidden) {
        void playCurrent();
        return;
      }

      notify();
    },

    unmuteAfterForegroundMedia() {
      if (!mutedByForeground) return;

      mutedByForeground = false;

      if (userEnabled) {
        applyForegroundMute();
        if (!isAudioPlaying(audio) && !document.hidden) {
          void playCurrent();
          return;
        }
      } else {
        audio.muted = false;
      }

      notify();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      destroyed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      audio.removeEventListener('play', handlePlaybackChange);
      audio.removeEventListener('pause', handlePlaybackChange);
      audio.removeEventListener('ended', handleTrackEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handleCanPlay);
      audio.pause();
      audio.src = '';
      audio.preload = 'none';
      audio.muted = false;
      userEnabled = false;
      mutedByForeground = false;
      loading = false;
      currentTrack = undefined;
      tracksPromise = null;
      listeners.clear();
    },
  };
}
