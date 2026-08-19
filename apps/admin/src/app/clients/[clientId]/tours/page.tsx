import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { ClientEditorPanel } from '@/components/client-editor-panel';
import { TourCreatePanel } from '@/components/tour-create-panel';
import { TourTable } from '@/components/tour-table';
import { clientLogoUrl } from '@/lib/admin-media';
import { TOUR_FORM_COPY } from '@/lib/authoring-copy';
import {
  adminClientCatalog,
  adminClientCrumbPeers,
  adminTourCategories,
  getAdminClient,
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
        createAction={
          <TourCreatePanel
            canEdit={process.env.NODE_ENV === 'development'}
            categories={adminTourCategories}
            clients={[client]}
            lockedClientId={client.id}
          />
        }
      />
    </AdminShell>
  );
}
