import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/cn';
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
import { SegmentedTabs } from './ui/SegmentedTabs';
import { SegmentedTabPanelContent } from './ui/SegmentedTabPanel';
import { useSegmentedTabPanelScroll } from '../hooks/useSegmentedTabPanelScroll';
import { ClientIntroGalleryCard } from './ClientIntroGalleryCard';
import { TourGlassPanel } from './TourGlassPanel';

interface ClientIntroPickerProps {
  searchParams: URLSearchParams;
}

const CLIENT_INTRO_TITLE_ID = 'client-intro-title';

type CategoryFilter = 'all' | TourCategory;

function categoryFilterId(category: CategoryFilter): string {
  if (category === 'all') return 'client-intro-filter-all';
  return `client-intro-filter-${category.replace(/\s+/g, '-').toLowerCase()}`;
}

const INTRO_PANEL_CLASS = cn(
  'relative z-[1] flex h-[min(88vh,760px)] max-h-[min(88vh,760px)] w-[min(640px,calc(100vw-48px))] min-w-0 flex-col overflow-hidden',
  '[&_.tour-glass-panel__shell]:flex [&_.tour-glass-panel__shell]:h-full [&_.tour-glass-panel__shell]:max-h-none [&_.tour-glass-panel__shell]:min-h-0 [&_.tour-glass-panel__shell]:flex-1 [&_.tour-glass-panel__shell]:flex-col',
  '[&_.tour-glass-panel__header]:shrink-0',
  'max-[480px]:h-[min(88vh,760px)] max-[480px]:w-[min(100%,calc(100vw-32px))]',
);

const INTRO_BODY_CLASS = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden pt-3 pb-5',
);

const INTRO_FILTERS_CLASS = cn(
  'mx-5 mb-2 box-border min-h-[42px] min-w-0 shrink-0 overflow-y-hidden max-[480px]:mx-4',
  '[&_[data-segmented-tab]]:min-w-[8.75rem] [&_[data-segmented-tab]]:flex-none',
);

export function ClientIntroPicker({ searchParams }: ClientIntroPickerProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const allTours = useMemo(() => listCatalogTours(), []);
  const filterCategories = useMemo(() => listTourCategories(), []);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useSegmentedTabPanelScroll(categoryFilter, galleryRef);

  const filterTabs = useMemo(
    () => [
      {
        id: 'all' as const,
        label: 'All',
        htmlId: 'client-intro-filter-all',
        ariaControls: 'client-intro-gallery',
      },
      ...filterCategories.map((category) => ({
        id: category,
        label: category,
        htmlId: categoryFilterId(category),
        ariaControls: 'client-intro-gallery',
      })),
    ],
    [filterCategories],
  );

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
    <div className='app relative flex min-h-full items-center justify-center overflow-hidden p-6 max-[480px]:items-end max-[480px]:p-4'>
      <div
        className='absolute inset-0 z-0 bg-page bg-[radial-gradient(ellipse_120%_80%_at_50%_20%,rgba(15,23,42,0.2),rgba(15,23,42,0.72)_72%)]'
        aria-hidden='true'
      >
        <video
          ref={videoRef}
          className='h-full w-full object-cover motion-reduce:hidden'
          src={CLIENT_INTRO_HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload='auto'
        />
        <div
          className='pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(15,23,42,0.12)] via-[rgba(15,23,42,0.34)] via-48% to-[rgba(15,23,42,0.58)]'
          aria-hidden='true'
        />
      </div>

      <TourGlassPanel
        titleId={CLIENT_INTRO_TITLE_ID}
        className={INTRO_PANEL_CLASS}
        bodyClassName={INTRO_BODY_CLASS}
        header={
          <div className='flex w-full flex-col items-center justify-center px-0 pt-2.5 pb-1'>
            <img
              className='block h-11 max-w-[min(220px,100%)] w-auto object-contain object-center'
              src={PLATFORM_PRODUCT_LOGO}
              alt='iShare'
              draggable={false}
            />
          </div>
        }
      >
        <div className='shrink-0 px-5 pt-3.5 pb-4.5 text-center max-[480px]:px-4'>
          <h2
            id={CLIENT_INTRO_TITLE_ID}
            className='mb-1 font-display text-xl font-bold leading-[1.25] tracking-tight text-foreground'
          >
            {CLIENT_INTRO_TITLE}
          </h2>
          <p className='m-0 font-body text-md leading-[1.55] text-muted'>
            {CLIENT_INTRO_LEAD}
          </p>
        </div>

        {filterCategories.length > 0 && (
          <SegmentedTabs
            className={INTRO_FILTERS_CLASS}
            aria-label='Filter tours by category'
            tabs={filterTabs}
            value={categoryFilter}
            onChange={setCategoryFilter}
            scrollable
            scrollToStartKey='all'
          />
        )}

        <div
          ref={galleryRef}
          id='client-intro-gallery'
          className='ishare-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-1 [-webkit-overflow-scrolling:touch] max-[480px]:px-4'
          role='tabpanel'
          aria-labelledby={categoryFilterId(categoryFilter)}
        >
          <SegmentedTabPanelContent panelKey={categoryFilter}>
            {activeTours.length > 0 ?
              <ul className='m-0 grid grid-cols-1 items-stretch gap-3 p-0 min-[560px]:grid-cols-2'>
                {activeTours.map((entry) => (
                  <ClientIntroGalleryCard
                    key={entry.tourId}
                    entry={entry}
                    onSelect={() => handleSelect(entry.tourId)}
                  />
                ))}
              </ul>
            : <p className='m-0 px-1 pt-3 pb-1 text-center text-md leading-[1.55] text-muted'>
                {categoryFilter === 'all' ?
                  'No tours available yet.'
                : 'No tours in this category yet.'}
              </p>
            }
          </SegmentedTabPanelContent>
        </div>
      </TourGlassPanel>
    </div>
  );
}
