import type { Hotspot, Scene, Tour } from '../types/tour';
import { resolveSceneNavHotspots } from '../utils/resolveSceneHotspots';

/** BFS depth from firstScene along nav hotspots (overview = 0). */
export function buildSceneDepths(tour: Tour): Record<string, number> {
  const depths: Record<string, number> = {};
  const queue = [tour.firstScene];
  depths[tour.firstScene] = 0;

  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    const scene = tour.scenes[sceneId];
    if (!scene) continue;

    for (const hotspot of resolveSceneNavHotspots(tour, scene)) {
      if (depths[hotspot.targetScene!] !== undefined) continue;
      depths[hotspot.targetScene!] = depths[sceneId] + 1;
      queue.push(hotspot.targetScene!);
    }
  }

  return depths;
}

export function getSceneDepth(tour: Tour, sceneId: string): number {
  return buildSceneDepths(tour)[sceneId] ?? 0;
}

/** Group id for scenes not reachable from firstScene via the nav graph. */
export const SCENE_GROUP_OTHER_ID = '__other';

/** A department-style grouping of scenes, derived from the nav graph. */
export interface SceneGroup {
  /** Group root scene id (the level-1 scene), or {@link SCENE_GROUP_OTHER_ID}. */
  id: string;
  title: string;
  scenes: Scene[];
}

/**
 * Groups scenes by their level-1 ancestor in the nav graph — each scene the
 * firstScene links to directly becomes a department header, and every scene
 * reachable beneath it (that isn't itself a level-1 branch) joins that group.
 * The firstScene is excluded (callers render it standalone). Scenes unreachable
 * via nav hotspots are collected into an "other" group.
 */
export function buildSceneGroups(
  tour: Pick<Tour, 'hotspots'>,
  scenes: Record<string, Scene>,
  firstSceneId: string,
  otherGroupTitle: string,
): SceneGroup[] {
  const groupRootOf = new Map<string, string>();
  const visited = new Set<string>();
  const queue: string[] = [];
  const rootOrder: string[] = [];
  const membersByRoot = new Map<string, string[]>();

  if (scenes[firstSceneId]) {
    queue.push(firstSceneId);
    visited.add(firstSceneId);
  }

  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    const scene = scenes[sceneId];
    if (!scene) continue;

    for (const hotspot of resolveSceneNavHotspots(tour, scene)) {
      const target = hotspot.targetScene!;
      if (visited.has(target) || !scenes[target]) continue;
      visited.add(target);

      // firstScene's direct targets start a new group; deeper scenes inherit.
      const root =
        sceneId === firstSceneId ? target : groupRootOf.get(sceneId)!;
      groupRootOf.set(target, root);
      if (!membersByRoot.has(root)) {
        membersByRoot.set(root, []);
        rootOrder.push(root);
      }
      membersByRoot.get(root)!.push(target);
      queue.push(target);
    }
  }

  const groups: SceneGroup[] = rootOrder.map((rootId) => ({
    id: rootId,
    title: scenes[rootId]?.title ?? rootId,
    scenes: (membersByRoot.get(rootId) ?? []).map((id) => scenes[id]),
  }));

  const orphans = Object.keys(scenes).filter(
    (id) => id !== firstSceneId && !visited.has(id),
  );
  if (orphans.length > 0) {
    groups.push({
      id: SCENE_GROUP_OTHER_ID,
      title: otherGroupTitle,
      scenes: orphans.map((id) => scenes[id]),
    });
  }

  return groups;
}

/**
 * BFS visit order from firstScene along nav hotspots — overview first, then its
 * level-1 targets, then their children. Scenes unreachable via the nav graph are
 * appended in declaration order so nothing is dropped.
 */
