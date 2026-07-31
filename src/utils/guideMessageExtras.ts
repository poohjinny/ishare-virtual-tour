import { resolveNamingOpportunityPopupCtas } from '../data/namingOpportunityStatus';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import type { ChatGuideCta, ChatGuideLink, Tour } from '../types/tour';
import { assembleTourContext } from './assembleTourContext';
import { listSceneInfoHotspots } from './findTourHotspot';
import {
  buildCurrentPlaceGuideLink,
  capGuideLinks,
  collectOpenNamingGuideLinks,
  collectOtherAreaGuideLinks,
  GUIDE_LINK_PREVIEW_COUNT,
  promoteGuideSceneLinkToNaming,
} from './guideSceneLinks';
import { resolveNamingPopup } from './namingSceneInherit';
import { getTourWebsite, resolveTourClient } from './resolveTourClient';

const MAX_FOLLOW_UPS = 6;
const MAX_GUIDE_CTAS = 3;

/** Visible follow-up questions before “Show more”. */
export const FOLLOW_UP_PREVIEW_COUNT = 3;

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

/**
 * “Express your interest” / how-to-support — not mere naming browse
 * (“what naming opportunities are here?”).
 */
export function isExpressInterestIntent(question: string, reply = ''): boolean {
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim();
  const r = reply.toLowerCase().replace(/\s+/g, ' ').trim();
  if (
    /\b(buy|purchase|purchasing|how (do|can) i (get|give|donate|support)|interested|interest|pledge|sponsor|claim)\b/.test(
      q,
    ) ||
    /\bexpress(ing)? (my |your )?interest\b/.test(q) ||
    /구매|사고\s*싶|관심\s*(있|표|등록)|후원\s*하|기부\s*하|어떻게\s*(사|구매|후원|기부)/.test(
      question,
    )
  ) {
    return true;
  }
  // Model invited them to express interest / contact the foundation about naming.
  return (
    /\bexpress(ing)? (your |my )?interest\b/.test(r) ||
    /\b(use|tap|click|choose)\b.{0,48}\bexpress your interest\b/.test(r) ||
    /\bcontact the foundation\b.{0,40}\b(naming|interest|support)\b/.test(r) ||
    /\b(naming|opportunity)\b.{0,48}\b(express interest|get in touch|reach out)\b/.test(
      r,
    )
  );
}

/** Where else / directions / nearby / what to explore — show place cards. */
export function isExplorePlacesQuestion(question: string): boolean {
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim();
  return (
    /\b(where else|how (do|can) i (get|go|reach)|directions?|nearby|other (areas?|places?|rooms?)|take me to|get me to|show me (around|other)|what (can|should) i (explore|see|visit|enjoy|tour)|what (to|can i) (explore|see|visit|enjoy|tour)|what (places?|areas?|rooms?) (can|should|do) i (explore|see|visit|enjoy|tour)|which (places?|areas?|rooms?) (can|should|do) i (explore|see|visit|enjoy|tour)|places? (to|i can) (explore|visit|see|enjoy|tour)|recommend .{0,24}(place|area|room|spot)|where (can|should) i (go|explore|visit))\b/.test(
      q,
    ) ||
    /\b((any|some) more\b|do you have more|have more|anything else|what else|other options?|more (places|areas|rooms|options|spots))\b/.test(
      q,
    ) ||
    /\bi want to (see|visit|go|explore|tour)\b/.test(q) ||
    /\b(show|take) me (around|there|to)\b/.test(q) ||
    /어디\s*(로|갈)|다른\s*(곳|장소|공간)|근처|길\s*찾|둘러\s*볼|가\s*볼\s*만|추천|더\s*있|또\s*있|투어\s*(할|가능)|어디\s*둘러/.test(
      question,
    )
  );
}

/**
 * Hours / schedule / visiting policy — facts this tour context usually lacks.
 * Prefer a short refusal + empty place cards (don’t invent “typically open”).
 */
