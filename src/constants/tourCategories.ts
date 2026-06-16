/** Platform tour categories — order is display order on the client intro screen. */
export const TOUR_CATEGORIES = [
  'Healthcare',
  'Education',
  'Culture',
  'Sporting Venues',
  'International Aid',
  'Social Services',
  'Tourism',
] as const;

export type TourCategory = (typeof TOUR_CATEGORIES)[number];

const TOUR_CATEGORY_SLUG: Record<TourCategory, string> = {
  Healthcare: 'healthcare',
  Education: 'education',
  Culture: 'culture',
  'Sporting Venues': 'sporting-venues',
  'International Aid': 'international-aid',
  'Social Services': 'social-services',
  Tourism: 'tourism',
};

export function tourCategorySlug(category: TourCategory): string {
  return TOUR_CATEGORY_SLUG[category];
}
