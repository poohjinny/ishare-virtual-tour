import { TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD } from '../constants/tourDirectory';
import { namingOpportunityStatusConfig } from '../data/namingOpportunityStatus';
import type { ChatGuideLink, Hotspot, Scene, Tour } from '../types/tour';
import { findNamingHotspotByNamingId } from './findTourHotspot';
import { formatNamingPriceDisplay } from './namingPrice';
import {
  abbreviateNamingBodyLead,
  resolveScenePlaceLead,
} from './resolveScenePlaceLead';
import { resolveNamingPopup } from './namingSceneInherit';
import { buildTourNamingDirectory } from './tourDirectory';
import { isSceneVisibleInExplore } from './sceneVisibility';

/** Place / naming card under an Ask Guide reply. */
export type GuideSceneLink = ChatGuideLink;

const MAX_GUIDE_LINKS = 4;
const GUIDE_CARD_DESC_MAX_CHARS = 96;

/** Short one-line blurb for guide cards — skips empty-place filler. */
export function guideCardDescription(
  text: string | null | undefined,
): string | undefined {
  const raw = text?.replace(/\s+/g, ' ').trim();
  if (!raw || raw === TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD) return undefined;
  const abbreviated = abbreviateNamingBodyLead(raw, GUIDE_CARD_DESC_MAX_CHARS);
  return abbreviated || undefined;
}

function sceneCardDescription(tour: Tour, sceneId: string): string | undefined {
  const scene = tour.scenes[sceneId];
  if (!scene) return undefined;
  return guideCardDescription(resolveScenePlaceLead(tour, scene));
}

function buildSceneLink(
  tour: Tour,
  sceneId: string,
  label?: string,
  options?: { allowNonPublic?: boolean },
): ChatGuideLink | null {
  const scene = tour.scenes[sceneId];
  if (!scene) return null;
  if (!options?.allowNonPublic && !isSceneVisibleInExplore(scene)) return null;
  return {
    kind: 'scene',
    sceneId,
    title: label?.trim() || scene.title?.trim() || sceneId,
    description: sceneCardDescription(tour, sceneId),
    thumbnail: scene.thumbnail?.trim() || undefined,
  };
}

/** Current-place summary card (allows the active scene even if unlisted/internal). */
export function buildCurrentPlaceGuideLink(
  tour: Tour,
  sceneId: string,
): ChatGuideLink | null {
  return buildSceneLink(tour, sceneId, undefined, { allowNonPublic: true });
}

function buildNamingLinkFromHotspot(
  tour: Tour,
  sceneId: string,
  hotspot: Hotspot,
  label?: string,
): ChatGuideLink | null {
  const scene = tour.scenes[sceneId];
  if (!scene || !isSceneVisibleInExplore(scene)) return null;

  const popup = resolveNamingPopup(tour, hotspot, scene);
  const naming = popup?.namingOpportunity;
  if (!naming) return null;

  const priceLabel =
    naming.priceLabel?.trim() || formatNamingPriceDisplay(naming.price);
  const statusLabel = namingOpportunityStatusConfig(naming.status).label;
  const bodyDesc = guideCardDescription(popup?.body);
  const fallbackDesc =
    [priceLabel, statusLabel, scene.title?.trim()]
      .filter(Boolean)
      .join(' · ') || undefined;

  return {
    kind: 'naming',
    sceneId,
    namingId: hotspot.namingId?.trim() || hotspot.id,
    hotspotId: hotspot.id,
    title:
      label?.trim() ||
      naming.name?.trim() ||
      hotspot.label?.trim() ||
      hotspot.id,
    description: bodyDesc || fallbackDesc,
    thumbnail:
      hotspot.preview?.image?.trim() ||
      popup?.image?.trim() ||
      scene.thumbnail?.trim() ||
      undefined,
    statusLabel,
    priceLabel: priceLabel || undefined,
  };
}

function buildNamingLink(
  tour: Tour,
  namingId: string,
  label?: string,
): ChatGuideLink | null {
  const found = findNamingHotspotByNamingId(tour, namingId);
  if (!found) return null;
  return buildNamingLinkFromHotspot(tour, found.sceneId, found.hotspot, label);
}

function findHotspotOnScene(
  tour: Tour,
  scene: Scene,
  hotspotId: string,
): Hotspot | undefined {
  return (
    scene.hotspots?.find((entry) => entry.id === hotspotId) ??
    tour.hotspots?.find(
      (entry) => entry.id === hotspotId && entry.sceneId === scene.id,
    ) ??
    tour.hotspots?.find((entry) => entry.id === hotspotId)
  );
}

