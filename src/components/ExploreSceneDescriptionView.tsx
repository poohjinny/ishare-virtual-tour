import { useScenePreview } from '../hooks/useScenePreview';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import type {
  Hotspot,
  NamingOpportunityRecord,
  Scene,
  TourViewerType,
} from '../types/tour';
import {
  TOUR_DIRECTORY_SCENE_DETAIL_BACK,
  tourDirectorySceneDetailVisitLabel,
} from '../constants/tourDirectory';
import { resolveScenePlaceLead } from '../utils/resolveScenePlaceLead';
import { InlineMarkdownParagraphs } from '../utils/inlineMarkdown';
import { cn } from '../lib/cn';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDetailVisitFooter } from './ExploreDetailVisitFooter';
import { PopupVideoEmbed } from './popupContentUi';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from './ui/materialSymbolClasses';
import {
  tourNavCurrentDetailHeroChipClassName,
  tourNavSceneDetailBackClassName,
  tourNavSceneDetailBodyClassName,
  tourNavSceneDetailCopyClassName,
  tourNavSceneDetailHeroClassName,
  tourNavSceneDetailHeroCopyStackClassName,
  tourNavSceneDetailHeroImageClassName,
  tourNavSceneDetailHeroSkeletonClassName,
  tourNavSceneDetailLayoutClassName,
  tourNavSceneDetailMainClassName,
  tourNavSceneDetailTitleClassName,
} from './tourNavFloatVariants';

interface ExploreSceneDescriptionViewProps {
  tourId: string;
  scene: Scene;
  tourTitle?: string;
  tourHotspots?: Hotspot[];
  tourViewerType?: TourViewerType;
  namingOpportunities?: Record<string, NamingOpportunityRecord>;
  active: boolean;
  disabled?: boolean;
  onBack: () => void;
  onVisit: () => void;
  onAskGuide?: () => void;
}

export function ExploreSceneDescriptionView({
  tourId,
  scene,
  tourTitle,
  tourHotspots,
  tourViewerType,
  namingOpportunities,
  active,
  disabled = false,
  onBack,
  onVisit,
  onAskGuide,
}: ExploreSceneDescriptionViewProps) {
  const description = resolveScenePlaceLead(
    {
      id: tourId,
      title: tourTitle ?? '',
      hotspots: tourHotspots,
      viewerType: tourViewerType,
      namingOpportunities,
    },
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
      <div className={tourNavSceneDetailMainClassName}>
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
            className={tourNavSceneDetailHeroClassName(
              Boolean(heroVideoUrl),
              active,
            )}
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
            {active ?
              <ExploreCurrentHereLabel
                className={tourNavCurrentDetailHeroChipClassName}
              />
            : null}
          </div>

          <div className={tourNavSceneDetailCopyClassName}>
            <h3 className={tourNavSceneDetailTitleClassName}>{scene.title}</h3>

            {description ?
              <InlineMarkdownParagraphs
                text={description}
                className='flex flex-col gap-3'
                paragraphClassName={tourNavSceneDetailBodyClassName}
              />
            : null}

            {bodyVideoUrl ?
              <PopupVideoEmbed videoUrl={bodyVideoUrl} title={scene.title} />
            : null}
          </div>
        </div>
      </div>

      <ExploreDetailVisitFooter
        label={tourDirectorySceneDetailVisitLabel(scene.title)}
        disabled={disabled}
        onVisit={onVisit}
        onAsk={onAskGuide}
      />
    </div>
  );
}
