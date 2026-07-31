/** Tour Guide nudge when an in-scene nav preview panel opens or closes. */

export type NavPreviewGuideInfo = {
  hotspotId: string;
  targetSceneId: string;
  title: string;
};

type NavPreviewGuideListener = (info: NavPreviewGuideInfo | null) => void;

let listener: NavPreviewGuideListener | null = null;

export function setNavPreviewGuideListener(
  next: NavPreviewGuideListener | null,
): void {
  listener = next;
}

export function notifyNavPreviewOpened(info: NavPreviewGuideInfo): void {
  listener?.(info);
}

export function notifyNavPreviewClosed(): void {
  listener?.(null);
}
