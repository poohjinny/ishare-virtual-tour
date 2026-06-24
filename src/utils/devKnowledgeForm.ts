import type { FaqEntry, SceneKnowledge } from '../types/tour';

export function knowledgeLinesFromArray(values: string[]): string {
  return values.join('\n');
}

export function knowledgeArrayFromLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function emptySceneKnowledgeForm(sceneId: string, sceneTitle?: string) {
  return {
    title: sceneTitle ?? sceneId,
    description: '',
    factsText: '',
    faqs: [] as FaqEntry[],
    suggestedQuestionsText: '',
  };
}

export function sceneKnowledgeToForm(
  scene: SceneKnowledge | undefined,
  sceneId: string,
  sceneTitle?: string,
) {
  if (!scene) {
    return emptySceneKnowledgeForm(sceneId, sceneTitle);
  }

  return {
    title: scene.title,
    description: scene.description,
    factsText: knowledgeLinesFromArray(scene.facts ?? []),
    faqs: scene.faqs ?? [],
    suggestedQuestionsText: knowledgeLinesFromArray(
      scene.suggestedQuestions ?? [],
    ),
  };
}

export function sceneKnowledgeFromForm(form: {
  title: string;
  description: string;
  factsText: string;
  faqs: FaqEntry[];
  suggestedQuestionsText: string;
}): SceneKnowledge {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    facts: knowledgeArrayFromLines(form.factsText),
    faqs: form.faqs
      .map((entry) => ({ q: entry.q.trim(), a: entry.a.trim() }))
      .filter((entry) => entry.q && entry.a),
    suggestedQuestions: knowledgeArrayFromLines(form.suggestedQuestionsText),
  };
}
