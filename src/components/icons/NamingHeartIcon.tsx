import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from '../ui/materialSymbolClasses';
import { tourNavItemIconNamingVariants } from '../tourNavFloatVariants';

interface NamingHeartIconProps {
  active: boolean;
  closed?: boolean;
}

export function NamingHeartIcon({
  active,
  closed = false,
}: NamingHeartIconProps) {
  return (
    <MaterialSymbol
      name='favorite'
      filled={active}
      data-tour-nav-naming-icon
      className={tourNavItemIconNamingVariants({ active, closed })}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}
