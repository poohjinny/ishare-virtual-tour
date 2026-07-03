import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/cn';
import { subscribeDevCatalogSnapshot } from '../data/devCatalogSnapshot';
import {
  CLIENT_INTRO_HERO_VIDEO,
  PLATFORM_PRODUCT_LOGO,
} from '../constants/branding';
import {
  CLIENT_INTRO_LEAD,
  CLIENT_INTRO_TITLE,
} from '../constants/clientIntro';
import type { TourCategory } from '../constants/tourCategories';
import {
  isFeaturedGalleryMode,
  listCatalogTours,
  listTourCategories,
  sortCatalogToursForGallery,
} from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { buildTourLocation } from '../utils/tourPaths';
import { toAbsoluteTourAssetUrl } from '../utils/tourOpenGraph';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import { useTourOpenGraph } from '../hooks/useTourOpenGraph';
import { SegmentedTabs } from './ui/SegmentedTabs';
import {
  segmentedTabsScrollableItemsClassName,
  segmentedTabsTrackChromeClassName,
} from './ui/segmentedTabsClasses';
import { SegmentedTabPanelContent } from './ui/SegmentedTabPanel';
import { useSegmentedTabPanelScroll } from '../hooks/useSegmentedTabPanelScroll';
import { ClientIntroTabLabel } from './icons/ClientIntroTabIcons';
import { ClientIntroGalleryCard } from './ClientIntroGalleryCard';
import { TourGlassPanel } from './TourGlassPanel';
import { tourNavPanelScrollClassName } from './tourNavFloatVariants';

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
  'tour-glass-panel--intro relative z-[1] mx-auto flex w-[min(640px,calc(100vw-48px))] shrink-0 flex-col self-center',
  'max-[480px]:w-[min(100%,calc(100vw-32px))]',
  '[&_.tour-glass-panel__header]:shrink-0',
);

const INTRO_BODY_CLASS = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip overflow-hidden',
);

const INTRO_FILTERS_CLASS = cn(
  'mx-5 mb-2 box-border w-[calc(100%-2.5rem)] max-w-full min-w-0 shrink-0 overflow-x-auto overflow-y-hidden max-[480px]:mx-4 max-[480px]:w-[calc(100%-2rem)]',
  segmentedTabsTrackChromeClassName,
  segmentedTabsScrollableItemsClassName,
);

const INTRO_GALLERY_SCROLL_INNER_CLASS = cn(
  'px-5 pb-5 max-[480px]:px-4 max-[480px]:pb-[18px]',
);

export function ClientIntroPicker({ searchParams }: ClientIntroPickerProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(
    () => subscribeDevCatalogSnapshot(() => setCatalogTick((tick) => tick + 1)),
    [],
  );

  const allTours = useMemo(() => listCatalogTours(), [catalogTick]);
  const filterCategories = useMemo(() => listTourCategories(), [catalogTick]);
  const featuredOnly = isFeaturedGalleryMode(searchParams);

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

  const filterTabOrder = useMemo(
    () => filterTabs.map((tab) => tab.id),
    [filterTabs],
  );

  const activeTours = useMemo(() => {
    const scoped =
      categoryFilter === 'all' ? allTours : (
        allTours.filter((entry) => entry.category === categoryFilter)
      );
    const filtered =
      featuredOnly ? scoped.filter((entry) => entry.featured) : scoped;
    return sortCatalogToursForGallery(filtered);
  }, [allTours, categoryFilter, featuredOnly]);

  useTourOpenGraph(
    useMemo(
      () => ({
        title: CLIENT_INTRO_TITLE,
        description: CLIENT_INTRO_LEAD,
        imageUrl: toAbsoluteTourAssetUrl('/assets/brand/logo_ishare.png'),
        pageUrl: resolveTourPublicOrigin(),
      }),
      [],
    ),
  );

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
            {featuredOnly ?
              'Featured virtual tours from our partner organizations.'
            : CLIENT_INTRO_LEAD}
          </p>
        </div>

        {filterCategories.length > 0 && (
          <SegmentedTabs
            className={INTRO_FILTERS_CLASS}
            aria-label='Filter tours by category'
            tabs={filterTabs.map((tab) => ({
              ...tab,
              label: <ClientIntroTabLabel filter={tab.id} label={tab.label} />,
            }))}
            value={categoryFilter}
            onChange={setCategoryFilter}
            scrollable
            scrollToStartKey='all'
          />
        )}

        <div
          ref={galleryRef}
          id='client-intro-gallery'
          className={cn(
            'client-intro__gallery flex flex-col overflow-x-clip',
            tourNavPanelScrollClassName,
          )}
          role='tabpanel'
          aria-labelledby={categoryFilterId(categoryFilter)}
        >
          <div className={INTRO_GALLERY_SCROLL_INNER_CLASS}>
            <SegmentedTabPanelContent
              panelKey={categoryFilter}
              tabOrder={filterTabOrder}
              className='client-intro__tab-panel'
            >
              {activeTours.length > 0 ?
                <ul className='m-0 grid grid-cols-1 items-stretch gap-4 p-0 min-[560px]:grid-cols-2'>
                  {activeTours.map((entry) => (
                    <ClientIntroGalleryCard
                      key={entry.tourId}
                      entry={entry}
                      onSelect={() => handleSelect(entry.tourId)}
                    />
                  ))}
                </ul>
              : <p className='m-0 pt-3 pb-1 text-center text-md leading-[1.55] text-muted'>
                  {featuredOnly ?
                    categoryFilter === 'all' ?
                      'No featured tours yet.'
                    : 'No featured tours in this category yet.'
                  : categoryFilter === 'all' ?
                    'No tours available yet.'
                  : 'No tours in this category yet.'}
                </p>
              }
            </SegmentedTabPanelContent>
          </div>
        </div>
      </TourGlassPanel>
    </div>
  );
}
