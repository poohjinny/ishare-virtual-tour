import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { ClientEditorPanel } from '@/components/client-editor-panel';
import { ClientWorkspaceHeader } from '@/components/client-workspace-header';
import { HeaderEditProvider } from '@/components/header-edit';
import { PageMain } from '@/components/page-header';
import { TourTable } from '@/components/tour-table';
import { clientLogoUrl } from '@/lib/admin-media';
import { AUTHORING_SURFACE, TOUR_FORM_COPY } from '@/lib/authoring-copy';
import {
  adminClientCatalog,
  adminClientCrumbPeers,
  getAdminClient,
  type TourVisibility,
} from '@/lib/tour-catalog';
import { getAdminTourOverviews } from '@/lib/tour-overview';

export function generateStaticParams() {
  return adminClientCatalog.map((client) => ({ clientId: client.id }));
}

export default async function ClientToursPage(
  props: PageProps<'/clients/[clientId]/tours'>,
) {
  const { clientId } = await props.params;
  const client = getAdminClient(clientId);

  if (!client) notFound();

  const tours = (await getAdminTourOverviews()).filter(
    (tour) => tour.clientId === client.id,
  );
  const visibilities = [
    ...new Set(tours.map((tour) => tour.visibility)),
  ] as TourVisibility[];
  const viewerTypes = [...new Set(tours.map((tour) => tour.viewerType))];

  return (
    <AdminShell
      currentPage='Tours'
      parents={[
        { href: '/clients', label: 'Clients' },
        {
          href: `/clients/${client.id}`,
          label: client.name,
          image: clientLogoUrl(client.id),
          peers: adminClientCrumbPeers(client.id, '/clients/{id}/tours'),
        },
      ]}
    >
      <HeaderEditProvider canEdit={process.env.NODE_ENV === 'development'}>
        <PageMain>
          <ClientWorkspaceHeader
            client={client}
            tourCount={tours.length}
            visibilities={visibilities}
            viewerTypes={viewerTypes}
            switchHrefTemplate='/clients/{id}/tours'
            lead={AUTHORING_SURFACE.clientTours.description}
          />

          {/* Edit sheet only — Tours tab keeps the same header Edit CTA. */}
          <ClientEditorPanel
            canEdit={process.env.NODE_ENV === 'development'}
            client={client}
            info={false}
          />

          <TourTable
            canDelete={process.env.NODE_ENV === 'development'}
            canEdit={process.env.NODE_ENV === 'development'}
            description={TOUR_FORM_COPY.clientManageDescription}
            tours={tours}
          />
        </PageMain>
      </HeaderEditProvider>
    </AdminShell>
  );
}
