import type { TourCategory } from '../../constants/tourCategories';
import { TOUR_CATEGORY_MATERIAL_ICONS } from '../../constants/tourCategories';
import { MaterialSymbol } from '../ui/MaterialSymbol';

interface TourCategoryIconProps {
  category: TourCategory;
  className?: string;
  sizePx?: number;
}

export function TourCategoryIcon({
  category,
  className,
  sizePx,
}: TourCategoryIconProps) {
  return (
    <MaterialSymbol
      name={TOUR_CATEGORY_MATERIAL_ICONS[category]}
      className={className}
      sizePx={sizePx}
    />
  );
}
