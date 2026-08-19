'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ExternalLink,
  LayoutList,
  Mail,
  MoreVertical,
  Pencil,
  Settings2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BrandedAvatar } from '@/components/branded-avatar';
import { ClientEditorPanel } from '@/components/client-editor-panel';
import { ColorSwatch } from '@/components/color-swatch';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { SectionHeader } from '@/components/page-header';
import { SortableHead } from '@/components/sortable-head';
import { LicenseBadge } from '@/components/status-badges';
import { TableEmptyState } from '@/components/table-empty-state';
import { TableFilterDropdown } from '@/components/table-filter-dropdown';
import { useSortableRows } from '@/hooks/use-sortable-rows';
import { useFlipList } from '@/hooks/use-flip-list';
import { useTableRowActionMenu } from '@/hooks/use-table-row-action-menu';
import { CLIENT_FORM_COPY } from '@/lib/authoring-copy';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteLocalClient } from '@/lib/admin-dev-api';
import { clientLogoUrl } from '@/lib/admin-media';
import type { AdminClientSummary } from '@/lib/tour-catalog';
import {
  cn,
  colorLabelClass,
  tableActionsCellClass,
  tableBadgeCellClass,
  tableBadgeClass,
  tableLinkClass,
  tableMediaCellClass,
  titleLinkClass,
} from '@/lib/utils';

export function ClientTable({
  canDelete = false,
  canEdit = false,
  clients,
  createAction,
  description,
  title = CLIENT_FORM_COPY.manageTitle,
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  clients: AdminClientSummary[];
  createAction?: ReactNode;
  description?: ReactNode;
  title?: string;
}) {
  const router = useRouter();
  /**
   * Keep the loaded client mounted while the sheet closes so the exit
   * animation can finish — same pattern as TourTable.
   */
  const [editingClient, setEditingClient] = useState<AdminClientSummary | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const rowActionMenu = useTableRowActionMenu();
  const filteredClients = useMemo(() => {
    const licenses = filters.license ?? [];
    if (licenses.length === 0) return clients;
    return clients.filter((client) =>
      licenses.includes(client.licensed ? 'licensed' : 'unlicensed'),
    );
  }, [clients, filters]);
  const { rows, sortKey, sortDir, toggle } = useSortableRows(
    filteredClients,
    (client, key) => {
      if (key === 'name') return client.name;
      if (key === 'license') return client.licensed ? 1 : 0;
      if (key === 'email') return client.email ?? '';
      if (key === 'tours') return client.tours.length;
      return '';
    },
    'name',
  );
  const flipRef = useFlipList(rows.map((row) => row.id));

  function openEdit(client: AdminClientSummary) {
    setEditingClient(client);
    setEditSession((session) => session + 1);
    setEditOpen(true);
  }

  async function remove(client: AdminClientSummary) {
    try {
      await deleteLocalClient(client.id);
      if (editingClient?.id === client.id) setEditOpen(false);
      showFormSuccess('Client deleted.');
      router.refresh();
    } catch (error) {
      showFormError(error, 'Client deletion failed.');
    }
  }

  return (
    <section className='grid gap-4' aria-labelledby='client-list-heading'>
      <SectionHeader
        id='client-list-heading'
        title={title}
        description={description}
        icon={LayoutList}
        actions={
          <>
            <TableFilterDropdown
              sections={[
                {
                  id: 'license',
                  label: 'License',
                  kind: 'license',
                  options: [
                    { value: 'licensed', label: 'Licensed' },
                    { value: 'unlicensed', label: 'Unlicensed' },
                  ],
                },
              ]}
              selected={filters}
              onSelectedChange={setFilters}
            />
            {createAction}
          </>
        }
      />

      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className={tableMediaCellClass}>
                <span className='sr-only'>Logo</span>
              </TableHead>
              <SortableHead
                label='Client'
                column='name'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='License'
                column='license'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className={tableBadgeCellClass}
              />
              <SortableHead
                label='Contact'
                column='email'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className='hidden md:table-cell'
              />
              <TableHead>Brand</TableHead>
              <SortableHead
                label='Tours'
                column='tours'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <TableHead className={tableActionsCellClass}>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ?
              <TableEmptyState
                colSpan={7}
                title={
                  clients.length === 0 ?
                    'No clients yet'
                  : 'No clients match these filters'
                }
                description={
                  clients.length === 0 ?
                    CLIENT_FORM_COPY.description
                  : 'Clear or change the active filters to see more clients.'
                }
              />
            : null}
            {rows.map((client) => (
              <TableRow
                key={client.id}
                ref={flipRef(client.id)}
                {...rowActionMenu.rowActionProps(client.id)}
              >
                <TableCell className={tableMediaCellClass}>
                  <BrandedAvatar
                    src={clientLogoUrl(client.id)}
                    label={client.name}
                    brandColor={client.brandColor}
                    className='h-10 w-12'
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/clients/${client.id}`}
                    className={titleLinkClass}
                  >
                    {client.name}
                  </Link>
                  <div className='font-mono type-meta'>{client.id}</div>
                </TableCell>
                <TableCell className={tableBadgeCellClass}>
                  <LicenseBadge
                    licensed={client.licensed}
                    className={tableBadgeClass}
                  />
                </TableCell>
                <TableCell className='hidden md:table-cell'>
                  {client.email ?
                    <a
                      href={`mailto:${client.email}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-sm',
                        tableLinkClass,
                      )}
                    >
                      <Mail
                        aria-hidden='true'
                        className='size-3.5 shrink-0 text-muted-foreground'
                      />
                      {client.email}
                    </a>
                  : <span className='text-muted-foreground'>—</span>}
                </TableCell>
                <TableCell>
                  {client.brandColor ?
                    <span className={colorLabelClass}>
                      <ColorSwatch color={client.brandColor} />
                      <span className='font-mono text-xs text-muted-foreground'>
                        {client.brandColor}
                      </span>
                    </span>
                  : <span className='text-muted-foreground'>—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{client.tours.length}</Badge>
                </TableCell>
                <TableCell className={tableActionsCellClass}>
                  <DropdownMenu {...rowActionMenu.menuProps(client.id)}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`Actions for ${client.name}`}
                          >
                            <MoreVertical aria-hidden='true' />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Client actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      align='end'
                      {...rowActionMenu.contentProps(client.id)}
                    >
                      <DropdownMenuLabel>Client actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/clients/${client.id}`}>
                          <Settings2 aria-hidden='true' />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      {client.website ?
                        <DropdownMenuItem asChild>
                          <a
                            href={client.website}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <ExternalLink aria-hidden='true' />
                            Open website
                          </a>
                        </DropdownMenuItem>
                      : null}
                      {canEdit ?
                        <DropdownMenuItem onSelect={() => openEdit(client)}>
                          <Pencil aria-hidden='true' />
                          Edit
                        </DropdownMenuItem>
                      : null}
                      {canDelete ?
                        <>
                          <DropdownMenuSeparator />
                          <ConfirmDeleteDialog
                            title={`Delete “${client.name}”?`}
                            description='This client and all of its tours will be permanently deleted. This action cannot be undone.'
                            onConfirm={() => void remove(client)}
                            trigger={
                              <DropdownMenuItem
                                variant='destructive'
                                onSelect={(event) => event.preventDefault()}
                              >
                                <Trash2 aria-hidden='true' />
                                Delete
                              </DropdownMenuItem>
                            }
                          />
                        </>
                      : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editingClient ?
        <ClientEditorPanel
          key={editSession}
          canEdit={canEdit}
          client={editingClient}
          info={false}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      : null}
    </section>
  );
}
