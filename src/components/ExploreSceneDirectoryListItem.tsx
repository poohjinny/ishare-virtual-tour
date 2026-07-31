import { type ReactNode, useEffect } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { useExploreDirectoryMediaLoad } from '../hooks/useExploreDirectoryMediaLoad';
import { useLazyInView } from '../hooks/useLazyInView';
import { useScenePreview } from '../hooks/useScenePreview';
import type {
  Hotspot,
  NamingOpportunityRecord,
  Scene,
  TourViewerType,
} from '../types/tour';
import { EXPLORE_GALLERY_VISIT_LABEL } from '../constants/tourDirectory';
import {
  renderInlineMarkdown,
  stripInlineMarkdown,
} from '../utils/inlineMarkdown';
import { resolveScenePlaceLead } from '../utils/resolveScenePlaceLead';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDirectoryListItemActions } from './ExploreDirectoryListItemActions';
import { useExploreGroupMediaReady } from './ExploreGroupMediaReady';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import {
  tourNavCurrentListChipClassName,
  tourNavDirectoryItemTitleRowClassName,
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemBodyClassName,
  tourNavDirectoryListItemBodyMainClassName,
  tourNavDirectoryListItemContentClassName,
  tourNavDirectoryListItemPrimaryCtaClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemDescriptionClassName,
  tourNavItemLabelClassName,
  tourNavItemLeadingThumbClassName,
  tourNavItemLeadingThumbFallbackClassName,
  tourNavItemLeadingThumbImageClassName,
  tourNavItemLeadingThumbSkeletonClassName,
  tourNavItemMetaClassName,
  tourNavItemTextClassName,
} from './tourNavFloatVariants';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';
import { cn } from '../lib/cn';

interface ExploreSceneDirectoryListItemProps {
  tourId: string;
  scene: Scene;
  tourTitle?: string;
  tourHotspots?: Hotspot[];
  tourViewerType?: TourViewerType;
  namingOpportunities?: Record<string, NamingOpportunityRecord>;
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
  tourTitle,
  tourHotspots,
  tourViewerType,
  namingOpportunities,
  active,
  isTourStart = false,
  contextLabel,
  disabled = false,
  onSelect,
  onShowDescription,
  locationIcon,
}: ExploreSceneDirectoryListItemProps) {
  const { isCoarsePointer } = useTourChromeLayout();
  const groupMediaReady = useExploreGroupMediaReady();
  const { ref: thumbRef, inView } = useLazyInView<HTMLSpanElement>();
  const wantsLoad = inView && groupMediaReady;
  const { allowed: mediaAllowed, onSettled: onMediaSettled } =
    useExploreDirectoryMediaLoad(wantsLoad);
  const { src: previewSrc, failed: previewFailed } = useScenePreview(
    tourId,
    scene,
    mediaAllowed,
  );
  const thumbSrc = previewSrc && !previewFailed ? previewSrc : null;
  // Icon only after failure / missing asset — never as a loading placeholder.
  const hasPreviewSource = Boolean(scene.thumbnail || scene.panorama);
  const showThumbSkeleton = hasPreviewSource && !thumbSrc && !previewFailed;

  useEffect(() => {
    if (mediaAllowed && previewFailed) onMediaSettled();
  }, [mediaAllowed, onMediaSettled, previewFailed]);
  const description = resolveScenePlaceLead(
    {
      id: tourId,
      title: tourTitle ?? '',
      hotspots: tourHotspots,
      viewerType: tourViewerType,
      namingOpportunities,
    },
    scene,
  ).trim();
  const descriptionPlain = description ? stripInlineMarkdown(description) : '';
  const showInfo = Boolean(onShowDescription);
  const showActions = true;
  const tourStartPrefix = isTourStart ? 'Tour start location. ' : '';
  const contextSuffix = contextLabel ? `, ${contextLabel}` : '';
  const ariaLabel =
    active ?
      descriptionPlain ?
        `${tourStartPrefix}${scene.title}${contextSuffix}, current location. ${descriptionPlain}`
      : `${tourStartPrefix}${scene.title}${contextSuffix}, current location`
    : descriptionPlain ?
      `${tourStartPrefix}Go to ${scene.title}${contextSuffix}. ${descriptionPlain}`
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
          loading='lazy'
          decoding='async'
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) onMediaSettled();
          }}
          onLoad={onMediaSettled}
          onError={onMediaSettled}
        />
      </span>
    : showThumbSkeleton ?
      <span
        ref={thumbRef}
        className={tourNavItemLeadingThumbSkeletonClassName}
        aria-hidden='true'
        aria-busy='true'
      />
    : <span ref={thumbRef} className={tourNavItemLeadingThumbFallbackClassName}>
        {locationIcon}
      </span>;

  const body = (
    <span className={tourNavDirectoryListItemBodyClassName}>
      {leading}
      <span className={tourNavDirectoryListItemContentClassName}>
        <span
          className={cn(
            tourNavDirectoryListItemBodyMainClassName,
            tourNavItemTextClassName,
          )}
        >
          {active ?
            <ExploreCurrentHereLabel
              className={tourNavCurrentListChipClassName}
            />
          : null}
          <span className={tourNavDirectoryItemTitleRowClassName}>
            <span className={tourNavItemLabelClassName}>{scene.title}</span>
            {contextLabel ?
              <span className={tourNavItemMetaClassName}>{contextLabel}</span>
            : null}
          </span>
          {description ?
            <span className={tourNavItemDescriptionClassName}>
              {renderInlineMarkdown(description, scene.id)}
            </span>
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
