import type { DragEvent } from 'react';
import { cn } from '../lib/cn';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_20,
  materialSymbolLayoutClassName,
} from './ui/materialSymbolClasses';
import { devViewPanelReorderHandleClassName } from './devViewPanelVariants';

type DevPanelReorderHandleProps = {
  disabled?: boolean;
  label: string;
  className?: string;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: (event: DragEvent<HTMLButtonElement>) => void;
};

/** Material `reorder` grip for HTML5 list/group reordering. */
export function DevPanelReorderHandle({
  disabled = false,
  label,
  className,
  onDragStart,
  onDragEnd,
}: DevPanelReorderHandleProps) {
  return (
    <button
      type='button'
      draggable={!disabled}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(devViewPanelReorderHandleClassName, className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart(event);
      }}
      onDragEnd={(event) => {
        event.stopPropagation();
        onDragEnd?.(event);
      }}
    >
      <MaterialSymbol
        name='reorder'
        sizePx={MATERIAL_SYMBOL_SIZE_20}
        className={materialSymbolLayoutClassName}
        aria-hidden
      />
    </button>
  );
}
