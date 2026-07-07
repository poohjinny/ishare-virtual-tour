/** Platform tour categories — order is display order on the client intro screen. */
export const TOUR_CATEGORIES = [
  'Healthcare',
  'Education',
  'Culture',
  'Sporting Venues',
  'International Aid',
  'Social Services',
  'Tourism',
  'Demo',
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
  Demo: 'demo',
};

export function tourCategorySlug(category: TourCategory): string {
  return TOUR_CATEGORY_SLUG[category];
}

export const TOUR_CATEGORY_MATERIAL_ICONS: Record<TourCategory, string> = {
  Healthcare: 'health_and_safety',
  Education: 'school',
  Culture: 'museum',
  'Sporting Venues': 'stadium',
  'International Aid': 'public',
  'Social Services': 'groups',
  Tourism: 'luggage',
  Demo: 'science',
};
