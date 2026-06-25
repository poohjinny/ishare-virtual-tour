import {
  bindHtmlVideoForegroundMedia,
  claimTourMedia,
  releaseTourMedia,
} from './tourMediaCoordinator';

export type PopupVideoKind = 'youtube' | 'file' | 'embed';

export interface ResolvedPopupVideo {
  kind: PopupVideoKind;
  /** YouTube embed URL or direct file URL */
  sourceUrl: string;
  thumbnailUrl: string | null;
}

export function youtubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] ?? null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] ?? null;
      }
      return parsed.searchParams.get('v');
    }

    if (host === 'youtu.be') {
      return parsed.pathname.replace(/^\//, '').split('/')[0] || null;
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeThumbnailUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function synthesiaEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');

    if (
      host === 'share.synthesia.io' &&
      parsed.pathname.startsWith('/embeds/')
    ) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function synthesiaVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'share.synthesia.io') return null;

    const embedMatch = parsed.pathname.match(/^\/embeds\/videos\/([^/]+)/);
    if (embedMatch?.[1]) return embedMatch[1];

    const shareMatch = parsed.pathname.match(/^\/videos\/([^/]+)/);
    if (shareMatch?.[1]) return shareMatch[1];
  } catch {
    return null;
  }

  return null;
}

/** Public JPG thumbnail served for Synthesia share/embed pages (see og:image on embed HTML). */
const SYNTHESIA_THUMBNAIL_BASE =
  'https://69jr5v75rc.execute-api.eu-west-1.amazonaws.com/prod';

export function synthesiaThumbnailUrl(url: string): string | null {
  const id = synthesiaVideoId(url);
  return id ? `${SYNTHESIA_THUMBNAIL_BASE}/${id}/thumbnail.jpg` : null;
}

/** Public MP4 for published Synthesia share/embed videos (see embed page dehydrated state). */
export function synthesiaDirectVideoUrl(videoId: string): string {
  return `https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/${videoId}/transfers/rendered_video.mp4`;
}

function isFileVideoUrl(url: string): boolean {
  try {
    const path = new URL(url, 'https://local.invalid').pathname;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(path);
  } catch {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  }
}

export function resolvePopupVideo(
  videoUrl: string,
  poster?: string,
): ResolvedPopupVideo | null {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  const youtubeEmbed = youtubeEmbedUrl(trimmed);
  if (youtubeEmbed) {
    return {
      kind: 'youtube',
      sourceUrl: youtubeEmbed,
      thumbnailUrl: youtubeThumbnailUrl(trimmed),
    };
  }

  const synthesiaId = synthesiaVideoId(trimmed);
  if (synthesiaId) {
    return {
      kind: 'file',
      sourceUrl: synthesiaDirectVideoUrl(synthesiaId),
      thumbnailUrl: poster?.trim() || synthesiaThumbnailUrl(trimmed),
    };
  }

  const synthesiaEmbed = synthesiaEmbedUrl(trimmed);
  if (synthesiaEmbed) {
    return {
      kind: 'embed',
      sourceUrl: synthesiaEmbed,
      thumbnailUrl: poster?.trim() || synthesiaThumbnailUrl(trimmed),
    };
  }

  if (isFileVideoUrl(trimmed)) {
    return {
      kind: 'file',
      sourceUrl: trimmed,
      thumbnailUrl: poster?.trim() || null,
    };
  }

  return null;
}

export function popupVideoAutoplayUrl(sourceUrl: string): string {
  const joiner = sourceUrl.includes('?') ? '&' : '?';
  return `${sourceUrl}${joiner}autoplay=1&rel=0`;
}

/** YouTube embed with IFrame API postMessage — play/pause sync for bg ducking. */
export function popupVideoYoutubeEmbedUrl(embedUrl: string): string {
  const url = new URL(embedUrl);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('rel', '0');
  url.searchParams.set('enablejsapi', '1');
  url.searchParams.set('origin', window.location.origin);
  return url.toString();
}

