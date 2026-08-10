import type { Tour } from '../types/tour';
import {
  assembleTourContext,
  type AssembledTourContext,
} from '../utils/assembleTourContext';

const FALLBACK =
  "I don't have that information yet. Please ask at the reception desk or try one of the suggested questions.";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

function scoreMatch(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q || !t) return 0;
  if (q === t) return 1;
  if (t.includes(q) || q.includes(t)) return 0.8;
  const qWords = q.split(/\s+/).filter(Boolean);
  const matches = qWords.filter((w) => t.includes(w));
  return matches.length / Math.max(qWords.length, 1);
}

function formatNamingBlurb(ctx: AssembledTourContext): string {
  if (ctx.namings.length === 0) return '';
  return ctx.namings
    .map((entry) => {
      const bits = [
        `${entry.name} (${entry.statusLabel}, ${entry.priceLabel})`,
      ];
      if (entry.body) bits.push(entry.body);
      return bits.join(' — ');
    })
    .join(' ');
}

/** Prefer scene pins; fall back to tour-wide catalog (Overview often has none). */
function namingPool(
  ctx: AssembledTourContext,
): Array<{
  name: string;
  status: AssembledTourContext['namings'][number]['status'];
  statusLabel: string;
  priceLabel?: string;
  body?: string;
}> {
  if (ctx.namings.length > 0) return ctx.namings;
  return ctx.tourNamings.map((entry) => ({
    name: entry.name,
    status: entry.status,
    statusLabel: entry.statusLabel,
    priceLabel: entry.priceLabel,
  }));
}

function formatTourNamingBlurb(ctx: AssembledTourContext): string {
  const pool = namingPool(ctx);
  if (pool.length === 0) return '';
  return pool
    .slice(0, 6)
    .map((entry) => {
      const price =
        entry.priceLabel?.trim() ? `, ${entry.priceLabel.trim()}` : '';
      return `${entry.name} (${entry.statusLabel}${price})`;
    })
    .join('; ');
}

export function getSuggestedQuestions(tour: Tour, sceneId: string): string[] {
  return assembleTourContext(tour, sceneId)?.suggestedQuestions ?? [];
}

export function getSceneTitle(tour: Tour, sceneId: string): string {
  return (
    assembleTourContext(tour, sceneId)?.sceneTitle ??
    tour.scenes[sceneId]?.title?.trim() ??
    sceneId
  );
}

