export type PopupVideoKind = 'youtube' | 'file';

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

  const embedUrl = youtubeEmbedUrl(trimmed);
  if (embedUrl) {
    return {
      kind: 'youtube',
      sourceUrl: embedUrl,
      thumbnailUrl: youtubeThumbnailUrl(trimmed),
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

export function popupVideoPlayIconHtml(
  className = 'tour-glass-panel__video-play-icon',
): string {
  return `<svg class="${className}" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <circle class="tour-glass-panel__video-play-ring" cx="28" cy="28" r="26" stroke="currentColor" stroke-width="2.5" fill="transparent"/>
    <path class="tour-glass-panel__video-play-glyph" d="M23 18.5v19l14-9.5-14-9.5z" fill="currentColor"/>
  </svg>`;
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
    iframe.src = popupVideoAutoplayUrl(src);
    iframe.title = `${title} video`;
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    );
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    shell.appendChild(iframe);
    return;
  }

  const video = document.createElement('video');
  video.src = src;
  video.controls = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.title = `${title} video`;
  shell.appendChild(video);
  void video.play().catch(() => undefined);
}

export function initPopupVideoPlayers(root: ParentNode): void {
  root.querySelectorAll('.tour-glass-panel__video--preview').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.popupVideoBound === 'true') return;

    node.dataset.popupVideoBound = 'true';

    const play = () => mountPopupVideoPlayer(node);

    const button = node.querySelector('.tour-glass-panel__video-play');
    if (button instanceof HTMLButtonElement) {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        play();
      });
    }
  });
}
