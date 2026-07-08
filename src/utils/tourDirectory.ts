import { TOUR_DIRECTORY_GROUP_OTHER } from '../constants/tourDirectory';
import type { ExploreDirectorySort } from '../constants/tourDirectorySort';
import { compareNamingOpportunityStatusModifiers } from '../data/namingOpportunityStatus';
import type { Scene, Tour, ViewPosition } from '../types/tour';
import { parseNamingPrice } from './namingPrice';
import { buildNavPreviewNamingItems } from './navPreview';
import {
  findNamingHotspotInTour,
  isModel3dTour,
  resolveModel3dNamingTargetView,
} from './findTourHotspot';
import { resolveNamingOpportunityView } from '../viewer/pendingNamingInfoHotspot';
import {
  buildSceneGroups,
  buildSceneVisitOrder,
  SCENE_GROUP_OTHER_ID,
} from '../viewer/sceneDepth';

export interface TourDirectoryNamingItem {
  sceneId: string;
  sceneTitle: string;
  hotspotId: string;
  name: string;
  price: number;
  priceLabel?: string;
  priceAmount: number | null;
  statusLabel: string;
  statusShortLabel: string;
  statusModifier: string;
  /** First paragraph from the naming opportunity popup body. */
  description?: string;
  /** model3d — baked preview hero for Explore cards */
  previewImage?: string;
}

export interface NamingSectorGroup {
  id: string;
  title: string;
  items: TourDirectoryNamingItem[];
  total: number;
}

export function buildTourNamingDirectory(
  tour: Pick<Tour, 'scenes' | 'hotspots' | 'viewerType'>,
): TourDirectoryNamingItem[] {
  const items: TourDirectoryNamingItem[] = [];

  for (const scene of Object.values(tour.scenes)) {
    for (const naming of buildNavPreviewNamingItems(tour, scene)) {
      items.push({
        sceneId: scene.id,
        sceneTitle: scene.title,
        hotspotId: naming.hotspotId,
        name: naming.name,
        price: naming.price,
        priceLabel: naming.priceLabel,
        priceAmount: parseNamingPrice(naming.price),
        statusLabel: naming.statusLabel,
        statusShortLabel: naming.statusShortLabel,
        statusModifier: naming.statusModifier,
        description: naming.description,
        previewImage: naming.previewImage,
      });
    }
  }

  return items;
}

/** Group sorted naming items by nav-graph sector and sum visible prices. */
export function buildNamingSectorGroups(
  tour: Pick<Tour, 'hotspots' | 'viewerType'> & {
    scenes: Record<string, Scene>;
    firstScene: string;
  },
  sortedItems: TourDirectoryNamingItem[],
  otherGroupTitle: string = TOUR_DIRECTORY_GROUP_OTHER,
): NamingSectorGroup[] {
  const sceneGroups = buildSceneGroups(
    tour,
    tour.scenes,
    tour.firstScene,
    otherGroupTitle,
  );

  const sceneToGroupId = new Map<string, string>();
  const groupMeta = new Map<string, { id: string; title: string }>();

  for (const group of sceneGroups) {
    groupMeta.set(group.id, { id: group.id, title: group.title });
    sceneToGroupId.set(group.id, group.id);
    for (const scene of group.scenes) {
      sceneToGroupId.set(scene.id, group.id);
    }
  }

  const buckets = new Map<string, TourDirectoryNamingItem[]>();
  for (const group of sceneGroups) {
    buckets.set(group.id, []);
  }

  for (const item of sortedItems) {
    const groupId = sceneToGroupId.get(item.sceneId) ?? SCENE_GROUP_OTHER_ID;
    if (!buckets.has(groupId)) {
      buckets.set(groupId, []);
      if (!groupMeta.has(groupId)) {
        groupMeta.set(groupId, { id: groupId, title: otherGroupTitle });
      }
    }
    buckets.get(groupId)!.push(item);
  }

  return sceneGroups
    .map((group) => {
      const items = buckets.get(group.id) ?? [];
      if (items.length === 0) return null;

      const total = items.reduce(
        (sum, item) => sum + (item.priceAmount ?? 0),
        0,
      );

      return { id: group.id, title: group.title, items, total };
    })
    .filter((group): group is NamingSectorGroup => group != null);
}

