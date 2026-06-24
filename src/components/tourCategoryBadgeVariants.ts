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
  'max-w-[120px] gap-0.5 border-none px-1.5 py-[2px] pr-2 pl-1.5 font-display font-semibold tracking-tight',
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