export function askMockAssistant(
  tour: Tour,
  sceneId: string,
  question: string,
): string {
  const ctx = assembleTourContext(tour, sceneId);
  if (!ctx) return FALLBACK;

  const q = normalize(question);
  let bestScore = 0;
  let bestAnswer = '';

  const consider = (target: string, answer: string, floor = 0) => {
    const score = scoreMatch(question, target);
    if (score > bestScore && score >= floor) {
      bestScore = score;
      bestAnswer = answer;
    }
  };

  for (const naming of ctx.namings) {
    const answerParts = [
      `${naming.name} is a naming opportunity (${naming.statusLabel}, ${naming.priceLabel}).`,
    ];
    if (naming.body) answerParts.push(naming.body);
    const answer = answerParts.join(' ').trim();
    consider(naming.name, answer);
    if (naming.body) consider(naming.body, answer);
  }

  if (ctx.facilitySummary) {
    consider(ctx.facilitySummary, ctx.facilitySummary, 0.35);
  }
  if (ctx.placeCopy) {
    consider(ctx.placeCopy, ctx.placeCopy, 0.35);
  }
  if (ctx.sceneDescription && ctx.sceneDescription !== ctx.placeCopy) {
    consider(ctx.sceneDescription, ctx.sceneDescription, 0.35);
  }
  consider(ctx.sceneTitle, `${ctx.sceneTitle}. ${ctx.placeCopy}`.trim(), 0.5);

  if (
    /\b(hours?|schedule|timetable|visiting hours|operating hours)\b/.test(q) ||
    /\bwhen\b.{0,40}\b(open|opened|close|closed)\b/.test(q) ||
    /\b(open|opened|close|closed)\b.{0,24}\b(when|what time|hours?)\b/.test(
      q,
    ) ||
    /\bwhat time\b/.test(q) ||
    /\bwhen (is|are|will|was|were)\b.{0,64}\b(house|facility|building)\b/.test(
      q,
    ) ||
    /몇\s*시|운영\s*시간|방문\s*시간|언제\s*(열어|열고|여|닫)/.test(question)
  ) {
    return 'I don’t have visiting hours or a schedule in this tour. For the latest details, please ask the foundation team at reception.';
  }

  if (bestScore >= 0.35 && bestAnswer) return bestAnswer;

  if (q.includes('where am i') || q.includes('current location')) {
    return `You are currently at ${ctx.sceneTitle}.`;
  }

  if (
    /\b(buy|purchase|interested|interest|pledge|sponsor|claim)\b/.test(q) ||
    /구매|사고\s*싶|관심|어떻게\s*(사|구매|후원|기부)/.test(question)
  ) {
    const pool = namingPool(ctx);
    const open = pool.filter((entry) => entry.status === 'open');
    const first = open[0] ?? pool[0];
    if (!first) {
      return `There isn’t a naming opportunity listed to support in this tour yet. You can ask at reception or explore other areas.`;
    }
    if (first.status === 'open') {
      const price =
        'priceLabel' in first && first.priceLabel ?
          ` (${first.priceLabel})`
        : '';
      return `${first.name} is available${price}. You can’t check out here like a store — use Express interest to contact the foundation team, or explore tax-efficient giving if that option is shown.`;
    }
    if (first.status === 'reserved') {
      return `${first.name} is reserved — a naming commitment is already in progress. Speak with the foundation team if you have questions; I can’t promise it’s still available.`;
    }
    if (first.status === 'soon') {
      return `${first.name} is coming soon and isn’t open yet. You can ask to be notified when it becomes available.`;
    }
    return `${first.name} has already been named. You can explore other open naming opportunities in the tour or support the mission through the foundation.`;
  }

  if (
    q.includes('naming') ||
    q.includes('opportunit') ||
    q.includes('donate') ||
    q.includes('gift')
  ) {
    const sceneBlurb = formatNamingBlurb(ctx);
    if (sceneBlurb) {
      return `Naming opportunities in ${ctx.sceneTitle}: ${sceneBlurb}`;
    }
    const tourBlurb = formatTourNamingBlurb(ctx);
    if (tourBlurb) {
      return `There aren’t naming pins in ${ctx.sceneTitle} itself, but across ${ctx.tourTitle} you can support opportunities like: ${tourBlurb}.`;
    }
    return `There are no naming opportunities listed in this tour yet.`;
  }

  if (
    q.includes('what is this') ||
    q.includes('tell me about') ||
    q.includes('about this') ||
    q.includes('about the tour') ||
    q.includes('know more about') ||
    /여기가|뭐하는|투어에 대한|설명해/.test(question)
  ) {
    const namingBlurb = formatNamingBlurb(ctx);
    return [ctx.facilitySummary, ctx.tourTitle, ctx.placeCopy, namingBlurb]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return FALLBACK;
}

export function getLocationChangeNote(tour: Tour, sceneId: string): string {
  const title = getSceneTitle(tour, sceneId);
  return `Here we are at ${title} — I'd love to tell you more about this space, or help you explore what's nearby.`;
}

/**
 * Explore place detail → Ask Guide user question.
 * Interest / curiosity — not “tell me about this place” (implies already there).
 */
export function getExplorePlaceAskQuestion(tour: Tour, sceneId: string): string {
  const title = getSceneTitle(tour, sceneId).trim();
  return title ?
      `I'd like to know more about ${title}`
    : "I'd like to know more about this place";
}

/**
 * Chat note when Ask Guide opens from Explore about a place.
 * Same hospitality as visit notes, without claiming they have arrived.
 */
export function getExplorePlaceAskNote(tour: Tour, sceneId: string): string {
  const title = getSceneTitle(tour, sceneId).trim() || 'this place';
  return `Looking at ${title} — happy to tell you more about this space, or help you explore what's nearby.`;
}

/** Compact sticky notice after a place move (Ask Guide panel). */
export function getSceneContextNotice(tour: Tour, sceneId: string): string {
  return `Now in ${getSceneTitle(tour, sceneId)}`;
}

/** Chat note when a naming opportunity is opened (same or new scene). */
export function getNamingOpenNote(
  tour: Tour,
  sceneId: string,
  namingName?: string,
): string {
  const place = getSceneTitle(tour, sceneId);
  const name = namingName?.trim();
  if (name) {
    if (name.toLowerCase() === place.toLowerCase()) {
      return `Here's the ${name} naming opportunity — happy to share what it supports, or how you can get involved.`;
    }
    return `Here's the ${name} naming opportunity in ${place} — I can walk you through what it means, or how to show your support.`;
  }
  return `Here's a naming opportunity in ${place} — happy to share what it supports, or how you can get involved.`;
}

/** Compact sticky notice after a naming opportunity is opened. */
export function getNamingContextNotice(
  tour: Tour,
  sceneId: string,
  namingName?: string,
): string {
  const place = getSceneTitle(tour, sceneId);
  const name = namingName?.trim();
  if (name) {
    if (name.toLowerCase() === place.toLowerCase()) {
      return `Viewing ${name} naming opportunity`;
    }
    return `Viewing ${name} · ${place}`;
  }
  return `Viewing a naming opportunity · ${place}`;
}

/**
 * FAB proximity bubbles — curated variant banks (not LLM).
 * Wrap place / naming names in `**…**` for emphasis in {@link AiGuideFabBubble}.
 * `{place}` / `{name}` are filled at pick time.
 */

const GUIDE_FAB_OVERVIEW_BUBBLES = [
  "Welcome — I'm here if you'd like a hand exploring.",
  'Hi! Pick a place to dive in, or ask me anything.',
  'This is the overview — tap somewhere to look around, or chat with me.',
  'Ready when you are — where should we start?',
  "I'll tag along. Explore from here, or ask me a question.",
] as const;

const GUIDE_FAB_OVERVIEW_BUBBLES_WITH_TOUR = [
  'Welcome to **{tour}** — where should we start?',
  "Hi! You're at the **{tour}** overview. Pick a place, or ask me anything.",
  'This is **{tour}**. Tap an area to explore, or chat with me.',
  "Ready to look around **{tour}**? I'm here if you need a guide.",
  'Welcome — explore **{tour}** from here, or ask me a question.',
] as const;

const GUIDE_FAB_SCENE_BUBBLES = [
  "Hey — we're in **{place}** — want to look around together?",
  'Just stepped into **{place}**. Anything you want to know?',
  "We're at **{place}** now — I can point things out if you'd like.",
  'Welcome to **{place}**. Curious what stands out here?',
  'This is **{place}**. Want a quick look around with me?',
  'Made it to **{place}** — ask me anything about this spot.',
  "Here's **{place}**. I can tell you more whenever you're ready.",
  "Now we're in **{place}**. Shall we explore a little?",
  'Nice — **{place}**. Tap me if you want the story behind it.',
  "You've reached **{place}**. Happy to guide you from here.",
] as const;

const GUIDE_FAB_NAMING_BUBBLES = [
  "Ooh, **{name}** is open — I can tell you more if you'd like.",
  '**{name}** caught your eye — want the details?',
  'Looking at **{name}**. I can walk you through it.',
  'Nice pick — **{name}**. Ask me anything about it.',
  '**{name}** is right here. Curious about naming it?',
  'You opened **{name}** — happy to fill in the blanks.',
  "Here's **{name}**. I can share what's special about it.",
  '**{name}** — want a quick intro, or jump into questions?',
  "Checking out **{name}**? I've got the scoop if you need it.",
  'Paused on **{name}** — tap me when you want to know more.',
] as const;

const GUIDE_FAB_NAMING_BUBBLES_GENERIC = [
  "Ooh, a naming opportunity is open — I can tell you more if you'd like.",
  'A naming opportunity is open here — want the details?',
  "You've opened a naming opportunity. I can walk you through it.",
  'Nice — a naming spot is open. Ask me anything about it.',
  "There's a naming opportunity right here. Curious?",
  'A naming opportunity is up — happy to fill in the blanks.',
  "You've found a naming opportunity. I can share what's special.",
  'Naming opportunity open — want a quick intro?',
] as const;

const GUIDE_FAB_NAV_PREVIEW_BUBBLES = [
  'Peeking at **{place}** — want a quick intro before you go?',
  '**{place}** looks interesting — I can tell you more, or you can hop over.',
  "Here's a preview of **{place}**. Ask me anything about it.",
  "Looking toward **{place}** — curious what's waiting there?",
  '**{place}** is next door — want the story before you visit?',
  "Checking out **{place}**? I've got details if you'd like.",
  'Nice — **{place}** is on the path. Tap me for a quick briefing.',
  "You're previewing **{place}**. Happy to fill in the blanks.",
] as const;

/** Shuffle-bag picker so session lines feel varied without immediate repeats. */
function createGuideFabBagPicker() {
  let bag: number[] = [];
  let last = -1;

  return (length: number): number => {
    if (length <= 0) return 0;
    if (length === 1) return 0;

    if (bag.length === 0) {
      bag = Array.from({ length }, (_, i) => i);
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = bag[i]!;
        bag[i] = bag[j]!;
        bag[j] = swap;
      }
      // Avoid starting a fresh bag on the same line we just used.
      if (bag[bag.length - 1] === last && bag.length > 1) {
        const swapWith = bag.length - 2;
        const end = bag[bag.length - 1]!;
        bag[bag.length - 1] = bag[swapWith]!;
        bag[swapWith] = end;
      }
    }

    last = bag.pop() ?? 0;
    return last;
  };
}

