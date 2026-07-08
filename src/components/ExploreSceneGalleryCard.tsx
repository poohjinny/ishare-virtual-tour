import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { cn } from '../lib/cn';
import { useLazyInView } from '../hooks/useLazyInView';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import { useScenePreview } from '../hooks/useScenePreview';
import type { Scene } from '../types/tour';
import { EXPLORE_GALLERY_VISIT_LABEL } from '../constants/tourDirectory';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import {
  tourNavCurrentHeroChipClassName,
  tourNavLocationGalleryCardClassName,
  tourNavLocationGalleryCardHeroClassName,
  tourNavLocationGalleryCardHeroImageClassName,
  tourNavLocationGalleryCardHeroSkeletonClassName,
  tourNavLocationGalleryHeroBottomOverlayClassName,
  tourNavLocationGalleryHeroDescriptionClassName,
  tourNavLocationGalleryHeroHoverBodyClassName,
  tourNavLocationGalleryHeroHoverBodyInnerColumnClassName,
  tourNavLocationGalleryHeroMetaRowClassName,
  tourNavLocationGalleryHeroOverlayInnerClassName,
  tourNavLocationGalleryHeroPillCtaClassName,
  tourNavLocationGalleryHeroTitleOverlayClassName,
  tourNavLocationGalleryHeroTitleRowClassName,
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
  const showHoverBody = true;
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
      <div
        className={cn(
          tourNavLocationGalleryCardClassName({ active }),
          'relative w-full',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <span
          className={cn(
            tourNavLocationGalleryCardHeroClassName,
            previewFailed && 'bg-[#e2e8f0]',
          )}
          aria-busy={heroLoading || undefined}
        >
          <button
            type='button'
            role='option'
            aria-selected={active}
            data-tour-nav-directory-kind='location'
            disabled={disabled}
            className='absolute inset-0 z-[1] block h-full w-full cursor-pointer rounded-lg border-none bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-light disabled:cursor-not-allowed'
            onClick={onSelect}
            aria-label={ariaLabel}
          />
          {heroLoading ?
            <span
              className={cn(
                tourNavLocationGalleryCardHeroSkeletonClassName,
                'pointer-events-none',
              )}
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
              className='pointer-events-none absolute inset-0 z-[1] block bg-[#e2e8f0]'
              aria-hidden='true'
            />
          : null}
          {active ?
            <ExploreCurrentHereLabel
              className={tourNavCurrentHeroChipClassName}
            />
          : null}
          <span className={tourNavLocationGalleryHeroBottomOverlayClassName}>
            <span className={tourNavLocationGalleryHeroOverlayInnerClassName}>
              <span className={tourNavLocationGalleryHeroTitleRowClassName}>
                <span
                  className={tourNavLocationGalleryHeroTitleOverlayClassName}
                >
                  {scene.title}
                </span>
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
                    <span
                      className={cn(
                        tourNavLocationGalleryHeroMetaRowClassName,
                        'relative z-[3]',
                      )}
                    >
                      {showInfo ?
                        <ExploreSceneInfoButton
                          sceneTitle={scene.title}
                          disabled={disabled}
                          variant='galleryHeroText'
                          onShow={onShowDescription!}
                        />
                      : null}
                      <span
                        className={tourNavLocationGalleryHeroPillCtaClassName}
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
                    </span>
                  </span>
                </span>
              : null}
            </span>
          </span>
        </span>
      </div>
    </li>
  );
}
