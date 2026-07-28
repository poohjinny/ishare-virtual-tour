import {
  namingOpportunityStatusConfig,
  resolveNamingOpportunityPopupCtas,
  resolveNamingOpportunityStatus,
} from '../data/namingOpportunityStatus';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import type { ChatGuideCta, ChatGuideLink, Tour } from '../types/tour';
import { assembleTourContext } from './assembleTourContext';
import { listSceneInfoHotspots } from './findTourHotspot';
import {
  buildCurrentPlaceGuideLink,
  guideCardDescription,
} from './guideSceneLinks';
import { resolveNamingPopup } from './namingSceneInherit';
import { getTourWebsite } from './resolveTourClient';

const MAX_FOLLOW_UPS = 3;
const MAX_GUIDE_CTAS = 2;

export function isWhereAmIQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    q.includes('where am i') ||
    q.includes('current location') ||
    q.includes('어디') ||
    q.includes('지금 여기')
  );
}

/** Interest / how-to-give / purchase intent for naming opportunities. */
export function isNamingInterestQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /\b(buy|purchase|purchasing|how (do|can) i (get|give|donate|support)|interested|interest|pledge|sponsor|claim)\b/.test(
      q,
    ) ||
    /구매|사고\s*싶|관심|후원\s*하|기부\s*하|어떻게\s*(사|구매|후원|기부)/.test(
      question,
    )
  );
}

function normalizeFollowUps(raw: unknown, exclude: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const text = typeof entry === 'string' ? entry.trim() : '';
    if (!text || text.length > 80) continue;
    // Action-y website prompts belong as CTAs, not chat chips.
    if (
      /\b(website|web site|homepage|official site)\b/i.test(text) ||
      /웹사이트|홈페이지/.test(text)
    ) {
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key) || exclude.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= MAX_FOLLOW_UPS) break;
  }

  return out;
}

/** Org / facility / learn-more — when a Website CTA is appropriate. */
export function isWebsiteIntentQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /\b(website|web site|homepage|organization|foundation|learn more|contact (them|the team|us)|who (runs|operates))\b/.test(
      q,
    ) || /웹사이트|홈페이지|재단|기관|더 알아|공식\s*사이트/.test(question)
  );
}

function replyMentions(text: string, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (n.length < 3) return false;
  return text.toLowerCase().includes(n);
}

/**
 * Build follow-ups grounded in the assistant reply + tour entities.
 * Prefer model followUps, then fill from reply-mentioned places/namings.
 */
