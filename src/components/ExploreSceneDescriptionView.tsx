import { useScenePreview } from '../hooks/useScenePreview';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import type { Hotspot, Scene, TourViewerType } from '../types/tour';
import {
  TOUR_DIRECTORY_CURRENT_LOCATION_LABEL,
  TOUR_DIRECTORY_SCENE_DETAIL_BACK,
  tourDirectorySceneDetailVisitLabel,
} from '../constants/tourDirectory';
import { resolveScenePlaceLead } from '../utils/resolveScenePlaceLead';
import { cn } from '../lib/cn';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { PopupVideoEmbed } from './popupContentUi';
import { Badge } from './ui/Badge';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_14,
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
  tourHotspots?: Hotspot[];
  tourViewerType?: TourViewerType;
  active: boolean;
  disabled?: boolean;
  onBack: () => void;
  onVisit: () => void;
}

export function ExploreSceneDescriptionView({
  tourId,
  scene,
  tourHotspots,
  tourViewerType,
  active,
  disabled = false,
  onBack,
  onVisit,
}: ExploreSceneDescriptionViewProps) {
  const description = resolveScenePlaceLead(
    { hotspots: tourHotspots, viewerType: tourViewerType },
    scene,
  );
  const heroVideoUrl = scene.previewVideoUrl?.trim();
  const bodyVideoUrl = scene.videoUrl?.trim();
  const showThumbnailHero = !heroVideoUrl;
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useScenePreview(tourId, scene, showThumbnailHero);
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);
  const heroLoading =
    showThumbnailHero &&
    (previewLoading || Boolean(previewSrc && !previewLoaded && !previewFailed));

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
          className={tourNavSceneDetailHeroClassName(Boolean(heroVideoUrl))}
          aria-busy={heroLoading || undefined}
        >
          {heroVideoUrl ?
            <PopupVideoEmbed
              videoUrl={heroVideoUrl}
              title={scene.title}
              poster={scene.videoPoster}
            />
          : <>
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
            </>
          }
        </div>

        <div className={tourNavSceneDetailCopyClassName}>
          <div className='flex min-w-0 items-start gap-2'>
            <h3 className={tourNavSceneDetailTitleClassName}>{scene.title}</h3>
            {active ?
              <Badge
                variant='fill'
                size='sm'
                tone='primary'
                uppercase
                className='gap-1'
              >
                <MaterialSymbol name='flag' sizePx={MATERIAL_SYMBOL_SIZE_14} />
                {TOUR_DIRECTORY_CURRENT_LOCATION_LABEL}
              </Badge>
            : null}
          </div>

          <p className={tourNavSceneDetailBodyClassName}>{description}</p>

          {bodyVideoUrl ?
            <PopupVideoEmbed videoUrl={bodyVideoUrl} title={scene.title} />
          : null}
        </div>
      </div>

      <div className={tourNavSceneDetailFooterClassName}>
        <button
          type='button'
          className={tourNavSceneDetailVisitClassName}
          disabled={disabled}
          onClick={onVisit}
        >
          {tourDirectorySceneDetailVisitLabel(scene.title)}
          <ExploreGalleryCtaArrowIcon
            sizePx={MATERIAL_SYMBOL_SIZE_18}
            variant='text'
          />
        </button>
      </div>
    </div>
  );
}
