import type {
  Hotspot,
  NavPreviewContent,
  NavPreviewNamingItem,
  Scene,
  Tour,
} from '../types/tour';
import {
  namingOpportunityStatusConfig,
  stripNamingOpportunitySuffix,
} from '../data/namingOpportunityStatus';
import { listSceneInfoHotspots } from './findTourHotspot';

function navPreviewNamingDescription(body: string): string {
  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean);

  return firstParagraph ?? body.trim();
}

export function buildNavPreviewNamingItems(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scene: Scene,
): NavPreviewNamingItem[] {
  const items: NavPreviewNamingItem[] = [];

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    const popup = hotspot.popup;
    const naming = popup?.namingOpportunity;
    if (!naming) continue;

    const statusConfig = namingOpportunityStatusConfig(naming.status);
    const description =
      popup.body?.trim() ? navPreviewNamingDescription(popup.body) : undefined;

    items.push({
      hotspotId: hotspot.id,
      name: stripNamingOpportunitySuffix(naming.name),
      statusLabel: statusConfig.label,
      statusShortLabel: statusConfig.shortLabel,
      statusModifier: statusConfig.cssModifier,
      price: naming.price,
      priceLabel: naming.priceLabel,
      description,
      previewImage: hotspot.preview?.image,
    });
  }

  return items;
}

export function navPreviewCanNavigate(
  hotspot: Hotspot,
  currentSceneId: string,
): boolean {
  if (hotspot.type !== 'nav' || !hotspot.targetScene) return false;
  return hotspot.targetScene !== currentSceneId;
}

export function buildNavPreview(
  hotspot: Hotspot,
  tour: Tour,
  currentSceneId: string,
): NavPreviewContent | null {
  if (hotspot.type !== 'nav' || !hotspot.targetScene) return null;

  const scene = tour.scenes[hotspot.targetScene];
  if (!scene) return null;

  const videoUrl =
    hotspot.preview?.videoUrl?.trim() || scene.videoUrl?.trim() || undefined;
  const image = hotspot.preview?.image ?? scene.panorama ?? undefined;
  const canNavigate = navPreviewCanNavigate(hotspot, currentSceneId);
  const hotspotLabel = hotspot.label?.trim();

  return {
    targetSceneId: hotspot.targetScene,
    title: canNavigate ? scene.title : hotspotLabel || scene.title,
    panorama: scene.panorama,
    image,
    videoUrl,
    description: scene.description?.trim() || undefined,
    namingItems: buildNavPreviewNamingItems(tour, scene),
    targetView: hotspot.targetView ?? scene.defaultView,
    ctaLabel: hotspotLabel || undefined,
    canNavigate,
  };
}

export function navPreviewVisitDestination(preview: NavPreviewContent): string {
  return preview.ctaLabel?.trim() || preview.title;
}

export function navPreviewCtaLabel(preview: NavPreviewContent): string {
  if (!preview.canNavigate) return '';
  return `Visit ${navPreviewVisitDestination(preview)}`;
}

export function navPreviewVisitAriaLabel(preview: NavPreviewContent): string {
  if (!preview.canNavigate) return '';
  return navPreviewCtaLabel(preview);
}
