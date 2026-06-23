import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ISHARE_PLATFORM,
  ISHARE_VIRTUAL_TOUR_NAME,
  PLATFORM_PRODUCT_LOGO,
} from '../constants/branding';
import { listPublicTourIds, loadTour } from '../data/loadTour';
import { getTourProductFullName } from '../utils/tourProductName';
import {
  buildTourLocation,
  preservedSearchStringFrom,
} from '../utils/tourPaths';
import './TourNotFound.css';

interface TourNotFoundProps {
  requestedTourId: string;
  searchParams: URLSearchParams;
}

const NOT_FOUND_ICON = (
  <svg
    className='tour-not-found__icon'
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
  >
    <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='1.75' />
    <path
      d='M12 8v5'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
    />
    <circle cx='12' cy='16.25' r='1' fill='currentColor' />
  </svg>
);

export function TourNotFound({
  requestedTourId,
  searchParams,
}: TourNotFoundProps) {
  const navigate = useNavigate();
  const publicTourIds = listPublicTourIds();
  const fallbackTourId = publicTourIds[0];

  useEffect(() => {
    document.title = `Tour not found · ${ISHARE_VIRTUAL_TOUR_NAME}`;
  }, []);

  const handleBrowseTours = () => {
    navigate('/' + preservedSearchStringFrom(searchParams), { replace: true });
  };

  const handleOpenFallbackTour = () => {
    if (!fallbackTourId) {
      handleBrowseTours();
      return;
    }
    const tour = loadTour(fallbackTourId);
    navigate(
      buildTourLocation(
        tour.id,
        tour.firstScene,
        tour.firstScene,
        searchParams,
      ),
      { replace: true },
    );
  };

  const primaryLabel =
    publicTourIds.length > 1 ? 'Browse tours'
    : fallbackTourId ?
      `Open ${getTourProductFullName(loadTour(fallbackTourId))}`
    : 'Back to home';

  const handlePrimary =
    publicTourIds.length > 1 ? handleBrowseTours : handleOpenFallbackTour;

  return (
    <div className='app tour-not-found' role='alert' aria-live='assertive'>
      <header className='tour-not-found__header'>
        <a
          className='tour-not-found__logo-link'
          href={ISHARE_PLATFORM.url}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='iShare — opens in a new tab'
        >
          <img
            className='tour-not-found__logo'
            src={PLATFORM_PRODUCT_LOGO}
            alt=''
            draggable={false}
          />
        </a>
      </header>
      <div className='tour-not-found__content'>
        <div className='tour-not-found__icon-wrap'>{NOT_FOUND_ICON}</div>
        <h1 className='tour-not-found__title'>Tour not found</h1>
        <p className='tour-not-found__body'>
          No tour matches{' '}
          <span className='tour-not-found__emphasis'>{requestedTourId}</span>.
          <br />
          The link may be outdated or the tour is no longer available.
        </p>
        <button
          type='button'
          className='tour-not-found__cta'
          onClick={handlePrimary}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
