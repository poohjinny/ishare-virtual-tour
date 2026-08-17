import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { ClientEditorPanel } from '@/components/client-editor-panel';
import { ClientWorkspaceHeader } from '@/components/client-workspace-header';
import { HeaderEditProvider } from '@/components/header-edit';
import { PageMain } from '@/components/page-header';
import { clientLogoUrl } from '@/lib/admin-media';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
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

export default async function ClientDetailPage(
  props: PageProps<'/clients/[clientId]'>,
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
      currentPage={client.name}
      currentImage={clientLogoUrl(client.id)}
      currentPeers={adminClientCrumbPeers(client.id)}
      parents={[{ href: '/clients', label: 'Clients' }]}
    >
      <HeaderEditProvider canEdit={process.env.NODE_ENV === 'development'}>
        <PageMain>
          <ClientWorkspaceHeader
            client={client}
            tourCount={tours.length}
            visibilities={visibilities}
            viewerTypes={viewerTypes}
            lead={AUTHORING_SURFACE.clientDetails.description}
          />

          <ClientEditorPanel
            canEdit={process.env.NODE_ENV === 'development'}
            client={client}
          />
        </PageMain>
      </HeaderEditProvider>
    </AdminShell>
  );
}
