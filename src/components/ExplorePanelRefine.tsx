import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  ExploreDirectorySort,
  ExploreDirectorySortField,
  ExploreDirectorySortGroup,
  ExploreDirectorySortGroupConfig,
} from '../constants/tourDirectorySort';
import {
  EXPLORE_REFINE_SUBSECTION_FILTER,
  EXPLORE_REFINE_SUBSECTION_FILTER_ICON,
  EXPLORE_REFINE_SUBSECTION_SORT,
  EXPLORE_REFINE_SUBSECTION_SORT_ICON,
  TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL,
} from '../constants/tourDirectory';
import {
  exploreSortDirectionLabel,
  exploreSortDirectionToggleLabel,
  exploreSortDirectionToggleTooltip,
  exploreSortIdForField,
  flipExploreSortDirection,
  resolveExploreSortDirection,
  tourNavExploreRefineActionLabel,
} from '../constants/tourDirectorySort';
import type { ExploreDirectorySortContext } from '../constants/tourDirectorySort';
import { tourNavIconButtonA11y } from '../constants/tourNavActions';
import { cn } from '../lib/cn';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
} from './tourGlassPanelVariants';
import { TOUR_EXPLORE_REFINE_MENU_ATTR } from './tourNavFloatVariants';
import { NamingPriceRangeFilter } from './NamingPriceRangeFilter';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_22,
} from './ui/materialSymbolClasses';
import {
  tourNavExploreRefineFilterBlockClassName,
  tourNavExploreRefineGroupBlockClassName,
  tourNavExploreRefineGroupHeadingClassName,
  tourNavExploreRefineMenuClassName,
  tourNavExploreRefineSubsectionClassName,
  tourNavExploreRefineSubsectionIconClassName,
  tourNavExploreRefineTriggerActiveClassName,
  tourNavExploreSortDirectionToggleClassName,
  tourNavExploreSortFieldCheckClassName,
  tourNavExploreSortFieldListClassName,
  tourNavExploreSortFieldOptionClassName,
  tourNavExploreSortFieldRowClassName,
  tourNavExploreSortGroupSeparatorClassName,
  tourNavExploreSortCheckClassName,
  tourNavExploreSortMenuInClassName,
  tourNavExploreSortMenuOutClassName,
  tourNavExploreSortRootClassName,
} from './tourNavFloatVariants';

const REFINE_MENU_EXIT_MS = 140;

export type ExploreNamingPriceBounds = {
  min: number;
  max: number;
  step: number;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useDeferredRefineMenuMount(open: boolean): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timer = window.setTimeout(
      () => setMounted(false),
      prefersReducedMotion() ? 0 : REFINE_MENU_EXIT_MS,
    );

    return () => window.clearTimeout(timer);
  }, [open]);

  return open || mounted;
}

function useRefineMenuPosition(
  menuMounted: boolean,
  triggerRef: RefObject<HTMLButtonElement | null>,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!menuMounted) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setStyle({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [menuMounted, triggerRef]);

  return style;
}

function isSortFieldSelected(
  field: ExploreDirectorySortField,
  currentSort: ExploreDirectorySort,
): boolean {
  return field.asc === currentSort || field.desc === currentSort;
}

function resolveGroupSort(
  group: ExploreDirectorySortGroup,
  locationsSort: ExploreDirectorySort,
  namingSort: ExploreDirectorySort,
): ExploreDirectorySort {
  return group === 'locations' ? locationsSort : namingSort;
}

interface ExploreSortFieldRowProps {
  field: ExploreDirectorySortField;
  currentSort: ExploreDirectorySort;
  menuOpen: boolean;
  onSortChange: (sort: ExploreDirectorySort) => void;
}

function ExploreSortFieldRow({
  field,
  currentSort,
  menuOpen,
  onSortChange,
}: ExploreSortFieldRowProps) {
  const selected = isSortFieldSelected(field, currentSort);
  const direction =
    selected ?
      resolveExploreSortDirection(currentSort, field)
    : field.defaultDirection;
  const bidirectional = Boolean(field.desc);

  return (
    <li role='presentation'>
      <div className={tourNavExploreSortFieldRowClassName}>
        <button
          type='button'
          role='option'
          data-sort-field-option
          aria-selected={selected}
          tabIndex={menuOpen ? 0 : -1}
          data-selected={selected ? 'true' : 'false'}
          className={tourNavExploreSortFieldOptionClassName}
          onClick={() => {
            onSortChange(
              selected ? currentSort : (
                exploreSortIdForField(field, field.defaultDirection)
              ),
            );
          }}
        >
          {field.label}
        </button>
        {selected && bidirectional ?
          <IconTooltip
            label={exploreSortDirectionToggleTooltip(field, direction)}
            placement='left'
          >
            <button
              type='button'
              className={tourNavExploreSortDirectionToggleClassName}
              aria-label={exploreSortDirectionToggleLabel(field, direction)}
              tabIndex={menuOpen ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation();
                onSortChange(flipExploreSortDirection(currentSort, field));
              }}
            >
              {exploreSortDirectionLabel(field, direction)}
            </button>
          </IconTooltip>
        : selected ?
          <span
            className={tourNavExploreSortFieldCheckClassName}
            aria-hidden='true'
          >
            <MaterialSymbol
              name='check'
              className={tourNavExploreSortCheckClassName}
              sizePx={MATERIAL_SYMBOL_SIZE_18}
            />
          </span>
        : null}
      </div>
    </li>
  );
}

function ExploreRefineGroupHeading({ label }: { label: string }) {
  return (
    <div className={tourNavExploreRefineGroupHeadingClassName}>
      <span className='min-w-0 truncate'>{label}</span>
    </div>
  );
}

