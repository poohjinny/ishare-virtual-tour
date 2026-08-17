import { ExternalLink, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { HeaderEditProvider } from '@/components/header-edit';
import { PageMain } from '@/components/page-header';
import { TourEditorPanel } from '@/components/tour-editor-panel';
import { TourVisualEditor } from '@/components/tour-visual-editor';
import { TourWorkspaceHeader } from '@/components/tour-workspace-header';
import { Button } from '@/components/ui/button';
import { tourPath, tourVisualEditPath } from '@/lib/admin-routes';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { adminTourCatalog, getAdminTour } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import { getAdminTourNamings } from '@/lib/tour-namings';
import {
  adminTourCrumbPeers,
  getAdminTourOverviews,
} from '@/lib/tour-overview';
import { getAdminTourScene, getAdminTourScenes } from '@/lib/tour-scenes';
import { buildAdminPreviewUrl } from '@/lib/viewer-url';

export function generateStaticParams() {
  return adminTourCatalog.map((tour) => ({ tourId: tour.id }));
}

export default async function TourVisualEditPage(props: {
  params: Promise<{ tourId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tourId } = await props.params;
  const query = await props.searchParams;
  const tour = getAdminTour(tourId);
  const detail = await getAdminTourDetail(tourId);

  if (!tour || !detail) notFound();

  if (detail.viewerType !== 'panorama') {
    redirect(`/tours/${tour.id}/scenes`);
  }

  const scenes = await getAdminTourScenes(tour.id);
  if (scenes.length === 0) {
    redirect(`/tours/${tour.id}/scenes`);
  }

  const requestedSceneId =
    typeof query.scene === 'string' ? query.scene : undefined;

  // The bare tab URL renders the first scene, so entering the tab is a single
  // navigation; only an unknown `?scene=` bounces back.
  if (
    requestedSceneId &&
    !scenes.some((item) => item.id === requestedSceneId)
  ) {
    redirect(tourVisualEditPath(tour.id));
  }

  const sceneId =
    requestedSceneId ??
    scenes.find((item) => item.isFirstScene)?.id ??
    scenes[0].id;

  const scene = await getAdminTourScene(tour.id, sceneId);
  const namings = await getAdminTourNamings(tour.id);
  const overviews = await getAdminTourOverviews();
  const overview = overviews.find((item) => item.id === tour.id);

  if (!scene) notFound();

  const canEdit = process.env.NODE_ENV === 'development';
  const previewRoute = tourVisualEditPath(tour.id);
  const openPreviewUrl = buildAdminPreviewUrl(tour.id, { sceneId: scene.id });

  return (
    <AdminShell
      currentPage={AUTHORING_SURFACE.edit.label}
      currentImage={scene.thumbnailUrl}
      parents={[
        { href: '/tours', label: 'Tours' },
        {
          href: tourPath(tour.id),
          label: tour.name,
          image: overview?.coverUrl,
          fallbackImage: overview?.logoUrl,
          peers: adminTourCrumbPeers(tour.id, overviews, '/tours/{id}/edit'),
        },
      ]}
    >
      <HeaderEditProvider canEdit={canEdit}>
        <PageMain variant='workbench'>
          <TourWorkspaceHeader
            tourId={tour.id}
            title={overview?.title ?? tour.name}
            summary={tour.summary}
            visibility={tour.visibility}
            viewerType={detail.viewerType}
            overview={overview}
            overviews={overviews}
            actions={
              <>
                <Button variant='outline' size='sm' asChild>
                  <Link href={`/tours/${tour.id}/scenes/${scene.id}`}>
                    <Pencil aria-hidden='true' />
                    Scene details
                  </Link>
                </Button>
                <Button variant='ghost' size='sm' asChild>
                  <Link href={openPreviewUrl} target='_blank' rel='noreferrer'>
                    <ExternalLink aria-hidden='true' />
                    Open preview
                  </Link>
                </Button>
              </>
            }
          />

          <TourVisualEditor
            canEdit={canEdit}
            namings={namings}
            previewRoute={previewRoute}
            scene={scene}
            scenes={scenes}
            tourId={tour.id}
          />
          <TourEditorPanel canEdit={canEdit} info={false} tour={detail} />
        </PageMain>
      </HeaderEditProvider>
    </AdminShell>
  );
}
