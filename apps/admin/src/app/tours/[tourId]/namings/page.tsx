import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { HeaderEditProvider } from '@/components/header-edit';
import { NamingManager } from '@/components/naming-manager';
import { PageMain } from '@/components/page-header';
import { TourEditorPanel } from '@/components/tour-editor-panel';
import { TourWorkspaceHeader } from '@/components/tour-workspace-header';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { adminTourCatalog, getAdminTour } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import { getAdminTourNamings } from '@/lib/tour-namings';
import {
  adminTourCrumbPeers,
  getAdminTourOverviews,
} from '@/lib/tour-overview';
import { getAdminTourScenes } from '@/lib/tour-scenes';

export function generateStaticParams() {
  return adminTourCatalog.map((tour) => ({ tourId: tour.id }));
}

export default async function TourNamingsPage(
  props: PageProps<'/tours/[tourId]/namings'>,
) {
  const { tourId } = await props.params;
  const tour = getAdminTour(tourId);
  if (!tour) notFound();

  const [namings, scenes, overviews, detail] = await Promise.all([
    getAdminTourNamings(tourId),
    getAdminTourScenes(tourId),
    getAdminTourOverviews(),
    getAdminTourDetail(tourId),
  ]);
  if (!detail) notFound();
  const overview = overviews.find((item) => item.id === tour.id);
  const canEdit = process.env.NODE_ENV === 'development';

  return (
    <AdminShell
      currentPage='Namings'
      parents={[
        { href: '/tours', label: 'Tours' },
        {
          href: `/tours/${tour.id}`,
          label: tour.name,
          image: overview?.coverUrl,
          fallbackImage: overview?.logoUrl,
          peers: adminTourCrumbPeers(tour.id, overviews, '/tours/{id}/namings'),
        },
      ]}
    >
      <HeaderEditProvider canEdit={canEdit}>
        <PageMain>
          <TourWorkspaceHeader
            tourId={tour.id}
            title={overview?.title ?? tour.name}
            summary={tour.summary}
            visibility={tour.visibility}
            viewerType={detail.viewerType}
            overview={overview}
            overviews={overviews}
            lead={AUTHORING_SURFACE.namings.description}
          />

          <NamingManager
            canEdit={canEdit}
            clientId={tour.clientId}
            namings={namings}
            scenes={scenes}
            tourId={tour.id}
          />
          <TourEditorPanel canEdit={canEdit} info={false} tour={detail} />
        </PageMain>
      </HeaderEditProvider>
    </AdminShell>
  );
}
