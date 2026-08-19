'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ExternalLink,
  LayoutList,
  MoreVertical,
  Pencil,
  PencilRuler,
  Settings2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { MediaThumb } from '@/components/branded-avatar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { SectionHeader } from '@/components/page-header';
import { SortableHead } from '@/components/sortable-head';
import { TableEmptyState } from '@/components/table-empty-state';
import {
  TableFilterDropdown,
  type TableFilterSection,
} from '@/components/table-filter-dropdown';
import {
  CategoryBadge,
  ViewerTypeBadge,
  VisibilityBadge,
} from '@/components/status-badges';
import { TourEditorPanel } from '@/components/tour-editor-panel';
import { useSortableRows } from '@/hooks/use-sortable-rows';
import { useFlipList } from '@/hooks/use-flip-list';
import { useTableRowActionMenu } from '@/hooks/use-table-row-action-menu';
import { AUTHORING_SURFACE, TOUR_FORM_COPY } from '@/lib/authoring-copy';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteLocalTour, fetchLocalTour } from '@/lib/admin-dev-api';
import { showTourVisualEditor, tourVisualEditPath } from '@/lib/admin-routes';
import type { AdminTourDetail } from '@/lib/tour-detail';
import type { AdminTourOverview } from '@/lib/tour-overview';
import {
  cn,
  tableActionsCellClass,
  tableBadgeCellClass,
  tableBadgeClass,
  tableMediaCellClass,
  tableThumbClass,
  titleLinkClass,
} from '@/lib/utils';

/** Sentinel for the unfiltered client choice — Select cannot hold an empty value. */
const ALL_CLIENTS = 'all';

