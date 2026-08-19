'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  LayoutList,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { PersonAvatar } from '@/components/branded-avatar';
import {
  AUTHORING_SHEET_BODY_CLASS,
  AUTHORING_SHEET_CLASS,
  CreateSheet,
} from '@/components/create-panel-shell';
import {
  CollapsibleFormSection,
  FormField,
  FormHint,
} from '@/components/form-field';
import { FormCancelButton, StickyFormActions } from '@/components/form-status';
import { InputGroup } from '@/components/input-group';
import { SectionHeader } from '@/components/page-header';
import { PendingButton } from '@/components/pending-button';
import { SortableHead } from '@/components/sortable-head';
import {
  StaffRoleBadge,
  StaffStatusBadge,
} from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSortableRows } from '@/hooks/use-sortable-rows';
import { useTableRowActionMenu } from '@/hooks/use-table-row-action-menu';
import { useAdminAccountIdentity } from '@/lib/admin-account';
import {
  ADMIN_STAFF_ROLES,
  ADMIN_USERS_COPY,
  adminStaffAccounts,
  type AdminStaffAccount,
  type AdminStaffRole,
} from '@/lib/admin-users';
import { STAFF_ROLE_ICONS } from '@/lib/semantic-icons';
import {
  cn,
  tableActionsCellClass,
  tableBadgeCellClass,
  tableBadgeClass,
  tableLinkClass,
  tableMediaCellClass,
  titleLinkClass,
} from '@/lib/utils';

