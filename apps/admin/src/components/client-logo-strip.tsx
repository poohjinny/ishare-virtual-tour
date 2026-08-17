import Link from 'next/link';

import { BrandedAvatar } from '@/components/branded-avatar';
import { LicenseBadge } from '@/components/status-badges';
import type { AdminClientOverview } from '@/lib/tour-overview';

export function ClientLogoStrip({
  clients,
}: {
  clients: AdminClientOverview[];
}) {
  if (clients.length === 0) return null;

  return (
    <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {clients.map((client) => (
        <li key={client.id}>
          <Link
            href={`/clients/${client.id}`}
            className='group flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
          >
            <BrandedAvatar
              src={client.logoUrl}
              label={client.name}
              brandColor={client.brandColor}
              size='lg'
            />
            <span className='min-w-0 flex-1'>
              <span className='type-body block truncate font-medium transition-colors group-hover:text-primary'>
                {client.name}
              </span>
              <span className='mt-1 flex flex-wrap items-center gap-2'>
                <LicenseBadge licensed={client.licensed} />
                <span className='type-meta'>
                  {client.tourCount} {client.tourCount === 1 ? 'tour' : 'tours'}
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
