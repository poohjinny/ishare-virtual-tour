import { Eye, MapPinned, Tag, View } from 'lucide-react';

import { AdminShell } from '@/components/admin-shell';
import { DonutLegend } from '@/components/donut-chart';
import { SegmentedBar } from '@/components/distribution-chart';
import { PageHeader, PageMain } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { TourCreatePanel } from '@/components/tour-create-panel';
import { TourTable } from '@/components/tour-table';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { chartShares, chartStartTimes } from '@/lib/chart-motion';
import {
  categoryChartColor,
  VIEWER_COLORS,
  VISIBILITY_COLORS,
} from '@/lib/semantic-colors';
import { adminClientCatalog, adminTourCategories } from '@/lib/tour-catalog';
import { getAdminOverview } from '@/lib/tour-overview';
import {
  TOUR_CREATE_QUERY_KEY,
  TOUR_CREATE_QUERY_VALUE,
} from '@/lib/admin-routes';

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const openCreateTour =
    query[TOUR_CREATE_QUERY_KEY] === TOUR_CREATE_QUERY_VALUE;
  const { tours, stats } = await getAdminOverview();
  const panoramaCount = tours.filter(
    (tour) => tour.viewerType !== 'model3d',
  ).length;
  const modelCount = tours.length - panoramaCount;
  const categoryItems = stats.categories.map((category, index) => {
    const color = categoryChartColor(category.name, index);
    return { label: category.name, count: category.count, color };
  });
  const visibilityItems = [
    {
      label: 'Public',
      count: stats.visibility.public,
      color: VISIBILITY_COLORS.public,
    },
    {
      label: 'Unlisted',
      count: stats.visibility.unlisted,
      color: VISIBILITY_COLORS.unlisted,
    },
    {
      label: 'Internal',
      count: stats.visibility.internal,
      color: VISIBILITY_COLORS.internal,
    },
  ];
  const viewerItems = [
    { label: '360°', count: panoramaCount, color: VIEWER_COLORS.panorama },
    { label: '3D', count: modelCount, color: VIEWER_COLORS.model3d },
  ];

  const [categoryStart, visibilityStart, viewerStart] = chartStartTimes(
    [categoryItems, visibilityItems, viewerItems].map(chartShares),
  );

  return (
    <AdminShell currentPage='Tours'>
      <PageMain>
        <PageHeader
          title='Tours'
          description={AUTHORING_SURFACE.tours.description}
          icon={MapPinned}
        />

        <StatCard
          label='Tours'
          value={stats.tours}
          icon={MapPinned}
          tone='info'
          framed
          description={
            <div className='grid gap-10 sm:grid-cols-3 sm:gap-16'>
              <StatCard
                label='Categories'
                value={stats.categories.length}
                showValue={false}
                eyebrow='plain'
                tone='info'
                description={
                  <div className='space-y-3'>
                    <SegmentedBar
                      items={categoryItems}
                      startMs={categoryStart}
                      aria-label='Tour categories'
                    />
                    <DonutLegend
                      slices={categoryItems}
                      className='type-meta'
                      layout='column'
                    />
                  </div>
                }
                icon={Tag}
              />
              <StatCard
                label='Visibility'
                value={stats.tours}
                showValue={false}
                eyebrow='plain'
                tone='info'
                description={
                  <div className='space-y-3'>
                    <SegmentedBar
                      items={visibilityItems}
                      startMs={visibilityStart}
                      aria-label='Tour visibility'
                    />
                    <DonutLegend
                      slices={visibilityItems}
                      className='type-meta'
                      layout='column'
                    />
                  </div>
                }
                icon={Eye}
              />
              <StatCard
                label='Viewer'
                value={stats.tours}
                showValue={false}
                eyebrow='plain'
                tone='info'
                description={
                  <div className='space-y-3'>
                    <SegmentedBar
                      items={viewerItems}
                      startMs={viewerStart}
                      aria-label='Viewer type'
                    />
                    <DonutLegend
                      slices={viewerItems}
                      className='type-meta'
                      layout='column'
                    />
                  </div>
                }
                icon={View}
              />
            </div>
          }
        />

        <TourTable
          canDelete={process.env.NODE_ENV === 'development'}
          canEdit={process.env.NODE_ENV === 'development'}
          description='Local tours across all clients, with baked cover art when available.'
          tours={tours}
          createAction={
            <TourCreatePanel
              key={openCreateTour ? 'guide-create-tour' : 'default'}
              canEdit={process.env.NODE_ENV === 'development'}
              categories={adminTourCategories}
              clients={adminClientCatalog}
              defaultOpen={openCreateTour}
            />
          }
        />
      </PageMain>
    </AdminShell>
  );
}
