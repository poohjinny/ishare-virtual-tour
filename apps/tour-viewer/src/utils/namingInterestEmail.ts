import { ISHARE_VIRTUAL_TOUR_NAME } from '../constants/branding';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import type {
  Hotspot,
  NamingOpportunity,
  PopupContent,
  Tour,
} from '../types/tour';
import {
  findNamingHotspotByNamingId,
  listSceneInfoHotspots,
} from './findTourHotspot';
import { buildGmailComposeUrl } from './gmailCompose';
import { isDefaultNamingDescription } from './namingDescriptionPlaceholder';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  resolveNamingShareSceneId,
  toNamingOpportunitySearchValue,
} from './namingOpportunityUrl';
import { formatNamingGalleryItemPrice } from './namingPrice';
import { isNamingHotspot, resolveNamingPopup } from './namingSceneInherit';
import { buildTourLocation } from './tourPaths';

interface NamingInterestContext {
  tourTitle: string;
  namingName: string;
  sceneTitle?: string | null;
  priceLabel?: string | null;
  statusLabel?: string | null;
  detailText?: string | null;
  shareUrl?: string | null;
}

interface NamingPlacement {
  sceneId: string;
  hotspot: Hotspot;
}

export interface NamingInterestEmailOptions {
  statusLabel?: string | null;
  popup?: PopupContent | null;
}

function metaBits(context: NamingInterestContext): string[] {
  return [context.statusLabel?.trim(), context.priceLabel?.trim()].filter(
    (value): value is string => Boolean(value),
  );
}

function metaParen(context: NamingInterestContext): string {
  const bits = metaBits(context);
  return bits.length ? ` (${bits.join(' · ')})` : '';
}

function namingMatches(
  candidate: NamingOpportunity | undefined,
  naming: NamingOpportunity,
): boolean {
  if (!candidate) return false;
  return (
    candidate.name.trim().toLowerCase() === naming.name.trim().toLowerCase() &&
    candidate.price === naming.price &&
    (candidate.status ?? 'open') === (naming.status ?? 'open')
  );
}

function findNamingPlacement(
  tour: Tour,
  naming: NamingOpportunity,
): NamingPlacement | null {
  if (!naming.name.trim()) return null;

  for (const record of Object.values(tour.namingOpportunities ?? {})) {
    const found = findNamingHotspotByNamingId(tour, record.id);
    if (!found) continue;
    const scene = tour.scenes[found.sceneId];
    const popup = resolveNamingPopup(tour, found.hotspot, scene);
    if (namingMatches(popup?.namingOpportunity, naming)) {
      return { sceneId: found.sceneId, hotspot: found.hotspot };
    }
  }

  for (const scene of Object.values(tour.scenes)) {
    for (const hotspot of listSceneInfoHotspots(tour, scene)) {
      if (!isNamingHotspot(hotspot)) continue;
      const popup = resolveNamingPopup(tour, hotspot, scene);
      if (namingMatches(popup?.namingOpportunity, naming)) {
        return { sceneId: scene.id, hotspot };
      }
    }
  }

  return null;
}

function buildAbsoluteTourUrl(relative: string): string {
  const pathOnly = relative.startsWith('/') ? relative.slice(1) : relative;
  const base = import.meta.env.BASE_URL;
  const urlPath = `${base}${pathOnly}`.replace(/([^:]\/)\/+/g, '$1');
  return new URL(urlPath, resolveTourPublicOrigin()).href;
}

function buildInterestShareUrl(
  tour: Tour,
  sceneId: string,
  hotspotId: string,
): string {
  const shareSceneId = resolveNamingShareSceneId(tour, sceneId, hotspotId);
  const relative = buildTourLocation(
    tour.id,
    shareSceneId,
    tour.firstScene,
    new URLSearchParams(),
    {
      [NAMING_OPPORTUNITY_SEARCH_KEY]: toNamingOpportunitySearchValue(
        tour,
        hotspotId,
      ),
    },
  );
  return buildAbsoluteTourUrl(relative);
}

function resolveDetailText(
  tourTitle: string,
  namingName: string,
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const detail = candidate?.trim() || '';
    if (detail && !isDefaultNamingDescription(detail, namingName, tourTitle)) {
      return detail;
    }
  }
  return null;
}

