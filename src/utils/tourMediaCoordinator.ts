import type { ImmersiveBackgroundController } from '../viewer/immersiveBackgroundController';

/** Immersive ambience is lowest — foreground media mutes it while playing. */
export const TOUR_MEDIA_PRIORITY = {
  IMMERSIVE_BG: 0,
  FOREGROUND: 1,
} as const;

export type TourMediaPriority =
  (typeof TOUR_MEDIA_PRIORITY)[keyof typeof TOUR_MEDIA_PRIORITY];

interface TourMediaClaim {
  priority: TourMediaPriority;
}

const claims = new Map<string, TourMediaClaim>();
let immersiveController: ImmersiveBackgroundController | null = null;

export function registerImmersiveBackgroundController(
  controller: ImmersiveBackgroundController,
): void {
  immersiveController = controller;
}

export function unregisterImmersiveBackgroundController(): void {
  immersiveController = null;
}

function highestClaimPriority(): TourMediaPriority | null {
  let highest: TourMediaPriority | null = null;

  for (const claim of claims.values()) {
    if (highest == null || claim.priority > highest) {
      highest = claim.priority;
    }
  }

  return highest;
}

function reconcileMediaPriority(): void {
  if (!immersiveController) return;

  const top = highestClaimPriority();
  if (top != null && top > TOUR_MEDIA_PRIORITY.IMMERSIVE_BG) {
    immersiveController.muteForForegroundMedia();
    return;
  }

  immersiveController.unmuteAfterForegroundMedia();
}

export function claimTourMedia(
  id: string,
  priority: TourMediaPriority = TOUR_MEDIA_PRIORITY.FOREGROUND,
): void {
  claims.set(id, { priority });
  reconcileMediaPriority();
}

export function releaseTourMedia(id: string): void {
  if (!claims.delete(id)) return;
  reconcileMediaPriority();
}

export function releaseAllTourMedia(): void {
  if (claims.size === 0) return;
  claims.clear();
  reconcileMediaPriority();
}

export function bindHtmlVideoForegroundMedia(
  video: HTMLVideoElement,
  id: string,
): () => void {
  const syncClaim = () => {
    if (!video.paused && !video.ended) {
      claimTourMedia(id);
    } else {
      releaseTourMedia(id);
    }
  };

  video.addEventListener('play', syncClaim);
  video.addEventListener('pause', syncClaim);
  video.addEventListener('ended', syncClaim);
  syncClaim();

  return () => {
    video.removeEventListener('play', syncClaim);
    video.removeEventListener('pause', syncClaim);
    video.removeEventListener('ended', syncClaim);
    releaseTourMedia(id);
  };
}
