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
  capGuideLinks,
  guideCardDescription,
  promoteGuideSceneLinkToNaming,
} from './guideSceneLinks';
import { resolveNamingPopup } from './namingSceneInherit';
import { getTourWebsite, resolveTourClient } from './resolveTourClient';

const MAX_FOLLOW_UPS = 4;
const MAX_GUIDE_CTAS = 3;

/** Visible follow-up chips before “Show more”. */
export const FOLLOW_UP_PREVIEW_COUNT = 2;

export function isWhereAmIQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    q.includes('where am i') ||
    q.includes('current location') ||
    q.includes('어디') ||
    q.includes('지금 여기')
  );
}

/** Interest / how-to-give / purchase / browse naming opportunities. */
export function isNamingInterestQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /\b(buy|purchase|purchasing|how (do|can) i (get|give|donate|support)|interested|interest|pledge|sponsor|claim)\b/.test(
      q,
    ) ||
    /\bnaming opportunit|\bnamings?\b|\bexpress(ing)? (my |your )?interest\b/.test(
      q,
    ) ||
    /구매|사고\s*싶|관심|후원\s*하|기부\s*하|어떻게\s*(사|구매|후원|기부)|네이밍|후원\s*기회/.test(
      question,
    )
  );
}

/** Where else / directions / nearby places. */
export function isExplorePlacesQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /\b(where else|how (do|can) i (get|go|reach)|directions?|nearby|other (areas?|places?|rooms?)|take me to|show me (around|other))\b/.test(
      q,
    ) || /어디\s*(로|갈)|다른\s*(곳|장소|공간)|근처|길\s*찾/.test(question)
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

/** Email / phone / how-to-reach — show catalog contact details. */
export function isContactInfoQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /\b(contact|email|e-mail|phone|telephone|tel\b|call|reach|get in touch|how (do|can) i (contact|reach|email|call))\b/.test(
      q,
    ) || /연락|이메일|전화|문의|컨택/.test(question)
  );
}

function clientEmailContactCta(tour: Tour): ChatGuideCta | null {
  const email = resolveTourClient(tour)?.email?.trim();
  if (!email) return null;
  return {
    id: 'contact:client',
    label: 'Email',
    url: `mailto:${email}`,
    kind: 'contact',
  };
}

function replyMentions(text: string, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (n.length < 3) return false;
  return text.toLowerCase().includes(n);
}

function collectTourPlaceTitles(tour: Tour, currentSceneId: string): string[] {
  const titles: string[] = [];
  for (const [id, scene] of Object.entries(tour.scenes)) {
    const title = scene.title?.trim();
    if (!title || title.length < 3) continue;
    if (id === currentSceneId) continue;
    titles.push(title);
  }
  return titles;
}

/**
 * Drop follow-ups that name other tour places/namings outside the grounded set.
 * Generic “this place / naming / where else” questions stay.
 */
function isFollowUpGrounded(
  text: string,
  allowedNames: string[],
  foreignNames: string[],
): boolean {
  const lower = text.toLowerCase();
  for (const name of foreignNames) {
    const n = name.trim().toLowerCase();
    if (n.length < 3) continue;
    if (!lower.includes(n)) continue;
    const allowed = allowedNames.some(
      (entry) => entry.trim().toLowerCase() === n,
    );
    if (!allowed) return false;
  }
  return true;
}

/**
 * Build follow-ups grounded in the assistant reply + current place.
 * Prefer model followUps (filtered), then fill from reply-mentioned / current-place entities only.
 */
export function buildGuideFollowUps(options: {
  question: string;
  reply: string;
  tour: Tour;
  sceneId: string;
  modelFollowUps?: string[] | null;
  /** Card titles from this turn — also count as grounded. */
  guideLinks?: ChatGuideLink[] | null;
}): string[] {
  const questionKey = options.question.trim().toLowerCase();
  const exclude = new Set<string>(questionKey ? [questionKey] : []);
  const reply = options.reply.trim();
  const replyLower = reply.toLowerCase();
  const ctx = assembleTourContext(options.tour, options.sceneId);
  const sceneTitle = ctx?.sceneTitle?.trim() ?? '';
  const namings = ctx?.namings ?? [];
  const otherAreas = ctx?.otherAreas ?? [];

  const mentionedNamings = namings.filter((entry) =>
    replyMentions(reply, entry.name),
  );
  const mentionedPlaces = otherAreas.filter((area) =>
    replyMentions(reply, area.title),
  );

  const allowedNames = [
    sceneTitle,
    ...namings.map((entry) => entry.name),
    ...mentionedPlaces.map((area) => area.title),
    ...(options.guideLinks ?? [])
      .filter((link) => link.kind === 'naming')
      .map((link) => link.title?.trim())
      .filter((title): title is string => Boolean(title && title.length >= 3)),
  ].filter(Boolean);

  const foreignNames = [
    ...collectTourPlaceTitles(options.tour, options.sceneId),
    ...(ctx?.tourNamings ?? [])
      .map((entry) => entry.name)
      .filter((name) => {
        const key = name.trim().toLowerCase();
        return (
          key.length >= 3 &&
          !namings.some((local) => local.name.trim().toLowerCase() === key)
        );
      }),
  ];

  const candidates: string[] = [];
  const push = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!isFollowUpGrounded(trimmed, allowedNames, foreignNames)) return;
    candidates.push(trimmed);
  };

  // 1) Model suggestions — keep only grounded ones.
  for (const entry of normalizeFollowUps(options.modelFollowUps, exclude)) {
    push(entry);
  }

  // 2) Current-place / reply-mentioned namings only (no tour-wide wander).
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

  // 3) Other places only when the reply actually named them.
  for (const area of mentionedPlaces.slice(0, 2)) {
    push(`Tell me about ${area.title}`);
    push(`How do I get to ${area.title}?`);
  }

  // 4) Light current-place fallbacks — avoid stuffing unrelated rooms.
  const wantsLocalExplore =
    isWhereAmIQuestion(options.question) ||
    /\byou('re| are) (now )?(in|at|on)\b/i.test(reply) ||
    /\b(explore|nearby|other (areas|places)|down the (hall|corridor)|next door)\b/i.test(
      reply,
    );

  if (wantsLocalExplore) {
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
    push('Where else can I go?');
  }

  if (isNamingInterestQuestion(options.question) && namingPool[0]) {
    push(`Is ${namingPool[0].name} still available?`);
  }

  if (candidates.length < 2 && sceneTitle) {
    if (!questionKey.includes('tell me about this place')) {
      push('Tell me about this place');
    }
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
  }

  return normalizeFollowUps(candidates, exclude);
}