const pickOverviewBubbleIndex = createGuideFabBagPicker();
const pickOverviewTourBubbleIndex = createGuideFabBagPicker();
const pickSceneBubbleIndex = createGuideFabBagPicker();
const pickNamingBubbleIndex = createGuideFabBagPicker();
const pickNamingGenericBubbleIndex = createGuideFabBagPicker();
const pickNavPreviewBubbleIndex = createGuideFabBagPicker();

function fillGuideFabTemplate(
  template: string,
  vars: { place?: string; name?: string; tour?: string },
): string {
  return template
    .replaceAll('{place}', vars.place ?? '')
    .replaceAll('{name}', vars.name ?? '')
    .replaceAll('{tour}', vars.tour ?? '');
}

/**
 * FAB speech bubble on the tour overview / first scene (panel closed).
 * Welcome tone — invite to explore, not a place-arrival line.
 */
export function getGuideFabOverviewBubble(tourTitle?: string): string {
  const tour = tourTitle?.trim();
  if (tour) {
    const index = pickOverviewTourBubbleIndex(
      GUIDE_FAB_OVERVIEW_BUBBLES_WITH_TOUR.length,
    );
    return fillGuideFabTemplate(GUIDE_FAB_OVERVIEW_BUBBLES_WITH_TOUR[index]!, {
      tour,
    });
  }
  const index = pickOverviewBubbleIndex(GUIDE_FAB_OVERVIEW_BUBBLES.length);
  return GUIDE_FAB_OVERVIEW_BUBBLES[index]!;
}

