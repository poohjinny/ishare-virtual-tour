import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { HeaderEditProvider } from '@/components/header-edit';
import { PageMain } from '@/components/page-header';
import { SceneManagePanel } from '@/components/scene-manage-panel';
import { TourEditorPanel } from '@/components/tour-editor-panel';
import { TourWorkspaceHeader } from '@/components/tour-workspace-header';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { adminTourCatalog, getAdminTour } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import {
  adminTourCrumbPeers,
  getAdminTourOverviews,
} from '@/lib/tour-overview';
import { getAdminTourScenes } from '@/lib/tour-scenes';

export function generateStaticParams() {
  return adminTourCatalog.map((tour) => ({ tourId: tour.id }));
}

export default async function TourScenesPage(
  props: PageProps<'/tours/[tourId]/scenes'>,
) {
  const { tourId } = await props.params;
  const tour = getAdminTour(tourId);
  const detail = await getAdminTourDetail(tourId);

  if (!tour || !detail) notFound();

  const scenes = await getAdminTourScenes(tour.id);
  const overviews = await getAdminTourOverviews();
  const overview = overviews.find((item) => item.id === tour.id);
  const canEdit = process.env.NODE_ENV === 'development';

  return (
    <AdminShell
      currentPage='Scenes'
      parents={[
        { href: '/tours', label: 'Tours' },
        {
          href: `/tours/${tour.id}`,
          label: tour.name,
          image: overview?.coverUrl,
          fallbackImage: overview?.logoUrl,
          peers: adminTourCrumbPeers(tour.id, overviews, '/tours/{id}/scenes'),
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
            lead={AUTHORING_SURFACE.scenes.description}
          />

          <SceneManagePanel
            canEdit={canEdit}
            scenes={scenes}
            tourId={tour.id}
            viewerType={detail.viewerType}
          />
          <TourEditorPanel canEdit={canEdit} info={false} tour={detail} />
        </PageMain>
      </HeaderEditProvider>
    </AdminShell>
  );
}
