import type { AdminAccountIdentity } from '@/lib/admin-account';
import { ADMIN_ACCOUNT_COPY } from '@/lib/authoring-copy';

export type AdminStaffRole = 'Master' | 'Editor' | 'Viewer';
export type AdminStaffStatus = 'local' | 'active' | 'invited' | 'inactive';

/** Role choices, widest scope first — the invite and edit selects share this order. */
export const ADMIN_STAFF_ROLES: readonly AdminStaffRole[] = [
  'Master',
  'Editor',
  'Viewer',
];

export interface AdminStaffAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarSrc?: string;
  role: AdminStaffRole;
  status: AdminStaffStatus;
  current?: boolean;
}

const ADMIN_STAFF_FIXTURES: AdminStaffAccount[] = [
  {
    id: 'u_local_master',
    name: ADMIN_ACCOUNT_COPY.name,
    email: ADMIN_ACCOUNT_COPY.email,
    phone: ADMIN_ACCOUNT_COPY.phone,
    avatarSrc: ADMIN_ACCOUNT_COPY.avatarSrc,
    role: 'Master',
    status: 'local',
    current: true,
  },
  {
    id: 'u_maya_chen',
    name: 'Maya Chen',
    email: 'maya.chen@example.org',
    phone: '+1 (647) 555-0198',
    avatarSrc: '/avatars/maya-chen.jpg',
    role: 'Editor',
    status: 'active',
  },
  {
    id: 'u_noah_williams',
    name: 'Noah Williams',
    email: 'noah.williams@example.org',
    phone: '+1 (905) 555-0114',
    role: 'Editor',
    status: 'invited',
  },
  {
    id: 'u_ava_martin',
    name: 'Ava Martin',
    email: 'ava.martin@example.org',
    phone: '+1 (514) 555-0167',
    avatarSrc: '/avatars/ava-martin.jpg',
    role: 'Viewer',
    status: 'inactive',
  },
  {
    id: 'u_liam_tremblay',
    name: 'Liam Tremblay',
    email: 'liam.tremblay@example.org',
    phone: '+1 (438) 555-0126',
    role: 'Viewer',
    status: 'active',
  },
  {
    id: 'u_sofia_rodriguez',
    name: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@example.org',
    phone: '+1 (416) 555-0183',
    role: 'Editor',
    status: 'invited',
  },
  {
    id: 'u_ethan_brooks',
    name: 'Ethan Brooks',
    email: 'ethan.brooks@example.org',
    phone: '+1 (613) 555-0159',
    role: 'Viewer',
    status: 'active',
  },
  {
    id: 'u_priya_shah',
    name: 'Priya Shah',
    email: 'priya.shah@example.org',
    phone: '+1 (289) 555-0172',
    avatarSrc: '/avatars/priya-shah.jpg',
    role: 'Master',
    status: 'inactive',
  },
];

/** UI-only staff fixtures; the current Master row follows browser-local Account identity. */
export function adminStaffAccounts(
  identity: AdminAccountIdentity = {
    name: ADMIN_ACCOUNT_COPY.name,
    email: ADMIN_ACCOUNT_COPY.email,
    phone: ADMIN_ACCOUNT_COPY.phone,
  },
) {
  return ADMIN_STAFF_FIXTURES.map((account) =>
    account.current ? { ...account, ...identity } : account,
  );
}

export function getAdminStaffAccount(
  userId: string,
  identity?: AdminAccountIdentity,
) {
  return adminStaffAccounts(identity).find((account) => account.id === userId);
}

export function adminStaffCrumbPeers(
  userId: string,
  identity?: AdminAccountIdentity,
) {
  return {
    value: userId,
    label: 'Switch user',
    hrefTemplate: '/users/{id}',
    imageFit: 'cover' as const,
    shape: 'circle' as const,
    options: adminStaffAccounts(identity).map((account) => ({
      value: account.id,
      label: account.name,
      image: account.avatarSrc,
    })),
  };
}

export const ADMIN_USERS_COPY = {
  title: 'Users',
  description:
    'Manage the staff accounts that can access Admin. This master-account preview uses sample data only.',
  sectionTitle: 'User list',
  sectionDescription:
    'Roles and statuses preview the future account-management experience; they are not connected to authentication.',
  inviteTitle: 'Invite user',
  inviteDescription:
    'Preview the staff invite fields. No invitation will be sent until authentication and account storage are connected.',
  contactSection: 'Contact',
  accessSection: 'Access',
  inviteContactSectionDescription:
    'Who receives the invitation and how Admin reaches them.',
  inviteAccessSectionDescription:
    'What the invited account may do once authentication is connected.',
  phonePlaceholder: 'e.g. +1 (416) 555-0142',
  roleLabel: 'Role',
  roleDescription:
    'Master can manage staff; Editor can author; Viewer is read-only.',
  editTitle: 'Edit user',
  editDescription:
    'Update this staff account. Changes stay in this preview until authentication and account storage are connected.',
  editContactSectionDescription: 'How Admin reaches this staff member.',
  editAccessSectionDescription:
    'What this account may do once authentication is connected.',
  editEmptyName: 'Unnamed user',
  editHint: 'Saving this preview only shows an availability notice.',
  editSave: 'Save user',
  unavailable:
    'User management is unavailable until authentication and account storage are connected.',
} as const;
