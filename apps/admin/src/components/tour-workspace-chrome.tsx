'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { HeaderEditProvider } from '@/components/header-edit';
import { PageMain } from '@/components/page-header';
import { tourPath } from '@/lib/admin-routes';
import { isTourWorkspaceSurface } from '@/lib/workspace-nav';

/** Keeps workspace chrome mounted across Details / Scenes / Namings. */
export function TourWorkspaceChrome({
  tourId,
  header,
  children,
}: {
  tourId: string;
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (!isTourWorkspaceSurface(pathname, tourId)) {
    return children;
  }

  const isDetails = pathname === tourPath(tourId);

  return (
    <HeaderEditProvider canEdit={process.env.NODE_ENV === 'development'}>
      <PageMain variant={isDetails ? 'split' : 'default'}>
        {header}
        {children}
      </PageMain>
    </HeaderEditProvider>
  );
}
