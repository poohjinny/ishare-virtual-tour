import { notFound } from 'next/navigation';

import { TourWorkspaceChrome } from '@/components/tour-workspace-chrome';
import { TourWorkspaceHeader } from '@/components/tour-workspace-header';
import { adminTourCatalog, getAdminTour } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import { getAdminTourOverviews } from '@/lib/tour-overview';

export function generateStaticParams() {
  return adminTourCatalog.map((tour) => ({ tourId: tour.id }));
}

/** Workspace tabs stay mounted. `/edit` is outside this group; child details hide chrome. */
export default async function TourWorkspaceLayout({
  children,
  params,
}: LayoutProps<'/tours/[tourId]'>) {
  const { tourId } = await params;
  const [detail, overviews] = await Promise.all([
    getAdminTourDetail(tourId),
    getAdminTourOverviews(),
  ]);
  const tour = getAdminTour(tourId);

  if (!tour || !detail) notFound();

  const overview = overviews.find((item) => item.id === tour.id);

  return (
    <TourWorkspaceChrome
      tourId={tour.id}
      header={
        <TourWorkspaceHeader
          tourId={tour.id}
          title={overview?.title ?? detail.title}
          summary={detail.summary || tour.summary}
          visibility={detail.visibility}
          viewerType={detail.viewerType}
          overview={overview}
          overviews={overviews}
        />
      }
    >
      {children}
    </TourWorkspaceChrome>
  );
}
