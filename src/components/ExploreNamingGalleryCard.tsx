import { useMemo } from 'react';

import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';

import { cn } from '../lib/cn';

import { useLazyInView } from '../hooks/useLazyInView';

import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';

import { useScenePreview } from '../hooks/useScenePreview';

import type { Scene, Tour, TourViewerType } from '../types/tour';

import type { NamingStatusModifier } from './ui/Badge';

import { NamingStatusBadge } from './ui/NamingStatusBadge';

import { EXPLORE_GALLERY_NAMING_VIEW_LABEL } from '../constants/tourDirectory';

import {
  tourNavLocationGalleryCardClassName,
  tourNavLocationGalleryCardHeroClassName,
  tourNavLocationGalleryCardHeroImageClassName,
  tourNavLocationGalleryCardHeroSkeletonClassName,
  tourNavLocationGalleryHeroBadgeGroupClassName,
  tourNavLocationGalleryHeroBottomOverlayClassName,
  tourNavLocationGalleryHeroDescriptionClassName,
  tourNavLocationGalleryHeroHoverBodyClassName,
  tourNavLocationGalleryHeroHoverBodyInnerColumnClassName,
  tourNavLocationGalleryHeroNamingLocationClassName,
  tourNavLocationGalleryHeroNamingHeaderClassName,
  tourNavLocationGalleryHeroNamingNameClassName,
  tourNavLocationGalleryHeroNamingPriceClassName,
  tourNavLocationGalleryHeroNamingTitleRowClassName,
  tourNavLocationGalleryHeroOverlayInnerClassName,
  tourNavLocationGalleryHeroPillCtaClassName,
  tourNavLocationGalleryHeroMetaRowClassName,
  tourNavLocationGalleryHeroTitleRowClassName,
  tourNavLocationGalleryStatusBadgeVariants,
} from './tourNavFloatVariants';

import {
  resolveNamingDirectoryPreviewView,
  type TourDirectoryNamingItem,
} from '../utils/tourDirectory';

import { formatNamingGalleryItemPrice } from '../utils/namingPrice';

import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';

import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

interface ExploreNamingGalleryCardProps {
  tourId: string;

  tourViewerType?: TourViewerType;

  /** Hotspot lookup for model3d preview pose — from TourNavFloat tourDirectoryContext. */

  directoryTour?: Pick<
    Tour,
    'viewerType' | 'scenes' | 'hotspots' | 'firstScene'
  >;

  scenes: Scene[];

  item: TourDirectoryNamingItem;

  active: boolean;

  disabled?: boolean;

  onSelect: () => void;
}