export function buildGuideFollowUps(options: {
  question: string;
  reply: string;
  tour: Tour;
  sceneId: string;
  modelFollowUps?: string[] | null;
}): string[] {
  const questionKey = options.question.trim().toLowerCase();
  const exclude = new Set<string>(questionKey ? [questionKey] : []);
  const reply = options.reply.trim();
  const replyLower = reply.toLowerCase();
  const ctx = assembleTourContext(options.tour, options.sceneId);
  const candidates: string[] = [];

  const push = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    candidates.push(trimmed);
  };

  // 1) Model suggestions first (already filtered for website-ish chips).
  for (const entry of normalizeFollowUps(options.modelFollowUps, exclude)) {
    push(entry);
  }

  // 2) Namings mentioned in the reply (specific > generic).
  const namings = ctx?.namings ?? [];
  const mentionedNamings = namings.filter((entry) =>
    replyMentions(reply, entry.name),
  );
  const namingPool =
    mentionedNamings.length > 0 ? mentionedNamings
    : (
      isNamingInterestQuestion(options.question) ||
      /\bnaming\b|\bopportunit|\bprice\b|\bavailable\b|후원|네이밍/.test(
        replyLower,
      )
    ) ?
      namings
    : [];

  for (const naming of namingPool.slice(0, 2)) {
    push(`Tell me about ${naming.name}`);
    if (naming.priceLabel) {
      push(`What does ${naming.name} cost?`);
    }
    if (naming.status === 'open') {
      push(`How can I support ${naming.name}?`);
    } else if (naming.status === 'soon') {
      push(`When will ${naming.name} be available?`);
    } else if (naming.status === 'reserved') {
      push(`Is ${naming.name} still available?`);
    }
  }

  // 3) Other places mentioned in the reply.
  const otherAreas = ctx?.otherAreas ?? [];
  const mentionedPlaces = otherAreas.filter((area) =>
    replyMentions(reply, area.title),
  );
  for (const area of mentionedPlaces.slice(0, 2)) {
    push(`Tell me about ${area.title}`);
    push(`How do I get to ${area.title}?`);
  }

  // 4) Topic fallbacks from reply / question — still tied to this place.
  const sceneTitle = ctx?.sceneTitle?.trim();
  if (
    isWhereAmIQuestion(options.question) ||
    /\byou('re| are) (now )?(in|at|on)\b/i.test(reply)
  ) {
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
    push('Where else can I go?');
  }

  if (
    /\b(explore|nearby|other (areas|places)|down the (hall|corridor)|next door)\b/i.test(
      reply,
    )
  ) {
    push('Where else can I go?');
    if (mentionedPlaces[0]) {
      push(`Tell me about ${mentionedPlaces[0].title}`);
    }
  }

  if (isNamingInterestQuestion(options.question) && namingPool[0]) {
    push(`Is ${namingPool[0].name} still available?`);
  }

  if (candidates.length < MAX_FOLLOW_UPS && sceneTitle) {
    if (!questionKey.includes('tell me about this place')) {
      push('Tell me about this place');
    }
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
    push('Where else can I go?');
  }

  return normalizeFollowUps(candidates, exclude);
}

type NamingCtaBundle = {
  hotspotId: string;
  contact: ChatGuideCta | null;
  donate: ChatGuideCta | null;
};

function namingCtasFromPopup(
  tour: Tour,
  hotspotId: string,
  popup: NonNullable<ReturnType<typeof resolveNamingPopup>>,
): NamingCtaBundle {
  let contact: ChatGuideCta | null = null;
  let donate: ChatGuideCta | null = null;

  for (const cta of resolveNamingOpportunityPopupCtas(popup, tour)) {
    const resolved = resolvePopupCta(cta);
    const url = resolved.url?.trim();
    if (!url) continue;

    if (resolved.kind === 'giftabulator' && !donate) {
      donate = {
        id: `donate:${hotspotId}`,
        label: resolved.label || 'Donate',
        url,
        kind: 'donate',
      };
      continue;
    }

    const isContact =
      url.startsWith('mailto:') ||
      /interest|contact|speak|notify|email/i.test(resolved.label);
    if (isContact && !contact && resolved.kind !== 'giftabulator') {
      contact = {
        id: `contact:${hotspotId}`,
        label: resolved.label || 'Express your interest',
        url,
        kind: 'contact',
      };
    }
  }

  return { hotspotId, contact, donate };
}

function firstSceneNamingCtas(
  tour: Tour,
  sceneId: string,
): NamingCtaBundle | null {
  const scene = tour.scenes[sceneId];
  if (!scene) return null;

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    const popup = resolveNamingPopup(tour, hotspot, scene);
    if (!popup?.namingOpportunity) continue;
    const status = resolveNamingOpportunityStatus(
      popup.namingOpportunity.status,
    );
    if (status === 'sold') continue;
    return namingCtasFromPopup(tour, hotspot.id, popup);
  }

  return null;
}

function namingCtasFromGuideLinks(
  tour: Tour,
  links: ChatGuideLink[],
): NamingCtaBundle | null {
  for (const link of links) {
    if (link.kind !== 'naming' || !link.hotspotId) continue;
    const scene = tour.scenes[link.sceneId];
    if (!scene) continue;
    const hotspot =
      scene.hotspots?.find((entry) => entry.id === link.hotspotId) ??
      tour.hotspots?.find((entry) => entry.id === link.hotspotId);
    if (!hotspot) continue;
    const popup = resolveNamingPopup(tour, hotspot, scene);
    if (!popup?.namingOpportunity) continue;
    return namingCtasFromPopup(tour, link.hotspotId, popup);
  }
  return null;
}