/** Validate model/heuristic scene links and attach display fields. */
export function resolveGuideSceneLinks(
  tour: Tour,
  currentSceneId: string,
  rawLinks: Array<{ sceneId?: string; label?: string }> | null | undefined,
): ChatGuideLink[] {
  if (!Array.isArray(rawLinks) || rawLinks.length === 0) return [];

  const out: ChatGuideLink[] = [];
  const seen = new Set<string>();

  for (const entry of rawLinks) {
    const sceneId = entry?.sceneId?.trim();
    if (!sceneId || sceneId === currentSceneId || seen.has(`scene:${sceneId}`))
      continue;
    const link = buildSceneLink(tour, sceneId, entry.label);
    if (!link) continue;
    seen.add(`scene:${sceneId}`);
    out.push(link);
    if (out.length >= MAX_GUIDE_LINKS) break;
  }

  return out;
}

/** Validate model naming links (`no_*`) and attach display fields. */
export function resolveGuideNamingLinks(
  tour: Tour,
  rawLinks: Array<{ namingId?: string; label?: string }> | null | undefined,
): ChatGuideLink[] {
  if (!Array.isArray(rawLinks) || rawLinks.length === 0) return [];

  const out: ChatGuideLink[] = [];
  const seen = new Set<string>();

  for (const entry of rawLinks) {
    const namingId = entry?.namingId?.trim();
    if (!namingId || seen.has(`naming:${namingId}`)) continue;
    const link = buildNamingLink(tour, namingId, entry.label);
    if (!link) continue;
    seen.add(`naming:${namingId}`);
    out.push(link);
    if (out.length >= MAX_GUIDE_LINKS) break;
  }

  return out;
}

/**
 * When the model (or mock) only returns prose, attach cards for mentioned places
 * and naming opportunities.
 */
export function inferGuideSceneLinksFromText(
  tour: Tour,
  currentSceneId: string,
  reply: string,
): ChatGuideLink[] {
  const text = reply.trim();
  if (!text) return [];

  const lower = text.toLowerCase();
  const candidates: Array<{
    key: string;
    index: number;
    titleLen: number;
    build: () => ChatGuideLink | null;
  }> = [];

  for (const [sceneId, scene] of Object.entries(tour.scenes)) {
    if (sceneId === currentSceneId) continue;
    if (!isSceneVisibleInExplore(scene)) continue;
    const title = scene.title?.trim();
    if (!title || title.length < 3) continue;
    const index = lower.indexOf(title.toLowerCase());
    if (index < 0) continue;
    candidates.push({
      key: `scene:${sceneId}`,
      index,
      titleLen: title.length,
      build: () => buildSceneLink(tour, sceneId, title),
    });
  }

  for (const item of buildTourNamingDirectory(tour)) {
    const name = item.name?.trim();
    if (!name || name.length < 3) continue;
    const index = lower.indexOf(name.toLowerCase());
    if (index < 0) continue;
    candidates.push({
      key: `naming-hotspot:${item.hotspotId}`,
      index,
      titleLen: name.length,
      build: () => {
        const scene = tour.scenes[item.sceneId];
        if (!scene) return null;
        const hotspot = findHotspotOnScene(tour, scene, item.hotspotId);
        if (!hotspot) return null;
        return buildNamingLinkFromHotspot(tour, item.sceneId, hotspot, name);
      },
    });
  }

  candidates.sort((a, b) => a.index - b.index || b.titleLen - a.titleLen);

  const out: ChatGuideLink[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.key)) continue;
    const link = candidate.build();
    if (!link) continue;
    seen.add(candidate.key);
    out.push(link);
    if (out.length >= MAX_GUIDE_LINKS) break;
  }

  return out;
}

/** Merge model scene + naming links; fall back to text inference. */
export function resolveGuideLinks(
  tour: Tour,
  currentSceneId: string,
  reply: string,
  rawSceneLinks?: Array<{ sceneId?: string; label?: string }> | null,
  rawNamingLinks?: Array<{ namingId?: string; label?: string }> | null,
): ChatGuideLink[] {
  const fromScenes = resolveGuideSceneLinks(
    tour,
    currentSceneId,
    rawSceneLinks,
  );
  const fromNamings = resolveGuideNamingLinks(tour, rawNamingLinks);
  const merged: ChatGuideLink[] = [];
  const seen = new Set<string>();

  for (const link of [...fromScenes, ...fromNamings]) {
    const key =
      link.kind === 'naming' ?
        `naming:${link.namingId}`
      : `scene:${link.sceneId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(link);
    if (merged.length >= MAX_GUIDE_LINKS) return merged;
  }

  if (merged.length > 0) return merged;
  return inferGuideSceneLinksFromText(tour, currentSceneId, reply);
}
