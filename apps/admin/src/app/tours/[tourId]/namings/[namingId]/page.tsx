import { BadgeDollarSign, HandHeart, Link2, MapPin, Tag } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { MediaThumb } from '@/components/branded-avatar';
import {
  InfoField,
  InfoFieldList,
  InfoLink,
} from '@/components/form-status';
import { NamingEditorForm } from '@/components/naming-editor-form';
import { PageHeader, PageMain, SectionHeader } from '@/components/page-header';
import { NamingStatusBadge, VisibilityBadge } from '@/components/status-badges';
import { TourWorkspaceHeader } from '@/components/tour-workspace-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { resolveTourMediaUrl } from '@/lib/admin-media';
import { httpHref } from '@/lib/admin-routes';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { adminTourCatalog, getAdminTour } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import {
  getAdminTourNaming,
  getAdminTourNamings,
} from '@/lib/tour-namings';
import {
  adminTourCrumbPeers,
  getAdminTourOverviews,
} from '@/lib/tour-overview';
import { getAdminTourScenes } from '@/lib/tour-scenes';
import { cardLinkClass } from '@/lib/utils';

const priceFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

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

  const [detail, naming, namings, scenes, overviews] = await Promise.all([
    getAdminTourDetail(tourId),
    getAdminTourNaming(tourId, namingId),
    getAdminTourNamings(tourId),
    getAdminTourScenes(tourId),
    getAdminTourOverviews(),
  ]);

  if (!detail || !naming) notFound();

  const overview = overviews.find((item) => item.id === tour.id);
  const placementScene = scenes.find(
    (scene) => scene.id === naming.placements[0]?.sceneId,
  );
  const thumbSrc =
    naming.image ?
      resolveTourMediaUrl(naming.image, tour.clientId, tour.id)
    : placementScene?.thumbnailUrl;
  const canEdit = process.env.NODE_ENV === 'development';

  return (
    <AdminShell
      currentPage={naming.name}
      currentImage={thumbSrc}
      currentPeers={{
        value: naming.id,
        label: 'Switch naming',
        hrefTemplate: `/tours/${tour.id}/namings/{id}`,
        imageFit: 'cover',
        options: namings.map((item) => {
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
        }),
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

        <PageHeader
          title={naming.name}
          description='Naming opportunity details, visitor-facing content, donor recognition, and scene placements.'
          media={
            <MediaThumb
              src={thumbSrc}
              label={naming.name}
              aspect='auto'
              className='w-24'
            />
          }
          meta={
            <>
              <NamingStatusBadge status={naming.status} />
              <VisibilityBadge visibility={naming.visibility} />
            </>
          }
        />

        <section className='grid gap-4' aria-labelledby='naming-summary-heading'>
          <SectionHeader
            id='naming-summary-heading'
            title='Opportunity summary'
            description='Commercial status and visitor-facing recognition content.'
            icon={Tag}
          />
          <div className='grid gap-4 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  Core catalog values for this opportunity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InfoFieldList>
                  <InfoField label='Price' layout='inline'>
                    {priceFormatter.format(naming.price)}
                  </InfoField>
                  <InfoField label='Status' layout='inline'>
                    <NamingStatusBadge status={naming.status} />
                  </InfoField>
                  <InfoField label='Visibility' layout='inline'>
                    <VisibilityBadge visibility={naming.visibility} />
                  </InfoField>
                  <InfoField label='Naming ID' layout='inline'>
                    <span className='font-mono type-meta'>{naming.id}</span>
                  </InfoField>
                </InfoFieldList>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recognition content</CardTitle>
                <CardDescription>
                  Copy and linked media presented to tour visitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InfoFieldList>
                  <InfoField label='Body' layout='inline'>
                    {naming.body}
                  </InfoField>
                  <InfoField label='Video' layout='inline'>
                    {naming.videoUrl ?
                      <InfoLink href={httpHref(naming.videoUrl)}>
                        Open video
                      </InfoLink>
                    : null}
                  </InfoField>
                  <InfoField label='Image' layout='inline'>
                    {naming.image || null}
                  </InfoField>
                </InfoFieldList>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className='grid gap-4' aria-labelledby='naming-donor-heading'>
          <SectionHeader
            id='naming-donor-heading'
            title='Donor recognition'
            description='Person or organization associated with this opportunity.'
            icon={HandHeart}
          />
          <Card>
            <CardContent>
              <InfoFieldList columns={2}>
                <InfoField label='Donor' layout='inline'>
                  {naming.donor?.name}
                </InfoField>
                <InfoField label='Kind' layout='inline'>
                  {naming.donor?.kind}
                </InfoField>
                <InfoField label='Affiliation' layout='inline'>
                  {naming.donor?.affiliation}
                </InfoField>
                <InfoField label='Website' layout='inline'>
                  {naming.donor?.website ?
                    <InfoLink href={httpHref(naming.donor.website)}>
                      {naming.donor.website}
                    </InfoLink>
                  : null}
                </InfoField>
              </InfoFieldList>
            </CardContent>
          </Card>
        </section>

        <section
          className='grid gap-4'
          aria-labelledby='naming-placements-heading'
        >
          <SectionHeader
            id='naming-placements-heading'
            title='Scene placements'
            description='Hotspots that place this opportunity in the tour.'
            icon={MapPin}
          />
          <Card>
            <CardContent className='grid gap-3'>
              {naming.placements.length > 0 ?
                naming.placements.map((placement) => {
                  const scene = scenes.find(
                    (candidate) => candidate.id === placement.sceneId,
                  );
                  return (
                    <div
                      key={placement.hotspotId}
                      className='flex items-center justify-between gap-4 rounded-lg border p-3'
                    >
                      <div className='min-w-0'>
                        <Link
                          href={`/tours/${tour.id}/scenes/${placement.sceneId}`}
                          className={cardLinkClass}
                        >
                          {scene?.title ?? placement.sceneId}
                        </Link>
                        <div className='font-mono type-meta'>
                          {placement.hotspotId}
                        </div>
                      </div>
                      <MapPin
                        aria-hidden='true'
                        className='size-4 shrink-0 text-muted-foreground'
                      />
                    </div>
                  );
                })
              : <p className='text-sm text-muted-foreground'>
                  Not placed yet. Add this opportunity from Scene → Hotspots.
                </p>
              }
            </CardContent>
          </Card>
        </section>

        <section className='grid gap-4' aria-labelledby='naming-edit-heading'>
          <SectionHeader
            id='naming-edit-heading'
            title='Edit naming'
            description='Update the catalog fields used by this opportunity.'
            icon={BadgeDollarSign}
          />
          <Card>
            <CardHeader>
              <CardTitle className='inline-flex items-center gap-2'>
                <Link2 aria-hidden='true' className='icon-inline' />
                Naming content
              </CardTitle>
              <CardDescription>
                Changes persist only through the local development authoring
                API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NamingEditorForm
                canEdit={canEdit}
                naming={naming}
                tourId={tour.id}
              />
            </CardContent>
          </Card>
        </section>
      </PageMain>
    </AdminShell>
  );
}
