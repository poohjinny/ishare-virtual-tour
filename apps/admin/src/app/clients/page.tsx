import { Building2, ShieldCheck } from 'lucide-react';

import { AdminShell } from '@/components/admin-shell';
import { ClientEditorPanel } from '@/components/client-editor-panel';
import { ClientTable } from '@/components/client-table';
import { DonutLegend } from '@/components/donut-chart';
import { SegmentedBar } from '@/components/distribution-chart';
import { PageHeader, PageMain } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { LICENSE_COLORS } from '@/lib/semantic-colors';
import { adminCatalogStats, adminClientCatalog } from '@/lib/tour-catalog';

export default function ClientsPage() {
  const unlicensedClients =
    adminCatalogStats.clients - adminCatalogStats.licensedClients;
  const licenseItems = [
    {
      label: 'Licensed',
      count: adminCatalogStats.licensedClients,
      color: LICENSE_COLORS.licensed,
    },
    {
      label: 'Unlicensed',
      count: unlicensedClients,
      color: LICENSE_COLORS.unlicensed,
    },
  ];

  return (
    <AdminShell currentPage='Clients'>
      <PageMain>
        <PageHeader
          title='Clients'
          description={AUTHORING_SURFACE.clients.description}
          icon={Building2}
        />

        <StatCard
          label='Clients'
          value={adminCatalogStats.clients}
          icon={Building2}
          tone='success'
          framed
          description={
            <StatCard
              label='License'
              value={adminCatalogStats.licensedClients}
              showValue={false}
              eyebrow='plain'
              tone='success'
              description={
                <div className='space-y-3'>
                  <SegmentedBar
                    items={licenseItems}
                    aria-label='Client license'
                  />
                  <DonutLegend
                    slices={licenseItems}
                    className='type-meta'
                    layout='column'
                  />
                </div>
              }
              icon={ShieldCheck}
            />
          }
        />

        <ClientTable
          canDelete={process.env.NODE_ENV === 'development'}
          canEdit={process.env.NODE_ENV === 'development'}
          clients={adminClientCatalog}
          description='Local client records, branding, and tour counts.'
          createAction={
            <ClientEditorPanel
              canEdit={process.env.NODE_ENV === 'development'}
            />
          }
        />
      </PageMain>
    </AdminShell>
  );
}
