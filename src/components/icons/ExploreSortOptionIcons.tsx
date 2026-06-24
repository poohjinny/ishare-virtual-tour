import type { ExploreDirectorySort } from '../../constants/tourDirectorySort';
import { EXPLORE_DIRECTORY_SORT_MATERIAL_ICONS } from '../../constants/tourDirectorySort';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_18 } from '../ui/materialSymbolClasses';
import { tourNavExploreSortOptionIconClassName } from '../tourNavFloatVariants';

export function ExploreSortOptionIcon({
  sort,
  className,
}: {
  sort: ExploreDirectorySort;
  className?: string;
}) {
  const { name, flip } = EXPLORE_DIRECTORY_SORT_MATERIAL_ICONS[sort];

  return (
    <MaterialSymbol
      name={name}
      flip={flip}
      className={className ?? tourNavExploreSortOptionIconClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_18}
    />
  );
}