function ExploreRefineSubsectionHeading({
  icon,
  label,
  className,
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn(tourNavExploreRefineSubsectionClassName, className)}>
      <MaterialSymbol
        name={icon}
        className={tourNavExploreRefineSubsectionIconClassName}
        sizePx={MATERIAL_SYMBOL_SIZE_18}
      />
      <span>{label}</span>
    </div>
  );
}

interface ExplorePanelRefineProps {
  context: ExploreDirectorySortContext;
  locationsSort: ExploreDirectorySort;
  namingSort: ExploreDirectorySort;
  groups: ExploreDirectorySortGroupConfig[];
  namingPriceBounds: ExploreNamingPriceBounds | null;
  namingPriceMin: number | null;
  namingPriceMax: number | null;
  namingPriceFilterActive: boolean;
  /** All-tab (mixed) view — keep section headings when only one group is visible. */
  showGroupHeadings?: boolean;
  disabled?: boolean;
  onLocationsSortChange: (sort: ExploreDirectorySort) => void;
  onNamingSortChange: (sort: ExploreDirectorySort) => void;
  onNamingPriceRangeChange: (nextMin: number, nextMax: number) => void;
}

export function ExplorePanelRefine({
  context,
  locationsSort,
  namingSort,
  groups,
  namingPriceBounds,
  namingPriceMin,
  namingPriceMax,
  namingPriceFilterActive,
  showGroupHeadings: showGroupHeadingsProp,
  disabled = false,
  onLocationsSortChange,
  onNamingSortChange,
  onNamingPriceRangeChange,
}: ExplorePanelRefineProps) {
  const [open, setOpen] = useState(false);
  const menuMounted = useDeferredRefineMenuMount(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const menuStyle = useRefineMenuPosition(menuMounted, triggerRef);
  const showGroupHeadings = showGroupHeadingsProp ?? groups.length > 1;
  const showNamingFilter =
    namingPriceBounds != null &&
    namingPriceMin != null &&
    namingPriceMax != null &&
    groups.some((group) => group.id === 'naming');

  const tooltipLabel = tourNavExploreRefineActionLabel({
    context,
    locationsSort,
    namingSort,
    namingPriceFilterActive,
  });

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      event.stopPropagation();
      setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={tourNavExploreSortRootClassName}
      data-explore-refine-root
    >
      <IconTooltip label={tooltipLabel} placement='bottom'>
        <button
          ref={triggerRef}
          type='button'
          className={cn(
            tourGlassPanelCloseClassName,
            (namingPriceFilterActive || open) &&
              tourNavExploreRefineTriggerActiveClassName,
          )}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup='dialog'
          aria-controls={menuMounted ? menuId : undefined}
          onClick={() => setOpen((current) => !current)}
          {...tourNavIconButtonA11y(tooltipLabel)}
        >
          <MaterialSymbol
            name='tune'
            className={tourGlassPanelCloseIconClassName}
            sizePx={MATERIAL_SYMBOL_SIZE_22}
          />
        </button>
      </IconTooltip>

      {menuMounted && typeof document !== 'undefined' ?
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            {...{ [TOUR_EXPLORE_REFINE_MENU_ATTR]: '' }}
            role='dialog'
            aria-label='Refine explore list'
            aria-hidden={!open}
            style={menuStyle}
            className={cn(
              tourNavExploreRefineMenuClassName,
              open ?
                tourNavExploreSortMenuInClassName
              : tourNavExploreSortMenuOutClassName,
            )}
          >
            {groups.map((group, groupIndex) => (
              <Fragment key={group.id}>
                {groupIndex > 0 ?
                  <div
                    role='separator'
                    aria-hidden='true'
                    className={tourNavExploreSortGroupSeparatorClassName}
                  />
                : null}
                {showGroupHeadings ?
                  <ExploreRefineGroupHeading label={group.label} />
                : null}

                <div className={tourNavExploreRefineGroupBlockClassName}>
                  <ExploreRefineSubsectionHeading
                    icon={EXPLORE_REFINE_SUBSECTION_SORT_ICON}
                    label={EXPLORE_REFINE_SUBSECTION_SORT}
                  />
                  <ul
                    role='listbox'
                    aria-label={`${group.label} sort`}
                    className={tourNavExploreSortFieldListClassName}
                  >
                    {group.fields.map((field) => (
                      <ExploreSortFieldRow
                        key={`${group.id}-${field.id}`}
                        field={field}
                        currentSort={resolveGroupSort(
                          group.id,
                          locationsSort,
                          namingSort,
                        )}
                        menuOpen={open}
                        onSortChange={
                          group.id === 'locations' ?
                            onLocationsSortChange
                          : onNamingSortChange
                        }
                      />
                    ))}
                  </ul>

                  {group.id === 'naming' && showNamingFilter ?
                    <>
                      <ExploreRefineSubsectionHeading
                        className='pt-3'
                        icon={EXPLORE_REFINE_SUBSECTION_FILTER_ICON}
                        label={EXPLORE_REFINE_SUBSECTION_FILTER}
                      />
                      <div className={tourNavExploreRefineFilterBlockClassName}>
                        <NamingPriceRangeFilter
                          embedded
                          label={TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL}
                          min={namingPriceBounds.min}
                          max={namingPriceBounds.max}
                          step={namingPriceBounds.step}
                          valueMin={namingPriceMin}
                          valueMax={namingPriceMax}
                          disabled={disabled}
                          onChange={onNamingPriceRangeChange}
                        />
                      </div>
                    </>
                  : null}
                </div>
              </Fragment>
            ))}
          </div>,
          document.body,
        )
      : null}
    </div>
  );
}
