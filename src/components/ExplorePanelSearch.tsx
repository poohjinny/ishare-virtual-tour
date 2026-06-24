import { useRef, type RefObject } from 'react';
import { TOUR_DIRECTORY_SEARCH_PLACEHOLDER } from '../constants/tourDirectory';
import {
  TOUR_NAV_ACTION_SEARCH_CLOSE,
  TOUR_NAV_ACTION_SEARCH_OPEN,
  tourNavIconButtonA11y,
} from '../constants/tourNavActions';
import { cn } from '../lib/cn';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_18, MATERIAL_SYMBOL_SIZE_22 } from './ui/materialSymbolClasses';
import {
  tourNavExploreSearchCloseClassName,
  tourNavExploreSearchIconClassName,
  tourNavExploreSearchInputClassName,
  tourNavExploreSearchInputWrapClassName,
  tourNavExploreSearchPillVariants,
  tourNavExploreSearchTriggerClassName,
  tourNavSearchCloseIconClassName,
} from './tourNavFloatVariants';

interface ExplorePanelSearchProps {
  open: boolean;
  value: string;
  disabled?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
}

export function ExplorePanelSearch({
  open,
  value,
  disabled = false,
  inputRef,
  onOpen,
  onClose,
  onChange,
}: ExplorePanelSearchProps) {
  const pillRef = useRef<HTMLDivElement>(null);

  const handleInputBlur = () => {
    if (value.trim().length > 0) return;

    window.requestAnimationFrame(() => {
      const pill = pillRef.current;
      if (!pill) return;
      if (pill.contains(document.activeElement)) return;
      onClose();
    });
  };

  return (
    <div
      ref={pillRef}
      className={tourNavExploreSearchPillVariants({ open })}
      data-explore-search-pill=''
      data-open={open ? 'true' : 'false'}
    >
      <IconTooltip label={TOUR_NAV_ACTION_SEARCH_OPEN} placement='bottom'>
        <button
          type='button'
          className={cn(tourNavExploreSearchTriggerClassName, open && 'hidden')}
          onClick={onOpen}
          disabled={disabled}
          aria-expanded={open}
          aria-controls='tour-nav-explore-search-input'
          tabIndex={open ? -1 : 0}
          {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SEARCH_OPEN)}
        >
          <MaterialSymbol
            name='search'
            className={tourNavExploreSearchIconClassName}
            sizePx={MATERIAL_SYMBOL_SIZE_22}
          />
        </button>
      </IconTooltip>

      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-1.5',
          !open && 'hidden',
        )}
        aria-hidden={!open}
      >
        <MaterialSymbol
          name='search'
          className={cn(tourNavExploreSearchIconClassName, 'text-muted')}
          sizePx={MATERIAL_SYMBOL_SIZE_22}
        />
        <div className={tourNavExploreSearchInputWrapClassName}>
          <input
            ref={inputRef}
            id='tour-nav-explore-search-input'
            type='text'
            role='searchbox'
            inputMode='search'
            enterKeyHint='search'
            className={tourNavExploreSearchInputClassName}
            placeholder={TOUR_DIRECTORY_SEARCH_PLACEHOLDER}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onBlur={handleInputBlur}
            autoComplete='off'
            spellCheck={false}
            tabIndex={open ? 0 : -1}
            aria-label={TOUR_DIRECTORY_SEARCH_PLACEHOLDER}
            aria-controls='tour-nav-explore-search-results'
          />
        </div>
        <IconTooltip label={TOUR_NAV_ACTION_SEARCH_CLOSE} placement='bottom'>
          <button
            type='button'
            className={tourNavExploreSearchCloseClassName}
            onClick={onClose}
            disabled={disabled}
            tabIndex={open ? 0 : -1}
            {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SEARCH_CLOSE)}
          >
            <MaterialSymbol
              name='close'
              className={tourNavSearchCloseIconClassName}
              sizePx={MATERIAL_SYMBOL_SIZE_18}
            />
          </button>
        </IconTooltip>
      </div>
    </div>
  );
}
