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

  if (bestScore >= 0.35 && bestAnswer) return bestAnswer;

  if (q.includes('where am i') || q.includes('current location')) {
    return `You are currently at ${ctx.sceneTitle}.`;
  }

  if (
    /\b(buy|purchase|interested|interest|pledge|sponsor|claim)\b/.test(q) ||
    /구매|사고\s*싶|관심|어떻게\s*(사|구매|후원|기부)/.test(question)
  ) {
    const open = ctx.namings.filter((entry) => entry.status === 'open');
    const first = open[0] ?? ctx.namings[0];
    if (!first) {
      return `There isn’t a naming opportunity listed to support in ${ctx.sceneTitle} yet. You can ask at reception or explore other areas of the tour.`;
    }
    if (first.status === 'open') {
      return `${first.name} is available (${first.priceLabel}). You can’t check out here like a store — use Express your interest to contact the foundation team, or explore tax-efficient giving if that option is shown.`;
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
    const blurb = formatNamingBlurb(ctx);
    if (blurb) {
      return `Naming opportunities in ${ctx.sceneTitle}: ${blurb}`;
    }
    return `There are no naming opportunities listed in ${ctx.sceneTitle} yet.`;
  }

  if (
    q.includes('what is this') ||
    q.includes('tell me about') ||
    q.includes('about this') ||
    q.includes('about the tour') ||
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
