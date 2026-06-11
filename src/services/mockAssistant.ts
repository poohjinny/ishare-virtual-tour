import type { SceneKnowledge, TourKnowledge } from '../types/tour';

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
  if (q === t) return 1;
  if (t.includes(q) || q.includes(t)) return 0.8;
  const qWords = q.split(/\s+/).filter(Boolean);
  const matches = qWords.filter((w) => t.includes(w));
  return matches.length / Math.max(qWords.length, 1);
}

export function getSceneKnowledge(
  knowledge: TourKnowledge,
  sceneId: string,
): SceneKnowledge | null {
  return knowledge.scenes[sceneId] ?? null;
}

export function getSuggestedQuestions(
  knowledge: TourKnowledge,
  sceneId: string,
): string[] {
  return knowledge.scenes[sceneId]?.suggestedQuestions ?? [];
}

export function getSceneTitle(
  knowledge: TourKnowledge,
  sceneId: string,
): string {
  return knowledge.scenes[sceneId]?.title ?? sceneId;
}

export function askMockAssistant(
  knowledge: TourKnowledge,
  sceneId: string,
  question: string,
): string {
  const scene = knowledge.scenes[sceneId];
  if (!scene) return FALLBACK;

  let bestScore = 0;
  let bestAnswer = '';

  for (const faq of scene.faqs) {
    const score = Math.max(
      scoreMatch(question, faq.q),
      scoreMatch(question, faq.a),
    );
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = faq.a;
    }
  }

  if (bestScore >= 0.4) return bestAnswer;

  for (const fact of scene.facts) {
    const score = scoreMatch(question, fact);
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = fact;
    }
  }

  if (bestScore >= 0.35) return bestAnswer;

  if (
    normalize(question).includes('where am i') ||
    normalize(question).includes('current location')
  ) {
    return `You are currently at ${scene.title}. ${scene.description}`;
  }

  if (
    normalize(question).includes('what is this') ||
    normalize(question).includes('tell me about')
  ) {
    return `${knowledge.global.facilityName}: ${scene.description} ${scene.facts[0] ?? ''}`.trim();
  }

  return FALLBACK;
}

export function getLocationChangeNote(
  knowledge: TourKnowledge,
  sceneId: string,
): string {
  const title = getSceneTitle(knowledge, sceneId);
  return `You're now on ${title}. Feel free to ask questions about this area.`;
}
