import { ShieldCheck, UserRound, Users } from 'lucide-react';

import { AdminShell } from '@/components/admin-shell';
import { PageHeader, PageMain } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { UsersTable } from '@/components/users-table';
import {
  ADMIN_USERS_COPY,
  adminStaffAccounts,
  type AdminStaffRole,
  type AdminStaffStatus,
} from '@/lib/admin-users';
import { STAFF_ROLE_COLORS, STAFF_STATUS_COLORS } from '@/lib/semantic-colors';

/** Status keys are the vocabulary; the badge labels are the same words. */
function statusLabel(status: AdminStaffStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function UsersPage() {
  const accounts = adminStaffAccounts();
  const roles = Object.keys(STAFF_ROLE_COLORS) as AdminStaffRole[];
  const statuses = Object.keys(STAFF_STATUS_COLORS) as AdminStaffStatus[];
  const roleSlices = roles.map((role) => ({
    label: role,
    count: accounts.filter((account) => account.role === role).length,
    color: STAFF_ROLE_COLORS[role],
  }));
  const statusSlices = statuses.map((status) => ({
    label: statusLabel(status),
    count: accounts.filter((account) => account.status === status).length,
    color: STAFF_STATUS_COLORS[status],
  }));

  return (
    <AdminShell currentPage={ADMIN_USERS_COPY.title}>
      <PageMain>
        <PageHeader
          title={ADMIN_USERS_COPY.title}
          description={ADMIN_USERS_COPY.description}
          icon={Users}
        />

        <StatCard
          label='Users'
          value={accounts.length}
          icon={Users}
          tone='info'
          donuts={[
            { label: 'Roles', icon: ShieldCheck, slices: roleSlices },
            { label: 'Status', icon: UserRound, slices: statusSlices },
          ]}
        />

        <UsersTable />
      </PageMain>
    </AdminShell>
  );
}