/** Local follow-ups after a place move or naming open (no model call). */
export function buildNavContextFollowUps(options: {
  tour: Tour;
  sceneId: string;
  kind: 'scene' | 'naming';
  namingName?: string;
}): string[] {
  const ctx = assembleTourContext(options.tour, options.sceneId);
  const namings = ctx?.namings ?? [];
  const namingName = options.namingName?.trim();
  const candidates: string[] = [];

  const push = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    candidates.push(trimmed);
  };

  if (options.kind === 'naming') {
    if (namingName) {
      push(`How can I support ${namingName}?`);
      push(`Tell me more about ${namingName}`);
      push(`What does ${namingName} cost?`);
    } else {
      push('How do I express interest?');
    }
    push('Tell me about this place');
  } else {
    push('Tell me about this place');
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
    push('Where else can I go?');
  }

  return normalizeFollowUps(candidates, new Set());
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
 * - Website / contact-info intent: Website + catalog Email (+ Donate if present)
 * - Naming card in the reply: Donate for that opportunity
 * - Otherwise: no Giftabulator/donate on generic chat (e.g. "hi")
 */
export function buildGuideCtas(
  tour: Tour,
  sceneId: string,
  guideLinks: ChatGuideLink[] = [],
  question = '',
): ChatGuideCta[] {
  const linkNamingBundle = namingCtasFromGuideLinks(tour, guideLinks);
  const namingBundle = linkNamingBundle || firstSceneNamingCtas(tour, sceneId);

  const websiteUrl = getTourWebsite(tour).trim();
  const websiteCta: ChatGuideCta | null =
    websiteUrl && websiteUrl !== 'https://example.com' ?
      { id: 'website', label: 'Website', url: websiteUrl, kind: 'website' }
    : null;
  const clientContact = clientEmailContactCta(tour);

  if (isNamingInterestQuestion(question)) {
    const out: ChatGuideCta[] = [];
    if (namingBundle?.contact) out.push(namingBundle.contact);
    else if (clientContact) out.push(clientContact);
    if (namingBundle?.donate) out.push(namingBundle.donate);
    if (out.length > 0) return out.slice(0, MAX_GUIDE_CTAS);
    return websiteCta ? [websiteCta] : [];
  }

  if (isContactInfoQuestion(question) || isWebsiteIntentQuestion(question)) {
    const out: ChatGuideCta[] = [];
    if (websiteCta) out.push(websiteCta);
    if (clientContact) out.push(clientContact);
    else if (namingBundle?.contact) out.push(namingBundle.contact);
    if (namingBundle?.donate && out.length < MAX_GUIDE_CTAS) {
      out.push(namingBundle.donate);
    }
    return out.slice(0, MAX_GUIDE_CTAS);
  }

  return linkNamingBundle?.donate ? [linkNamingBundle.donate] : [];
}

/**
 * Where-am-i: only the current place card (no nearby/naming extras).
 * Nearby places belong on “where else” / directions answers.
 */
export function withCurrentPlaceSummaryLink(
  tour: Tour,
  sceneId: string,
  question: string,
  links: ChatGuideLink[],
): ChatGuideLink[] {
  if (!isWhereAmIQuestion(question)) return links;

  const current = buildCurrentPlaceGuideLink(tour, sceneId);
  return current ? [current] : links;
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
      status,
    };
    return capGuideLinks([link, ...links]);
  }

  return links;
}

/**
 * Keep cards aligned to the question: naming Q → NO cards; explore Q → places;
 * otherwise naming cards first when both kinds are present.
 */
export function shapeGuideLinksForQuestion(
  tour: Tour,
  question: string,
  links: ChatGuideLink[],
): ChatGuideLink[] {
  if (links.length === 0) return links;
  if (isWhereAmIQuestion(question)) return links;

  if (isNamingInterestQuestion(question)) {
    const namings: ChatGuideLink[] = [];
    for (const link of links) {
      if (link.kind === 'naming') {
        namings.push(link);
        continue;
      }
      const promoted = promoteGuideSceneLinkToNaming(tour, link);
      if (promoted) namings.push(promoted);
    }
    return capGuideLinks(namings);
  }

  if (isExplorePlacesQuestion(question)) {
    return links.filter((link) => link.kind === 'scene');
  }

  const namings = links.filter((link) => link.kind === 'naming');
  const places = links.filter((link) => link.kind === 'scene');
  if (namings.length > 0 && places.length > 0) {
    return [...namings, ...places];
  }
  return links;
}
