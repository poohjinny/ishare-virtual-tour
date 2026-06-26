import { useEffect, useId, useRef, useState } from 'react';
import type {
  ExploreDirectorySort,
  ExploreDirectorySortOption,
} from '../constants/tourDirectorySort';
import { tourNavExploreSortActionLabel } from '../constants/tourDirectorySort';
import { tourNavIconButtonA11y } from '../constants/tourNavActions';
import { cn } from '../lib/cn';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
} from './tourGlassPanelVariants';
import { ExploreSortOptionIcon } from './icons/ExploreSortOptionIcons';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_22,
} from './ui/materialSymbolClasses';
import {
  tourNavExploreSortCheckClassName,
  tourNavExploreSortMenuClassName,
  tourNavExploreSortMenuInClassName,
  tourNavExploreSortMenuOutClassName,
  tourNavExploreSortOptionLeadingClassName,
  tourNavExploreSortOptionVariants,
  tourNavExploreSortRootClassName,
} from './tourNavFloatVariants';

const SORT_MENU_EXIT_MS = 140;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Keep the menu mounted through the close animation. */
function useDeferredSortMenuMount(open: boolean): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timer = window.setTimeout(
      () => setMounted(false),
      prefersReducedMotion() ? 0 : SORT_MENU_EXIT_MS,
    );

    return () => window.clearTimeout(timer);
  }, [open]);

  return open || mounted;
}

interface ExplorePanelSortProps {
  value: ExploreDirectorySort;
  options: ExploreDirectorySortOption[];
  disabled?: boolean;
  onChange: (sort: ExploreDirectorySort) => void;
}

export function ExplorePanelSort({
  value,
  options,
  disabled = false,
  onChange,
}: ExplorePanelSortProps) {
  const [open, setOpen] = useState(false);
  const menuMounted = useDeferredSortMenuMount(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const tooltipLabel = tourNavExploreSortActionLabel(value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root?.contains(event.target as Node)) {
        setOpen(false);
      }
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
    <div ref={rootRef} className={tourNavExploreSortRootClassName}>
      <IconTooltip label={tooltipLabel} placement='bottom'>
        <button
          type='button'
          className={tourGlassPanelCloseClassName}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup='listbox'
          aria-controls={menuMounted ? menuId : undefined}
          onClick={() => setOpen((current) => !current)}
          {...tourNavIconButtonA11y(tooltipLabel)}
        >
          <MaterialSymbol
            name='sort'
            className={tourGlassPanelCloseIconClassName}
            sizePx={MATERIAL_SYMBOL_SIZE_22}
          />
        </button>
      </IconTooltip>

      {menuMounted && (
        <ul
          id={menuId}
          role='listbox'
          aria-label='Sort options'
          aria-hidden={!open}
          className={cn(
            tourNavExploreSortMenuClassName,
            open ?
              tourNavExploreSortMenuInClassName
            : tourNavExploreSortMenuOutClassName,
          )}
        >
          {options.map((option) => {
            const selected = option.id === value;

            return (
              <li key={option.id} role='presentation'>
                <button
                  type='button'
                  role='option'
                  aria-selected={selected}
                  tabIndex={open ? 0 : -1}
                  className={tourNavExploreSortOptionVariants({ selected })}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span className={tourNavExploreSortOptionLeadingClassName}>
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
      )}
    </div>
  );
}
