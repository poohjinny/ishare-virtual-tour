import type { ReactNode } from 'react';

import {
  BreadcrumbSetter,
  type AdminCrumb,
  type CrumbPeers,
} from '@/components/admin-breadcrumbs';

interface AdminShellProps {
  children: ReactNode;
  currentPage: string;
  currentImage?: string;
  currentFallbackImage?: string;
  currentPeers?: CrumbPeers;
  parents?: AdminCrumb[];
}

/** Sets breadcrumb labels only — sidebar lives in the root layout. */
export function AdminShell({
  children,
  currentPage,
  currentImage,
  currentFallbackImage,
  currentPeers,
  parents = [],
}: AdminShellProps) {
  return (
    <>
      <BreadcrumbSetter
        currentPage={currentPage}
        currentImage={currentImage}
        currentFallbackImage={currentFallbackImage}
        currentPeers={currentPeers}
        parents={parents}
      />
      {children}
    </>
  );
}
