import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  exploreCtaTextArrowIconClassName,
  exploreGalleryCtaArrowIconClassName,
} from '../tourNavFloatVariants';
import { MATERIAL_SYMBOL_SIZE_22 } from '../ui/materialSymbolClasses';

interface ExploreGalleryCtaArrowIconProps {
  sizePx?: number;
  /** gallery = centered icon chip; text = trailing arrow on pill CTA */
  variant?: 'gallery' | 'text';
}

export function ExploreGalleryCtaArrowIcon({
  sizePx = MATERIAL_SYMBOL_SIZE_22,
  variant = 'gallery',
}: ExploreGalleryCtaArrowIconProps = {}) {
  return (
    <MaterialSymbol
      name='arrow_forward'
      className={
        variant === 'text' ?
          exploreCtaTextArrowIconClassName
        : exploreGalleryCtaArrowIconClassName
      }
      sizePx={sizePx}
    />
  );
}