/** Synthesia share embed — autoplay with sound after the viewer clicks our preview play control. */
export function popupVideoSynthesiaEmbedUrl(embedUrl: string): string {
  const url = new URL(embedUrl);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('mute', '0');
  return url.toString();
}

const YOUTUBE_ORIGIN = 'https://www.youtube.com';

function parseYoutubePlayerState(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;

  const record = data as Record<string, unknown>;

  if (record.event === 'onStateChange' && typeof record.info === 'number') {
    return record.info;
  }

  if (
    record.event === 'infoDelivery' &&
    record.info &&
    typeof record.info === 'object'
  ) {
    const info = record.info as Record<string, unknown>;
    if (typeof info.playerState === 'number') {
      return info.playerState;
    }
  }

  return null;
}

function isYoutubeForegroundPlaying(state: number): boolean {
  return state === 1 || state === 3;
}

export function bindYoutubeIframeForegroundMedia(
  iframe: HTMLIFrameElement,
  mediaId: string,
): () => void {
  let claimed = false;

  const setClaimed = (next: boolean) => {
    if (claimed === next) return;
    claimed = next;
    if (next) {
      claimTourMedia(mediaId);
    } else {
      releaseTourMedia(mediaId);
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== YOUTUBE_ORIGIN) return;
    if (event.source !== iframe.contentWindow) return;

    let payload: unknown = event.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return;
      }
    }

    const state = parseYoutubePlayerState(payload);
    if (state == null) return;

    setClaimed(isYoutubeForegroundPlaying(state));
  };

  const requestListening = () => {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening' }),
      YOUTUBE_ORIGIN,
    );
  };

  iframe.addEventListener('load', requestListening);
  window.addEventListener('message', onMessage);

  // Autoplay embed — claim until YouTube reports pause/end.
  setClaimed(true);

  return () => {
    iframe.removeEventListener('load', requestListening);
    window.removeEventListener('message', onMessage);
    releaseTourMedia(mediaId);
    claimed = false;
  };
}

export function popupVideoPlayIconHtml(
  className = 'tour-glass-panel__video-play-icon',
): string {
  return `<svg class="${className}" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <circle class="tour-glass-panel__video-play-ring" cx="28" cy="28" r="26" stroke="currentColor" stroke-width="2.5" fill="transparent"/>
    <path class="tour-glass-panel__video-play-glyph" d="M23 18.5v19l14-9.5-14-9.5z" fill="currentColor"/>
  </svg>`;
}

export function popupVideoSkeletonHtml(): string {
  return `<div class="preview-hero-skeleton tour-glass-panel__video-skeleton" aria-hidden="true"></div>`;
}

function markPopupVideoThumbLoaded(shell: HTMLElement): void {
  shell.classList.remove('tour-glass-panel__video--thumb-loading');
  shell.classList.add('tour-glass-panel__video--thumb-loaded');
}

function settlePopupVideoThumb(
  shell: HTMLElement,
  thumb: HTMLImageElement,
): void {
  if (shell.classList.contains('tour-glass-panel__video--thumb-loaded')) return;

  if (!thumb.src) return;

  if (thumb.complete) {
    markPopupVideoThumbLoaded(shell);
  }
}

function bindPopupVideoThumbnailRoot(host: HTMLElement): void {
  if (host.dataset.popupVideoThumbRootBound === 'true') return;
  host.dataset.popupVideoThumbRootBound = 'true';

  host.addEventListener(
    'load',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!target.classList.contains('tour-glass-panel__video-thumb')) return;
      const shell = target.closest('.tour-glass-panel__video--preview');
      if (shell instanceof HTMLElement) markPopupVideoThumbLoaded(shell);
    },
    true,
  );

  host.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!target.classList.contains('tour-glass-panel__video-thumb')) return;
      const shell = target.closest('.tour-glass-panel__video--preview');
      if (shell instanceof HTMLElement) markPopupVideoThumbLoaded(shell);
    },
    true,
  );
}

