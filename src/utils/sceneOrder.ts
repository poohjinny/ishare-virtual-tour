import type { Scene, Tour } from '../types/tour';
import {
  buildSceneVisitOrder,
  SCENE_GROUP_OTHER_ID,
  type SceneGroup,
} from '../viewer/sceneDepth';

type TourOrderPick = Pick<
  Tour,
  'hotspots' | 'scenes' | 'firstScene' | 'sceneOrder'
>;

/**
 * Authoritative Explore / Play tour order.
 * Keeps valid authored ids, drops orphans, appends missing scenes in nav BFS
 * order (runtime fill only — not persisted until DEV saves).
 */
export function resolveTourSceneOrder(tour: TourOrderPick): string[] {
  const scenes = tour.scenes ?? {};
  const known = new Set(Object.keys(scenes));
  if (known.size === 0) return [];

  const seen = new Set<string>();
  const order: string[] = [];

  const authored = Array.isArray(tour.sceneOrder) ? tour.sceneOrder : [];
  for (const raw of authored) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }

  if (seen.size < known.size) {
    for (const id of buildSceneVisitOrder(tour, scenes, tour.firstScene)) {
      if (!known.has(id) || seen.has(id)) continue;
      seen.add(id);
      order.push(id);
    }
  }

  if (seen.size < known.size) {
    for (const id of Object.keys(scenes)) {
      if (seen.has(id)) continue;
      seen.add(id);
      order.push(id);
    }
  }

  return order;
}

function sceneOrderRankMap(tour: TourOrderPick): Map<string, number> {
  return new Map(resolveTourSceneOrder(tour).map((id, index) => [id, index]));
}

/** Sort a scene list by {@link resolveTourSceneOrder} ranks. */
export function sortScenesByTourOrder(
  tour: TourOrderPick,
  scenes: Scene[],
): Scene[] {
  const rank = sceneOrderRankMap(tour);
  return [...scenes].sort(
    (a, b) =>
      (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/** Sort scene ids by {@link resolveTourSceneOrder} ranks (membership unchanged). */
export function sortSceneIdsByTourOrder(
  tour: TourOrderPick,
  sceneIds: string[],
): string[] {
  const rank = sceneOrderRankMap(tour);
  return [...sceneIds].sort(
    (a, b) =>
      (rank.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Sort nav department groups for Tour order: members + group headers follow
 * authored {@link resolveTourSceneOrder} ranks (membership stays nav-based).
 */
export function sortSceneGroupsByTourOrder(
  tour: TourOrderPick,
  groups: SceneGroup[],
  otherGroupId: string = SCENE_GROUP_OTHER_ID,
): SceneGroup[] {
  const rank = sceneOrderRankMap(tour);
  const sceneRank = (id: string) => rank.get(id) ?? Number.MAX_SAFE_INTEGER;
  const groupRank = (group: SceneGroup) => {
    if (group.id !== otherGroupId) return sceneRank(group.id);
    if (group.scenes.length === 0) return Number.MAX_SAFE_INTEGER;
    return Math.min(...group.scenes.map((scene) => sceneRank(scene.id)));
  };

  return [...groups]
    .map((group) => ({
      ...group,
      scenes: [...group.scenes].sort(
        (a, b) => sceneRank(a.id) - sceneRank(b.id),
      ),
    }))
    .sort((a, b) => groupRank(a) - groupRank(b));
}

/** Swap `sceneId` with the adjacent peer in `peerIds` (tour-order subsequence). */
export function moveSceneAmongPeersInOrder(
  order: string[],
  sceneId: string,
  direction: -1 | 1,
  peerIds: readonly string[],
): string[] | null {
  const peerSet = new Set(peerIds);
  if (!peerSet.has(sceneId)) return null;

  const peers = order.filter((id) => peerSet.has(id));
  const peerIndex = peers.indexOf(sceneId);
  const swapWith = peers[peerIndex + direction];
  if (!swapWith || peerIndex < 0) return null;

  const next = [...order];
  const i = next.indexOf(sceneId);
  const j = next.indexOf(swapWith);
  if (i < 0 || j < 0) return null;
  next[i] = swapWith;
  next[j] = sceneId;
  return next;
}

/**
 * Move `sceneId` to `toPeerIndex` within the peer subsequence (0-based among
 * peers in tour order). Non-peers keep absolute slots.
 */
export function moveSceneAmongPeersToIndex(
  order: string[],
  sceneId: string,
  peerIds: readonly string[],
  toPeerIndex: number,
): string[] | null {
  const peerSet = new Set(peerIds);
  if (!peerSet.has(sceneId)) return null;

  const peers = order.filter((id) => peerSet.has(id));
  const from = peers.indexOf(sceneId);
  if (from < 0 || peers.length === 0) return null;

  const clamped = Math.max(0, Math.min(toPeerIndex, peers.length - 1));
  if (from === clamped) return null;

  const nextPeers = [...peers];
  const [moved] = nextPeers.splice(from, 1);
  if (!moved) return null;
  nextPeers.splice(clamped, 0, moved);

  let cursor = 0;
  return order.map((id) =>
    peerSet.has(id) ? (nextPeers[cursor++] ?? id) : id,
  );
}

/**
 * Swap two groups' member subsequences in `order` (non-members keep relative
 * places). Call with the pair already ordered as currently earlier → later.
 */
export function swapGroupBlocksInOrder(
  order: string[],
  earlierGroupIds: readonly string[],
  laterGroupIds: readonly string[],
): string[] | null {
  const earlierSet = new Set(earlierGroupIds);
  const laterSet = new Set(laterGroupIds);
  if (earlierSet.size === 0 || laterSet.size === 0) return null;

  const blockEarlier = order.filter((id) => earlierSet.has(id));
  const blockLater = order.filter((id) => laterSet.has(id));
  if (blockEarlier.length === 0 || blockLater.length === 0) return null;

  const out: string[] = [];
  let placed = false;
  for (const id of order) {
    if (earlierSet.has(id) || laterSet.has(id)) {
      if (!placed) {
        out.push(...blockLater, ...blockEarlier);
        placed = true;
      }
      continue;
    }
    out.push(id);
  }
  return out;
}

/**
 * Move a group block from `fromIndex` to `toIndex` among `groupSceneIds`
 * (adjacent swaps; same membership semantics as {@link swapGroupBlocksInOrder}).
 */
export function moveGroupBlockToIndex(
  order: string[],
  groupSceneIds: readonly (readonly string[])[],
  fromIndex: number,
  toIndex: number,
): string[] | null {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= groupSceneIds.length ||
    toIndex >= groupSceneIds.length ||
    fromIndex === toIndex
  ) {
    return null;
  }

  let next = order;
  const blocks = groupSceneIds.map((ids) => [...ids]);
  let current = fromIndex;
  const step = toIndex > fromIndex ? 1 : -1;

  while (current !== toIndex) {
    const a = Math.min(current, current + step);
    const b = Math.max(current, current + step);
    const earlier = blocks[a];
    const later = blocks[b];
    if (!earlier || !later) return null;
    const swapped = swapGroupBlocksInOrder(next, earlier, later);
    if (!swapped) return null;
    next = swapped;
    blocks[a] = later;
    blocks[b] = earlier;
    current += step;
  }

  return next;
}
