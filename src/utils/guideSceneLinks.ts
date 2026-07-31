import { TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD } from '../constants/tourDirectory';
import {
  namingOpportunityStatusConfig,
  resolveNamingOpportunityStatus,
} from '../data/namingOpportunityStatus';
import type { ChatGuideLink, Hotspot, Scene, Tour } from '../types/tour';
import {
  findNamingHotspotByNamingId,
  listSceneInfoHotspots,
} from './findTourHotspot';
import { formatNamingGalleryItemPrice } from './namingPrice';
import {
  abbreviateNamingBodyLead,
  resolveScenePlaceLead,
} from './resolveScenePlaceLead';
import {
  resolveHotspotNamingRecord,
  resolveNamingPopup,
} from './namingSceneInherit';
import { isNamingVisibleInExplore } from './namingVisibility';
import { buildTourNamingDirectory } from './tourDirectory';
import { isSceneVisibleInExplore } from './sceneVisibility';

/** Place / naming card under an Ask Guide reply. */
export type GuideSceneLink = ChatGuideLink;

/** UI collapses the list after this many cards (Show more / Show less). */
export const GUIDE_LINK_PREVIEW_COUNT = 4;

const GUIDE_CARD_DESC_MAX_CHARS = 140;

function guideLinkKey(link: ChatGuideLink): string {
  return link.kind === 'naming' ?
      `naming:${link.namingId ?? link.hotspotId ?? ''}`
    : `scene:${link.sceneId}`;
}

function normalizeGuideLinkTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dedupe guide cards by id, then by display title.
 * Same title for a place + its inherited naming (e.g. both "Covered Porch")
 * collapses to one card — prefer the scene/place card for navigation.
 */
export function capGuideLinks(links: ChatGuideLink[]): ChatGuideLink[] {
  const byId: ChatGuideLink[] = [];
  const seenId = new Set<string>();
  for (const link of links) {
    const key = guideLinkKey(link);
    if (seenId.has(key)) continue;
    seenId.add(key);
    byId.push(link);
  }

  const out: ChatGuideLink[] = [];
  const indexByTitle = new Map<string, number>();
  for (const link of byId) {
    const titleKey = normalizeGuideLinkTitle(link.title);
    if (!titleKey) {
      out.push(link);
      continue;
    }
    const existingIndex = indexByTitle.get(titleKey);
    if (existingIndex === undefined) {
      indexByTitle.set(titleKey, out.length);
      out.push(link);
      continue;
    }
    const existing = out[existingIndex];
    if (existing && existing.kind === 'naming' && link.kind === 'scene') {
      out[existingIndex] = link;
    }
  }
  return out;
}

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
  if (!isNamingVisibleInExplore(resolveHotspotNamingRecord(tour, hotspot))) {
    return null;
  }

  const priceLabel = formatNamingGalleryItemPrice({
    price: naming.price,
    priceLabel: naming.priceLabel,
  });
  const statusLabel = namingOpportunityStatusConfig(naming.status).label;
  const bodyDesc = guideCardDescription(popup?.body);
  const title =
    label?.trim() || naming.name?.trim() || hotspot.label?.trim() || hotspot.id;
  const placeHint = scene.title?.trim();
  const description =
    bodyDesc ||
    (placeHint && placeHint.toLowerCase() !== title.toLowerCase() ?
      `In ${placeHint}`
    : undefined);

  return {
    kind: 'naming',
    sceneId,
    namingId: hotspot.namingId?.trim() || hotspot.id,
    hotspotId: hotspot.id,
    title,
    description,
    thumbnail:
      hotspot.preview?.image?.trim() ||
      popup?.image?.trim() ||
      scene.thumbnail?.trim() ||
      undefined,
    statusLabel,
    priceLabel: priceLabel || undefined,
    status: resolveNamingOpportunityStatus(naming.status),
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

/**
 * Open / soon naming cards across the tour (Explore-visible).
 * Prefer placements on {@link preferSceneId} when provided.
 */
export function collectOpenNamingGuideLinks(
  tour: Tour,
  options?: { preferSceneId?: string; limit?: number },
): ChatGuideLink[] {
  const limit = Math.max(1, options?.limit ?? GUIDE_LINK_PREVIEW_COUNT);
  const preferSceneId = options?.preferSceneId?.trim();
  const out: ChatGuideLink[] = [];
  const seen = new Set<string>();

  const pushFromScene = (sceneId: string) => {
    const scene = tour.scenes[sceneId];
    if (!scene) return;
    for (const hotspot of listSceneInfoHotspots(tour, scene)) {
      const link = buildNamingLinkFromHotspot(tour, sceneId, hotspot);
      if (!link || link.status === 'sold') continue;
      const key = link.namingId ?? link.hotspotId ?? '';
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(link);
      if (out.length >= limit) return;
    }
  };

  if (preferSceneId) pushFromScene(preferSceneId);
  if (out.length >= limit) return out;

  for (const item of buildTourNamingDirectory(tour)) {
    if (preferSceneId && item.sceneId === preferSceneId) continue;
    const scene = tour.scenes[item.sceneId];
    if (!scene) continue;
    const hotspot = findHotspotOnScene(tour, scene, item.hotspotId);
    if (!hotspot) continue;
    const link = buildNamingLinkFromHotspot(tour, item.sceneId, hotspot);
    if (!link || link.status === 'sold') continue;
    const key = link.namingId ?? link.hotspotId ?? '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(link);
    if (out.length >= limit) break;
  }

  return out;
}

/**
 * Other Explore-visible places (exclude current). Used when an explore question
 * gets a text-only answer with no model sceneLinks.
 */
export function collectOtherAreaGuideLinks(
  tour: Tour,
  currentSceneId: string,
  options?: { limit?: number },
): ChatGuideLink[] {
  const limit = Math.max(1, options?.limit ?? GUIDE_LINK_PREVIEW_COUNT);
  const out: ChatGuideLink[] = [];
  const seenTitles = new Set<string>();

  for (const [id, scene] of Object.entries(tour.scenes)) {
    if (id === currentSceneId) continue;
    if (!isSceneVisibleInExplore(scene)) continue;
    const title = scene.title?.trim();
    if (!title) continue;
    const titleKey = normalizeGuideLinkTitle(title);
    if (titleKey && seenTitles.has(titleKey)) continue;
    if (titleKey) seenTitles.add(titleKey);
    const link = buildSceneLink(tour, id);
    if (!link) continue;
    out.push(link);
    if (out.length >= limit) break;
  }

  return out;
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
  }

  return out;
}

