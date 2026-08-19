import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { BrandedAvatar } from '@/components/branded-avatar';
import {
  ClientWorkspaceLead,
  ClientWorkspaceNav,
  ClientWorkspaceSwitcher,
} from '@/components/client-workspace-nav';
import { HeaderEditButton } from '@/components/header-edit';
import {
  PageChrome,
  PageHeader,
  WorkspaceTabs,
} from '@/components/page-header';
import {
  LicenseBadge,
  ViewerTypeBadge,
  VisibilityBadge,
} from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { clientLogoUrl } from '@/lib/admin-media';
import {
  type AdminClientSummary,
  type TourVisibility,
} from '@/lib/tour-catalog';
import type { AdminViewerType } from '@/lib/tour-detail';

export function ClientWorkspaceHeader({
  client,
  tourCount,
  visibilities = [],
  viewerTypes = [],
}: {
  client: AdminClientSummary;
  tourCount: number;
  visibilities?: TourVisibility[];
  viewerTypes?: AdminViewerType[];
}) {
  return (
    <PageChrome>
      <PageHeader
        title={client.name}
        media={
          <BrandedAvatar
            src={clientLogoUrl(client.id)}
            label={client.name}
            size='lg'
            className='h-full w-20 self-stretch'
          />
        }
        switcher={<ClientWorkspaceSwitcher client={client} />}
        meta={
          <>
            <LicenseBadge licensed={client.licensed} />
            {visibilities.map((visibility) => (
              <VisibilityBadge key={visibility} visibility={visibility} />
            ))}
            {viewerTypes.map((viewerType) => (
              <ViewerTypeBadge key={viewerType} viewerType={viewerType} />
            ))}
          </>
        }
        actions={
          <>
            <HeaderEditButton />
            {client.website ?
              <Button variant='outline' size='sm' asChild>
                <Link href={client.website} target='_blank' rel='noreferrer'>
                  <ExternalLink aria-hidden='true' />
                  Open website
                </Link>
              </Button>
            : null}
          </>
        }
      />
      <WorkspaceTabs lead={<ClientWorkspaceLead clientId={client.id} />}>
        <ClientWorkspaceNav clientId={client.id} tourCount={tourCount} />
      </WorkspaceTabs>
    </PageChrome>
  );
}