export function TourTable({
  canDelete = false,
  canEdit = false,
  createAction,
  description,
  title = TOUR_FORM_COPY.manageTitle,
  tours,
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  createAction?: ReactNode;
  description?: ReactNode;
  title?: string;
  tours: AdminTourOverview[];
}) {
  const router = useRouter();
  /**
   * The loaded tour outlives `editOpen` so the sheet keeps its close animation —
   * unmounting on close would cut it. `editSession` remounts the panel on each
   * open so its form starts from the tour we just fetched.
   */
  const [editingTour, setEditingTour] = useState<AdminTourDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState(0);
  const [editBusyId, setEditBusyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS);
  const rowActionMenu = useTableRowActionMenu();
  const detailCacheRef = useRef(new Map<string, Promise<AdminTourDetail>>());
  const clientOptions = useMemo(() => {
    const byId = new Map(
      tours.map((tour) => [tour.clientId, tour.clientName] as const),
    );
    return [...byId]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tours]);
  /** A deleted tour can drop the picked client from the list — fall back to all. */
  const activeClient =
    clientOptions.some((client) => client.id === clientFilter) ? clientFilter
    : ALL_CLIENTS;
  const filterSections = useMemo<TableFilterSection[]>(
    () => [
      {
        id: 'category',
        label: 'Category',
        kind: 'category',
        options: [...new Set(tours.map((tour) => tour.category))]
          .sort()
          .map((value) => ({ value, label: value })),
      },
      {
        id: 'visibility',
        label: 'Visibility',
        kind: 'visibility',
        options: [
          { value: 'public', label: 'Public' },
          { value: 'unlisted', label: 'Unlisted' },
          { value: 'internal', label: 'Internal' },
        ],
      },
      {
        id: 'type',
        label: 'Viewer type',
        kind: 'viewer',
        options: [
          { value: 'panorama', label: 'Panorama' },
          { value: 'model3d', label: '3D model' },
        ],
      },
    ],
    [tours],
  );
  const filteredTours = useMemo(
    () =>
      tours.filter((tour) => {
        const categories = filters.category ?? [];
        const visibilities = filters.visibility ?? [];
        const types = filters.type ?? [];
        return (
          (activeClient === ALL_CLIENTS || tour.clientId === activeClient) &&
          (categories.length === 0 || categories.includes(tour.category)) &&
          (visibilities.length === 0 ||
            visibilities.includes(tour.visibility)) &&
          (types.length === 0 || types.includes(tour.viewerType))
        );
      }),
    [activeClient, filters, tours],
  );
  const { rows, sortKey, sortDir, toggle } = useSortableRows(
    filteredTours,
    (tour, key) => {
      if (key === 'title') return tour.title;
      if (key === 'client') return tour.clientName;
      if (key === 'category') return tour.category;
      if (key === 'visibility') return tour.visibility;
      if (key === 'type') return tour.viewerType;
      return '';
    },
    'title',
  );
  const flipRef = useFlipList(rows.map((row) => row.id));

  function prefetchTour(tourId: string) {
    const cached = detailCacheRef.current.get(tourId);
    if (cached) return cached;
    const pending = fetchLocalTour(tourId).catch((error) => {
      detailCacheRef.current.delete(tourId);
      throw error;
    });
    detailCacheRef.current.set(tourId, pending);
    return pending;
  }

  async function remove(tour: AdminTourOverview) {
    try {
      await deleteLocalTour(tour.id);
      showFormSuccess('Tour deleted.');
      router.refresh();
    } catch (error) {
      showFormError(error, 'Tour deletion failed.');
    }
  }

  async function openEdit(tour: AdminTourOverview) {
    setEditBusyId(tour.id);
    try {
      const detail = await prefetchTour(tour.id);
      detailCacheRef.current.delete(tour.id);
      setEditingTour(detail);
      setEditSession((session) => session + 1);
      setEditOpen(true);
    } catch (error) {
      showFormError(error, 'Could not open tour editor.');
    } finally {
      setEditBusyId(null);
    }
  }

  return (
    <section className='grid gap-4' aria-labelledby='tour-list-heading'>
      <SectionHeader
        id='tour-list-heading'
        title={title}
        description={description}
        icon={LayoutList}
        actions={
          <>
            {clientOptions.length > 1 ?
              <Select value={activeClient} onValueChange={setClientFilter}>
                <SelectTrigger
                  size='sm'
                  aria-label='Filter tours by client'
                  className='max-w-48'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLIENTS}>All clients</SelectItem>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            : null}
            <TableFilterDropdown
              sections={filterSections}
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
                <span className='sr-only'>Cover</span>
              </TableHead>
              <SortableHead
                label='Tour'
                column='title'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='Client'
                column='client'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className='hidden md:table-cell'
              />
              <SortableHead
                label='Category'
                column='category'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className={cn('hidden lg:table-cell', tableBadgeCellClass)}
              />
              <SortableHead
                label='Visibility'
                column='visibility'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className={tableBadgeCellClass}
              />
              <SortableHead
                label='Type'
                column='type'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
                className={cn('hidden sm:table-cell', tableBadgeCellClass)}
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
                  tours.length === 0 ?
                    'No tours yet'
                  : 'No tours match these filters'
                }
                description={
                  tours.length === 0 ?
                    'Add a tour to start building the catalog.'
                  : 'Clear or change the active filters to see more tours.'
                }
              />
            : null}
            {rows.map((tour) => {
              const menuProps = rowActionMenu.menuProps(tour.id);
              const showEditor = showTourVisualEditor(tour.viewerType);
              return (
                <TableRow
                  key={tour.id}
                  ref={flipRef(tour.id)}
                  className='group'
                  {...rowActionMenu.rowActionProps(
                    tour.id,
                    editBusyId === tour.id,
                  )}
                >
                  <TableCell className={tableMediaCellClass}>
                    <MediaThumb
                      src={tour.coverUrl}
                      label='Thumb'
                      aspect='auto'
                      className={tableThumbClass}
                    />
                  </TableCell>
                  <TableCell>
                    <div className='min-w-0'>
                      <Link
                        href={`/tours/${tour.id}`}
                        className={titleLinkClass}
                      >
                        {tour.title}
                      </Link>
                      <div className='mt-0.5 flex flex-wrap items-center gap-2 type-meta'>
                        <span className='font-mono'>{tour.id}</span>
                        <span className='md:hidden'>{tour.clientName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {tour.clientName}
                  </TableCell>
                  <TableCell
                    className={cn('hidden lg:table-cell', tableBadgeCellClass)}
                  >
                    <CategoryBadge
                      category={tour.category}
                      className={tableBadgeClass}
                    />
                  </TableCell>
                  <TableCell className={tableBadgeCellClass}>
                    <VisibilityBadge
                      visibility={tour.visibility}
                      className={tableBadgeClass}
                    />
                  </TableCell>
                  <TableCell
                    className={cn('hidden sm:table-cell', tableBadgeCellClass)}
                  >
                    <ViewerTypeBadge
                      viewerType={tour.viewerType}
                      className={tableBadgeClass}
                    />
                  </TableCell>
                  <TableCell className={tableActionsCellClass}>
                    <DropdownMenu
                      {...menuProps}
                      onOpenChange={(open) => {
                        menuProps.onOpenChange(open);
                        if (open) void prefetchTour(tour.id);
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={`Actions for ${tour.title}`}
                              disabled={editBusyId === tour.id}
                            >
                              <MoreVertical aria-hidden='true' />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Tour actions</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        align='end'
                        {...rowActionMenu.contentProps(tour.id)}
                      >
                        <DropdownMenuLabel>Tour actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/tours/${tour.id}`}>
                            <Settings2 aria-hidden='true' />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`https://tour.ishare.ca/${tour.id}`}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <ExternalLink aria-hidden='true' />
                            Open live tour
                          </a>
                        </DropdownMenuItem>
                        {showEditor ?
                          <DropdownMenuItem asChild>
                            <Link href={tourVisualEditPath(tour.id)}>
                              <PencilRuler aria-hidden='true' />
                              {AUTHORING_SURFACE.edit.openLabel}
                            </Link>
                          </DropdownMenuItem>
                        : null}
                        {canEdit ?
                          <DropdownMenuItem
                            disabled={editBusyId === tour.id}
                            onSelect={() => void openEdit(tour)}
                          >
                            <Pencil aria-hidden='true' />
                            Edit
                          </DropdownMenuItem>
                        : null}
                        {canDelete ?
                          <>
                            <DropdownMenuSeparator />
                            <ConfirmDeleteDialog
                              title={`Delete “${tour.title}”?`}
                              description='This tour and all of its scenes will be permanently deleted. This action cannot be undone.'
                              onConfirm={() => void remove(tour)}
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
              );
            })}
          </TableBody>
        </Table>
      </div>
      {editingTour ?
        <TourEditorPanel
          key={editSession}
          canEdit={canEdit}
          tour={editingTour}
          info={false}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      : null}
    </section>
  );
}
