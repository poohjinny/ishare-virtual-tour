import type { TourDirectoryTab } from '../../constants/tourDirectory';
import { EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS } from '../../constants/tourDirectorySort';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_20,
  materialSymbolTabClassName,
} from '../ui/materialSymbolClasses';

function ExploreDirectoryTabIcon({ tab }: { tab: TourDirectoryTab }) {
  return (
    <MaterialSymbol
      name={EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS[tab]}
      className={materialSymbolTabClassName}
      sizePx={MATERIAL_SYMBOL_SIZE_20}
    />
  );
}

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
