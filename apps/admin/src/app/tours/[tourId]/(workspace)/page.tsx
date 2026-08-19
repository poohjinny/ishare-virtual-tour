import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { EditorPreviewSplit } from '@/components/editor-preview-split';
import { HeaderEditIntent } from '@/components/header-edit';
import { TourEditorPanel } from '@/components/tour-editor-panel';
import { TourPreviewPanel } from '@/components/tour-preview-panel';
import {
  TOUR_EDIT_QUERY_KEY,
  TOUR_EDIT_QUERY_VALUE,
} from '@/lib/admin-routes';
import { adminTourCatalog } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import {
  adminTourCrumbPeers,
  getAdminTourOverviews,
} from '@/lib/tour-overview';

export function generateStaticParams() {
  return adminTourCatalog.map((tour) => ({ tourId: tour.id }));
}

export default async function TourDetailPage(
  props: PageProps<'/tours/[tourId]'>,
) {
  const { tourId } = await props.params;
  const query = await props.searchParams;
  const openEditTour = query[TOUR_EDIT_QUERY_KEY] === TOUR_EDIT_QUERY_VALUE;
  const tour = await getAdminTourDetail(tourId);
  const overviews = await getAdminTourOverviews();
  const overview = overviews.find((item) => item.id === tourId);

  if (!tour) notFound();

  const canEdit = process.env.NODE_ENV === 'development';

  return (
    <AdminShell
      currentPage={tour.title}
      currentImage={overview?.coverUrl}
      currentFallbackImage={overview?.logoUrl}
      currentPeers={adminTourCrumbPeers(tour.id, overviews)}
      parents={[{ href: '/tours', label: 'Tours' }]}
    >
      <HeaderEditIntent active={openEditTour} />
      <EditorPreviewSplit
        editor={<TourEditorPanel canEdit={canEdit} tour={tour} />}
        preview={
          <TourPreviewPanel
            title={tour.title}
            tourId={tour.id}
            viewerType={tour.viewerType}
          />
        }
      />
    </AdminShell>
  );
}
