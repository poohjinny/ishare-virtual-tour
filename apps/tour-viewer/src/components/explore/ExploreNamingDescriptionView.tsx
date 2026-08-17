import { useMemo } from 'react';
import { useScenePreview } from '../../hooks/useScenePreview';
import { usePreviewHeroReveal } from '../../hooks/usePreviewHeroReveal';
import type { Hotspot, Scene, Tour } from '../../types/tour';
import {
  TOUR_DIRECTORY_NAMING_DETAIL_BACK,
  tourDirectorySceneDetailVisitLabel,
} from '../../constants/tourDirectory';
import { resolveNamingPopup } from '../../utils/namingSceneInherit';
import { cn } from '../../lib/cn';
import { ExploreCurrentHereLabel } from './ExploreCurrentHereLabel';
import { ExploreDetailVisitFooter } from './ExploreDetailVisitFooter';
import {
  NamingDonorCreditBlock,
  NamingOpportunityPrice,
  PopupBodyCopy,
  PopupHeaderMeta,
  PopupVideoEmbed,
} from '../popupContentUi';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from '../ui/materialSymbolClasses';
import {
  tourNavCurrentDetailHeroChipClassName,
  tourNavSceneDetailBackClassName,
  tourNavSceneDetailBodyScrollClassName,
  tourNavSceneDetailCopyClassName,
  tourNavSceneDetailHeroClassName,
  tourNavSceneDetailHeroCopyStackClassName,
  tourNavSceneDetailHeroImageClassName,
  tourNavSceneDetailHeroSkeletonClassName,
  tourNavSceneDetailInlinePadClassName,
  tourNavSceneDetailLayoutClassName,
  tourNavSceneDetailMainClassName,
  tourNavSceneDetailTitleClassName,
} from '../tourNavFloatVariants';

interface ExploreNamingDescriptionViewProps {
  tour: Tour;
  scene: Scene;
  hotspot: Hotspot;
  active: boolean;
  disabled?: boolean;
  onBack: () => void;
  onVisit: () => void;
  onAskGuide?: () => void;
}

export function ExploreNamingDescriptionView({
  tour,
  scene,
  hotspot,
  active,
  disabled = false,
  onBack,
  onVisit,
  onAskGuide,
}: ExploreNamingDescriptionViewProps) {
  const popup = useMemo(
    () => resolveNamingPopup(tour, hotspot, scene),
    [hotspot, scene, tour],
  );

  const heroVideoUrl = popup?.videoUrl?.trim();
  const heroImageUrl = popup?.image?.trim();
  const showThumbnailHero = !heroVideoUrl && !heroImageUrl;
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useScenePreview(tour.id, scene, showThumbnailHero);
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(
    heroImageUrl || (showThumbnailHero ? previewSrc : null),
  );

  const heroSrc = heroImageUrl || (showThumbnailHero ? previewSrc : null);
  const heroFailed = !heroImageUrl && previewFailed;
  const heroLoading =
    Boolean(heroSrc) &&
    !heroVideoUrl &&
    (showThumbnailHero ?
      previewLoading || Boolean(heroSrc && !previewLoaded && !heroFailed)
    : !previewLoaded);
  const title =
    popup?.title?.trim() || hotspot.popup?.title?.trim() || scene.title;
  const body = popup?.body?.trim() ?? '';
  const visitLabel = tourDirectorySceneDetailVisitLabel(scene.title);

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
          {TOUR_DIRECTORY_NAMING_DETAIL_BACK}
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
                title={title}
                poster={popup?.videoPoster}
              />
            : <>
                {heroLoading ?
                  <span
                    className={tourNavSceneDetailHeroSkeletonClassName}
                    aria-hidden='true'
                  />
                : null}
                {heroSrc && !heroFailed ?
                  <img
                    ref={imgRef}
                    className={cn(
                      tourNavSceneDetailHeroImageClassName,
                      previewLoaded && 'opacity-100',
                    )}
                    src={heroSrc}
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
            <div
              className={cn(
                'tour-glass-panel__title-block shrink-0',
                tourNavSceneDetailInlinePadClassName,
              )}
            >
              <div className='tour-glass-panel__title-line'>
                <h3 className={tourNavSceneDetailTitleClassName}>{title}</h3>
                {popup?.namingOpportunity ?
                  <div className='tour-glass-panel__title-line-trailing'>
                    <PopupHeaderMeta popup={popup} />
                    <NamingOpportunityPrice
                      opportunity={popup.namingOpportunity}
                    />
                  </div>
                : null}
              </div>
              {popup?.namingOpportunity?.priceLabel ?
                <p className='tour-glass-panel__price-label m-0'>
                  {popup.namingOpportunity.priceLabel}
                </p>
              : null}
              {popup?.namingOpportunity ?
                <NamingDonorCreditBlock opportunity={popup.namingOpportunity} />
              : null}
            </div>

            {body ?
              <div className={tourNavSceneDetailBodyScrollClassName}>
                <PopupBodyCopy body={body} />
              </div>
            : null}
          </div>
        </div>
      </div>

      <ExploreDetailVisitFooter
        label={visitLabel}
        disabled={disabled}
        onVisit={onVisit}
        onAsk={onAskGuide}
      />
    </div>
  );
}
