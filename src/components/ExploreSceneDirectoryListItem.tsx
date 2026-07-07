import { type ReactNode } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import type { Scene } from '../types/tour';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import { ExploreTourStartPin } from './ExploreTourStartPin';
import {
  tourNavDirectoryItemTitleRowClassName,
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemBadgeColumnClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemDescriptionClassName,
  tourNavItemLabelClassName,
  tourNavItemLeadingLocationClassName,
  tourNavItemTextClassName,
} from './tourNavFloatVariants';
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
            <span className={tourNavDirectoryItemTitleRowClassName}>
              <span className={tourNavItemLabelClassName}>{scene.title}</span>
              {isTourStart ?
                <ExploreTourStartPin variant='list' />
              : null}
            </span>
            {description ?
              <span className={tourNavItemDescriptionClassName}>
                {description}
              </span>
            : null}
          </span>
        </button>
        {showInfo ?
          <div className={tourNavDirectoryListItemBadgeColumnClassName}>
            <ExploreSceneInfoButton
              variant='list'
              sceneTitle={scene.title}
              disabled={disabled}
              onShow={onShowDescription!}
            />
          </div>
        : null}
      </div>
    </li>
  );
}
