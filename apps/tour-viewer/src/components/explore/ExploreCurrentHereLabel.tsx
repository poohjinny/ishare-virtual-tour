import { TOUR_DIRECTORY_CURRENT_LOCATION_LABEL } from '../../constants/tourDirectory';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_14 } from '../ui/materialSymbolClasses';

/**
 * "You are here" marker shown on the currently active place / naming item.
 * Replaces the old top-pinned current section — the layout (flag chip vs.
 * inline label) is supplied by the caller via {@link className}.
 */
export function ExploreCurrentHereLabel({
  className,
  sizePx = MATERIAL_SYMBOL_SIZE_14,
}: {
  className?: string;
  /** Icon size — override only for compact surfaces (e.g. Guide place cards). */
  sizePx?: number;
}) {
  return (
    <span className={className}>
      <MaterialSymbol name='flag' sizePx={sizePx} />
      {TOUR_DIRECTORY_CURRENT_LOCATION_LABEL}
    </span>
  );
}
