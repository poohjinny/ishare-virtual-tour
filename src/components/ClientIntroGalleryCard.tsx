import { CLIENT_INTRO_CTA } from '../constants/clientIntro';
import type { CatalogTourListItem } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { useCatalogTourPreview } from '../hooks/useCatalogTourPreview';
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
  const { src: previewSrc, failed: previewFailed } = useCatalogTourPreview(
    entry.tourId,
  );
  const logo = tour.branding?.logo;
  const showPreview = previewSrc && !previewFailed;

  return (
    <li className='client-intro-gallery__item'>
      <button
        type='button'
        className='client-intro-gallery__card'
        onClick={onSelect}
        aria-label={`${entry.tourName}, ${entry.clientName}. ${CLIENT_INTRO_CTA}.`}
      >
        <span className='client-intro-gallery__media'>
          {showPreview ?
            <img
              className='client-intro-gallery__preview'
              src={previewSrc}
              alt=''
              aria-hidden='true'
              draggable={false}
            />
          : <span
              className='client-intro-gallery__preview-fallback'
              aria-hidden='true'
            />
          }
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
