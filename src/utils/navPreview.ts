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

function findSceneInfoHotspots(scene: Scene): Hotspot[] {
  return scene.hotspots.filter(
    (hotspot) => hotspot.type === 'info' && hotspot.popup,
  );
}

function navPreviewNamingDescription(body: string): string {
  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean);

  return firstParagraph ?? body.trim();
}

export function buildNavPreviewNamingItems(
  scene: Scene,
): NavPreviewNamingItem[] {
  const items: NavPreviewNamingItem[] = [];

  for (const hotspot of findSceneInfoHotspots(scene)) {
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
      statusModifier: statusConfig.cssModifier,
      price: naming.price,
      priceLabel: naming.priceLabel,
      description,
    });
  }

  return items;
}

export function buildNavPreview(
  hotspot: Hotspot,
  tour: Tour,
): NavPreviewContent | null {
  if (hotspot.type !== 'nav' || !hotspot.targetScene) return null;

  const scene = tour.scenes[hotspot.targetScene];
  if (!scene) return null;

  const image =
    hotspot.preview?.image ?? scene.thumbnail ?? scene.panorama ?? undefined;

  return {
    targetSceneId: hotspot.targetScene,
    title: scene.title,
    panorama: scene.panorama,
    image,
    description: scene.description?.trim() || undefined,
    namingItems: buildNavPreviewNamingItems(scene),
    targetView: hotspot.targetView ?? scene.defaultView,
    ctaLabel: hotspot.label?.trim() || undefined,
  };
}

export function navPreviewVisitDestination(preview: NavPreviewContent): string {
  return preview.ctaLabel?.trim() || preview.title;
}

export function navPreviewCtaLabel(preview: NavPreviewContent): string {
  return `Visit ${navPreviewVisitDestination(preview)}`;
}

export function navPreviewVisitAriaLabel(preview: NavPreviewContent): string {
  return navPreviewCtaLabel(preview);
}
