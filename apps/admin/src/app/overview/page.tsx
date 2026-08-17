import {
  Building2,
  Eye,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Tag,
  View,
  type LucideIcon,
} from 'lucide-react';

import { AdminShell } from '@/components/admin-shell';
import { ClientLogoStrip } from '@/components/client-logo-strip';
import { PageHeader, PageMain, SectionHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { TourGallery } from '@/components/tour-gallery';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import { LICENSE_COLORS } from '@/lib/semantic-colors';
import { buildTourStatDonuts, getAdminOverview } from '@/lib/tour-overview';

const OVERVIEW_DONUT_ICONS: Record<string, LucideIcon> = {
  Categories: Tag,
  Visibility: Eye,
  Viewer: View,
};

export default async function OverviewPage() {
  const { clients, stats, tours } = await getAdminOverview();
  const licensedClients = clients.filter((client) => client.licensed).length;
  const licenseDonut = {
    label: 'License',
    icon: ShieldCheck,
    slices: [
      {
        label: 'Licensed',
        count: licensedClients,
        color: LICENSE_COLORS.licensed,
      },
      {
        label: 'Unlicensed',
        count: clients.length - licensedClients,
        color: LICENSE_COLORS.unlicensed,
      },
    ],
  };

  return (
    <AdminShell currentPage={AUTHORING_SURFACE.overview.label}>
      <PageMain>
        <PageHeader
          title={AUTHORING_SURFACE.overview.label}
          description={AUTHORING_SURFACE.overview.description}
          icon={LayoutDashboard}
        />

        <section
          className='grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]'
          aria-label='Catalog size'
        >
          <StatCard
            label='Tours'
            value={stats.tours}
            icon={MapPinned}
            tone='info'
            donuts={buildTourStatDonuts(
              tours,
              stats.visibility,
              stats.categories,
            ).map((donut) => ({
              ...donut,
              icon: donut.label ? OVERVIEW_DONUT_ICONS[donut.label] : undefined,
            }))}
          />
          <StatCard
            label='Clients'
            value={stats.clients}
            icon={Building2}
            tone='success'
            donuts={[licenseDonut]}
          />
        </section>

        <section className='space-y-4' aria-labelledby='overview-tours'>
          <SectionHeader
            id='overview-tours'
            title={AUTHORING_SURFACE.tours.label}
            description='Open a tour, or jump straight to its scenes or namings.'
            icon={MapPinned}
          />
          <TourGallery tours={tours} />
        </section>

        <section className='space-y-4' aria-labelledby='overview-clients'>
          <SectionHeader
            id='overview-clients'
            title={AUTHORING_SURFACE.clients.label}
            icon={Building2}
          />
          <ClientLogoStrip clients={clients} />
        </section>
      </PageMain>
    </AdminShell>
  );
}