export function ExploreNamingGalleryCard({
  tourId,

  tourViewerType,

  directoryTour,

  scenes,

  item,

  active,

  disabled = false,

  onSelect,
}: ExploreNamingGalleryCardProps) {
  const { ref, inView } = useLazyInView<HTMLLIElement>();

  const scene = useMemo(
    () => scenes.find((entry) => entry.id === item.sceneId),

    [item.sceneId, scenes],
  );

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

  const previewTour = useMemo(
    (): Pick<Tour, 'viewerType' | 'scenes' | 'hotspots' | 'firstScene'> =>
      directoryTour ?? {
        viewerType: tourViewerType,

        scenes: Object.fromEntries(scenes.map((entry) => [entry.id, entry])),

        firstScene: scenes[0]?.id ?? item.sceneId,

        hotspots: [],
      },

    [directoryTour, item.sceneId, scenes, tourViewerType],
  );

  const previewView = useMemo(
    () =>
      resolveNamingDirectoryPreviewView(
        previewTour,

        scenes,

        item.sceneId,

        item.hotspotId,
      ),

    [item.hotspotId, item.sceneId, previewTour, scenes],
  );

  const previewOptions = useMemo(() => {
    if (tourViewerType === 'model3d') {
      return undefined;
    }

    return { view: previewView, cacheKeySuffix: `no:${item.hotspotId}` };
  }, [item.hotspotId, previewView, tourViewerType]);

  const {
    src: previewSrc,

    failed: previewFailed,

    loading: previewLoading,
  } = useScenePreview(
    tourId,

    previewScene,

    inView && Boolean(previewScene.panorama || previewScene.thumbnail),

    previewOptions,
  );

  const {
    imgRef,

    revealed: previewLoaded,

    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);

  const description = item.description?.trim();

  const priceLabel = formatNamingGalleryItemPrice(item);

  const showHoverBody = Boolean(description || !active);

  const ariaLabel =
    active ?
      description ?
        `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}. ${description}`
      : `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}.`
    : description ?
      `${item.name}, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}. ${description}`
    : `${item.name}, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}.`;

  return (
    <li
      ref={ref}
      className='m-0 flex min-h-0 list-none p-0'
      role='presentation'
      {...{ [FLIP_LIST_KEY_ATTR]: `${item.sceneId}:${item.hotspotId}` }}
    >
      <button
        type='button'
        role='option'
        aria-selected={active}
        data-tour-nav-directory-kind='naming'
        disabled={disabled}
        className={tourNavLocationGalleryCardClassName({ active })}
        onClick={onSelect}
        aria-label={ariaLabel}
      >
        <span
          className={cn(
            tourNavLocationGalleryCardHeroClassName,

            previewFailed && 'bg-[#e2e8f0]',
          )}
          aria-busy={previewLoading || undefined}
        >
          {previewLoading ?
            <span
              className={tourNavLocationGalleryCardHeroSkeletonClassName}
              aria-hidden='true'
            />
          : null}

          {previewSrc && !previewFailed ?
            <img
              ref={imgRef}
              className={cn(
                tourNavLocationGalleryCardHeroImageClassName({ active }),

                previewLoaded && 'opacity-100',
              )}
              src={previewSrc}
              alt=''
              aria-hidden='true'
              draggable={false}
              onLoad={onPreviewLoad}
            />
          : null}

          {previewFailed ?
            <span
              className='absolute inset-0 z-[1] block bg-[#e2e8f0]'
              aria-hidden='true'
            />
          : null}

          <span className={tourNavLocationGalleryHeroBadgeGroupClassName}>
            <NamingStatusBadge
              statusModifier={item.statusModifier as NamingStatusModifier}
              label={item.statusShortLabel}
              ariaLabel={item.statusLabel}
              className={tourNavLocationGalleryStatusBadgeVariants({
                status: item.statusModifier as NamingStatusModifier,
              })}
            />
          </span>

          <span className={tourNavLocationGalleryHeroBottomOverlayClassName}>
            <span className={tourNavLocationGalleryHeroOverlayInnerClassName}>
              <span className={tourNavLocationGalleryHeroNamingHeaderClassName}>
                <span className={tourNavLocationGalleryHeroTitleRowClassName}>
                  <span
                    className={
                      tourNavLocationGalleryHeroNamingTitleRowClassName
                    }
                  >
                    <span
                      className={tourNavLocationGalleryHeroNamingNameClassName}
                    >
                      {item.name}
                    </span>

                    {priceLabel ?
                      <span
                        className={
                          tourNavLocationGalleryHeroNamingPriceClassName
                        }
                      >
                        {priceLabel}
                      </span>
                    : null}
                  </span>
                </span>

                {item.sceneTitle ?
                  <span
                    className={
                      tourNavLocationGalleryHeroNamingLocationClassName
                    }
                  >
                    {item.sceneTitle}
                  </span>
                : null}
              </span>

              {showHoverBody ?
                <span className={tourNavLocationGalleryHeroHoverBodyClassName}>
                  <span
                    className={
                      tourNavLocationGalleryHeroHoverBodyInnerColumnClassName
                    }
                  >
                    {description ?
                      <span
                        className={
                          tourNavLocationGalleryHeroDescriptionClassName
                        }
                      >
                        {description}
                      </span>
                    : null}

                    {!active ?
                      <span
                        className={tourNavLocationGalleryHeroMetaRowClassName}
                      >
                        <span
                          className={tourNavLocationGalleryHeroPillCtaClassName}
                          aria-hidden='true'
                        >
                          <span className='min-w-0 truncate'>
                            {EXPLORE_GALLERY_NAMING_VIEW_LABEL}
                          </span>

                          <ExploreGalleryCtaArrowIcon
                            variant='text'
                            sizePx={MATERIAL_SYMBOL_SIZE_14}
                          />
                        </span>
                      </span>
                    : null}
                  </span>
                </span>
              : null}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
