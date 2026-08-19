import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { NamingDetailPanel } from '@/components/naming-detail-panel';
import { PageMain } from '@/components/page-header';
import { resolveTourMediaUrl } from '@/lib/admin-media';
import { adminTourCatalog, getAdminTour } from '@/lib/tour-catalog';
import {
  getAdminTourNaming,
  getAdminTourNamings,
} from '@/lib/tour-namings';
import {
  adminTourCrumbPeers,
  getAdminTourOverviews,
} from '@/lib/tour-overview';
import { getAdminTourScenes } from '@/lib/tour-scenes';

export async function generateStaticParams() {
  const toursWithNamings = await Promise.all(
    adminTourCatalog.map(async (tour) => ({
      tourId: tour.id,
      namings: await getAdminTourNamings(tour.id),
    })),
  );

  return toursWithNamings.flatMap(({ tourId, namings }) =>
    namings.map((naming) => ({ tourId, namingId: naming.id })),
  );
}

export default async function NamingDetailPage(
  props: { params: Promise<{ tourId: string; namingId: string }> },
) {
  const { tourId, namingId } = await props.params;
  const tour = getAdminTour(tourId);

  if (!tour) notFound();

  const [naming, namings, scenes, overviews] = await Promise.all([
    getAdminTourNaming(tourId, namingId),
    getAdminTourNamings(tourId),
    getAdminTourScenes(tourId),
    getAdminTourOverviews(),
  ]);

  if (!naming) notFound();

  const overview = overviews.find((item) => item.id === tour.id);
  const placementScene = scenes.find(
    (scene) => scene.id === naming.placements[0]?.sceneId,
  );
  const thumbSrc =
    naming.image ?
      resolveTourMediaUrl(naming.image, tour.clientId, tour.id)
    : placementScene?.thumbnailUrl;
  const namingPeers = namings.map((item) => {
    const scene = scenes.find(
      (candidate) => candidate.id === item.placements[0]?.sceneId,
    );
    return {
      value: item.id,
      label: item.name,
      image:
        item.image ?
          resolveTourMediaUrl(item.image, tour.clientId, tour.id)
        : scene?.thumbnailUrl,
    };
  });

  return (
    <AdminShell
      currentPage={naming.name}
      currentImage={thumbSrc}
      currentPeers={{
        value: naming.id,
        label: 'Switch naming',
        hrefTemplate: `/tours/${tour.id}/namings/{id}`,
        imageFit: 'cover',
        options: namingPeers,
      }}
      parents={[
        { href: '/tours', label: 'Tours' },
        {
          href: `/tours/${tour.id}`,
          label: tour.name,
          image: overview?.coverUrl,
          fallbackImage: overview?.logoUrl,
          peers: adminTourCrumbPeers(tour.id, overviews, '/tours/{id}/namings'),
        },
        { href: `/tours/${tour.id}/namings`, label: 'Namings' },
      ]}
    >
      <PageMain>
        <NamingDetailPanel
          key={naming.id}
          canEdit={process.env.NODE_ENV === 'development'}
          naming={naming}
          namingPeers={namingPeers}
          scenes={scenes}
          thumbSrc={thumbSrc}
          tourId={tour.id}
        />
      </PageMain>
    </AdminShell>
  );
}
