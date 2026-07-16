import type { Hotspot, PopupContent, Scene, Tour } from '../types/tour';

/** Naming title derived from a scene title when `namingOpportunity.name` is omitted. */
export function inheritedNamingOpportunityName(sceneTitle: string): string {
  return sceneTitle.trim();
}

/** Host scene for a naming/info hotspot — `sceneId` (model3d) or the panorama scene that owns it. */
export function resolveHotspotHostScene(
  tour: Pick<Tour, 'scenes'>,
  hotspot: Hotspot,
  fallbackScene?: Scene | null,
): Scene | undefined {
  const linkedId = hotspot.sceneId?.trim();
  if (linkedId && tour.scenes[linkedId]) return tour.scenes[linkedId];
  return fallbackScene ?? undefined;
}

/**
 * Fill blank NO popup fields from the host scene.
 * Non-naming popups are returned unchanged.
 */
export function resolveNamingPopup(
  popup: PopupContent,
  scene?: Scene | null,
): PopupContent {
  if (!popup.namingOpportunity) return popup;

  const sceneTitle = scene?.title?.trim() ?? '';
  const inheritedName = inheritedNamingOpportunityName(sceneTitle);

  const title = popup.title?.trim() || sceneTitle;
  const body = popup.body?.trim() || scene?.description?.trim() || '';
  const videoUrl =
    popup.videoUrl?.trim() || scene?.previewVideoUrl?.trim() || undefined;
  const namingName = popup.namingOpportunity.name?.trim() || inheritedName;

  const next: PopupContent = {
    ...popup,
    title: title || popup.title || '',
    body: body || popup.body || '',
    namingOpportunity: {
      ...popup.namingOpportunity,
      name: namingName || popup.namingOpportunity.name || inheritedName,
    },
  };

  if (videoUrl) {
    next.videoUrl = videoUrl;
    if (!popup.videoUrl?.trim() && scene?.videoPoster?.trim()) {
      next.videoPoster = scene.videoPoster.trim();
    }
  } else {
    delete next.videoUrl;
  }

  return next;
}

export function resolveNamingHotspotPopup(
  hotspot: Hotspot,
  scene?: Scene | null,
): PopupContent | undefined {
  if (!hotspot.popup) return undefined;
  return resolveNamingPopup(hotspot.popup, scene);
}