/**
 * Short FAB speech bubble when the visitor moves places (panel closed).
 * Warm, conversational — invite without selling. Rotates a curated variant bank.
 */
export function getGuideFabSceneBubble(placeTitle: string): string {
  const place = placeTitle.trim() || 'this spot';
  const index = pickSceneBubbleIndex(GUIDE_FAB_SCENE_BUBBLES.length);
  return fillGuideFabTemplate(GUIDE_FAB_SCENE_BUBBLES[index]!, { place });
}

/**
 * Short FAB speech bubble when a naming opportunity panel opens (panel closed).
 * Rotates a curated variant bank. Wrap the naming name in `**…**` when present.
 */
export function getGuideFabNamingBubble(namingName?: string): string {
  const name = namingName?.trim();
  if (name) {
    const index = pickNamingBubbleIndex(GUIDE_FAB_NAMING_BUBBLES.length);
    return fillGuideFabTemplate(GUIDE_FAB_NAMING_BUBBLES[index]!, { name });
  }
  const index = pickNamingGenericBubbleIndex(
    GUIDE_FAB_NAMING_BUBBLES_GENERIC.length,
  );
  return GUIDE_FAB_NAMING_BUBBLES_GENERIC[index]!;
}

/**
 * FAB speech bubble when a nav destination preview opens (panel closed).
 * Destination title in `**…**` for emphasis.
 */
export function getGuideFabNavPreviewBubble(placeTitle: string): string {
  const place = placeTitle.trim() || 'that spot';
  const index = pickNavPreviewBubbleIndex(GUIDE_FAB_NAV_PREVIEW_BUBBLES.length);
  return fillGuideFabTemplate(GUIDE_FAB_NAV_PREVIEW_BUBBLES[index]!, { place });
}

/** Chat note when a nav destination preview is opened. */
export function getNavPreviewOpenNote(
  tour: Tour,
  targetSceneId: string,
  previewTitle?: string,
): string {
  const title =
    previewTitle?.trim() || getSceneTitle(tour, targetSceneId) || 'that place';
  return `You're previewing ${title} — I can tell you more about it, or help you decide where to go next.`;
}
