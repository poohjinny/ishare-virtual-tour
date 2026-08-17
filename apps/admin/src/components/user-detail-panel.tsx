'use client';

import {
  BriefcaseBusiness,
  Clock3,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { InfoField, InfoFieldList } from '@/components/form-status';
import { PageHeader, SectionHeader } from '@/components/page-header';
import { StaffRoleBadge, StaffStatusBadge } from '@/components/status-badges';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserEditorForm } from '@/components/users-table';
import {
  adminAccountInitials,
  useAdminAccountIdentity,
} from '@/lib/admin-account';
import {
  ADMIN_USERS_COPY,
  adminStaffAccounts,
  type AdminStaffAccount,
} from '@/lib/admin-users';
import { cardLinkClass } from '@/lib/utils';

export function UserDetailPanel({
  initialAccount,
}: {
  initialAccount: AdminStaffAccount;
}) {
  const { identity } = useAdminAccountIdentity();
  const account = useMemo(
    () =>
      adminStaffAccounts(identity).find(
        (candidate) => candidate.id === initialAccount.id,
      ) ?? initialAccount,
    [identity, initialAccount],
  );
  const [editing, setEditing] = useState(false);

  return (
    <>
      <PageHeader
        title={account.name}
        description='Staff identity, contact information, and Admin access preview.'
        media={
          <Avatar className='size-16 self-center'>
            {account.avatarSrc ?
              <AvatarImage src={account.avatarSrc} alt='' />
            : null}
            <AvatarFallback>{adminAccountInitials(account.name)}</AvatarFallback>
          </Avatar>
        }
        meta={
          <>
            <StaffRoleBadge role={account.role} />
            <StaffStatusBadge status={account.status} />
          </>
        }
        actions={
          <Button size='sm' onClick={() => setEditing((current) => !current)}>
            <Pencil aria-hidden='true' />
            {editing ? 'View details' : 'Edit'}
          </Button>
        }
      />

      {editing ?
        <Card>
          <CardHeader>
            <CardTitle>{ADMIN_USERS_COPY.editTitle}</CardTitle>
            <CardDescription>{ADMIN_USERS_COPY.editDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <UserEditorForm
              key={account.id}
              account={account}
              onClose={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      : <>
          <section className='grid gap-4' aria-labelledby='user-details-heading'>
            <SectionHeader
              id='user-details-heading'
              title='User details'
              description='Contact and access information shown across Admin.'
              icon={UserRound}
            />
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='inline-flex items-center gap-2'>
                    <Mail aria-hidden='true' className='icon-inline' />
                    Contact
                  </CardTitle>
                  <CardDescription>
                    Direct contact information for this staff member.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InfoFieldList>
                    <InfoField label='Name' layout='inline'>
                      {account.name}
                    </InfoField>
                    <InfoField label='Email' layout='inline'>
                      <a
                        href={`mailto:${account.email}`}
                        className={cardLinkClass}
                      >
                        {account.email}
                      </a>
                    </InfoField>
                    <InfoField label='Phone' layout='inline'>
                      {account.phone ?
                        <a
                          href={`tel:${account.phone.replace(/[^\d+]/g, '')}`}
                          className={cardLinkClass}
                        >
                          {account.phone}
                        </a>
                      : '—'}
                    </InfoField>
                  </InfoFieldList>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='inline-flex items-center gap-2'>
                    <ShieldCheck aria-hidden='true' className='icon-inline' />
                    Access
                  </CardTitle>
                  <CardDescription>
                    Preview of the role and account lifecycle state.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InfoFieldList>
                    <InfoField label='Role' layout='inline'>
                      <StaffRoleBadge role={account.role} />
                    </InfoField>
                    <InfoField label='Status' layout='inline'>
                      <StaffStatusBadge status={account.status} />
                    </InfoField>
                    <InfoField label='Account ID' layout='inline'>
                      <span className='font-mono type-meta'>{account.id}</span>
                    </InfoField>
                  </InfoFieldList>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className='grid gap-4' aria-labelledby='user-related-heading'>
            <SectionHeader
              id='user-related-heading'
              title='Related activity'
              description='Reserved surfaces for assignment and audit data when account storage is connected.'
              icon={BriefcaseBusiness}
            />
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Assigned clients and tours</CardTitle>
                  <CardDescription>
                    Access is currently role-wide. Scoped assignments will
                    appear here when organization permissions are available.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className='inline-flex items-center gap-2'>
                    <Clock3 aria-hidden='true' className='icon-inline' />
                    Audit history
                  </CardTitle>
                  <CardDescription>
                    Sign-ins and authoring events are not recorded in this
                    UI-only account preview.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>
        </>
      }
    </>
  );
}
