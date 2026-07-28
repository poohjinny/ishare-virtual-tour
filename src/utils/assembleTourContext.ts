/**
 * Runtime AI context from canonical tour + catalog data (assemble-only).
 */

import { findCatalogTour } from '../data/tourCatalog';
import {
  namingOpportunityStatusConfig,
  resolveNamingOpportunityStatus,
} from '../data/namingOpportunityStatus';
import type { NamingOpportunityStatus, Scene, Tour } from '../types/tour';
import { getTourClientId } from './tourClientId';
import {
  listSceneInfoHotspots,
  findNamingHotspotInTour,
} from './findTourHotspot';
import { formatNamingPriceDisplay } from './namingPrice';
import {
  resolveHotspotNamingOpportunity,
  resolveHotspotNamingRecord,
  resolveNamingPopup,
} from './namingSceneInherit';
import { isNamingVisibleInExplore } from './namingVisibility';
import { resolveScenePlaceLead } from './resolveScenePlaceLead';
import { getTourWebsite, resolveTourClient } from './resolveTourClient';
import { buildTourNamingDirectory } from './tourDirectory';
import { isSceneVisibleInExplore } from './sceneVisibility';

export interface AssembledNamingContext {
  id: string;
  name: string;
  status: NamingOpportunityStatus;
  statusLabel: string;
  priceLabel: string;
  body: string;
}

export interface AssembledTourContext {
  tourId: string;
  tourTitle: string;
  clientName: string;
  websiteUrl: string;
  /** Catalog tour summary when set — facility / tour overview. */
  facilitySummary: string;
  sceneId: string;
  sceneTitle: string;
  /** Visitor-facing place copy (description or abbreviated first public NO body). */
  placeCopy: string;
  /** Raw scene.description when set (may be empty). */
  sceneDescription: string;
  /** Other areas in this tour — id + title for interactive place links. */
  otherAreas: Array<{ id: string; title: string }>;
  /**
   * Tour-wide naming catalog for Ask Guide links —
   * `id | name | sceneTitle | status` (current scene namings stay in `namings`).
   */
  tourNamings: Array<{
    id: string;
    name: string;
    sceneId: string;
    sceneTitle: string;
    statusLabel: string;
  }>;
  namings: AssembledNamingContext[];
  suggestedQuestions: string[];
}

function listSceneNamings(tour: Tour, scene: Scene): AssembledNamingContext[] {
  const namings: AssembledNamingContext[] = [];
  const seen = new Set<string>();

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    if (!isNamingVisibleInExplore(resolveHotspotNamingRecord(tour, hotspot))) {
      continue;
    }
    const resolved = resolveHotspotNamingOpportunity(tour, hotspot, scene);
    if (!resolved) continue;

    const popup = resolveNamingPopup(tour, hotspot, scene);
    const namingId = hotspot.namingId?.trim() || `legacy:${hotspot.id}`;
    if (seen.has(namingId)) continue;
    seen.add(namingId);

    const status = resolveNamingOpportunityStatus(resolved.status);
    const priceLabel =
      resolved.priceLabel?.trim() || formatNamingPriceDisplay(resolved.price);

    namings.push({
      id: namingId,
      name: resolved.name,
      status,
      statusLabel: namingOpportunityStatusConfig(status).label,
      priceLabel,
      body: popup?.body?.trim() || '',
    });
  }

  return namings;
}

function buildSuggestedQuestions(namings: AssembledNamingContext[]): string[] {
  const questions = ['Tell me about this place'];

  const openNamings = namings.filter((entry) => entry.status === 'open');
  if (openNamings.length > 0) {
    questions.push('What naming opportunities are available in this place?');
    const first = openNamings[0];
    if (first) {
      questions.push(`Tell me about ${first.name}`);
    }
  } else if (namings.length > 0) {
    questions.push('What naming opportunities are in this place?');
  }

  questions.push('Where am I?');
  return questions.slice(0, 4);
}

function listOtherAreas(
  tour: Tour,
  currentSceneId: string,
): Array<{ id: string; title: string }> {
  const areas: Array<{ id: string; title: string }> = [];
  const seenTitles = new Set<string>();
  for (const [id, scene] of Object.entries(tour.scenes)) {
    if (id === currentSceneId) continue;
    if (!isSceneVisibleInExplore(scene)) continue;
    const title = scene.title?.trim();
    if (!title || seenTitles.has(title)) continue;
    seenTitles.add(title);
    areas.push({ id, title });
    if (areas.length >= 24) break;
  }
  return areas;
}

function listTourNamingsForGuide(
  tour: Tour,
): AssembledTourContext['tourNamings'] {
  const out: AssembledTourContext['tourNamings'] = [];
  const seen = new Set<string>();

  for (const item of buildTourNamingDirectory(tour)) {
    const found = findNamingHotspotInTour(tour, item.hotspotId);
    const namingId = found?.hotspot.namingId?.trim() || item.hotspotId;
    if (seen.has(namingId)) continue;
    seen.add(namingId);
    out.push({
      id: namingId,
      name: item.name,
      sceneId: item.sceneId,
      sceneTitle: item.sceneTitle,
      statusLabel: item.statusLabel,
    });
    if (out.length >= 40) break;
  }

  return out;
}

function resolveFacilitySummary(tour: Tour): string {
  return findCatalogTour(getTourClientId(tour), tour.id)?.summary?.trim() || '';
}

/** Assemble assistant context for a scene from tour + naming + catalog. */
export function assembleTourContext(
  tour: Tour,
  sceneId: string,
): AssembledTourContext | null {
  const scene = tour.scenes[sceneId];
  if (!scene) return null;

  const sceneTitle = scene.title?.trim() || sceneId;
  const namings = listSceneNamings(tour, scene);
  const placeCopy = resolveScenePlaceLead(tour, scene);
  const client = resolveTourClient(tour);

  return {
    tourId: tour.id,
    tourTitle: tour.title?.trim() || tour.id,
    clientName: client?.name?.trim() || '',
    websiteUrl: getTourWebsite(tour),
    facilitySummary: resolveFacilitySummary(tour),
    sceneId,
    sceneTitle,
    placeCopy,
    sceneDescription: scene.description?.trim() || '',
    otherAreas: listOtherAreas(tour, sceneId),
    tourNamings: listTourNamingsForGuide(tour),
    namings,
    suggestedQuestions: buildSuggestedQuestions(namings),
  };
}