/**
 * CTAs from tour data only — never invent URLs.
 * - Interest/purchase: Contact + Donate
 * - Website intent (org / learn more): Website (+ Donate if present)
 * - Otherwise: Donate only when a naming gift CTA exists (no bare Website on every reply)
 */
export function buildGuideCtas(
  tour: Tour,
  sceneId: string,
  guideLinks: ChatGuideLink[] = [],
  question = '',
): ChatGuideCta[] {
  const namingBundle =
    namingCtasFromGuideLinks(tour, guideLinks) ||
    firstSceneNamingCtas(tour, sceneId);

  const websiteUrl = getTourWebsite(tour).trim();
  const websiteCta: ChatGuideCta | null =
    websiteUrl && websiteUrl !== 'https://example.com' ?
      { id: 'website', label: 'Website', url: websiteUrl, kind: 'website' }
    : null;

  if (isNamingInterestQuestion(question)) {
    const out: ChatGuideCta[] = [];
    if (namingBundle?.contact) out.push(namingBundle.contact);
    if (namingBundle?.donate) out.push(namingBundle.donate);
    if (out.length > 0) return out.slice(0, MAX_GUIDE_CTAS);
    return websiteCta ? [websiteCta] : [];
  }

  if (isWebsiteIntentQuestion(question)) {
    const out: ChatGuideCta[] = [];
    if (websiteCta) out.push(websiteCta);
    if (namingBundle?.donate) out.push(namingBundle.donate);
    return out.slice(0, MAX_GUIDE_CTAS);
  }

  return namingBundle?.donate ? [namingBundle.donate] : [];
}

/**
 * Ensure a current-place card for where-am-i questions.
 * Prefers existing scene links; otherwise prepends the current place card.
 */
export function withCurrentPlaceSummaryLink(
  tour: Tour,
  sceneId: string,
  question: string,
  links: ChatGuideLink[],
): ChatGuideLink[] {
  if (!isWhereAmIQuestion(question)) return links;

  const hasCurrent = links.some(
    (link) => link.kind === 'scene' && link.sceneId === sceneId,
  );
  if (hasCurrent) return links;

  const current = buildCurrentPlaceGuideLink(tour, sceneId);
  if (!current) return links;
  return [current, ...links].slice(0, 4);
}

/**
 * For interest/purchase questions, ensure at least one NO card from this scene
 * so View opportunity is available.
 */
export function withInterestNamingLink(
  tour: Tour,
  sceneId: string,
  question: string,
  links: ChatGuideLink[],
): ChatGuideLink[] {
  if (!isNamingInterestQuestion(question)) return links;
  if (links.some((link) => link.kind === 'naming')) return links;

  const scene = tour.scenes[sceneId];
  if (!scene) return links;

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    const popup = resolveNamingPopup(tour, hotspot, scene);
    const naming = popup?.namingOpportunity;
    if (!naming) continue;
    const status = resolveNamingOpportunityStatus(naming.status);
    if (status === 'sold') continue;

    const statusConfig = namingOpportunityStatusConfig(status);
    const link: ChatGuideLink = {
      kind: 'naming',
      sceneId,
      namingId: hotspot.namingId?.trim() || hotspot.id,
      hotspotId: hotspot.id,
      title: naming.name?.trim() || hotspot.label?.trim() || hotspot.id,
      description: guideCardDescription(popup.body),
      thumbnail:
        hotspot.preview?.image?.trim() ||
        popup.image?.trim() ||
        scene.thumbnail?.trim() ||
        undefined,
      statusLabel: statusConfig.label,
      priceLabel: naming.priceLabel?.trim() || undefined,
    };
    return [link, ...links].slice(0, 4);
  }

  return links;
}
