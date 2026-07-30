import { useEffect, useMemo } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { useExploreDirectoryMediaLoad } from '../hooks/useExploreDirectoryMediaLoad';
import { useLazyInView } from '../hooks/useLazyInView';
import { useScenePreview } from '../hooks/useScenePreview';
import { cn } from '../lib/cn';
import {
  EXPLORE_GALLERY_NAMING_VIEW_LABEL,
  EXPLORE_GALLERY_VISIT_LABEL,
  exploreNamingVisitPlaceAriaLabel,
  tourDirectoryNamingInfoAriaLabel,
} from '../constants/tourDirectory';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import type { Scene, TourViewerType, ViewPosition } from '../types/tour';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDirectoryListItemActions } from './ExploreDirectoryListItemActions';
import { useExploreGroupMediaReady } from './ExploreGroupMediaReady';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { NamingHeartIcon } from './icons/NamingHeartIcon';
import type { NamingStatusModifier } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import {
  tourNavCurrentListChipClassName,
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemBadgeColumnClassName,
  tourNavDirectoryListItemBodyClassName,
  tourNavDirectoryListItemBodyMainClassName,
  tourNavDirectoryListItemContentClassName,
  tourNavDirectoryListItemNamingMainClassName,
  tourNavDirectoryListItemPrimaryCtaClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemBadgeClassName,
  tourNavItemLeadingThumbClassName,
  tourNavItemLeadingThumbFallbackClassName,
  tourNavItemLeadingThumbImageClassName,
  tourNavItemLeadingThumbSkeletonClassName,
  tourNavItemNamingDescriptionClassName,
  tourNavItemNamingHeaderClassName,
  tourNavItemNamingLocationClassName,
  tourNavItemNamingMetaStackClassName,
  tourNavItemNamingNameClassName,
  tourNavItemNamingPriceClassName,
  tourNavItemNamingTitleRowClassName,
  tourNavItemNamingTopRowClassName,
  tourNavItemTextClassName,
  tourNavSceneInfoButtonClassName,
} from './tourNavFloatVariants';
import type { TourDirectoryNamingItem } from '../utils/tourDirectory';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

function resolveListNamingPreviewView(
  scene: Scene | undefined,
  hotspotId: string,
): ViewPosition | undefined {
  if (!scene) return undefined;
  const hotspot = scene.hotspots.find((entry) => entry.id === hotspotId);
  const pos = hotspot?.position as ViewPosition | undefined;
  if (typeof pos?.yaw === 'number' && typeof pos?.pitch === 'number') {
    return {
      yaw: pos.yaw,
      pitch: pos.pitch,
      zoom: pos.zoom ?? scene.defaultView?.zoom,
    };
  }
  return scene.defaultView;
}

interface ExploreNamingDirectoryListItemProps {
  tourId: string;
  item: TourDirectoryNamingItem;
  scene?: Scene;
  tourViewerType?: TourViewerType;
  active: boolean;
  priceLabel: string;
  disabled?: boolean;
  /** Show the scene (place) name under the title. Off when a scene subheader already names it. */
  showLocation?: boolean;
  /** Open the naming opportunity (framed panel). */
  onSelect: () => void;
  /** Go to the place without opening the opportunity panel. */
  onVisitPlace: () => void;
}

