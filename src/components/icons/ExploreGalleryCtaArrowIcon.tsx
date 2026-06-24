import { cn } from '../../lib/cn';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_22,
  materialSymbolCompactClassName,
} from '../ui/materialSymbolClasses';

export function ExploreGalleryCtaArrowIcon() {
  return (
    <MaterialSymbol
      name='arrow_forward'
      className={cn(
        materialSymbolCompactClassName,
        'transition-transform duration-200',
      )}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}
