import { useScenePreview } from '../hooks/useScenePreview';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import type { Scene } from '../types/tour';
import {
  TOUR_DIRECTORY_SCENE_DETAIL_BACK,
  TOUR_DIRECTORY_SCENE_DETAIL_VISIT,
} from '../constants/tourDirectory';
import { cn } from '../lib/cn';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { Badge } from './ui/Badge';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_20,
} from './ui/materialSymbolClasses';
import {
  tourNavSceneDetailBackClassName,
  tourNavSceneDetailBodyClassName,
  tourNavSceneDetailCopyClassName,
  tourNavSceneDetailFooterClassName,
  tourNavSceneDetailHeroClassName,
  tourNavSceneDetailHeroCopyStackClassName,
  tourNavSceneDetailHeroImageClassName,
  tourNavSceneDetailHeroSkeletonClassName,
  tourNavSceneDetailLayoutClassName,
  tourNavSceneDetailTitleClassName,
  tourNavSceneDetailVisitClassName,
} from './tourNavFloatVariants';

interface ExploreSceneDescriptionViewProps {
  tourId: string;
  scene: Scene;
  active: boolean;
  disabled?: boolean;
  onBack: () => void;
  onVisit: () => void;
}

export function ExploreSceneDescriptionView({
  tourId,
  scene,
  active,
  disabled = false,
  onBack,
  onVisit,
}: ExploreSceneDescriptionViewProps) {
  const description = scene.description?.trim();
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useScenePreview(tourId, scene, true);
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);
  const heroLoading =
    previewLoading || Boolean(previewSrc && !previewLoaded && !previewFailed);

  return (
    <div className={tourNavSceneDetailLayoutClassName}>
      <button
        type='button'
        className={tourNavSceneDetailBackClassName}
        disabled={disabled}
        onClick={onBack}
      >
        <MaterialSymbol name='arrow_back' sizePx={MATERIAL_SYMBOL_SIZE_20} />
        {TOUR_DIRECTORY_SCENE_DETAIL_BACK}
      </button>

      <div className={tourNavSceneDetailHeroCopyStackClassName}>
        <div
          className={tourNavSceneDetailHeroClassName}
          aria-busy={heroLoading || undefined}
        >
          {heroLoading ?
            <span
              className={tourNavSceneDetailHeroSkeletonClassName}
              aria-hidden='true'
            />
          : null}
          {previewSrc && !previewFailed ?
            <img
              ref={imgRef}
              className={cn(
                tourNavSceneDetailHeroImageClassName,
                previewLoaded && 'opacity-100',
              )}
              src={previewSrc}
              alt=''
              aria-hidden='true'
              draggable={false}
              onLoad={onPreviewLoad}
            />
          : null}
        </div>

        <div className={tourNavSceneDetailCopyClassName}>
          <div className='flex min-w-0 items-start gap-2'>
            <h3 className={tourNavSceneDetailTitleClassName}>{scene.title}</h3>
            {active ?
              <Badge variant='fill' size='sm' tone='primary' uppercase>
                Current
              </Badge>
            : null}
          </div>

          {description ?
            <p className={tourNavSceneDetailBodyClassName}>{description}</p>
          : <p className={tourNavSceneDetailBodyClassName}>
              No description for this location yet.
            </p>
          }
        </div>
      </div>

      {!active ?
        <div className={tourNavSceneDetailFooterClassName}>
          <button
            type='button'
            className={tourNavSceneDetailVisitClassName}
            disabled={disabled}
            onClick={onVisit}
          >
            {TOUR_DIRECTORY_SCENE_DETAIL_VISIT}
            <ExploreGalleryCtaArrowIcon
              sizePx={MATERIAL_SYMBOL_SIZE_18}
              variant='text'
            />
          </button>
        </div>
      : null}
    </div>
  );
}
