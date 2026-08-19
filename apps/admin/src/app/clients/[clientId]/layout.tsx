import { notFound } from 'next/navigation';

import { ClientWorkspaceHeader } from '@/components/client-workspace-header';
import { HeaderEditProvider } from '@/components/header-edit';
import { PageMain } from '@/components/page-header';
import {
  adminClientCatalog,
  getAdminClient,
  type TourVisibility,
} from '@/lib/tour-catalog';
import { getAdminTourOverviews } from '@/lib/tour-overview';

export function generateStaticParams() {
  return adminClientCatalog.map((client) => ({ clientId: client.id }));
}

export default async function ClientWorkspaceLayout({
  children,
  params,
}: LayoutProps<'/clients/[clientId]'>) {
  const { clientId } = await params;
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
    <HeaderEditProvider canEdit={process.env.NODE_ENV === 'development'}>
      <PageMain>
        <ClientWorkspaceHeader
          client={client}
          tourCount={tours.length}
          visibilities={visibilities}
          viewerTypes={viewerTypes}
        />
        {children}
      </PageMain>
    </HeaderEditProvider>
  );
}
