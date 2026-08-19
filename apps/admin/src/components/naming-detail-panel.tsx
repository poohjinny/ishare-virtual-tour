'use client';

import { HandHeart, MapPin, Pencil, Settings2, Tag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { MediaThumb } from '@/components/branded-avatar';
import {
  InfoField,
  InfoFieldList,
  InfoLink,
} from '@/components/form-status';
import { NamingEditorForm } from '@/components/naming-editor-form';
import { PageHeader, SectionHeader } from '@/components/page-header';
import { PeerSwitcher } from '@/components/peer-switcher';
import { NamingStatusBadge, VisibilityBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { httpHref } from '@/lib/admin-routes';
import { NAMING_FORM_COPY } from '@/lib/authoring-copy';
import type { AdminNamingOpportunity } from '@/lib/tour-namings';
import type { AdminSceneSummary } from '@/lib/tour-scenes';
import { cardLinkClass } from '@/lib/utils';

const priceFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

export function NamingDetailPanel({
  canEdit,
  naming,
  namingPeers,
  scenes,
  thumbSrc,
  tourId,
}: {
  canEdit: boolean;
  naming: AdminNamingOpportunity;
  namingPeers: Array<{ value: string; label: string; image?: string }>;
  scenes: AdminSceneSummary[];
  thumbSrc?: string;
  tourId: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
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
        switcher={
          <PeerSwitcher
            variant='title'
            label='Switch naming'
            value={naming.id}
            options={namingPeers}
            hrefTemplate={`/tours/${tourId}/namings/{id}`}
            imageFit='cover'
          />
        }
        meta={
          <>
            <NamingStatusBadge status={naming.status} />
            <VisibilityBadge visibility={naming.visibility} />
          </>
        }
        actions={
          editing ?
            <Button size='sm' onClick={() => setEditing(false)}>
              <Settings2 aria-hidden='true' />
              View details
            </Button>
          : <Button size='sm' onClick={() => setEditing(true)}>
              <Pencil aria-hidden='true' />
              Edit
            </Button>
        }
      />

      {editing ?
        <section className='grid gap-4' aria-labelledby='naming-summary-heading'>
          <SectionHeader
            id='naming-summary-heading'
            title='Opportunity summary'
            description='Commercial status and visitor-facing recognition content.'
            icon={Tag}
          />
          <Card>
            <CardContent>
              <NamingEditorForm
                key={naming.id}
                canEdit={canEdit}
                naming={naming}
                onCancel={() => setEditing(false)}
                tourId={tourId}
              />
            </CardContent>
          </Card>
        </section>
      : <>
          <section
            className='grid gap-4'
            aria-labelledby='naming-summary-heading'
          >
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
              <CardHeader>
                <CardTitle>{NAMING_FORM_COPY.donorSection}</CardTitle>
              </CardHeader>
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
        </>
      }

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
          <CardHeader>
            <CardTitle>{NAMING_FORM_COPY.placementsSection}</CardTitle>
          </CardHeader>
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
                        href={`/tours/${tourId}/scenes/${placement.sceneId}`}
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
    </>
  );
}
