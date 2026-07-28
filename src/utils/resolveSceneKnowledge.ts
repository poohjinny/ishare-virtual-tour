import type { SceneKnowledge, Tour, TourKnowledge } from '../types/tour';

/**
 * AI scene knowledge with title/description overlaid from the tour scene
 * (canonical visitor copy). facts / faqs / suggestedQuestions stay on knowledge.
 */
export function resolveSceneKnowledge(
  tour: Pick<Tour, 'scenes'> | null | undefined,
  knowledge: TourKnowledge,
  sceneId: string,
): SceneKnowledge | null {
  const fromKnowledge = knowledge.scenes[sceneId];
  const fromTour = tour?.scenes?.[sceneId];
  if (!fromKnowledge && !fromTour) return null;

  const tourTitle = fromTour?.title?.trim() || '';
  const tourDescription = fromTour?.description?.trim() || '';

  return {
    title: tourTitle || fromKnowledge?.title?.trim() || sceneId,
    description: tourDescription || fromKnowledge?.description?.trim() || '',
    facts: fromKnowledge?.facts ?? [],
    faqs: fromKnowledge?.faqs ?? [],
    suggestedQuestions: fromKnowledge?.suggestedQuestions ?? [],
  };
}
