import {
  type TourCategory,
  tourCategorySlug,
} from '../constants/tourCategories';
import { cn } from '../lib/cn';
import { TourCategoryIcon } from './icons/TourCategoryIcon';
import { Badge } from './ui/Badge';
import { BADGE_CLASS } from './ui/badgeClasses';
import {
  materialSymbolBadgeClassName,
  MATERIAL_SYMBOL_SIZE_16,
} from './ui/materialSymbolClasses';
import {
  tourCategoryBadgeVariants,
  type TourCategoryBadgeSlug,
} from './tourCategoryBadgeVariants';

interface TourCategoryBadgeProps {
  category: TourCategory;
  className?: string;
}

export function TourCategoryBadge({
  category,
  className = '',
}: TourCategoryBadgeProps) {
  const slug = tourCategorySlug(category);

  return (
    <Badge
      variant='fill'
      size='sm'
      tone='none'
      className={cn(
        tourCategoryBadgeVariants({ category: slug as TourCategoryBadgeSlug }),
        className,
      )}
    >
      <TourCategoryIcon
        category={category}
        className={cn(BADGE_CLASS.icon, materialSymbolBadgeClassName)}
        sizePx={MATERIAL_SYMBOL_SIZE_16}
      />
      <span className='min-w-0 overflow-hidden text-ellipsis whitespace-nowrap'>
        {category}
      </span>
    </Badge>
  );
}
