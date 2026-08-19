import { ExternalLink, PencilRuler } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { MediaThumb } from '@/components/branded-avatar';
import { EditorPreviewSplit } from '@/components/editor-preview-split';
import {
  HeaderEditButton,
  HeaderEditProvider,
} from '@/components/header-edit';
import { PageHeader, PageMain } from '@/components/page-header';
import { PeerSwitcher } from '@/components/peer-switcher';
import { SceneEditorPanel } from '@/components/scene-editor-panel';
import { ViewerTypeBadge, VisibilityBadge } from '@/components/status-badges';
import { TourPreviewPanel } from '@/components/tour-preview-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  showTourVisualEditor,
  tourLayoutFromScene,
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

export async function generateStaticParams() {
  const toursWithScenes = await Promise.all(
    adminTourCatalog.map(async (tour) => ({
      tourId: tour.id,
      scenes: await getAdminTourScenes(tour.id),
    })),
  );

  return toursWithScenes.flatMap(({ tourId, scenes }) =>
    scenes.map((scene) => ({ tourId, sceneId: scene.id })),
  );
}

export default async function SceneDetailPage(
  props: PageProps<'/tours/[tourId]/scenes/[sceneId]'>,
) {
  const { tourId, sceneId } = await props.params;
  const tour = getAdminTour(tourId);
  const detail = await getAdminTourDetail(tourId);
  const scene = await getAdminTourScene(tourId, sceneId);
  const scenes = await getAdminTourScenes(tourId);
  const namings = await getAdminTourNamings(tourId);
  const overviews = await getAdminTourOverviews();

  if (!tour || !detail || !scene) notFound();

  const overview = overviews.find((item) => item.id === tour.id);
  const canEdit = process.env.NODE_ENV === 'development';

  const previewUrl = buildAdminPreviewUrl(tour.id, { sceneId: scene.id });
  const scenePeers = scenes.map((item) => ({
    value: item.id,
    label: item.title,
    image: item.thumbnailUrl,
  }));

  return (
    <AdminShell
      currentPage={scene.title}
      currentImage={scene.thumbnailUrl}
      currentPeers={{
        value: scene.id,
        label: 'Switch scene',
        hrefTemplate: `/tours/${tour.id}/scenes/{id}`,
        imageFit: 'cover',
        options: scenePeers,
      }}
      parents={[
        { href: '/tours', label: 'Tours' },
        {
          href: `/tours/${tour.id}`,
          label: tour.name,
          image: overview?.coverUrl,
          fallbackImage: overview?.logoUrl,
          peers: adminTourCrumbPeers(tour.id, overviews, '/tours/{id}/scenes'),
        },
        { href: `/tours/${tour.id}/scenes`, label: 'Scenes' },
      ]}
    >
      <HeaderEditProvider canEdit={canEdit}>
        <PageMain variant='split'>
          <PageHeader
            title={scene.title}
            description={AUTHORING_SURFACE.scene.description}
            media={
              <MediaThumb
                src={scene.thumbnailUrl}
                label='Scene'
                className='w-20'
              />
            }
            switcher={
              <PeerSwitcher
                variant='title'
                label='Switch scene'
                value={scene.id}
                options={scenePeers}
                hrefTemplate={`/tours/${tour.id}/scenes/{id}`}
                imageFit='cover'
              />
            }
            meta={
              <>
                <VisibilityBadge visibility={scene.visibility} />
                {scene.isFirstScene ?
                  <Badge variant='outline'>First scene</Badge>
                : null}
                <ViewerTypeBadge viewerType={detail.viewerType} />
                <Badge variant='secondary'>
                  {scene.hotspotCount}{' '}
                  {scene.hotspotCount === 1 ? 'hotspot' : 'hotspots'}
                </Badge>
              </>
            }
            actions={
              <>
                <HeaderEditButton />
                {showTourVisualEditor(detail.viewerType) ?
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      href={tourVisualEditPath(
                        tour.id,
                        scene.id,
                        tourLayoutFromScene(scene.id),
                      )}
                    >
                      <PencilRuler aria-hidden='true' />
                      {AUTHORING_SURFACE.edit.label}
                    </Link>
                  </Button>
                : null}
                <Button variant='outline' size='sm' asChild>
                  <Link href={previewUrl} target='_blank' rel='noreferrer'>
                    <ExternalLink aria-hidden='true' />
                    Preview
                  </Link>
                </Button>
              </>
            }
          />

          <EditorPreviewSplit
            editor={
              <SceneEditorPanel
                canEdit={canEdit}
                namings={namings}
                scene={scene}
                scenes={scenes}
                tourId={tour.id}
                viewerType={detail.viewerType}
              />
            }
            preview={
              <TourPreviewPanel
                sceneId={scene.id}
                title={scene.title}
                tourId={tour.id}
                viewerType={detail.viewerType}
              />
            }
          />
        </PageMain>
      </HeaderEditProvider>
    </AdminShell>
  );
}
