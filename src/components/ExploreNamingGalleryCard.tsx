import { useMemo } from 'react';
import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { cn } from '../lib/cn';
import { useLazyInView } from '../hooks/useLazyInView';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import { useScenePreview } from '../hooks/useScenePreview';
import type { Scene } from '../types/tour';
import type { NamingStatusModifier } from './ui/Badge';
import { Badge } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import {
  tourNavLocationGalleryCardClassName,
  tourNavLocationGalleryCardHeroClassName,
  tourNavLocationGalleryCardHeroImageClassName,
  tourNavLocationGalleryCardHeroSkeletonClassName,
  tourNavLocationGalleryCurrentBadgeClassName,
  tourNavLocationGalleryHeroBadgeGroupClassName,
  tourNavLocationGalleryHeroBottomOverlayClassName,
  tourNavLocationGalleryHeroCtaInActionsClassName,
  tourNavLocationGalleryHeroDescriptionClassName,
  tourNavLocationGalleryHeroHoverBodyClassName,
  tourNavLocationGalleryHeroHoverBodyInnerClassName,
  tourNavLocationGalleryHeroNamingLabelClassName,
  tourNavLocationGalleryHeroNamingLocationClassName,
  tourNavLocationGalleryHeroNamingNameClassName,
  tourNavLocationGalleryHeroNamingSeparatorClassName,
  tourNavLocationGalleryHeroNamingTitleRowClassName,
  tourNavLocationGalleryHeroOverlayInnerClassName,
  tourNavLocationGalleryHeroTitleActionsClassName,
  tourNavLocationGalleryHeroTitleRowClassName,
  tourNavLocationGalleryStatusBadgeVariants,
} from './tourNavFloatVariants';
import {
  resolveNamingDirectoryPreviewView,
  type TourDirectoryNamingItem,
} from '../utils/tourDirectory';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

interface ExploreNamingGalleryCardProps {
  tourId: string;
  scenes: Scene[];
  item: TourDirectoryNamingItem;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function ExploreNamingGalleryCard({
  tourId,
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
  const previewView = useMemo(
    () =>
      resolveNamingDirectoryPreviewView(scenes, item.sceneId, item.hotspotId),
    [item.hotspotId, item.sceneId, scenes],
  );
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useScenePreview(
    tourId,
    scene ?? {
      id: item.sceneId,
      panorama: '',
      defaultView: { yaw: 0, pitch: 0, zoom: 50 },
    },
    inView && Boolean(scene?.panorama),
    { view: previewView, cacheKeySuffix: `no:${item.hotspotId}` },
  );
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);
  const description = item.description?.trim();
  const ariaLabel =
    active ?
      description ?
        `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${description}`
      : `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}.`
    : description ?
      `${item.name}, ${item.sceneTitle}. ${item.statusLabel}. ${description}`
    : `${item.name}, ${item.sceneTitle}. ${item.statusLabel}.`;

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
            {active ?
              <Badge
                variant='fill'
                size='sm'
                tone='primary'
                uppercase
                className={tourNavLocationGalleryCurrentBadgeClassName}
              >
                Current
              </Badge>
            : null}
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
              <span className={tourNavLocationGalleryHeroTitleRowClassName}>
                <span
                  className={tourNavLocationGalleryHeroNamingTitleRowClassName}
                >
                  <span
                    className={tourNavLocationGalleryHeroNamingLabelClassName}
                  >
                    <span
                      className={tourNavLocationGalleryHeroNamingNameClassName}
                    >
                      {item.name}
                    </span>
                    <span
                      className={
                        tourNavLocationGalleryHeroNamingSeparatorClassName
                      }
                      aria-hidden='true'
                    >
                      |
                    </span>
                    <span
                      className={
                        tourNavLocationGalleryHeroNamingLocationClassName
                      }
                    >
                      {item.sceneTitle}
                    </span>
                  </span>
                </span>
                {!active ?
                  <span
                    className={tourNavLocationGalleryHeroTitleActionsClassName}
                  >
                    <span
                      className={
                        tourNavLocationGalleryHeroCtaInActionsClassName
                      }
                      aria-hidden='true'
                    >
                      <ExploreGalleryCtaArrowIcon
                        sizePx={MATERIAL_SYMBOL_SIZE_14}
                      />
                    </span>
                  </span>
                : null}
              </span>
              {description ?
                <span className={tourNavLocationGalleryHeroHoverBodyClassName}>
                  <span
                    className={
                      tourNavLocationGalleryHeroHoverBodyInnerClassName
                    }
                  >
                    <span
                      className={tourNavLocationGalleryHeroDescriptionClassName}
                    >
                      {description}
                    </span>
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