export function isFactualGapQuestion(question: string): boolean {
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!q) return false;
  return (
    /\b(hours?|opening hours|visiting hours|operating hours|schedule|timetable)\b/.test(
      q,
    ) ||
    /\bwhen (is|are|does|do|will|was|were)\b.{0,48}\b(open|opened|close|closed|closing)\b/.test(
      q,
    ) ||
    /\b(open|opened|close|closed)\b.{0,32}\b(when|what time|hours?)\b/.test(
      q,
    ) ||
    /\bwhat time\b/.test(q) ||
    /\bis (it|the .{0,40}) open\b/.test(q) ||
    // Incomplete “when will/is … house?” without open/hours still implies schedule.
    /\bwhen (is|are|will|was|were)\b.{0,64}\b(house|facility|building)\b/.test(
      q,
    ) ||
    /몇\s*시|운영\s*시간|방문\s*시간|언제\s*(열어|열고|여|닫)/.test(question)
  );
}

/** Reply admits a missing fact / points to reception — don’t attach place cards. */
export function isUncertainGuideReply(reply: string): boolean {
  const t = reply.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return (
    /\bi don'?t have\b/.test(t) ||
    /\bi do not have\b/.test(t) ||
    /\bi'?m not (sure|certain)\b/.test(t) ||
    /\bi am not (sure|certain)\b/.test(t) ||
    /\bnot (sure|certain) (about|of|whether)\b/.test(t) ||
    /\bdon'?t have (specific|that|this|exact|enough|the)\b/.test(t) ||
    /\black (that |the |specific |enough )?information\b/.test(t) ||
    /\bnot (listed|available) in (this|the) tour\b/.test(t) ||
    /\bi (can'?t|cannot) (find|confirm|verify)\b/.test(t) ||
    /\bask (at |the )?(reception|front desk|foundation team)\b/.test(t) ||
    /\bfoundation team at (the )?reception\b/.test(t) ||
    /\breception (desk|would|can|will) (be )?happy\b/.test(t) ||
    /정보가\s*없|잘\s*모르|확실하(지|진)\s*않|리셉션|안내\s*데스크/.test(reply)
  );
}

function normalizePlaceMatchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Visitor named a tour place as the message (e.g. “communal space”, “the gazebo”).
 * Used so a destination choice still gets a tappable go-card.
 */
export function matchTourPlaceSceneIdsFromQuestion(
  tour: Tour,
  question: string,
): string[] {
  const q = normalizePlaceMatchText(question);
  if (q.length < 3) return [];

  const candidates: Array<{ sceneId: string; titleNorm: string; len: number }> =
    [];
  for (const [sceneId, scene] of Object.entries(tour.scenes)) {
    const title = scene.title?.trim();
    if (!title || title.length < 3) continue;
    const titleNorm = normalizePlaceMatchText(title);
    if (titleNorm.length < 3) continue;
    candidates.push({ sceneId, titleNorm, len: titleNorm.length });
  }
  candidates.sort((a, b) => b.len - a.len);

  const matched: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.sceneId)) continue;
    const { titleNorm, len } = candidate;
    const compactChoice =
      q === titleNorm ||
      q === `the ${titleNorm}` ||
      q === `go ${titleNorm}` ||
      q === `go to ${titleNorm}` ||
      q === `visit ${titleNorm}` ||
      q === `see ${titleNorm}`;
    const namedInShort =
      q.length <= len + 16 && (q.includes(titleNorm) || titleNorm.includes(q));
    const namedInSentence = len >= 5 && q.includes(titleNorm);
    if (!compactChoice && !namedInShort && !namedInSentence) continue;
    // Avoid tiny title substrings in long free chat.
    if (!compactChoice && len < 5 && q.length > len + 4) continue;
    seen.add(candidate.sceneId);
    matched.push(candidate.sceneId);
  }
  return matched;
}

/** Short place-name messages — prefer that place’s card only. */
export function isPrimarilyPlaceChoiceQuestion(
  question: string,
  matchedSceneIds: string[],
): boolean {
  if (matchedSceneIds.length === 0) return false;
  const q = normalizePlaceMatchText(question);
  return q.length > 0 && q.length <= 48 && matchedSceneIds.length <= 2;
}

/**
 * Detail / go-to questions about a place or naming — cards help open that entity.
 * Keep narrow so chitchat (“hahaha”, “thanks”) never becomes a card turn.
 */
