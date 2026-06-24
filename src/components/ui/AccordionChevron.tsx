import { cn } from '../../lib/cn';
import {
  MATERIAL_SYMBOL_SIZE_22,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import { MaterialSymbol } from '../ui/MaterialSymbol';

export function AccordionChevron({ className }: { className?: string }) {
  return (
    <MaterialSymbol
      name='expand_more'
      className={cn(materialSymbolLayoutClassName, className)}
      sizePx={MATERIAL_SYMBOL_SIZE_22}
    />
  );
}