export { findNamingHotspotInTour } from './findTourHotspot';

/** Landing end pose — `defaultView`, or the NO hotspot view when `?no=` matches this scene. */
export function resolveSceneLandingView(
  tour: Tour,
  sceneId: string,
  namingHotspotId: string | null | undefined,
): ViewPosition | undefined {
  const scene = tour.scenes[sceneId];
  if (!scene) return undefined;

  if (!namingHotspotId) {
    return scene.defaultView;
  }

  const loc = findNamingHotspotInTour(tour, namingHotspotId);
  if (!loc || loc.sceneId !== sceneId) {
    return scene.defaultView;
  }

  if (isModel3dTour(tour)) {
    return (
      resolveModel3dNamingTargetView(tour, loc.hotspot, loc.sceneId) ??
      scene.defaultView
    );
  }

  return (
    resolveNamingOpportunityView(tour, sceneId, namingHotspotId) ??
    scene.defaultView
  );
}

export function filterTourScenes(scenes: Scene[], query: string): Scene[] {
  const q = query.trim().toLowerCase();
  if (!q) return scenes;

  return scenes.filter(
    (scene) =>
      scene.title.toLowerCase().includes(q) ||
      scene.id.toLowerCase().includes(q) ||
      scene.description?.toLowerCase().includes(q),
  );
}

export function filterTourNamingDirectory(
  items: TourDirectoryNamingItem[],
  query: string,
): TourDirectoryNamingItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.sceneTitle.toLowerCase().includes(q) ||
      item.statusLabel.toLowerCase().includes(q) ||
      item.statusShortLabel.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q),
  );
}

function compareLocaleStrings(a: string, b: string, direction: 1 | -1): number {
  return a.localeCompare(b) * direction;
}

function compareNamingDirectoryNames(
  a: TourDirectoryNamingItem,
  b: TourDirectoryNamingItem,
  direction: 1 | -1,
): number {
  const nameDiff = compareLocaleStrings(a.name, b.name, direction);
  if (nameDiff !== 0) return nameDiff;

  return compareNamingOpportunityStatusModifiers(
    a.statusModifier,
    b.statusModifier,
  );
}

function compareNamingDirectoryLocations(
  a: TourDirectoryNamingItem,
  b: TourDirectoryNamingItem,
  direction: 1 | -1,
): number {
  const locationDiff = compareLocaleStrings(
    a.sceneTitle,
    b.sceneTitle,
    direction,
  );
  if (locationDiff !== 0) return locationDiff;

  return compareNamingDirectoryNames(a, b, 1);
}

function compareNamingPrices(
  a: TourDirectoryNamingItem,
  b: TourDirectoryNamingItem,
  direction: 1 | -1,
): number {
  const aPrice = a.priceAmount;
  const bPrice = b.priceAmount;

  if (aPrice == null && bPrice == null) {
    return compareNamingDirectoryNames(a, b, 1);
  }
  if (aPrice == null) return 1;
  if (bPrice == null) return -1;

  const diff = (aPrice - bPrice) * direction;
  if (diff !== 0) return diff;

  return compareNamingDirectoryNames(a, b, 1);
}

function sceneNamingOpportunityCount(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scene: Scene,
): number {
  return buildNavPreviewNamingItems(tour, scene).length;
}

function compareScenesByNamingCount(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  a: Scene,
  b: Scene,
  direction: 1 | -1,
): number {
  const countDiff =
    (sceneNamingOpportunityCount(tour, a) -
      sceneNamingOpportunityCount(tour, b)) *
    direction;
  if (countDiff !== 0) return countDiff;

  return compareLocaleStrings(a.title, b.title, 1);
}

