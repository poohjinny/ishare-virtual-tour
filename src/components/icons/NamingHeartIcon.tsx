import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from '../ui/materialSymbolClasses';
import { tourNavItemIconNamingVariants } from '../tourNavFloatVariants';

interface NamingHeartIconProps {
  active: boolean;
  sold?: boolean;
}

export function NamingHeartIcon({
  active,
  sold = false,
}: NamingHeartIconProps) {
  return (
    <MaterialSymbol
      name='favorite'
      filled={active}
      data-tour-nav-naming-icon
      className={tourNavItemIconNamingVariants({ active, sold })}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}