export function initPopupVideoThumbnails(root: ParentNode): void {
  const host =
    root instanceof HTMLElement ? root
    : root instanceof Document ? root.documentElement
    : null;
  if (host) bindPopupVideoThumbnailRoot(host);

  root.querySelectorAll('.tour-glass-panel__video--preview').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    const thumb = node.querySelector('.tour-glass-panel__video-thumb');
    if (!(thumb instanceof HTMLImageElement)) {
      markPopupVideoThumbLoaded(node);
      return;
    }

    node.classList.add('tour-glass-panel__video--thumb-loading');
    settlePopupVideoThumb(node, thumb);
  });
}

export function bindPopupVideoForegroundMedia(
  shell: HTMLElement,
  kind: PopupVideoKind,
): () => void {
  const source = shell.dataset.popupVideoSrc ?? 'unknown';
  const mediaId = `popup-video:${kind}:${source}`;

  if (kind === 'youtube') {
    const iframe = shell.querySelector('iframe');
    if (iframe instanceof HTMLIFrameElement) {
      return bindYoutubeIframeForegroundMedia(iframe, mediaId);
    }
    return () => releaseTourMedia(mediaId);
  }

  if (kind === 'embed') {
    claimTourMedia(mediaId);
    return () => releaseTourMedia(mediaId);
  }

  const video = shell.querySelector('video');
  if (!(video instanceof HTMLVideoElement)) {
    claimTourMedia(mediaId);
    return () => releaseTourMedia(mediaId);
  }

  return bindHtmlVideoForegroundMedia(video, mediaId);
}

export function mountPopupVideoPlayer(shell: HTMLElement): void {
  const kind = shell.dataset.popupVideoKind as PopupVideoKind | undefined;
  const src = shell.dataset.popupVideoSrc;
  const title = shell.dataset.popupVideoTitle ?? 'Video';
  if (
    !kind ||
    !src ||
    shell.classList.contains('tour-glass-panel__video--playing')
  ) {
    return;
  }

  shell.classList.remove('tour-glass-panel__video--preview');
  shell.classList.add('tour-glass-panel__video--playing');
  shell.innerHTML = '';

  if (kind === 'youtube') {
    const iframe = document.createElement('iframe');
    iframe.src = popupVideoYoutubeEmbedUrl(src);
    iframe.title = `${title} video`;
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    );
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    shell.appendChild(iframe);
    bindPopupVideoForegroundMedia(shell, kind);
    return;
  }

  if (kind === 'embed') {
    const iframe = document.createElement('iframe');
    iframe.src = popupVideoSynthesiaEmbedUrl(src);
    iframe.title = `${title} video`;
    iframe.setAttribute(
      'allow',
      'autoplay; fullscreen; encrypted-media; picture-in-picture',
    );
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    shell.appendChild(iframe);
    bindPopupVideoForegroundMedia(shell, kind);
    return;
  }

  const video = document.createElement('video');
  video.src = src;
  video.controls = true;
  video.playsInline = true;
  video.muted = false;
  video.setAttribute('playsinline', '');
  video.title = `${title} video`;
  shell.appendChild(video);
  bindPopupVideoForegroundMedia(shell, kind);
  void video.play().catch(() => undefined);
}

export function initPopupVideoPlayers(root: ParentNode): void {
  initPopupVideoThumbnails(root);

  root.querySelectorAll('.tour-glass-panel__video--preview').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.popupVideoBound === 'true') return;

    node.dataset.popupVideoBound = 'true';

    const play = () => mountPopupVideoPlayer(node);

    const button = node.querySelector('.tour-glass-panel__video-play');
    if (button instanceof HTMLButtonElement) {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        play();
      });
    }
  });
}
