import { cn } from '../lib/cn';
import { CLIENT_INTRO_CTA } from '../constants/clientIntro';
import type { CatalogTourListItem } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { useCatalogTourPreview } from '../hooks/useCatalogTourPreview';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import {
  clientIntroGalleryCardClassName,
  tourNavLocationGalleryCardHeroClassName,
  tourNavLocationGalleryCardHeroImageClassName,
  tourNavLocationGalleryCardHeroSkeletonClassName,
  tourNavLocationGalleryCtaClassName,
  tourNavLocationGalleryHeroBadgePlacementClassName,
  tourNavLocationGalleryHeroCtaOverlayClassName,
} from './tourNavFloatVariants';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { TourCategoryBadge } from './TourCategoryBadge';

interface ClientIntroGalleryCardProps {
  entry: CatalogTourListItem;
  onSelect: () => void;
}

export function ClientIntroGalleryCard({
  entry,
  onSelect,
}: ClientIntroGalleryCardProps) {
  const tour = loadTour(entry.tourId);
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useCatalogTourPreview(entry.tourId);
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);
  const logo = tour.branding?.logo;

  return (
    <li className='m-0 flex min-h-0 list-none p-0'>
      <button
        type='button'
        className={clientIntroGalleryCardClassName}
        onClick={onSelect}
        aria-label={`${entry.tourName}, ${entry.clientName}. ${CLIENT_INTRO_CTA}.`}
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
                tourNavLocationGalleryCardHeroImageClassName({ active: false }),
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
          <span className={tourNavLocationGalleryHeroCtaOverlayClassName}>
            <span className={tourNavLocationGalleryCtaClassName}>
              <ExploreGalleryCtaArrowIcon />
            </span>
          </span>
          <TourCategoryBadge
            category={entry.category}
            className={tourNavLocationGalleryHeroBadgePlacementClassName}
          />
        </span>
        <span className='flex flex-1 items-stretch px-3.5 pt-3 pb-3.5'>
          <span className='flex min-h-0 min-w-0 flex-1 flex-col gap-0.5'>
            <span className='font-display text-lg font-bold leading-[1.3] tracking-tight text-foreground'>
              {entry.tourName}
            </span>
            <span className='text-xs leading-[1.4] text-muted'>
              {entry.clientName}
            </span>
            <span className='mt-auto flex min-h-[30px] items-end pt-5'>
              {logo ?
                <img
                  className='h-[30px] max-w-[140px] w-auto object-contain object-left'
                  src={logo}
                  alt=''
                  aria-hidden='true'
                  draggable={false}
                />
              : null}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
