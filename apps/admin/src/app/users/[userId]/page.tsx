import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { PageMain } from '@/components/page-header';
import { UserDetailPanel } from '@/components/user-detail-panel';
import {
  adminStaffAccounts,
  adminStaffCrumbPeers,
  getAdminStaffAccount,
} from '@/lib/admin-users';

export function generateStaticParams() {
  return adminStaffAccounts().map((account) => ({ userId: account.id }));
}

export default async function UserDetailPage(
  props: { params: Promise<{ userId: string }> },
) {
  const { userId } = await props.params;
  const account = getAdminStaffAccount(userId);

  if (!account) notFound();

  return (
    <AdminShell
      currentPage={account.name}
      currentImage={account.avatarSrc}
      currentPeers={adminStaffCrumbPeers(account.id)}
      parents={[{ href: '/users', label: 'Users' }]}
    >
      <PageMain>
        <UserDetailPanel initialAccount={account} />
      </PageMain>
    </AdminShell>
  );
}