export function buildSceneVisitOrder(
  tour: Pick<Tour, 'hotspots'>,
  scenes: Record<string, Scene>,
  firstSceneId: string,
): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  if (scenes[firstSceneId]) {
    queue.push(firstSceneId);
    visited.add(firstSceneId);
  }

  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    const scene = scenes[sceneId];
    if (!scene) continue;
    order.push(sceneId);

    for (const hotspot of resolveSceneNavHotspots(tour, scene)) {
      const target = hotspot.targetScene!;
      if (visited.has(target) || !scenes[target]) continue;
      visited.add(target);
      queue.push(target);
    }
  }

  for (const sceneId of Object.keys(scenes)) {
    if (!visited.has(sceneId)) order.push(sceneId);
  }

  return order;
}

export function isGoingDeeper(
  tour: Tour,
  fromSceneId: string,
  toSceneId: string,
): boolean {
  return getSceneDepth(tour, toSceneId) > getSceneDepth(tour, fromSceneId);
}

/** Shortest nav path from firstScene to target (BFS along nav hotspots). */
export function buildScenePath(
  firstSceneId: string,
  scenes: Record<string, Scene>,
  targetSceneId: string,
  tourHotspots?: Tour['hotspots'],
): string[] {
  if (targetSceneId === firstSceneId) {
    return [firstSceneId];
  }

  const parent = new Map<string, string>();
  const queue = [firstSceneId];
  const visited = new Set<string>([firstSceneId]);
  const tour = { hotspots: tourHotspots };

  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    if (sceneId === targetSceneId) break;

    const scene = scenes[sceneId];
    if (!scene) continue;

    for (const hotspot of resolveSceneNavHotspots(tour, scene)) {
      if (visited.has(hotspot.targetScene!)) continue;
      visited.add(hotspot.targetScene!);
      parent.set(hotspot.targetScene!, sceneId);
      queue.push(hotspot.targetScene!);
    }
  }

  if (!visited.has(targetSceneId)) {
    return [targetSceneId];
  }

  const path: string[] = [];
  let cursor: string | undefined = targetSceneId;
  while (cursor) {
    path.unshift(cursor);
    cursor = parent.get(cursor);
  }
  return path;
}

/** Nav hotspot on target that links back toward the scene we came from. */
export function findIngressHotspot(
  tour: Pick<Tour, 'hotspots'>,
  targetScene: Scene,
  fromSceneId: string,
): Hotspot | undefined {
  return resolveSceneNavHotspots(tour, targetScene).find(
    (hotspot) => hotspot.targetScene === fromSceneId,
  );
}

/** Nav hotspot on current scene that points to the shallower target. */
export function findEgressHotspot(
  tour: Pick<Tour, 'hotspots'>,
  scene: Scene,
  targetSceneId: string,
): Hotspot | undefined {
  return resolveSceneNavHotspots(tour, scene).find(
    (hotspot) => hotspot.targetScene === targetSceneId,
  );
}

/**
 * Scene id → department / floor title for rows that need context without
 * baking a floor prefix into {@link Scene.title}. Group roots and the tour
 * start are omitted (no secondary) so hubs don't read as "Main Floor · Main Floor".
 */
export function buildSceneGroupSecondaryById(
  tour: Pick<Tour, 'hotspots'>,
  scenes: Record<string, Scene>,
  firstSceneId: string,
  otherGroupTitle: string,
): Record<string, string> {
  const groups = buildSceneGroups(tour, scenes, firstSceneId, otherGroupTitle);
  const out: Record<string, string> = {};

  for (const group of groups) {
    // Orphans stay unlabeled so callers can fall back to scene id — "More places"
    // is not useful for authoring disambiguation.
    if (group.id === SCENE_GROUP_OTHER_ID) continue;

    for (const scene of group.scenes) {
      if (scene.id === group.id) continue;
      out[scene.id] = group.title;
    }
  }

  return out;
}

/** Scene ids whose visitor-facing titles collide (case-insensitive trim). */
export function sceneIdsWithTitleCollisions(
  scenes: Iterable<Scene>,
): Set<string> {
  const counts = new Map<string, number>();

  for (const scene of scenes) {
    const key = scene.title.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const colliding = new Set<string>();
  for (const scene of scenes) {
    const key = scene.title.trim().toLowerCase();
    if (key && (counts.get(key) ?? 0) > 1) colliding.add(scene.id);
  }

  return colliding;
}
