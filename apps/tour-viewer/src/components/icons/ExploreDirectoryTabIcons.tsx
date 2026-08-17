import type { TourDirectoryTab } from '../../constants/tourDirectory';
import { EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS } from '../../constants/tourDirectorySort';
import { cn } from '../../lib/cn';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_20,
  materialSymbolTabClassName,
} from '../ui/materialSymbolClasses';

function ExploreDirectoryTabIcon({
  tab,
  sizePx = MATERIAL_SYMBOL_SIZE_20,
  className,
}: {
  tab: TourDirectoryTab;
  sizePx?: number;
  className?: string;
}) {
  return (
    <MaterialSymbol
      name={EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS[tab]}
      className={cn(materialSymbolTabClassName, className)}
      sizePx={sizePx}
    />
  );
}

export { ExploreDirectoryTabIcon };

export function ExploreDirectoryTabLabel({
  tab,
  label,
}: {
  tab: TourDirectoryTab;
  label: string;
}) {
  return (
    <>
      <ExploreDirectoryTabIcon tab={tab} />
      <span className='min-w-0 truncate'>{label}</span>
    </>
  );
}
