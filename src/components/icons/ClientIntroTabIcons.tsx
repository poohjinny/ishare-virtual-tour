import type { TourCategory } from '../../constants/tourCategories';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_20,
  materialSymbolTabClassName,
} from '../ui/materialSymbolClasses';
import { TourCategoryIcon } from './TourCategoryIcon';

export type ClientIntroCategoryFilter = 'all' | TourCategory;

export function ClientIntroTabLabel({
  filter,
  label,
}: {
  filter: ClientIntroCategoryFilter;
  label: string;
}) {
  return (
    <>
      {filter === 'all' ?
        <MaterialSymbol
          name='grid_view'
          className={materialSymbolTabClassName}
          sizePx={MATERIAL_SYMBOL_SIZE_20}
        />
      : <TourCategoryIcon
          category={filter}
          className={materialSymbolTabClassName}
          sizePx={MATERIAL_SYMBOL_SIZE_20}
        />
      }
      <span className='min-w-0 truncate'>{label}</span>
    </>
  );
}
