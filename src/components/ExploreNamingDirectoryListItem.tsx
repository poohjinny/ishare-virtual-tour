import { useMemo } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { useLazyInView } from '../hooks/useLazyInView';
import { useScenePreview } from '../hooks/useScenePreview';
import { cn } from '../lib/cn';
import {
  EXPLORE_GALLERY_NAMING_VIEW_LABEL,
  EXPLORE_GALLERY_VISIT_LABEL,
  exploreNamingVisitPlaceAriaLabel,
} from '../constants/tourDirectory';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import type { Scene, TourViewerType } from '../types/tour';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDirectoryListItemActions } from './ExploreDirectoryListItemActions';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { NamingHeartIcon } from './icons/NamingHeartIcon';
import type { NamingStatusModifier } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import {
  tourNavCurrentInlineLabelClassName,
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemBadgeColumnClassName,
  tourNavDirectoryListItemNamingMainClassName,
  tourNavDirectoryListItemPrimaryCtaClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemBadgeClassName,
  tourNavItemLeadingThumbClassName,
  tourNavItemLeadingThumbFallbackClassName,
  tourNavItemLeadingThumbImageClassName,
  tourNavItemNamingDescriptionClassName,
  tourNavItemNamingHeaderClassName,
  tourNavItemNamingLocationClassName,
  tourNavItemNamingNameClassName,
  tourNavItemNamingPriceClassName,
  tourNavItemNamingTitleRowClassName,
  tourNavItemTextClassName,
  tourNavSceneInfoButtonClassName,
} from './tourNavFloatVariants';
import type { TourDirectoryNamingItem } from '../utils/tourDirectory';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

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
  const { ref: thumbRef, inView } = useLazyInView<HTMLSpanElement>();
  const isClosed = item.statusModifier === 'closed';
  const description = item.description?.trim();
  const showActions = true;
  const visitPlaceLabel = exploreNamingVisitPlaceAriaLabel(item.sceneTitle);
  const viewOpportunityLabel = `${EXPLORE_GALLERY_NAMING_VIEW_LABEL}: ${item.name}`;
  const rowAriaLabel =
    active ?
      description ?
        `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}. ${description}`
      : `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}.`
    : description ?
      `${visitPlaceLabel}. ${item.name}. ${item.statusLabel}. ${priceLabel}. ${description}`
    : `${visitPlaceLabel}. ${item.name}. ${item.statusLabel}. ${priceLabel}.`;

  const previewScene = useMemo((): Scene => {
    const base: Scene = scene ?? {
      id: item.sceneId,
      title: item.sceneTitle,
      panorama: '',
      defaultView: { yaw: 0, pitch: 0, zoom: 50 },
      hotspots: [],
    };

    if (tourViewerType === 'model3d' && item.previewImage) {
      return {
        ...base,
        thumbnail: item.previewImage,
        panorama: item.previewImage,
      };
    }

    return base;
  }, [item.previewImage, item.sceneId, item.sceneTitle, scene, tourViewerType]);

  const { src: previewSrc, failed: previewFailed } = useScenePreview(
    tourId,
    previewScene,
    inView && Boolean(previewScene.panorama || previewScene.thumbnail),
  );
  const thumbSrc = previewSrc && !previewFailed ? previewSrc : null;

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
        />
      </span>
    : <span ref={thumbRef} className={tourNavItemLeadingThumbFallbackClassName}>
        <NamingHeartIcon active={active} closed={isClosed} />
      </span>;

  const body = (
    <>
      {leading}
      <span className={tourNavDirectoryListItemNamingMainClassName}>
        <span className={tourNavItemTextClassName}>
          {active ?
            <ExploreCurrentHereLabel
              className={tourNavCurrentInlineLabelClassName}
            />
          : null}
          <span className={tourNavItemNamingHeaderClassName}>
            <span className={tourNavItemNamingTitleRowClassName}>
              <span className={tourNavItemNamingNameClassName}>
                {item.name}
              </span>
            </span>
            {showLocation ?
              <span className={tourNavItemNamingLocationClassName}>
                {item.sceneTitle}
              </span>
            : null}
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
    </>
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
            statusTone: isClosed ? 'closed' : 'default',
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