/** Merge model scene + naming links; optionally fall back to text inference. */
export function resolveGuideLinks(
  tour: Tour,
  currentSceneId: string,
  reply: string,
  rawSceneLinks?: Array<{ sceneId?: string; label?: string }> | null,
  rawNamingLinks?: Array<{ namingId?: string; label?: string }> | null,
  options?: { allowTextInference?: boolean },
): ChatGuideLink[] {
  const allowTextInference = options?.allowTextInference !== false;
  const fromScenes = resolveGuideSceneLinks(
    tour,
    currentSceneId,
    rawSceneLinks,
  );
  const fromNamings = resolveGuideNamingLinks(tour, rawNamingLinks);
  const merged: ChatGuideLink[] = [];
  const seen = new Set<string>();

  for (const link of [...fromNamings, ...fromScenes]) {
    const key =
      link.kind === 'naming' ?
        `naming:${link.namingId}`
      : `scene:${link.sceneId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(link);
  }

  if (merged.length > 0) {
    if (!allowTextInference) return capGuideLinks(merged);
    // Model often lists naming names as sceneLinks — still attach naming cards
    // from reply text so interest answers are not place-only.
    const inferredNamings = inferGuideSceneLinksFromText(
      tour,
      currentSceneId,
      reply,
    ).filter((link) => link.kind === 'naming');
    return capGuideLinks([...merged, ...inferredNamings]);
  }

  if (!allowTextInference) return [];
  return inferGuideSceneLinksFromText(tour, currentSceneId, reply);
}

/**
 * When a Place card is really a naming opportunity (same title / scene pin),
 * return the naming card instead.
 */
export function promoteGuideSceneLinkToNaming(
  tour: Tour,
  link: ChatGuideLink,
): ChatGuideLink | null {
  if (link.kind !== 'scene') return null;

  const titleKey = normalizeGuideLinkTitle(link.title);
  if (titleKey) {
    for (const item of buildTourNamingDirectory(tour)) {
      if (normalizeGuideLinkTitle(item.name) !== titleKey) continue;
      const scene = tour.scenes[item.sceneId];
      if (!scene) continue;
      const hotspot = findHotspotOnScene(tour, scene, item.hotspotId);
      if (!hotspot) continue;
      return buildNamingLinkFromHotspot(tour, item.sceneId, hotspot, item.name);
    }
  }

  const scene = tour.scenes[link.sceneId];
  if (!scene || !isSceneVisibleInExplore(scene)) return null;

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    const popup = resolveNamingPopup(tour, hotspot, scene);
    const naming = popup?.namingOpportunity;
    if (!naming) continue;
    if (!isNamingVisibleInExplore(resolveHotspotNamingRecord(tour, hotspot))) {
      continue;
    }
    const status = resolveNamingOpportunityStatus(naming.status);
    if (status === 'sold') continue;
    return buildNamingLinkFromHotspot(tour, link.sceneId, hotspot);
  }

  return null;
}
