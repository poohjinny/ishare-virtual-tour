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

interface TourNotFoundProps {
  requestedTourId: string;
  searchParams: URLSearchParams;
}

const NOT_FOUND_ICON = (
  <svg
    className='size-[3.25rem]'
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
    <div
      className='app relative flex min-h-full items-center justify-center bg-page px-6 py-8 text-body max-md:px-6 max-md:py-8'
      role='alert'
      aria-live='assertive'
    >
      <header className='absolute inset-x-0 top-0 flex justify-center px-6 pt-7 max-md:pt-5'>
        <a
          className='inline-flex rounded-md leading-none transition-opacity hover:opacity-[0.85] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
          href={ISHARE_PLATFORM.url}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='iShare — opens in a new tab'
        >
          <img
            className='block h-[46px] w-auto max-w-[min(220px,calc(100vw-48px))] object-contain'
            src={PLATFORM_PRODUCT_LOGO}
            alt=''
            draggable={false}
          />
        </a>
      </header>
      <div className='mt-6 flex w-full max-w-sm flex-col items-center text-center max-md:mt-4'>
        <div className='mb-1.5 flex items-center justify-center text-danger'>
          {NOT_FOUND_ICON}
        </div>
        <h1 className='m-0 font-display text-2xl font-semibold leading-[1.35] text-foreground'>
          Tour not found
        </h1>
        <p className='mt-3.5 mb-0 text-lg leading-[1.55] text-muted'>
          No tour matches{' '}
          <span className='font-semibold text-body'>{requestedTourId}</span>
          .
          <br />
          The link may be outdated or the tour is no longer available.
        </p>
        <button
          type='button'
          className='mt-8 min-w-48 cursor-pointer rounded-full border-none bg-primary px-6 py-2.5 font-display text-lg font-semibold text-white transition-[background,transform] duration-150 hover:bg-primary-dark active:scale-[0.98]'
          onClick={handlePrimary}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
