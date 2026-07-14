import { type ReactNode } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { useLazyInView } from '../hooks/useLazyInView';
import { useScenePreview } from '../hooks/useScenePreview';
import type { Scene } from '../types/tour';
import { EXPLORE_GALLERY_VISIT_LABEL } from '../constants/tourDirectory';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDirectoryListItemActions } from './ExploreDirectoryListItemActions';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import {
  tourNavCurrentInlineLabelClassName,
  tourNavDirectoryItemTitleRowClassName,
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemBodyClassName,
  tourNavDirectoryListItemBodyMainClassName,
  tourNavDirectoryListItemPrimaryCtaClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemDescriptionClassName,
  tourNavItemLabelClassName,
  tourNavItemLeadingThumbClassName,
  tourNavItemLeadingThumbFallbackClassName,
  tourNavItemLeadingThumbImageClassName,
  tourNavItemMetaClassName,
  tourNavItemTextClassName,
} from './tourNavFloatVariants';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';
import { cn } from '../lib/cn';

interface ExploreSceneDirectoryListItemProps {
  tourId: string;
  scene: Scene;
  active: boolean;
  isTourStart?: boolean;
  /** Floor / department when the same title appears on multiple scenes. */
  contextLabel?: string;
  disabled?: boolean;
  onSelect: () => void;
  onShowDescription?: () => void;
  /** Fallback when the scene thumbnail is missing or fails to load. */
  locationIcon: ReactNode;
}

export function ExploreSceneDirectoryListItem({
  tourId,
  scene,
  active,
  isTourStart = false,
  contextLabel,
  disabled = false,
  onSelect,
  onShowDescription,
  locationIcon,
}: ExploreSceneDirectoryListItemProps) {
  const { isCoarsePointer } = useTourChromeLayout();
  const { ref: thumbRef, inView } = useLazyInView<HTMLSpanElement>();
  const { src: previewSrc, failed: previewFailed } = useScenePreview(
    tourId,
    scene,
    inView,
  );
  const thumbSrc = previewSrc && !previewFailed ? previewSrc : null;
  const description = scene.description?.trim();
  const showInfo = Boolean(description && onShowDescription);
  const showActions = true;
  const tourStartPrefix = isTourStart ? 'Tour start location. ' : '';
  const contextSuffix = contextLabel ? `, ${contextLabel}` : '';
  const ariaLabel =
    active ?
      description ?
        `${tourStartPrefix}${scene.title}${contextSuffix}, current location. ${description}`
      : `${tourStartPrefix}${scene.title}${contextSuffix}, current location`
    : description ?
      `${tourStartPrefix}Go to ${scene.title}${contextSuffix}. ${description}`
    : `${tourStartPrefix}Go to ${scene.title}${contextSuffix}`;

  const visitCta = (
    <>
      <span className='min-w-0 truncate'>{EXPLORE_GALLERY_VISIT_LABEL}</span>
      <ExploreGalleryCtaArrowIcon
        variant='text'
        sizePx={MATERIAL_SYMBOL_SIZE_14}
      />
    </>
  );

  const leading =
    thumbSrc ?
      <span ref={thumbRef} className={tourNavItemLeadingThumbClassName}>
        <img
          className={tourNavItemLeadingThumbImageClassName}
          src={thumbSrc}
          alt=''
          aria-hidden='true'
          draggable={false}
        />
      </span>
    : <span ref={thumbRef} className={tourNavItemLeadingThumbFallbackClassName}>
        {locationIcon}
      </span>;

  const body = (
    <span className={tourNavDirectoryListItemBodyClassName}>
      {leading}
      <span
        className={cn(
          tourNavDirectoryListItemBodyMainClassName,
          tourNavItemTextClassName,
        )}
      >
        {active ?
          <ExploreCurrentHereLabel
            className={tourNavCurrentInlineLabelClassName}
          />
        : null}
        <span className={tourNavDirectoryItemTitleRowClassName}>
          <span className={tourNavItemLabelClassName}>{scene.title}</span>
          {contextLabel ?
            <span className={tourNavItemMetaClassName}>{contextLabel}</span>
          : null}
        </span>
        {description ?
          <span className={tourNavItemDescriptionClassName}>{description}</span>
        : null}
      </span>
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
          {isCoarsePointer ?
            <span
              className={tourNavDirectoryListItemPrimaryCtaClassName}
              aria-hidden='true'
            >
              {visitCta}
            </span>
          : <button
              type='button'
              role='option'
              aria-selected={active}
              data-tour-nav-directory-kind='location'
              disabled={disabled}
              className={tourNavDirectoryListItemPrimaryCtaClassName}
              onClick={onSelect}
              aria-label={ariaLabel}
            >
              {visitCta}
            </button>
          }
        </ExploreDirectoryListItemActions>
      : null}
    </span>
  );

  return (
    <li role='presentation' {...{ [FLIP_LIST_KEY_ATTR]: scene.id }}>
      <div
        className={cn(
          tourNavDirectoryItemVariants({ kind: 'location', active }),
          !isCoarsePointer && !active && 'cursor-auto',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {isCoarsePointer ?
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
            {body}
          </button>
        : <div
            className={cn(
              tourNavDirectoryListItemSelectClassName,
              'cursor-auto',
            )}
          >
            {body}
          </div>
        }
      </div>
    </li>
  );
}
