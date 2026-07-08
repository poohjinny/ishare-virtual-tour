import { TOUR_DIRECTORY_CURRENT_LOCATION_LABEL } from '../constants/tourDirectory';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

/**
 * "You are here" marker shown on the currently active place / naming item.
 * Replaces the old top-pinned current section — the layout (flag chip vs.
 * inline label) is supplied by the caller via {@link className}.
 */
export function ExploreCurrentHereLabel({ className }: { className?: string }) {
  return (
    <span className={className}>
      <MaterialSymbol name='flag' sizePx={MATERIAL_SYMBOL_SIZE_14} />
      {TOUR_DIRECTORY_CURRENT_LOCATION_LABEL}
    </span>
  );
}
