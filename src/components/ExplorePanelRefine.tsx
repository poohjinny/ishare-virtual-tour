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
import {
  EXPLORE_REFINE_SUBSECTION_FILTER,
  EXPLORE_REFINE_SUBSECTION_SORT,
  TOUR_DIRECTORY_NAMING_PRICE_FILTER_LABEL,
} from '../constants/tourDirectory';
import type {
  ExploreDirectorySort,
  ExploreDirectorySortGroup,
  ExploreDirectorySortGroupConfig,
} from '../constants/tourDirectorySort';
import {
  EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS,
  tourNavExploreRefineActionLabel,
} from '../constants/tourDirectorySort';
import type { ExploreDirectorySortContext } from '../constants/tourDirectorySort';
import { tourNavIconButtonA11y } from '../constants/tourNavActions';
import { cn } from '../lib/cn';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
} from './tourGlassPanelVariants';
import { ExploreSortOptionIcon } from './icons/ExploreSortOptionIcons';
import { NamingPriceRangeFilter } from './NamingPriceRangeFilter';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_20,
  MATERIAL_SYMBOL_SIZE_22,
  materialSymbolTabClassName,
} from './ui/materialSymbolClasses';
import {
  tourNavExploreRefineFilterBlockClassName,
  tourNavExploreRefineGroupBlockClassName,
  tourNavExploreRefineGroupHeadingClassName,
  tourNavExploreRefineMenuClassName,
  tourNavExploreRefineSubsectionClassName,
  tourNavExploreRefineTriggerActiveClassName,
  tourNavExploreSortCheckClassName,
  tourNavExploreSortGroupSeparatorClassName,
  tourNavExploreSortMenuInClassName,
  tourNavExploreSortMenuOutClassName,
  tourNavExploreSortOptionLeadingClassName,
  tourNavExploreSortOptionVariants,
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

function isSortOptionSelected(
  group: ExploreDirectorySortGroup,
  optionId: ExploreDirectorySort,
  locationsSort: ExploreDirectorySort,
  namingSort: ExploreDirectorySort,
): boolean {
  return group === 'locations' ?
      locationsSort === optionId
    : namingSort === optionId;
}

function ExploreRefineGroupHeading({
  groupId,
  label,
}: {
  groupId: ExploreDirectorySortGroup;
  label: string;
}) {
  return (
    <div className={tourNavExploreRefineGroupHeadingClassName}>
      <MaterialSymbol
        name={EXPLORE_DIRECTORY_TAB_MATERIAL_ICONS[groupId]}
        className={materialSymbolTabClassName}
        sizePx={MATERIAL_SYMBOL_SIZE_20}
      />
      <span className='min-w-0 truncate'>{label}</span>
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
  const showGroupHeadings = groups.length > 1;
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
                  <ExploreRefineGroupHeading
                    groupId={group.id}
                    label={group.label}
                  />
                : null}

                <div className={tourNavExploreRefineGroupBlockClassName}>
                  <div className={tourNavExploreRefineSubsectionClassName}>
                    {EXPLORE_REFINE_SUBSECTION_SORT}
                  </div>
                  <ul
                    role='listbox'
                    aria-label={`${group.label} sort`}
                    className='m-0 list-none p-0'
                  >
                    {group.options.map((option) => {
                      const selected = isSortOptionSelected(
                        group.id,
                        option.id,
                        locationsSort,
                        namingSort,
                      );

                      return (
                        <li key={`${group.id}-${option.id}`} role='presentation'>
                          <button
                            type='button'
                            role='option'
                            aria-selected={selected}
                            tabIndex={open ? 0 : -1}
                            className={tourNavExploreSortOptionVariants({
                              selected,
                            })}
                            onClick={() => {
                              if (group.id === 'locations') {
                                onLocationsSortChange(option.id);
                              } else {
                                onNamingSortChange(option.id);
                              }
                            }}
                          >
                            <span
                              className={tourNavExploreSortOptionLeadingClassName}
                            >
                              <ExploreSortOptionIcon sort={option.id} />
                              <span>{option.label}</span>
                            </span>
                            {selected ?
                              <MaterialSymbol
                                name='check'
                                className={tourNavExploreSortCheckClassName}
                                sizePx={MATERIAL_SYMBOL_SIZE_18}
                              />
                            : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {group.id === 'naming' && showNamingFilter ?
                    <>
                      <div
                        className={cn(
                          tourNavExploreRefineSubsectionClassName,
                          'pt-2',
                        )}
                      >
                        {EXPLORE_REFINE_SUBSECTION_FILTER}
                      </div>
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