export function isGuideEntityQuestion(question: string): boolean {
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!q) return false;
  return (
    /\btell me about\b/.test(q) ||
    /\b(how (do|can) i get to|take me to|go to|visit)\b/.test(q) ||
    /\bi want to (see|visit|go|explore)\b/.test(q) ||
    /\bwhat (is|are|does|do)\b.{0,48}\b(room|space|area|suite|naming|opportunit|price|cost)\b/.test(
      q,
    ) ||
    /\b(price|cost|status) of\b/.test(q) ||
    /\bis .{0,40}\b(available|open|sold|reserved)\b/.test(q) ||
    /알려\s*줘|설명해|어때요?|가\s*고\s*싶|가격|비용/.test(question)
  );
}

/**
 * Opt-in: attach place/naming cards only when the visitor's question needs them.
 * Model sceneLinks alone are not enough (avoids leftover links on chitchat turns).
 */
export function shouldAttachGuideLinks(
  question: string,
  reply: string,
  options?: { tour?: Tour },
): boolean {
  if (isWhereAmIQuestion(question)) return true;
  // Place / naming browse intent wins even when the model hedges
  // (“ask the foundation”, “none here”) — cards still come from tour data.
  if (
    isExplorePlacesQuestion(question) ||
    isNamingInterestQuestion(question) ||
    isGuideEntityQuestion(question)
  ) {
    return true;
  }
  if (isFactualGapQuestion(question) || isUncertainGuideReply(reply)) {
    return false;
  }
  if (options?.tour) {
    return (
      matchTourPlaceSceneIdsFromQuestion(options.tour, question).length > 0
    );
  }
  return false;
}

/**
 * Whether client-side title matching may invent place/naming cards from prose.
 * Same opt-in as cards — never scrape names on low-intent turns.
 */
export function shouldInferGuideLinksFromText(
  question: string,
  reply: string,
  _hasModelLinks = false,
  options?: { tour?: Tour },
): boolean {
  return shouldAttachGuideLinks(question, reply, options);
}

/**
 * Inverse of {@link shouldAttachGuideLinks} — kept for existing call sites.
 */
export function shouldSuppressGuideLinks(
  question: string,
  reply: string,
  options?: { tour?: Tour },
): boolean {
  return !shouldAttachGuideLinks(question, reply, options);
}

/**
 * Missing-fact / “ask reception” answers — show catalog contact, not place cards.
 */
export function shouldAttachContactReferralCtas(
  question: string,
  reply: string,
): boolean {
  return isFactualGapQuestion(question) || isUncertainGuideReply(reply);
}

/**
 * Follow-ups become the visitor’s next chat message — keep visitor voice
 * (“I would like…”, “I’m interested…”, “Shall I…”, “관심있어요”),
 * drop only guide→visitor offers (“Would you like…?”, “관심 있으세요?”).
 */
