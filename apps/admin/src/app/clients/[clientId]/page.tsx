import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { ClientEditorPanel } from '@/components/client-editor-panel';
import { clientLogoUrl } from '@/lib/admin-media';
import {
  adminClientCatalog,
  adminClientCrumbPeers,
  getAdminClient,
} from '@/lib/tour-catalog';

export function generateStaticParams() {
  return adminClientCatalog.map((client) => ({ clientId: client.id }));
}

export default async function ClientDetailPage(
  props: PageProps<'/clients/[clientId]'>,
) {
  const { clientId } = await props.params;
  const client = getAdminClient(clientId);

  if (!client) notFound();

  return (
    <AdminShell
      currentPage={client.name}
      currentImage={clientLogoUrl(client.id)}
      currentPeers={adminClientCrumbPeers(client.id)}
      parents={[{ href: '/clients', label: 'Clients' }]}
    >
      <ClientEditorPanel
        canEdit={process.env.NODE_ENV === 'development'}
        client={client}
      />
    </AdminShell>
  );
}
