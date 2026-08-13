import { useLayoutEffect, useRef, type RefObject } from 'react';
import { ExploreDirectoryTabIcon } from '../icons/ExploreDirectoryTabIcons';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_20,
} from '../ui/materialSymbolClasses';
import {
  clickExploreDirectoryPinSource,
  type ExploreDirectoryScrollPinsState,
} from '../../hooks/useExploreDirectoryScrollPins';
import {
  tourNavDirectoryPinBarClassName,
  tourNavDirectoryPinBarShellClassName,
  tourNavDirectoryPinGroupClassName,
  tourNavDirectoryPinSectionClassName,
  tourNavLocationGroupChevronClassName,
  tourNavLocationGroupChevronIconClassName,
  tourNavLocationGroupChevronOpenClassName,
  tourNavLocationGroupHeaderOpenClassName,
  tourNavLocationGroupMetaClassName,
  tourNavLocationGroupTitleClassName,
  tourNavSectionTitleClassName,
  tourNavSectionTitleChevronClassName,
  tourNavSectionTitleClusterButtonClassName,
  tourNavSectionTitleDividerLineClassName,
  tourNavSectionTitleIconClassName,
  tourNavSectionTitleLabelClassName,
  tourNavSectionTitleToggleClassName,
  tourNavSectionTitleToggleOpenClassName,
} from '../tourNavFloatVariants';
import { IconTooltip } from '../ui/IconTooltip';
import { cn } from '../../lib/cn';

interface ExploreDirectoryScrollPinsProps {
  pins: ExploreDirectoryScrollPinsState;
  scrollRef: RefObject<HTMLElement | null>;
}

const SCROLLBAR_GUTTER_VAR = '--directory-pin-scrollbar-gutter';

function hasAnyPin(pins: ExploreDirectoryScrollPinsState): boolean {
  return Boolean(pins.section || pins.group);
}

/** Outside-scroller mirror of pinned Explore section + department headers. */
export function ExploreDirectoryScrollPins({
  pins,
  scrollRef,
}: ExploreDirectoryScrollPinsProps) {
  const barRef = useRef<HTMLDivElement>(null);

  // Match pin content width to in-scroller titles (subtract classic scrollbar).
  useLayoutEffect(() => {
    if (!hasAnyPin(pins)) return;
    const root = scrollRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;

    const syncGutter = () => {
      const gutter = Math.max(0, root.offsetWidth - root.clientWidth);
      bar.style.setProperty(SCROLLBAR_GUTTER_VAR, `${gutter}px`);
    };

    syncGutter();
    const ro = new ResizeObserver(syncGutter);
    ro.observe(root);
    return () => {
      ro.disconnect();
      bar.style.removeProperty(SCROLLBAR_GUTTER_VAR);
    };
  }, [pins, scrollRef, pins.section?.key, pins.group?.key]);

  if (!hasAnyPin(pins)) return null;

  const { section, group } = pins;

  const sectionToggleLabel =
    !section ? ''
    : section.groupsAnyExpanded ? `Collapse ${section.label}`
    : `Expand ${section.label}`;

  return (
    <div className={tourNavDirectoryPinBarShellClassName}>
      <div ref={barRef} className={tourNavDirectoryPinBarClassName}>
        {section ?
          <div
            className={cn(
              tourNavDirectoryPinSectionClassName,
              section.denseBottom && 'mb-0',
            )}
          >
            <span
              className={tourNavSectionTitleDividerLineClassName}
              aria-hidden='true'
            />
            {section.hasToggle ?
              <IconTooltip label={sectionToggleLabel} placement='top'>
                <button
                  type='button'
                  className={tourNavSectionTitleClusterButtonClassName}
                  aria-expanded={section.groupsAnyExpanded}
                  aria-label={sectionToggleLabel}
                  onClick={() =>
                    clickExploreDirectoryPinSource(
                      scrollRef.current,
                      section.key,
                    )
                  }
                >
                  <h3
                    className={tourNavSectionTitleClassName}
                    aria-hidden='true'
                  >
                    <span
                      className={tourNavSectionTitleIconClassName}
                      aria-hidden='true'
                    >
                      <ExploreDirectoryTabIcon
                        tab={section.tab}
                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                      />
                    </span>
                    <span className={tourNavSectionTitleLabelClassName}>
                      {section.label}
                    </span>
                  </h3>
                  <span
                    className={cn(
                      tourNavSectionTitleToggleClassName,
                      section.groupsAnyExpanded &&
                        tourNavSectionTitleToggleOpenClassName,
                    )}
                    aria-hidden='true'
                  >
                    <MaterialSymbol
                      name='chevron_right'
                      sizePx={MATERIAL_SYMBOL_SIZE_20}
                      className={tourNavSectionTitleChevronClassName}
                    />
                  </span>
                </button>
              </IconTooltip>
            : <h3 className={tourNavSectionTitleClassName} aria-hidden='true'>
                <span
                  className={tourNavSectionTitleIconClassName}
                  aria-hidden='true'
                >
                  <ExploreDirectoryTabIcon
                    tab={section.tab}
                    sizePx={MATERIAL_SYMBOL_SIZE_18}
                  />
                </span>
                <span className={tourNavSectionTitleLabelClassName}>
                  {section.label}
                </span>
              </h3>
            }
            <span
              className={tourNavSectionTitleDividerLineClassName}
              aria-hidden='true'
            />
          </div>
        : null}
        {group ?
          <IconTooltip
            label={
              group.expanded ?
                `Collapse ${group.title}`
              : `Expand ${group.title}`
            }
            placement='top'
            className='block w-full'
          >
            <button
              type='button'
              className={cn(
                tourNavDirectoryPinGroupClassName,
                group.expanded && tourNavLocationGroupHeaderOpenClassName,
              )}
              aria-expanded={group.expanded}
              aria-label={
                group.expanded ?
                  `Collapse ${group.title}`
                : `Expand ${group.title}`
              }
              onClick={() =>
                clickExploreDirectoryPinSource(scrollRef.current, group.key)
              }
            >
              <span
                className={cn(
                  tourNavLocationGroupChevronClassName,
                  group.expanded && tourNavLocationGroupChevronOpenClassName,
                )}
              >
                <MaterialSymbol
                  name='chevron_right'
                  sizePx={MATERIAL_SYMBOL_SIZE_20}
                  className={tourNavLocationGroupChevronIconClassName}
                />
              </span>
              <span
                className={tourNavLocationGroupTitleClassName}
                aria-hidden='true'
              >
                {group.title}
              </span>
              {group.metaLabel ?
                <span
                  className={tourNavLocationGroupMetaClassName}
                  aria-hidden='true'
                >
                  {group.metaLabel}
                </span>
              : null}
            </button>
          </IconTooltip>
        : null}
      </div>
    </div>
  );
}
