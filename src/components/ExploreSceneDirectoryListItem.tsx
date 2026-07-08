import { type ReactNode } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import type { Scene } from '../types/tour';
import { EXPLORE_GALLERY_VISIT_LABEL } from '../constants/tourDirectory';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDirectoryListItemActions } from './ExploreDirectoryListItemActions';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import {
  tourNavCurrentInlineLabelClassName,
  tourNavDirectoryItemTitleRowClassName,
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemPrimaryCtaClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemDescriptionClassName,
  tourNavItemLabelClassName,
  tourNavItemLeadingLocationClassName,
  tourNavItemTextClassName,
} from './tourNavFloatVariants';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';
import { cn } from '../lib/cn';

interface ExploreSceneDirectoryListItemProps {
  scene: Scene;
  active: boolean;
  isTourStart?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onShowDescription?: () => void;
  locationIcon: ReactNode;
}

export function ExploreSceneDirectoryListItem({
  scene,
  active,
  isTourStart = false,
  disabled = false,
  onSelect,
  onShowDescription,
  locationIcon,
}: ExploreSceneDirectoryListItemProps) {
  const description = scene.description?.trim();
  const showInfo = Boolean(description && onShowDescription);
  const showActions = true;
  const tourStartPrefix = isTourStart ? 'Tour start location. ' : '';
  const ariaLabel =
    active ?
      description ?
        `${tourStartPrefix}${scene.title}, current location. ${description}`
      : `${tourStartPrefix}${scene.title}, current location`
    : description ? `${tourStartPrefix}Go to ${scene.title}. ${description}`
    : `${tourStartPrefix}Go to ${scene.title}`;

  return (
    <li role='presentation' {...{ [FLIP_LIST_KEY_ATTR]: scene.id }}>
      <div
        className={cn(
          tourNavDirectoryItemVariants({ kind: 'location', active }),
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <button
          type='button'
          role='option'
          aria-selected={active}
          data-tour-nav-directory-kind='location'
          className={tourNavDirectoryListItemSelectClassName}
          disabled={disabled}
          onClick={onSelect}
          aria-label={ariaLabel}
        >
          <span className={tourNavItemLeadingLocationClassName}>
            {locationIcon}
          </span>
          <span className={tourNavItemTextClassName}>
            {active ?
              <ExploreCurrentHereLabel
                className={tourNavCurrentInlineLabelClassName}
              />
            : null}
            <span className={tourNavDirectoryItemTitleRowClassName}>
              <span className={tourNavItemLabelClassName}>{scene.title}</span>
            </span>
            {description || showActions ?
              <span className='flex min-w-0 flex-col'>
                {description ?
                  <span className={tourNavItemDescriptionClassName}>
                    {description}
                  </span>
                : null}
                {showActions ?
                  <ExploreDirectoryListItemActions>
                    {showInfo ?
                      <ExploreSceneInfoButton
                        variant='listText'
                        sceneTitle={scene.title}
                        disabled={disabled}
                        onShow={onShowDescription!}
                      />
                    : null}
                    <span
                      className={tourNavDirectoryListItemPrimaryCtaClassName}
                      aria-hidden='true'
                    >
                      <span className='min-w-0 truncate'>
                        {EXPLORE_GALLERY_VISIT_LABEL}
                      </span>
                      <ExploreGalleryCtaArrowIcon
                        variant='text'
                        sizePx={MATERIAL_SYMBOL_SIZE_14}
                      />
                    </span>
                  </ExploreDirectoryListItemActions>
                : null}
              </span>
            : null}
          </span>
        </button>
      </div>
    </li>
  );
}