function resolveInterestContext(
  tour: Tour,
  naming: NamingOpportunity,
  options?: NamingInterestEmailOptions,
): NamingInterestContext {
  const tourTitle = tour.title.trim() || 'this facility';
  const namingName = naming.name.trim();
  const placement = findNamingPlacement(tour, naming);
  const scene = placement ? tour.scenes[placement.sceneId] : undefined;
  const resolvedPopup =
    placement && scene ?
      resolveNamingPopup(tour, placement.hotspot, scene)
    : null;
  const resolvedNaming = resolvedPopup?.namingOpportunity ?? naming;
  const priceLabel =
    formatNamingGalleryItemPrice({
      price: resolvedNaming.price,
      priceLabel: resolvedNaming.priceLabel,
    }) || null;

  return {
    tourTitle,
    namingName,
    sceneTitle: scene?.title?.trim() || null,
    priceLabel,
    statusLabel: options?.statusLabel?.trim() || null,
    detailText: resolveDetailText(
      tourTitle,
      namingName,
      options?.popup?.body,
      resolvedPopup?.body,
    ),
    shareUrl:
      placement ?
        buildInterestShareUrl(tour, placement.sceneId, placement.hotspot.id)
      : null,
  };
}

function placePhrase(context: NamingInterestContext): string {
  const scene = context.sceneTitle?.trim();
  if (scene) return `${context.namingName} in ${scene}`;
  return context.namingName;
}

export function buildNamingInquiryEmailSubject(
  context: NamingInterestContext,
): string {
  const meta = metaBits(context).join(', ');
  return meta ?
      `Express interest: ${context.namingName} (${meta}) — ${context.tourTitle} virtual tour`
    : `Express interest: ${context.namingName} — ${context.tourTitle} virtual tour`;
}

export function buildNamingInquiryEmailBody(
  context: NamingInterestContext,
): string {
  const lines = [
    'Hello,',
    '',
    `I am reaching out from the ${context.tourTitle} virtual tour. I would like to express my interest in the naming opportunity ${placePhrase(context)}${metaParen(context)}, and would be grateful if your team could follow up with more information.`,
  ];
  if (context.detailText) {
    lines.push('', context.detailText);
  }
  if (context.shareUrl) {
    lines.push('', 'You can view the same opportunity here:', context.shareUrl);
  }
  lines.push(
    '',
    'Thank you for your time.',
    '',
    '—',
    `This message was sent via Express interest on the ${context.tourTitle} virtual tour (${ISHARE_VIRTUAL_TOUR_NAME}).`,
  );
  return lines.join('\n');
}

export function buildNamingNotifyEmailSubject(
  context: NamingInterestContext,
): string {
  return `Notify me: ${context.namingName} — ${context.tourTitle} virtual tour`;
}

export function buildNamingNotifyEmailBody(
  context: NamingInterestContext,
): string {
  const lines = [
    'Hello,',
    '',
    `I am reaching out from the ${context.tourTitle} virtual tour. Please notify me if the naming opportunity ${placePhrase(context)}${metaParen(context)} becomes available.`,
  ];
  if (context.shareUrl) {
    lines.push('', 'You can view the opportunity here:', context.shareUrl);
  }
  lines.push(
    '',
    'Name:',
    'Email:',
    'Phone (optional):',
    '',
    'Thank you for your time.',
    '',
    '—',
    `This message was sent via Notify me on the ${context.tourTitle} virtual tour (${ISHARE_VIRTUAL_TOUR_NAME}).`,
  );
  return lines.join('\n');
}

export function buildNamingInquiryComposeUrl(
  to: string,
  tour: Tour,
  naming: NamingOpportunity,
  options?: NamingInterestEmailOptions,
): string {
  const context = resolveInterestContext(tour, naming, options);
  return buildGmailComposeUrl({
    to,
    subject: buildNamingInquiryEmailSubject(context),
    body: buildNamingInquiryEmailBody(context),
  });
}

export function buildNamingNotifyComposeUrl(
  to: string,
  tour: Tour,
  naming: NamingOpportunity,
  options?: NamingInterestEmailOptions,
): string {
  const context = resolveInterestContext(tour, naming, options);
  return buildGmailComposeUrl({
    to,
    subject: buildNamingNotifyEmailSubject(context),
    body: buildNamingNotifyEmailBody(context),
  });
}
