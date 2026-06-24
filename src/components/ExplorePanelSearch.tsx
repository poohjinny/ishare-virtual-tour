import { useRef, type RefObject } from 'react';
import { TOUR_DIRECTORY_SEARCH_PLACEHOLDER } from '../constants/tourDirectory';
import {
  TOUR_NAV_ACTION_SEARCH_CLOSE,
  TOUR_NAV_ACTION_SEARCH_OPEN,
  tourNavIconButtonA11y,
} from '../constants/tourNavActions';
import { cn } from '../lib/cn';
import { GlassPanelCloseIcon } from './TourGlassPanel';
import { IconTooltip } from './ui/IconTooltip';
import {
  tourNavExploreSearchCloseClassName,
  tourNavExploreSearchIconClassName,
  tourNavExploreSearchInputClassName,
  tourNavExploreSearchInputWrapClassName,
  tourNavExploreSearchPillVariants,
  tourNavExploreSearchTriggerClassName,
  tourNavSearchCloseIconClassName,
} from './tourNavFloatVariants';

function ExplorePanelSearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='8.5'
        cy='8.5'
        r='5.5'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M13 13L17 17'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

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
          className={cn(
            tourNavExploreSearchTriggerClassName,
            open && 'hidden',
          )}
          onClick={onOpen}
          disabled={disabled}
          aria-expanded={open}
          aria-controls='tour-nav-explore-search-input'
          tabIndex={open ? -1 : 0}
          {...tourNavIconButtonA11y(TOUR_NAV_ACTION_SEARCH_OPEN)}
        >
          <ExplorePanelSearchIcon className={tourNavExploreSearchIconClassName} />
        </button>
      </IconTooltip>

      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-1.5',
          !open && 'hidden',
        )}
        aria-hidden={!open}
      >
        <ExplorePanelSearchIcon
          className={cn(tourNavExploreSearchIconClassName, 'text-muted')}
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
            <GlassPanelCloseIcon className={tourNavSearchCloseIconClassName} />
          </button>
        </IconTooltip>
      </div>
    </div>
  );
}