export function isVisitorVoiceFollowUp(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  // Guide asking the visitor — not the visitor speaking.
  if (
    /^(would you|do you (want|need)|are you (interested|curious|looking)|shall we|can i help you|let me know|if you('d| would) like)\b/.test(
      lower,
    ) ||
    /\b(would you like|would you care|are you interested|shall we|can i help you|let me know if|feel free to ask)\b/.test(
      lower,
    ) ||
    /^(원하시나요|관심\s*있으(신가요|세요)|어떠세요|도와드릴까요|알려\s*드릴까요)/.test(
      t,
    ) ||
    /(으실래요|실래요|하실래요|드릴까요|관심\s*있으세요)\s*\??\s*$/.test(t)
  ) {
    return false;
  }
  return true;
}

function normalizeFollowUps(raw: unknown, exclude: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const text = typeof entry === 'string' ? entry.trim() : '';
    if (!text || text.length > 80) continue;
    if (!isVisitorVoiceFollowUp(text)) continue;
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
 * Opt-in: follow-ups only when this turn is about the tour (cards, entity talk,
 * or a missing-fact pull-back) — not on chitchat / thanks / laughter.
 */
export function shouldAttachGuideFollowUps(options: {
  question: string;
  reply: string;
  guideLinks?: ChatGuideLink[] | null;
}): boolean {
  if (shouldAttachContactReferralCtas(options.question, options.reply)) {
    return true;
  }
  if (shouldAttachGuideLinks(options.question, options.reply)) return true;
  return (options.guideLinks?.length ?? 0) > 0;
}

/**
 * Build follow-ups grounded in the assistant reply + current place.
 * Prefer model followUps (filtered), then fill from reply-mentioned / current-place entities only.
 * Never pad empty turns with generic tour chips.
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
  if (!shouldAttachGuideFollowUps(options)) return [];

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

  // Missing-fact / ask-reception turns: pull back into the tour (contact card
  // already covers reaching the foundation — chips should not re-ask hours).
  if (shouldAttachContactReferralCtas(options.question, reply)) {
    for (const entry of normalizeFollowUps(options.modelFollowUps, exclude)) {
      if (isFactualGapQuestion(entry) || isContactInfoQuestion(entry)) continue;
      push(entry);
    }
    if (sceneTitle && !questionKey.includes('tell me about this place')) {
      push('Tell me about this place');
    }
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
    push('Where else can I go?');
    return normalizeFollowUps(candidates, exclude).slice(0, 3);
  }

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

  // 3) Other places only when the reply actually named them — or when this
  // turn already shows place cards (explore / where-else answers).
  const placeSeed =
    mentionedPlaces.length > 0 ? mentionedPlaces.map((area) => area.title)
    : isExplorePlacesQuestion(options.question) ?
      (options.guideLinks ?? [])
        .filter((link) => link.kind === 'scene')
        .map((link) => link.title?.trim() ?? '')
        .filter(Boolean)
    : [];

  for (const title of placeSeed.slice(0, 2)) {
    push(`Tell me about ${title}`);
    push(`How do I get to ${title}?`);
  }

  // 4) Where-am-i / naming interest — natural next questions only (no prose sniff).
  if (isWhereAmIQuestion(options.question)) {
    if (namings.length > 0) {
      push('What naming opportunities are available in this place?');
    }
    push('Where else can I go?');
  }

  if (isNamingInterestQuestion(options.question) && namingPool[0]) {
    push(`Is ${namingPool[0].name} still available?`);
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

  const sceneTitle = ctx?.sceneTitle?.trim();

  if (options.kind === 'naming') {
    if (namingName) {
      push(`How can I support ${namingName}?`);
      push(`Tell me more about ${namingName}`);
      push(`What does ${namingName} cost?`);
    } else {
      push('How do I express interest?');
    }
    push(
      sceneTitle ? `Tell me about ${sceneTitle}` : 'Tell me about this place',
    );
  } else {
    push(
      sceneTitle ? `Tell me about ${sceneTitle}` : 'Tell me about this place',
    );
    if (namings.length > 0) {
      push(
        sceneTitle ?
          `What naming opportunities are available in ${sceneTitle}?`
        : 'What naming opportunities are available in this place?',
      );
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

function namingCtaBundleForLink(
  tour: Tour,
  link: ChatGuideLink,
): NamingCtaBundle | null {
  if (link.kind !== 'naming' || !link.hotspotId) return null;
  const scene = tour.scenes[link.sceneId];
  if (!scene) return null;
  const hotspot =
    scene.hotspots?.find((entry) => entry.id === link.hotspotId) ??
    tour.hotspots?.find((entry) => entry.id === link.hotspotId);
  if (!hotspot) return null;
  const popup = resolveNamingPopup(tour, hotspot, scene);
  if (!popup?.namingOpportunity) return null;
  return namingCtasFromPopup(tour, link.hotspotId, popup);
}

/**
 * Attach per-naming support CTAs (Giftabulator gt / express interest).
 * Only when the turn is about supporting / interest — not on browse cards.
 */
export function attachNamingGuideLinkCtas(
  tour: Tour,
  links: ChatGuideLink[],
  options?: { includeSupportCtas?: boolean },
): ChatGuideLink[] {
  if (options?.includeSupportCtas !== true) return links;

  return links.map((link) => {
    if (link.kind !== 'naming') return link;
    const bundle = namingCtaBundleForLink(tour, link);
    if (!bundle) return link;
    const ctas: ChatGuideCta[] = [];
    if (bundle.contact) ctas.push(bundle.contact);
    if (bundle.donate) ctas.push(bundle.donate);
    if (ctas.length === 0) return link;
    return { ...link, ctas };
  });
}

function catalogContactReferralCtas(
  websiteCta: ChatGuideCta | null,
  clientContact: ChatGuideCta | null,
  namingContact: ChatGuideCta | null,
): ChatGuideCta[] {
  const out: ChatGuideCta[] = [];
  if (websiteCta) out.push(websiteCta);
  if (clientContact) out.push(clientContact);
  else if (namingContact) out.push(namingContact);
  return out.slice(0, MAX_GUIDE_CTAS);
}

/**
 * Reply-level CTAs only (contact card / website). Naming Giftabulator / interest
 * CTAs live on each naming card via {@link attachNamingGuideLinkCtas}.
 */
export function buildGuideCtas(
  tour: Tour,
  sceneId: string,
  guideLinks: ChatGuideLink[] = [],
  question = '',
  reply = '',
): ChatGuideCta[] {
  const hasNamingCards = guideLinks.some((link) => link.kind === 'naming');
  const linkNamingBundle = namingCtasFromGuideLinks(tour, guideLinks);
  const namingBundle = linkNamingBundle || firstSceneNamingCtas(tour, sceneId);

  const websiteUrl = getTourWebsite(tour).trim();
  const websiteCta: ChatGuideCta | null =
    websiteUrl && websiteUrl !== 'https://example.com' ?
      { id: 'website', label: 'Website', url: websiteUrl, kind: 'website' }
    : null;
  const clientContact = clientEmailContactCta(tour);

  // Naming / explore cards already answer the question — don't replace with
  // org contact just because the model hedged (“ask the foundation”).
  if (hasNamingCards && isNamingInterestQuestion(question)) return [];
  if (
    guideLinks.some((link) => link.kind === 'scene') &&
    isExplorePlacesQuestion(question)
  ) {
    return [];
  }

  if (
    isContactInfoQuestion(question) ||
    isWebsiteIntentQuestion(question) ||
    shouldAttachContactReferralCtas(question, reply)
  ) {
    return catalogContactReferralCtas(
      websiteCta,
      clientContact,
      namingBundle?.contact ?? null,
    );
  }

  // Interest / purchase with naming cards — actions are on each card.
  if (hasNamingCards) return [];

  if (isNamingInterestQuestion(question)) {
    const out: ChatGuideCta[] = [];
    if (!isExpressInterestIntent(question, reply)) {
      return websiteCta ? [websiteCta] : [];
    }
    if (namingBundle?.contact) out.push(namingBundle.contact);
    else if (clientContact) out.push(clientContact);
    if (namingBundle?.donate) out.push(namingBundle.donate);
    if (out.length > 0) return out.slice(0, MAX_GUIDE_CTAS);
    return websiteCta ? [websiteCta] : [];
  }

  return [];
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
 * For interest/purchase/browse naming questions, ensure naming cards.
 * Prefer the current scene; if none, fall back to open opportunities tour-wide
 * (Overview often has no pins).
 */
export function withInterestNamingLink(
  tour: Tour,
  sceneId: string,
  question: string,
  links: ChatGuideLink[],
  reply?: string,
): ChatGuideLink[] {
  if (!isNamingInterestQuestion(question)) return links;
  if (reply && shouldSuppressGuideLinks(question, reply)) return links;
  if (links.some((link) => link.kind === 'naming')) return links;

  const fallback = collectOpenNamingGuideLinks(tour, {
    preferSceneId: sceneId,
    limit: GUIDE_LINK_PREVIEW_COUNT,
  });
  if (fallback.length === 0) return links;
  return capGuideLinks([...fallback, ...links]);
}

/**
 * For where-else / what-can-I-tour questions, ensure Place cards even when the
 * model answers with a text-only list and empty sceneLinks.
 */
export function withExplorePlaceLinks(
  tour: Tour,
  sceneId: string,
  question: string,
  links: ChatGuideLink[],
  reply?: string,
): ChatGuideLink[] {
  if (!isExplorePlacesQuestion(question)) return links;
  if (reply && shouldSuppressGuideLinks(question, reply)) return links;
  if (links.some((link) => link.kind === 'scene')) return links;

  const fallback = collectOtherAreaGuideLinks(tour, sceneId, {
    limit: GUIDE_LINK_PREVIEW_COUNT,
  });
  if (fallback.length === 0) return links;
  return capGuideLinks([...fallback, ...links]);
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
