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
import { buildSceneGroups } from '../viewer/sceneDepth';
import {
  formatNamingPriceAbbrev,
  parseNamingPrice,
  SHOW_SECTOR_NAMING_TOTAL,
} from './namingPrice';
import { TOUR_DIRECTORY_GROUP_OTHER } from '../constants/tourDirectory';

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

/**
 * Total naming price across a destination sector — only when `targetSceneId` is
 * a department root (level-1 scene the overview links to). Returns 0 otherwise,
 * so callers can skip the label for mid-sector nav targets.
 */
export function buildNavPreviewSectorNamingTotal(
  tour: Tour,
  targetSceneId: string,
): number {
  const groups = buildSceneGroups(
    tour,
    tour.scenes,
    tour.firstScene,
    TOUR_DIRECTORY_GROUP_OTHER,
  );
  const group = groups.find((entry) => entry.id === targetSceneId);
  if (!group) return 0;

  let total = 0;
  for (const scene of group.scenes) {
    for (const naming of buildNavPreviewNamingItems(tour, scene)) {
      total += parseNamingPrice(naming.price) ?? 0;
    }
  }
  return total;
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

  const videoUrl = scene.previewVideoUrl?.trim() || undefined;
  const bodyVideoUrl = scene.videoUrl?.trim() || undefined;
  const image = hotspot.preview?.image ?? scene.panorama ?? undefined;
  const canNavigate = navPreviewCanNavigate(hotspot, currentSceneId);
  const hotspotLabel = hotspot.label?.trim();

  const sectorNamingTotal = buildNavPreviewSectorNamingTotal(
    tour,
    hotspot.targetScene,
  );
  const hasSectorTotal = sectorNamingTotal > 0;
  const namingTotalLabel =
    SHOW_SECTOR_NAMING_TOTAL && hasSectorTotal ?
      formatNamingPriceAbbrev(sectorNamingTotal)
    : undefined;

  return {
    targetSceneId: hotspot.targetScene,
    title: canNavigate ? scene.title : hotspotLabel || scene.title,
    panorama: scene.panorama,
    image,
    videoUrl,
    videoPoster: videoUrl ? scene.videoPoster : undefined,
    bodyVideoUrl,
    description: scene.description?.trim() || undefined,
    namingItems: buildNavPreviewNamingItems(tour, scene),
    namingTotalLabel,
    namingTotalAmount:
      SHOW_SECTOR_NAMING_TOTAL && hasSectorTotal ? sectorNamingTotal : (
        undefined
      ),
    targetView: scene.defaultView,
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
