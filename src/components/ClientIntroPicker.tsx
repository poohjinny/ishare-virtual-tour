import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CLIENT_INTRO_HERO_VIDEO,
  PLATFORM_PRODUCT_LOGO,
} from '../constants/branding';
import {
  CLIENT_INTRO_LEAD,
  CLIENT_INTRO_TITLE,
} from '../constants/clientIntro';
import type { TourCategory } from '../constants/tourCategories';
import { listCatalogTours, listTourCategories } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { buildTourLocation } from '../utils/tourPaths';
import { ClientIntroGalleryCard } from './ClientIntroGalleryCard';
import { TourGlassPanel } from './TourGlassPanel';
import './ClientIntroPicker.css';

interface ClientIntroPickerProps {
  searchParams: URLSearchParams;
}

const CLIENT_INTRO_TITLE_ID = 'client-intro-title';

type CategoryFilter = 'all' | TourCategory;

export function ClientIntroPicker({ searchParams }: ClientIntroPickerProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const allTours = useMemo(() => listCatalogTours(), []);

  const filterCategories = useMemo(() => {
    const used = new Set(allTours.map((entry) => entry.category));
    return listTourCategories().filter((category) => used.has(category));
  }, [allTours]);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const activeTours = useMemo(() => {
    if (categoryFilter === 'all') return allTours;
    return allTours.filter((entry) => entry.category === categoryFilter);
  }, [allTours, categoryFilter]);

  useEffect(() => {
    document.title = CLIENT_INTRO_TITLE;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncPlayback = () => {
      if (motionQuery.matches) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        return;
      }

      void video.play().catch(() => undefined);
    };

    syncPlayback();
    motionQuery.addEventListener('change', syncPlayback);
    return () => motionQuery.removeEventListener('change', syncPlayback);
  }, []);

  const handleSelect = (tourId: string) => {
    const tour = loadTour(tourId);
    navigate(
      buildTourLocation(tourId, tour.firstScene, tour.firstScene, searchParams),
      { replace: true },
    );
  };

  return (
    <div className='app client-intro'>
      <div className='client-intro__media' aria-hidden='true'>
        <video
          ref={videoRef}
          className='client-intro__video'
          src={CLIENT_INTRO_HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload='auto'
        />
        <div className='client-intro__scrim' />
      </div>

      <TourGlassPanel
        titleId={CLIENT_INTRO_TITLE_ID}
        className='client-intro__panel'
        bodyClassName='client-intro__body'
        header={
          <div className='client-intro__header'>
            <img
              className='client-intro__logo'
              src={PLATFORM_PRODUCT_LOGO}
              alt='iShare'
              draggable={false}
            />
          </div>
        }
      >
        <div className='client-intro__intro'>
          <h2 id={CLIENT_INTRO_TITLE_ID} className='client-intro__title'>
            {CLIENT_INTRO_TITLE}
          </h2>
          <p className='client-intro__lead'>{CLIENT_INTRO_LEAD}</p>
        </div>

        {filterCategories.length > 1 && (
          <div
            className='client-intro__filters'
            role='group'
            aria-label='Filter tours by category'
          >
            <button
              type='button'
              className={`client-intro__filter${categoryFilter === 'all' ? ' client-intro__filter--active' : ''}`}
              aria-pressed={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            {filterCategories.map((category) => (
              <button
                key={category}
                type='button'
                className={`client-intro__filter${categoryFilter === category ? ' client-intro__filter--active' : ''}`}
                aria-pressed={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className='client-intro__gallery ishare-scrollbar'>
          {activeTours.length > 0 ?
            <ul className='client-intro__grid'>
              {activeTours.map((entry) => (
                <ClientIntroGalleryCard
                  key={entry.tourId}
                  entry={entry}
                  onSelect={() => handleSelect(entry.tourId)}
                />
              ))}
            </ul>
          : <p className='client-intro__empty'>
              {categoryFilter === 'all' ?
                'No tours available yet.'
              : 'No tours in this category yet.'}
            </p>
          }
        </div>
      </TourGlassPanel>
    </div>
  );
}
