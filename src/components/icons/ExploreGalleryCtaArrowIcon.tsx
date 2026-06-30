import { cn } from '../../lib/cn';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_22,
  materialSymbolCompactClassName,
} from '../ui/materialSymbolClasses';

interface ExploreGalleryCtaArrowIconProps {
  sizePx?: number;
}

export function ExploreGalleryCtaArrowIcon({
  sizePx = MATERIAL_SYMBOL_SIZE_22,
}: ExploreGalleryCtaArrowIconProps = {}) {
  return (
    <MaterialSymbol
      name='arrow_forward'
      className={cn(
        materialSymbolCompactClassName,
        'transition-transform duration-300 ease-out',
      )}
      sizePx={sizePx}
    />
  );
}
