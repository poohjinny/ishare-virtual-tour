import { ExternalLink, PencilRuler } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { PageHeader, PageMain } from '@/components/page-header';
import {
  EditorCloseButton,
  TourVisualEditor,
} from '@/components/tour-visual-editor';
import { Button } from '@/components/ui/button';
import {
  showTourVisualEditor,
  TOUR_LAYOUT_FROM_QUERY_KEY,
  tourLayoutCloseHref,
  tourPath,
  tourVisualEditPath,
} from '@/lib/admin-routes';
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

  if (!showTourVisualEditor(detail.viewerType)) {
    redirect(`/tours/${tour.id}/scenes`);
  }

  const scenes = await getAdminTourScenes(tour.id);
  if (scenes.length === 0) {
    redirect(`/tours/${tour.id}/scenes`);
  }

  const requestedSceneId =
    typeof query.scene === 'string' ? query.scene : undefined;
  const fromQuery = query[TOUR_LAYOUT_FROM_QUERY_KEY];
  const layoutFrom = typeof fromQuery === 'string' ? fromQuery : undefined;

  // The bare tool URL renders the first scene, so entering the editor is a
  // single navigation; only an unknown `?scene=` bounces back.
  if (
    requestedSceneId &&
    !scenes.some((item) => item.id === requestedSceneId)
  ) {
    redirect(tourVisualEditPath(tour.id, undefined, layoutFrom));
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
      <PageMain variant='workbench'>
        <PageHeader
          title={AUTHORING_SURFACE.edit.label}
          icon={PencilRuler}
          actions={
            <>
              <Button variant='outline' size='sm' asChild>
                <Link href={openPreviewUrl} target='_blank' rel='noreferrer'>
                  <ExternalLink aria-hidden='true' />
                  Preview
                </Link>
              </Button>
              <EditorCloseButton
                href={tourLayoutCloseHref(
                  tour.id,
                  layoutFrom,
                  scenes.map((item) => item.id),
                )}
              />
            </>
          }
        />

        <TourVisualEditor
          canEdit={canEdit}
          layoutFrom={layoutFrom}
          namings={namings}
          previewRoute={previewRoute}
          scene={scene}
          scenes={scenes}
          tourId={tour.id}
        />
      </PageMain>
    </AdminShell>
  );
}
