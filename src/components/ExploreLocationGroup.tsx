import { type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from './ui/materialSymbolClasses';
import {
  tourNavLocationGroupChevronClassName,
  tourNavLocationGroupChevronOpenClassName,
  tourNavLocationGroupClassName,
  tourNavLocationGroupExpandedClassName,
  tourNavLocationGroupHeaderClassName,
  tourNavLocationGroupMetaClassName,
  tourNavLocationGroupPanelClassName,
  tourNavLocationGroupPanelContentClassName,
  tourNavLocationGroupPanelInnerClassName,
  tourNavLocationGroupTitleClassName,
} from './tourNavFloatVariants';

interface ExploreLocationGroupProps {
  title: string;
  metaLabel?: string;
  expanded: boolean;
  regionId: string;
  headingId: string;
  disabled?: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Collapsible department group header + region for the grouped locations list. */
export function ExploreLocationGroup({
  title,
  metaLabel,
  expanded,
  regionId,
  headingId,
  disabled = false,
  onToggle,
  children,
}: ExploreLocationGroupProps) {
  return (
    <section
      className={cn(
        tourNavLocationGroupClassName,
        expanded && tourNavLocationGroupExpandedClassName,
      )}
    >
      <button
        type='button'
        id={headingId}
        className={tourNavLocationGroupHeaderClassName}
        aria-expanded={expanded}
        aria-controls={regionId}
        disabled={disabled}
        onClick={onToggle}
      >
        <MaterialSymbol
          name='chevron_right'
          sizePx={MATERIAL_SYMBOL_SIZE_20}
          className={cn(
            tourNavLocationGroupChevronClassName,
            expanded && tourNavLocationGroupChevronOpenClassName,
          )}
        />
        <span className={tourNavLocationGroupTitleClassName}>{title}</span>
        {metaLabel ?
          <span className={tourNavLocationGroupMetaClassName}>{metaLabel}</span>
        : null}
      </button>
      <div className={tourNavLocationGroupPanelClassName}>
        <div className={tourNavLocationGroupPanelInnerClassName}>
          <div
            id={regionId}
            role='region'
            aria-labelledby={headingId}
            aria-hidden={!expanded}
            className={tourNavLocationGroupPanelContentClassName}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
