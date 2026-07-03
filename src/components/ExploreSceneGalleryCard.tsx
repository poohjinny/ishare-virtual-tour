import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { cn } from '../lib/cn';
import { useLazyInView } from '../hooks/useLazyInView';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import { useScenePreview } from '../hooks/useScenePreview';
import type { Scene } from '../types/tour';
import { Badge } from './ui/Badge';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import { ExploreTourStartPin } from './ExploreTourStartPin';
import {
  tourNavLocationGalleryCardClassName,
  tourNavLocationGalleryCardHeroClassName,
  tourNavLocationGalleryCardHeroImageClassName,
  tourNavLocationGalleryCardHeroSkeletonClassName,
  tourNavLocationGalleryCurrentBadgeClassName,
  tourNavLocationGalleryHeroBadgePlacementClassName,
  tourNavLocationGalleryHeroBottomOverlayClassName,
  tourNavLocationGalleryHeroCtaInActionsClassName,
  tourNavLocationGalleryHeroDescriptionClassName,
  tourNavLocationGalleryHeroHoverBodyClassName,
  tourNavLocationGalleryHeroHoverBodyInnerClassName,
  tourNavLocationGalleryHeroOverlayInnerClassName,
  tourNavLocationGalleryHeroTitleActionsClassName,
  tourNavLocationGalleryHeroTitleOverlayClassName,
  tourNavLocationGalleryHeroTitleRowClassName,
  tourNavLocationGalleryHeroTitleWithPinClassName,
} from './tourNavFloatVariants';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

interface ExploreSceneGalleryCardProps {
  tourId: string;
  scene: Scene;
  active: boolean;
  isTourStart?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onShowDescription?: () => void;
}

export function ExploreSceneGalleryCard({
  tourId,
  scene,
  active,
  isTourStart = false,
  disabled = false,
  onSelect,
  onShowDescription,
}: ExploreSceneGalleryCardProps) {
  const { ref, inView } = useLazyInView<HTMLLIElement>();
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useScenePreview(tourId, scene, inView);
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);
  const heroLoading =
    previewLoading || Boolean(previewSrc && !previewLoaded && !previewFailed);
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
    <li
      ref={ref}
      className='m-0 flex min-h-0 list-none p-0'
      role='presentation'
      {...{ [FLIP_LIST_KEY_ATTR]: scene.id }}
    >
      <button
        type='button'
        role='option'
        aria-selected={active}
        data-tour-nav-directory-kind='location'
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
          aria-busy={heroLoading || undefined}
        >
          {heroLoading ?
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
          {active ?
            <Badge
              variant='fill'
              size='sm'
              tone='primary'
              uppercase
              className={cn(
                tourNavLocationGalleryHeroBadgePlacementClassName,
                tourNavLocationGalleryCurrentBadgeClassName,
              )}
            >
              Current
            </Badge>
          : null}
          <span className={tourNavLocationGalleryHeroBottomOverlayClassName}>
            <span className={tourNavLocationGalleryHeroOverlayInnerClassName}>
              <span className={tourNavLocationGalleryHeroTitleRowClassName}>
                <span
                  className={tourNavLocationGalleryHeroTitleWithPinClassName}
                >
                  <span
                    className={tourNavLocationGalleryHeroTitleOverlayClassName}
                  >
                    {scene.title}
                  </span>
                  {isTourStart ?
                    <ExploreTourStartPin variant='galleryHero' />
                  : null}
                </span>
                {showInfo || !active ?
                  <span
                    className={tourNavLocationGalleryHeroTitleActionsClassName}
                  >
                    {showInfo ?
                      <ExploreSceneInfoButton
                        sceneTitle={scene.title}
                        disabled={disabled}
                        variant='galleryHero'
                        onShow={onShowDescription!}
                      />
                    : null}
                    {!active ?
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
                    : null}
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
