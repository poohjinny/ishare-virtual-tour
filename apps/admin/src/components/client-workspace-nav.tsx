'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PeerSwitcher } from '@/components/peer-switcher';
import { Badge } from '@/components/ui/badge';
import { clientLogoUrl } from '@/lib/admin-media';
import { clientPath } from '@/lib/admin-routes';
import { AUTHORING_SURFACE } from '@/lib/authoring-copy';
import {
  adminClientCatalog,
  type AdminClientSummary,
} from '@/lib/tour-catalog';
import {
  CLIENT_WORKSPACE_ITEMS,
  isWorkspaceItemActive,
} from '@/lib/workspace-nav';
import { cn } from '@/lib/utils';

export function ClientWorkspaceLead({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = clientPath(clientId);
  if (pathname === `${base}/tours`) {
    return AUTHORING_SURFACE.clientTours.description;
  }
  if (pathname === base) return AUTHORING_SURFACE.clientDetails.description;
  return null;
}

export function ClientWorkspaceSwitcher({
  client,
}: {
  client: AdminClientSummary;
}) {
  const pathname = usePathname();
  const onTours = pathname === `${clientPath(client.id)}/tours`;

  return (
    <PeerSwitcher
      variant='title'
      label='Switch client'
      value={client.id}
      options={adminClientCatalog.map((item) => ({
        value: item.id,
        label: item.name,
        image: clientLogoUrl(item.id),
      }))}
      hrefTemplate={onTours ? '/clients/{id}/tours' : '/clients/{id}'}
      imageFit='contain'
    />
  );
}

export function ClientWorkspaceNav({
  clientId,
  tourCount = 0,
}: {
  clientId: string;
  tourCount?: number;
}) {
  const pathname = usePathname();
  const base = clientPath(clientId);
  const tabListRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const list = tabListRef.current;
    const active = list?.querySelector('[aria-current="page"]');
    if (!list || !(active instanceof HTMLElement)) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    const parent = list.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({ left: rect.left - parent.left, width: rect.width });
  }, [pathname, tourCount]);

  return (
    <nav
      aria-label='Client workspace'
      className='flex flex-wrap items-center gap-3 border-b'
    >
      <div ref={tabListRef} className='relative flex flex-wrap gap-x-6'>
        {CLIENT_WORKSPACE_ITEMS.map((item) => {
          const href = `${base}${item.suffix}`;
          const active = isWorkspaceItemActive(pathname, href, item.match);
          const Icon = item.icon;
          const count = item.countKey === 'tours' ? tourCount : undefined;

          return (
            <Link
              key={item.label}
              href={href}
              prefetch
              className={cn(
                'relative inline-flex cursor-pointer items-center gap-1.5 px-3 py-2.5 font-heading text-sm font-medium transition-colors duration-200',
                active ?
                  'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden='true' className='size-3.5 shrink-0' />
              {item.label}
              {count !== undefined ?
                <Badge
                  variant='secondary'
                  size='sm'
                  className='tabular-nums'
                  aria-label={`${count}`}
                >
                  {count}
                </Badge>
              : null}
            </Link>
          );
        })}
        <span
          aria-hidden='true'
          className='pointer-events-none absolute bottom-[-1px] h-0.5 bg-primary transition-[left,width] duration-200 ease-out motion-reduce:transition-none'
          style={{
            left: indicator.left,
            width: indicator.width,
            opacity: indicator.width > 0 ? 1 : 0,
          }}
        />
      </div>
    </nav>
  );
}