/** Role choice for both invite and edit, so one vocabulary drives both forms. */
export function RoleField({
  value,
  defaultValue,
  onValueChange,
}: {
  value?: AdminStaffRole;
  defaultValue?: AdminStaffRole;
  onValueChange?: (role: AdminStaffRole) => void;
}) {
  return (
    <FormField
      label={ADMIN_USERS_COPY.roleLabel}
      description={ADMIN_USERS_COPY.roleDescription}
    >
      {/* Each role option carries its own glyph, which the trigger
          repeats, so the field must not also carry an InputGroup icon. */}
      <Select
        name='role'
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as AdminStaffRole)}
      >
        <SelectTrigger aria-label={ADMIN_USERS_COPY.roleLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ADMIN_STAFF_ROLES.map((role) => {
            const RoleIcon = STAFF_ROLE_ICONS[role];
            return (
              <SelectItem key={role} value={role}>
                <RoleIcon aria-hidden='true' />
                {role}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </FormField>
  );
}

function InviteUserPanel() {
  const [open, setOpen] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.info(ADMIN_USERS_COPY.unavailable);
  }

  return (
    <CreateSheet
      title={ADMIN_USERS_COPY.inviteTitle}
      description={ADMIN_USERS_COPY.inviteDescription}
      triggerLabel='Invite user'
      open={open}
      onOpenChange={setOpen}
    >
      <form className='admin-form' onSubmit={submit}>
        <CollapsibleFormSection
          title={ADMIN_USERS_COPY.contactSection}
          icon={UserRound}
          description={ADMIN_USERS_COPY.inviteContactSectionDescription}
          defaultOpen
        >
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              label='Name'
              htmlFor='invite-user-name'
              description='The staff member who would receive the invitation.'
            >
              <InputGroup icon={UserRound}>
                <Input
                  id='invite-user-name'
                  name='name'
                  placeholder='e.g. Jordan Lee'
                  autoComplete='name'
                  required
                />
              </InputGroup>
            </FormField>
            <FormField
              label='Email'
              htmlFor='invite-user-email'
              description='This is a UI preview; no email will be sent.'
            >
              <InputGroup icon={Mail}>
                <Input
                  id='invite-user-email'
                  name='email'
                  type='email'
                  placeholder='name@example.org'
                  autoComplete='email'
                  required
                />
              </InputGroup>
            </FormField>
            <FormField
              label='Phone'
              htmlFor='invite-user-phone'
              description='Optional contact number for the invited staff member.'
            >
              <InputGroup icon={Phone}>
                <Input
                  id='invite-user-phone'
                  name='phone'
                  type='tel'
                  placeholder={ADMIN_USERS_COPY.phonePlaceholder}
                  autoComplete='tel'
                />
              </InputGroup>
            </FormField>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title={ADMIN_USERS_COPY.accessSection}
          icon={ShieldCheck}
          description={ADMIN_USERS_COPY.inviteAccessSectionDescription}
          defaultOpen
        >
          <RoleField defaultValue='Editor' />
        </CollapsibleFormSection>

        <FormHint>
          Submitting this preview only shows an availability notice.
        </FormHint>
        <StickyFormActions>
          {/* Fields are uncontrolled and the sheet unmounts on close, so
              closing is the reset. */}
          <FormCancelButton onReset={() => setOpen(false)} />
          <PendingButton type='submit'>
            <UserPlus aria-hidden='true' />
            Invite user
          </PendingButton>
        </StickyFormActions>
      </form>
    </CreateSheet>
  );
}

export function UserEditorForm({
  account,
  onClose,
  showIdentity = true,
}: {
  account: AdminStaffAccount;
  onClose: () => void;
  /** Sheet editors need a lockup; the user detail header already supplies it. */
  showIdentity?: boolean;
}) {
  const saved = {
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
  };
  const [form, setForm] = useState(saved);
  const isDirty =
    form.name !== saved.name ||
    form.email !== saved.email ||
    form.phone !== saved.phone ||
    form.role !== saved.role;

  function setField<Field extends keyof typeof saved>(
    field: Field,
    value: (typeof saved)[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.info(ADMIN_USERS_COPY.unavailable);
  }

  return (
    <form className='admin-form' onSubmit={submit}>
      {showIdentity ?
        <div className='flex items-center gap-3 rounded-lg border bg-muted/25 p-4'>
          <PersonAvatar
            src={account.avatarSrc}
            label={form.name || account.name}
            size='lg'
          />
          <div className='grid min-w-0 gap-1.5'>
            <span className='type-title truncate'>
              {form.name || ADMIN_USERS_COPY.editEmptyName}
            </span>
            <div className='flex flex-wrap items-center gap-1.5'>
              <StaffRoleBadge role={form.role} />
              <StaffStatusBadge status={account.status} />
            </div>
          </div>
        </div>
      : null}

      <CollapsibleFormSection
        title={ADMIN_USERS_COPY.contactSection}
        icon={UserRound}
        description={ADMIN_USERS_COPY.editContactSectionDescription}
        defaultOpen
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField label='Name' htmlFor='edit-user-name'>
            <InputGroup icon={UserRound}>
              <Input
                id='edit-user-name'
                name='name'
                value={form.name}
                autoComplete='name'
                required
                onChange={(event) => setField('name', event.target.value)}
              />
            </InputGroup>
          </FormField>
          <FormField label='Email' htmlFor='edit-user-email'>
            <InputGroup icon={Mail}>
              <Input
                id='edit-user-email'
                name='email'
                type='email'
                value={form.email}
                autoComplete='email'
                required
                onChange={(event) => setField('email', event.target.value)}
              />
            </InputGroup>
          </FormField>
          <FormField label='Phone' htmlFor='edit-user-phone'>
            <InputGroup icon={Phone}>
              <Input
                id='edit-user-phone'
                name='phone'
                type='tel'
                value={form.phone}
                placeholder={ADMIN_USERS_COPY.phonePlaceholder}
                autoComplete='tel'
                onChange={(event) => setField('phone', event.target.value)}
              />
            </InputGroup>
          </FormField>
        </div>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title={ADMIN_USERS_COPY.accessSection}
        icon={ShieldCheck}
        description={ADMIN_USERS_COPY.editAccessSectionDescription}
        defaultOpen
      >
        <RoleField
          value={form.role}
          onValueChange={(role) => setField('role', role)}
        />
      </CollapsibleFormSection>

      <FormHint>{ADMIN_USERS_COPY.editHint}</FormHint>
      <StickyFormActions>
        <FormCancelButton
          onReset={() => {
            setForm(saved);
            onClose();
          }}
        />
        <PendingButton type='submit' disabled={!isDirty}>
          <Save aria-hidden='true' />
          {ADMIN_USERS_COPY.editSave}
        </PendingButton>
      </StickyFormActions>
    </form>
  );
}

function UserEditorSheet({
  account,
  open,
  onOpenChange,
}: {
  account: AdminStaffAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!account) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={AUTHORING_SHEET_CLASS}>
        <SheetHeader>
          <SheetTitle>{ADMIN_USERS_COPY.editTitle}</SheetTitle>
          <SheetDescription>
            {ADMIN_USERS_COPY.editDescription}
          </SheetDescription>
        </SheetHeader>
        <div className={AUTHORING_SHEET_BODY_CLASS}>
          {/* Keyed so opening another row starts from that account's values. */}
          <UserEditorForm
            key={account.id}
            account={account}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UsersTable() {
  const { identity } = useAdminAccountIdentity();
  const accounts = useMemo(() => adminStaffAccounts(identity), [identity]);
  const [editingAccount, setEditingAccount] =
    useState<AdminStaffAccount | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const rowActionMenu = useTableRowActionMenu();
  const { rows, sortKey, sortDir, toggle } = useSortableRows(
    accounts,
    (account, key) => {
      if (key === 'name') return account.name;
      if (key === 'email') return account.email;
      if (key === 'phone') return account.phone;
      if (key === 'role') return account.role;
      if (key === 'status') return account.status;
      return '';
    },
    'name',
  );

  function openEditor(account: AdminStaffAccount) {
    setEditingAccount(account);
    setEditOpen(true);
  }

  return (
    <section className='grid gap-4' aria-labelledby='staff-list-heading'>
      <SectionHeader
        id='staff-list-heading'
        title={ADMIN_USERS_COPY.sectionTitle}
        description={ADMIN_USERS_COPY.sectionDescription}
        icon={LayoutList}
        actions={<InviteUserPanel />}
      />

      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className={tableMediaCellClass}>
                <span className='sr-only'>Avatar</span>
              </TableHead>
              <SortableHead
                label='Name'
                column='name'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='Email'
                column='email'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className='hidden md:table-cell'
              />
              <SortableHead
                label='Phone'
                column='phone'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className='hidden lg:table-cell'
              />
              <SortableHead
                label='Role'
                column='role'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className={tableBadgeCellClass}
              />
              <SortableHead
                label='Status'
                column='status'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className={tableBadgeCellClass}
              />
              <TableHead className={tableActionsCellClass}>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((account) => (
              <TableRow
                key={account.id}
                {...rowActionMenu.rowActionProps(account.id)}
              >
                <TableCell className={tableMediaCellClass}>
                  <PersonAvatar
                    src={account.avatarSrc}
                    label={account.name}
                    className='size-9'
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/users/${account.id}`}
                    className={titleLinkClass}
                  >
                    {account.name}
                  </Link>
                  {account.current ?
                    <div className='mt-1'>
                      <Badge variant='outline' size='sm'>
                        Current account
                      </Badge>
                    </div>
                  : null}
                </TableCell>
                <TableCell className='hidden md:table-cell'>
                  <a
                    href={`mailto:${account.email}`}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm',
                      tableLinkClass,
                    )}
                  >
                    <Mail
                      aria-hidden='true'
                      className='size-3.5 shrink-0 text-muted-foreground'
                    />
                    {account.email}
                  </a>
                </TableCell>
                <TableCell className='hidden lg:table-cell'>
                  {account.phone ?
                    <a
                      href={`tel:${account.phone.replace(/[^\d+]/g, '')}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-sm',
                        tableLinkClass,
                      )}
                    >
                      <Phone
                        aria-hidden='true'
                        className='size-3.5 shrink-0 text-muted-foreground'
                      />
                      {account.phone}
                    </a>
                  : <span className='text-muted-foreground'>—</span>}
                </TableCell>
                <TableCell className={tableBadgeCellClass}>
                  <StaffRoleBadge
                    role={account.role}
                    className={tableBadgeClass}
                  />
                </TableCell>
                <TableCell className={tableBadgeCellClass}>
                  <StaffStatusBadge
                    status={account.status}
                    className={tableBadgeClass}
                  />
                </TableCell>
                <TableCell className={tableActionsCellClass}>
                  <DropdownMenu {...rowActionMenu.menuProps(account.id)}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`Actions for ${account.name}`}
                          >
                            <MoreVertical aria-hidden='true' />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>User actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      align='end'
                      {...rowActionMenu.contentProps(account.id)}
                    >
                      <DropdownMenuLabel>User actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/users/${account.id}`}>
                          <Settings2 aria-hidden='true' />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openEditor(account)}>
                        <Pencil aria-hidden='true' />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant='destructive'
                        onSelect={() =>
                          toast.info(ADMIN_USERS_COPY.unavailable)
                        }
                      >
                        <Trash2 aria-hidden='true' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserEditorSheet
        account={editingAccount}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </section>
  );
}
