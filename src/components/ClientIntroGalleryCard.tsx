import { useEffect, useState } from 'react';
import { CLIENT_INTRO_CTA } from '../constants/clientIntro';
import type { CatalogTourListItem } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { useCatalogTourPreview } from '../hooks/useCatalogTourPreview';
import { PREVIEW_HERO_SKELETON_CLASS } from './ui/previewHeroSkeletonClasses';
import { TourCategoryBadge } from './TourCategoryBadge';
import './ClientIntroGalleryCard.css';

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

  const mediaClassName = [
    'client-intro-gallery__media',
    previewLoading ? 'client-intro-gallery__media--loading' : '',
    previewFailed ? 'client-intro-gallery__media--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className='client-intro-gallery__item'>
      <button
        type='button'
        className='client-intro-gallery__card'
        onClick={onSelect}
        aria-label={`${entry.tourName}, ${entry.clientName}. ${CLIENT_INTRO_CTA}.`}
      >
        <span
          className={mediaClassName}
          aria-busy={previewLoading || undefined}
        >
          {previewLoading ?
            <span className={PREVIEW_HERO_SKELETON_CLASS} aria-hidden='true' />
          : null}
          {previewSrc && !previewFailed ?
            <img
              className={`client-intro-gallery__preview${previewLoaded ? ' client-intro-gallery__preview--loaded' : ''}`}
              src={previewSrc}
              alt=''
              aria-hidden='true'
              draggable={false}
              onLoad={() => setPreviewLoaded(true)}
            />
          : null}
          {previewFailed ?
            <span
              className='client-intro-gallery__preview-fallback'
              aria-hidden='true'
            />
          : null}
          <span className='client-intro-gallery__scrim' aria-hidden='true' />
          <TourCategoryBadge
            category={entry.category}
            className='client-intro-gallery__badge'
          />
        </span>
        <span className='client-intro-gallery__body'>
          <span className='client-intro-gallery__content'>
            <span className='client-intro-gallery__title'>
              {entry.tourName}
            </span>
            <span className='client-intro-gallery__meta'>
              {entry.clientName}
            </span>
            <span className='client-intro-gallery__logo-slot'>
              {logo ?
                <img
                  className='client-intro-gallery__logo'
                  src={logo}
                  alt=''
                  aria-hidden='true'
                  draggable={false}
                />
              : null}
            </span>
          </span>
          <span className='client-intro-gallery__cta' aria-hidden='true'>
            <svg viewBox='0 0 20 20' fill='none'>
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
