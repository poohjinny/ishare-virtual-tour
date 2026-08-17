import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { MediaThumb } from '@/components/branded-avatar';
import { EditorPreviewSplit } from '@/components/editor-preview-split';
import {
  PageChrome,
  PageHeader,
  PageMain,
  WorkspaceTabs,
} from '@/components/page-header';
import { SceneEditorPanel } from '@/components/scene-editor-panel';
import { ViewerTypeBadge, VisibilityBadge } from '@/components/status-badges';
import { TourPreviewPanel } from '@/components/tour-preview-panel';
import { TourWorkspaceNav } from '@/components/tour-workspace-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const previewUrl = buildAdminPreviewUrl(tour.id, { sceneId: scene.id });

  return (
    <AdminShell
      currentPage={scene.title}
      currentImage={scene.thumbnailUrl}
      currentPeers={{
        value: scene.id,
        label: 'Switch scene',
        hrefTemplate: `/tours/${tour.id}/scenes/{id}`,
        imageFit: 'cover',
        options: scenes.map((item) => ({
          value: item.id,
          label: item.title,
          image: item.thumbnailUrl,
        })),
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
      <PageMain>
        <PageChrome>
          <PageHeader
            title={scene.title}
            media={
              <MediaThumb
                src={scene.thumbnailUrl}
                label='Scene'
                className='w-20'
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
              <Button variant='ghost' size='sm' asChild>
                <Link href={previewUrl} target='_blank' rel='noreferrer'>
                  <ExternalLink aria-hidden='true' />
                  Open preview
                </Link>
              </Button>
            }
          />
          <WorkspaceTabs lead={AUTHORING_SURFACE.scene.description}>
            <TourWorkspaceNav
              tourId={tour.id}
              scenes={scenes}
              sceneId={scene.id}
              sceneCount={scenes.length}
              namingCount={namings.length}
              showEditor={detail.viewerType === 'panorama'}
            />
          </WorkspaceTabs>
        </PageChrome>

        <EditorPreviewSplit
          className='xl:grid-cols-[minmax(22rem,0.8fr)_minmax(34rem,1.4fr)]'
          editor={
            <SceneEditorPanel
              canEdit={process.env.NODE_ENV === 'development'}
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
    </AdminShell>
  );
}