export function sortTourScenes(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scenes: Scene[],
  sort: ExploreDirectorySort,
  firstSceneId?: string,
): Scene[] {
  const sorted = [...scenes];

  switch (sort) {
    case 'tour-order': {
      if (firstSceneId) {
        const sceneMap = Object.fromEntries(
          sorted.map((scene) => [scene.id, scene]),
        );
        const order = buildSceneVisitOrder(tour, sceneMap, firstSceneId);
        const rank = new Map(order.map((id, index) => [id, index]));
        sorted.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
      }
      break;
    }
    case 'name-asc':
      sorted.sort((a, b) => compareLocaleStrings(a.title, b.title, 1));
      break;
    case 'name-desc':
      sorted.sort((a, b) => compareLocaleStrings(a.title, b.title, -1));
      break;
    case 'naming-count-desc':
      sorted.sort((a, b) => compareScenesByNamingCount(tour, a, b, -1));
      break;
    case 'naming-count-asc':
      sorted.sort((a, b) => compareScenesByNamingCount(tour, a, b, 1));
      break;
    default:
      sorted.sort((a, b) => compareLocaleStrings(a.title, b.title, 1));
      break;
  }

  if (!firstSceneId) return sorted;

  const firstIndex = sorted.findIndex((scene) => scene.id === firstSceneId);
  if (firstIndex <= 0) return sorted;

  const [firstScene] = sorted.splice(firstIndex, 1);
  return [firstScene, ...sorted];
}

export function sortTourNamingDirectory(
  items: TourDirectoryNamingItem[],
  sort: ExploreDirectorySort,
): TourDirectoryNamingItem[] {
  const sorted = [...items];

  switch (sort) {
    case 'name-asc':
      sorted.sort((a, b) => compareNamingDirectoryNames(a, b, 1));
      break;
    case 'name-desc':
      sorted.sort((a, b) => compareNamingDirectoryNames(a, b, -1));
      break;
    case 'location-asc':
      sorted.sort((a, b) => compareNamingDirectoryLocations(a, b, 1));
      break;
    case 'location-desc':
      sorted.sort((a, b) => compareNamingDirectoryLocations(a, b, -1));
      break;
    case 'status-asc':
      sorted.sort((a, b) => {
        const statusDiff = compareNamingOpportunityStatusModifiers(
          a.statusModifier,
          b.statusModifier,
        );
        if (statusDiff !== 0) return statusDiff;

        return a.name.localeCompare(b.name);
      });
      break;
    case 'price-asc':
      sorted.sort((a, b) => compareNamingPrices(a, b, 1));
      break;
    case 'price-desc':
      sorted.sort((a, b) => compareNamingPrices(a, b, -1));
      break;
  }

  return sorted;
}

/** Preview pose for a naming-opportunity card hero. */
export function resolveNamingDirectoryPreviewView(
  tour: Pick<Tour, 'viewerType' | 'scenes' | 'hotspots' | 'firstScene'>,
  scenes: Scene[],
  sceneId: string,
  hotspotId: string,
): ViewPosition | undefined {
  const scene = scenes.find((entry) => entry.id === sceneId);
  if (!scene) return undefined;

  if (isModel3dTour(tour)) {
    const tourForLookup = {
      ...tour,
      scenes:
        tour.scenes ??
        Object.fromEntries(scenes.map((entry) => [entry.id, entry])),
      firstScene: tour.firstScene ?? scenes[0]?.id ?? sceneId,
    } as Tour;
    const found = findNamingHotspotInTour(tourForLookup, hotspotId);
    if (found) {
      return resolveModel3dNamingTargetView(
        tourForLookup,
        found.hotspot,
        found.sceneId ?? sceneId,
      );
    }
    return scene.defaultView;
  }

  const hotspot = scene.hotspots.find((entry) => entry.id === hotspotId);
  if (!hotspot?.popup) return scene.defaultView;

  const pos = hotspot.position as ViewPosition;
  return {
    yaw: pos.yaw,
    pitch: pos.pitch,
    zoom: pos.zoom ?? scene.defaultView?.zoom,
  };
}
