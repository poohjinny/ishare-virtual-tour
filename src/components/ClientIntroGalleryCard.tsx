import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { CLIENT_INTRO_CTA } from '../constants/clientIntro';
import type { CatalogTourListItem } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { useCatalogTourPreview } from '../hooks/useCatalogTourPreview';
import { PREVIEW_HERO_SKELETON_CLASS } from './ui/previewHeroSkeletonClasses';
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
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const logo = tour.branding?.logo;

  useEffect(() => {
    setPreviewLoaded(false);
  }, [previewSrc]);

  return (
    <li className='m-0 flex min-h-0 list-none p-0'>
      <button
        type='button'
        className={cn(
          'group/card flex h-full w-full flex-1 cursor-pointer flex-col overflow-hidden rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/72 p-0 text-left transition-[border-color,box-shadow,transform] duration-200',
          'hover:-translate-y-px hover:border-[rgba(15,23,42,0.14)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)] focus-visible:-translate-y-px focus-visible:border-[rgba(15,23,42,0.14)] focus-visible:shadow-[0_10px_24px_rgba(15,23,42,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none',
        )}
        onClick={onSelect}
        aria-label={`${entry.tourName}, ${entry.clientName}. ${CLIENT_INTRO_CTA}.`}
      >
        <span
          className={cn(
            'relative block aspect-[16/10] overflow-hidden bg-[#0f172a]',
            previewLoading &&
              '[&_.preview-hero-skeleton]:absolute [&_.preview-hero-skeleton]:inset-0 [&_.preview-hero-skeleton]:z-0',
            previewFailed && 'bg-[#e2e8f0]',
          )}
          aria-busy={previewLoading || undefined}
        >
          {previewLoading ?
            <span className={PREVIEW_HERO_SKELETON_CLASS} aria-hidden='true' />
          : null}
          {previewSrc && !previewFailed ?
            <img
              className={cn(
                'relative z-[1] block h-full w-full object-cover object-center opacity-0 transition-opacity duration-[280ms] motion-reduce:transition-none',
                previewLoaded && 'opacity-100',
              )}
              src={previewSrc}
              alt=''
              aria-hidden='true'
              draggable={false}
              onLoad={() => setPreviewLoaded(true)}
            />
          : null}
          {previewFailed ?
            <span
              className='absolute inset-0 z-[1] block bg-[#e2e8f0]'
              aria-hidden='true'
            />
          : null}
          <span
            className='pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[rgba(15,23,42,0.28)]'
            aria-hidden='true'
          />
          <TourCategoryBadge
            category={entry.category}
            className='absolute top-2.5 right-2.5 z-[1] max-w-[calc(100%-20px)]'
          />
        </span>
        <span className='flex flex-1 items-stretch gap-3 px-3.5 pt-3 pb-3.5'>
          <span className='flex min-h-0 min-w-0 flex-1 flex-col gap-0.5'>
            <span className='font-display text-lg font-bold leading-[1.3] tracking-tight text-foreground'>
              {entry.tourName}
            </span>
            <span className='text-xs leading-[1.4] text-muted'>
              {entry.clientName}
            </span>
            <span className='mt-auto flex min-h-[30px] items-end pt-3'>
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
          <span
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center self-center rounded-full bg-primary text-white shadow-[0_6px_16px_rgba(var(--ishare-primary-rgb),0.28),0_2px_8px_rgba(var(--ishare-primary-rgb),0.16)] transition-[background,transform,box-shadow] duration-200',
              'group-hover/card:bg-primary-dark group-focus-visible/card:bg-primary-dark',
              'group-hover/card:[&_svg]:translate-x-px group-focus-visible/card:[&_svg]:translate-x-px',
            )}
            aria-hidden='true'
          >
            <svg
              className='block size-[18px] transition-transform duration-200'
              viewBox='0 0 20 20'
              fill='none'
            >
              <path
                d='M8 6l4 4-4 4'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
        </span>
      </button>
    </li>
  );
}
