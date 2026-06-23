import { cva } from 'class-variance-authority';

export type TourCategoryBadgeSlug =
  | 'healthcare'
  | 'education'
  | 'culture'
  | 'sporting-venues'
  | 'international-aid'
  | 'social-services'
  | 'tourism';

export const tourCategoryBadgeVariants = cva(
  'max-w-[120px] gap-1 px-2 py-[3px] pr-2.5 pl-2 font-display font-semibold tracking-tight',
  {
    variants: {
      category: {
        healthcare: 'bg-category-healthcare-bg text-category-healthcare',
        education: 'bg-category-education-bg text-category-education',
        culture: 'bg-category-culture-bg text-category-culture',
        'sporting-venues': 'bg-category-sporting-bg text-category-sporting',
        'international-aid': 'bg-category-aid-bg text-category-aid',
        'social-services': 'bg-category-social-bg text-category-social',
        tourism: 'bg-category-tourism-bg text-category-tourism',
      },
    },
  },
);
