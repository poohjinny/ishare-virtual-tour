import { type TourCategory, tourCategorySlug } from '../constants/tourCategories';
import { TourCategoryIcon } from './icons/TourCategoryIcon';
import { Badge } from './ui/Badge';
import './TourCategoryBadge.css';

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
      className={`tour-category-badge tour-category-badge--${slug}${className ? ` ${className}` : ''}`}
    >
      <TourCategoryIcon
        category={category}
        className='tour-category-badge__icon'
      />
      <span className='tour-category-badge__label'>{category}</span>
    </Badge>
  );
}