export function ExploreNamingDirectoryListItem({
  tourId,
  item,
  scene,
  tourViewerType = 'panorama',
  active,
  priceLabel,
  disabled = false,
  showLocation = true,
  onSelect,
  onVisitPlace,
}: ExploreNamingDirectoryListItemProps) {
  const { isCoarsePointer } = useTourChromeLayout();
  const groupMediaReady = useExploreGroupMediaReady();
  const { ref: thumbRef, inView } = useLazyInView<HTMLSpanElement>();
  const isSold = item.statusModifier === 'sold';
  const description = item.description?.trim();
  const donorCredit = item.donorCredit?.trim();
  const showActions = true;
  const visitPlaceLabel = exploreNamingVisitPlaceAriaLabel(item.sceneTitle);
  const viewOpportunityLabel = tourDirectoryNamingInfoAriaLabel(item.name);
  const creditSuffix = donorCredit ? ` ${donorCredit}.` : '';
  const rowAriaLabel =
    active ?
      description ?
        `${item.name}, current naming opportunity, ${item.sceneTitle}.${creditSuffix} ${item.statusLabel}. ${priceLabel}. ${description}`
      : `${item.name}, current naming opportunity, ${item.sceneTitle}.${creditSuffix} ${item.statusLabel}. ${priceLabel}.`
    : description ?
      `${visitPlaceLabel}. ${item.name}.${creditSuffix} ${item.statusLabel}. ${priceLabel}. ${description}`
    : `${visitPlaceLabel}. ${item.name}.${creditSuffix} ${item.statusLabel}. ${priceLabel}.`;

  const previewScene = useMemo((): Scene => {
    const base: Scene = scene ?? {
      id: item.sceneId,
      title: item.sceneTitle,
      panorama: '',
      defaultView: { yaw: 0, pitch: 0, zoom: 50 },
      hotspots: [],
    };

    if (item.previewImage) {
      return {
        ...base,
        thumbnail: item.previewImage,
        ...(tourViewerType === 'model3d' ?
          { panorama: item.previewImage }
        : {}),
      };
    }

    return base;
  }, [item.previewImage, item.sceneId, item.sceneTitle, scene, tourViewerType]);

  const previewView = useMemo(
    () => resolveListNamingPreviewView(scene, item.hotspotId),
    [item.hotspotId, scene],
  );

  const previewOptions = useMemo(() => {
    if (item.previewImage) return undefined;
    if (tourViewerType === 'model3d') return undefined;
    return { view: previewView, cacheKeySuffix: `no:${item.hotspotId}` };
  }, [item.hotspotId, item.previewImage, previewView, tourViewerType]);

  const wantsLoad =
    inView &&
    groupMediaReady &&
    Boolean(previewScene.panorama || previewScene.thumbnail);
  const { allowed: mediaAllowed, onSettled: onMediaSettled } =
    useExploreDirectoryMediaLoad(wantsLoad);
  const { src: previewSrc, failed: previewFailed } = useScenePreview(
    tourId,
    previewScene,
    mediaAllowed,
    previewOptions,
  );
  const thumbSrc = previewSrc && !previewFailed ? previewSrc : null;
  // Icon only after failure / missing asset — never as a loading placeholder.
  const hasPreviewSource = Boolean(
    previewScene.panorama || previewScene.thumbnail,
  );
  const showThumbSkeleton = hasPreviewSource && !thumbSrc && !previewFailed;

  useEffect(() => {
    if (mediaAllowed && previewFailed) onMediaSettled();
  }, [mediaAllowed, onMediaSettled, previewFailed]);

  const visitCta = (
    <>
      <span className='min-w-0 truncate'>{EXPLORE_GALLERY_VISIT_LABEL}</span>
      <ExploreGalleryCtaArrowIcon
        variant='text'
        sizePx={MATERIAL_SYMBOL_SIZE_14}
      />
    </>
  );

  const viewOpportunityButton = (
    <button
      type='button'
      className={tourNavSceneInfoButtonClassName({ variant: 'listText' })}
      disabled={disabled}
      aria-label={viewOpportunityLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
    >
      <span>{EXPLORE_GALLERY_NAMING_VIEW_LABEL}</span>
    </button>
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
        <NamingHeartIcon active={active} sold={isSold} />
      </span>;

  const body = (
    <span className={tourNavDirectoryListItemBodyClassName}>
      {leading}
      <span className={tourNavDirectoryListItemContentClassName}>
        <span
          className={cn(
            tourNavDirectoryListItemBodyMainClassName,
            tourNavDirectoryListItemNamingMainClassName,
            tourNavItemTextClassName,
          )}
        >
          {active ?
            <ExploreCurrentHereLabel
              className={tourNavCurrentListChipClassName}
            />
          : null}
          <span className={tourNavItemNamingTopRowClassName}>
            <span className={tourNavItemNamingHeaderClassName}>
              <span className={tourNavItemNamingTitleRowClassName}>
                <span className={tourNavItemNamingNameClassName}>
                  {item.name}
                </span>
              </span>
              {showLocation || donorCredit ?
                <span className={tourNavItemNamingMetaStackClassName}>
                  {showLocation ?
                    <span className={tourNavItemNamingLocationClassName}>
                      {item.sceneTitle}
                    </span>
                  : null}
                  {donorCredit ?
                    <span className={tourNavItemNamingLocationClassName}>
                      {donorCredit}
                    </span>
                  : null}
                </span>
              : null}
            </span>
            <span className={tourNavDirectoryListItemBadgeColumnClassName}>
              <NamingStatusBadge
                statusModifier={item.statusModifier as NamingStatusModifier}
                label={item.statusLabel}
                className={cn(tourNavItemBadgeClassName, 'ml-0')}
              />
              {priceLabel ?
                <span className={tourNavItemNamingPriceClassName}>
                  {priceLabel}
                </span>
              : null}
            </span>
          </span>
          {description ?
            <span className={tourNavItemNamingDescriptionClassName}>
              {description}
            </span>
          : null}
        </span>
        {showActions ?
          <ExploreDirectoryListItemActions>
            {viewOpportunityButton}
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
                data-tour-nav-directory-kind='naming'
                disabled={disabled}
                className={tourNavDirectoryListItemPrimaryCtaClassName}
                onClick={onVisitPlace}
                aria-label={visitPlaceLabel}
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
    <li
      role='presentation'
      {...{ [FLIP_LIST_KEY_ATTR]: `${item.sceneId}:${item.hotspotId}` }}
    >
      <div
        className={cn(
          tourNavDirectoryItemVariants({
            kind: 'naming',
            active,
            statusTone: isSold ? 'sold' : 'default',
          }),
          !isCoarsePointer && !active && 'cursor-auto',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {isCoarsePointer ?
          <button
            type='button'
            role='option'
            aria-selected={active}
            data-tour-nav-directory-kind='naming'
            className={tourNavDirectoryListItemSelectClassName}
            disabled={disabled}
            onClick={onVisitPlace}
            aria-label={rowAriaLabel}
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
