'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  AlignLeft,
  BadgeDollarSign,
  Building2,
  Copy,
  Eye,
  HandHeart,
  LayoutList,
  Link2,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Shapes,
  Tag,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { MediaThumb, SceneOptionLabel } from '@/components/branded-avatar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CreateSheet } from '@/components/create-panel-shell';
import {
  CollapsibleFormSection,
  FormDescription,
  FormHint,
} from '@/components/form-field';
import {
  FormCancelButton,
  StickyFormActions,
} from '@/components/form-status';
import { InputGroup } from '@/components/input-group';
import { SectionHeader } from '@/components/page-header';
import { PendingButton } from '@/components/pending-button';
import { SortableHead } from '@/components/sortable-head';
import { NamingStatusBadge, VisibilityBadge } from '@/components/status-badges';
import { TableEmptyState } from '@/components/table-empty-state';
import { TableFilterDropdown } from '@/components/table-filter-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSortableRows } from '@/hooks/use-sortable-rows';
import { useFlipList } from '@/hooks/use-flip-list';
import { useTableRowActionMenu } from '@/hooks/use-table-row-action-menu';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Textarea } from '@/components/ui/textarea';
import {
  createLocalNaming,
  deleteLocalNaming,
  duplicateLocalNaming,
} from '@/lib/admin-dev-api';
import {
  NAMING_CATALOG_SECTION,
  NAMING_DONOR_KIND_OPTIONS,
  NAMING_FORM_COPY,
  NAMING_STATUS_OPTIONS,
  SCENE_VISIBILITY_OPTIONS,
} from '@/lib/authoring-copy';
import type {
  AdminNamingOpportunity,
  AdminNamingStatus,
} from '@/lib/tour-namings';
import type { AdminSceneSummary } from '@/lib/tour-scenes';
import { resolveTourMediaUrl } from '@/lib/admin-media';
import {
  cn,
  tableActionsCellClass,
  tableMediaCellClass,
  tableThumbClass,
  titleLinkClass,
} from '@/lib/utils';

const priceFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

function NamingForm({
  canEdit,
  clientId,
  naming,
  onSaved,
  rowRef,
  scenes,
  tourId,
}: {
  canEdit: boolean;
  clientId: string;
  naming: AdminNamingOpportunity;
  onSaved: (message: string) => void;
  rowRef?: (node: HTMLTableRowElement | null) => void;
  scenes: AdminSceneSummary[];
  tourId: string;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [includePlacements, setIncludePlacements] = useState(false);
  const [resetAsOpen, setResetAsOpen] = useState(false);
  const rowActionMenu = useTableRowActionMenu();

  async function duplicate() {
    setIsSaving(true);
    try {
      await duplicateLocalNaming(tourId, naming.id, {
        includePlacements,
        resetAsOpen,
      });
      onSaved('Naming opportunity duplicated.');
    } catch (error) {
      showFormError(error, 'Duplicate failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    setIsSaving(true);
    try {
      await deleteLocalNaming(tourId, naming.id, naming.placements);
      onSaved('Naming opportunity deleted.');
    } catch (error) {
      showFormError(error, 'Delete failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const placementScene = scenes.find(
    (scene) => scene.id === naming.placements[0]?.sceneId,
  );
  const thumbSrc =
    naming.image ?
      resolveTourMediaUrl(naming.image, clientId, tourId)
    : placementScene?.thumbnailUrl;

  return (
    <TableRow
      ref={rowRef}
      {...rowActionMenu.rowActionProps(naming.id, isSaving)}
    >
      <TableCell className={cn('hidden sm:table-cell', tableMediaCellClass)}>
        <MediaThumb
          src={thumbSrc}
          label={naming.name}
          aspect='auto'
          className={tableThumbClass}
        />
      </TableCell>
      <TableCell>
        <Link
          href={`/tours/${tourId}/namings/${naming.id}`}
          className={titleLinkClass}
        >
          {naming.name}
        </Link>
        <div className='font-mono type-meta'>{naming.id}</div>
      </TableCell>
      <TableCell>
        <NamingStatusBadge status={naming.status} />
      </TableCell>
      <TableCell>
        <VisibilityBadge visibility={naming.visibility} />
      </TableCell>
      <TableCell className='tabular-nums'>
        {priceFormatter.format(naming.price)}
      </TableCell>
      <TableCell>
        <Badge variant='secondary'>{naming.placements.length}</Badge>
      </TableCell>
      <TableCell className={tableActionsCellClass}>
        <DropdownMenu {...rowActionMenu.menuProps(naming.id)}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    aria-label={`Actions for ${naming.name}`}
                    disabled={isSaving}
                  >
                    <MoreVertical aria-hidden='true' />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Naming actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align='end'
              {...rowActionMenu.contentProps(naming.id)}
            >
              <DropdownMenuLabel>Naming actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/tours/${tourId}/namings/${naming.id}`}>
                  <Settings2 aria-hidden='true' />
                  View details
                </Link>
              </DropdownMenuItem>
              {canEdit ?
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={isSaving}>
                      <Copy aria-hidden='true' />
                      Duplicate
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className='min-w-56'>
                      <DropdownMenuCheckboxItem
                        checked={includePlacements}
                        onCheckedChange={(checked) =>
                          setIncludePlacements(checked === true)
                        }
                        onSelect={(event) => event.preventDefault()}
                      >
                        <MapPin aria-hidden='true' />
                        {NAMING_FORM_COPY.duplicateIncludePlacements}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={resetAsOpen}
                        onCheckedChange={(checked) =>
                          setResetAsOpen(checked === true)
                        }
                        onSelect={(event) => event.preventDefault()}
                      >
                        <RotateCcw aria-hidden='true' />
                        {NAMING_FORM_COPY.duplicateResetAsOpen}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isSaving}
                        onSelect={() => void duplicate()}
                      >
                        <Copy aria-hidden='true' />
                        Duplicate naming
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <ConfirmDeleteDialog
                    title={`Delete “${naming.name}”?`}
                    description={`This naming opportunity and its ${naming.placements.length} placement(s) will be permanently deleted. This action cannot be undone.`}
                    disabled={isSaving}
                    onConfirm={() => void remove()}
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
}

export function NamingManager({
  canEdit,
  clientId,
  namings,
  scenes,
  tourId,
}: {
  canEdit: boolean;
  clientId: string;
  namings: AdminNamingOpportunity[];
  scenes: AdminSceneSummary[];
  tourId: string;
}) {
  const router = useRouter();
  const [sceneId, setSceneId] = useState(scenes[0]?.id ?? '');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<AdminNamingStatus>('open');
  const [body, setBody] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [visibility, setVisibility] =
    useState<AdminNamingOpportunity['visibility']>('public');
  const [donorName, setDonorName] = useState('');
  const [donorKind, setDonorKind] = useState<'organization' | 'person'>(
    'organization',
  );
  const [donorAffiliation, setDonorAffiliation] = useState('');
  const [donorWebsite, setDonorWebsite] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const filteredNamings = useMemo(
    () =>
      namings.filter((naming) => {
        const statuses = filters.status ?? [];
        const visibilities = filters.visibility ?? [];
        return (
          (statuses.length === 0 || statuses.includes(naming.status)) &&
          (visibilities.length === 0 ||
            visibilities.includes(naming.visibility))
        );
      }),
    [filters, namings],
  );
  const { rows, sortKey, sortDir, toggle } = useSortableRows(
    filteredNamings,
    (naming, key) => {
      if (key === 'name') return naming.name;
      if (key === 'status') return naming.status;
      if (key === 'visibility') return naming.visibility;
      if (key === 'price') return naming.price;
      if (key === 'placements') return naming.placements.length;
      return 0;
    },
  );
  const flipRef = useFlipList(rows.map((row) => row.id));

  function changed(nextMessage: string) {
    showFormSuccess(nextMessage);
    router.refresh();
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createLocalNaming(tourId, {
        sceneId,
        name,
        price,
        status,
        body,
        videoUrl,
        image: '',
        visibility,
        donor:
          donorName.trim() ?
            {
              name: donorName,
              kind: donorKind,
              affiliation: donorAffiliation || undefined,
              website: donorWebsite || undefined,
            }
          : undefined,
      });
      setName('');
      setBody('');
      setVideoUrl('');
      setDonorName('');
      setDonorAffiliation('');
      setDonorWebsite('');
      setPrice(0);
      setCreateOpen(false);
      changed('Naming opportunity created. Place it from a scene hotspot tab.');
    } catch (error) {
      showFormError(error, 'Create failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const createForm = (
    <form className='admin-form' onSubmit={create}>
      <CollapsibleFormSection
        title={NAMING_FORM_COPY.basicsSection}
        icon={Tag}
        description={NAMING_FORM_COPY.basicsSectionDescription}
        defaultOpen
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='new-naming-name'>
              {NAMING_FORM_COPY.nameOptional}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.nameDescription}
            </FormDescription>
            <InputGroup icon={Tag}>
              <Input
                id='new-naming-name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={NAMING_FORM_COPY.namePlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>Host scene</Label>
            <FormDescription>
              {NAMING_FORM_COPY.hostSceneDescription}
            </FormDescription>
            <Select
              value={sceneId}
              onValueChange={setSceneId}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenes.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id}>
                    <SceneOptionLabel
                      title={scene.title}
                      thumbnailUrl={scene.thumbnailUrl}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='grid gap-2'>
            <Label htmlFor='new-naming-price'>Price</Label>
            <FormDescription>
              {NAMING_FORM_COPY.priceDescription}
            </FormDescription>
            <InputGroup icon={BadgeDollarSign}>
              <Input
                id='new-naming-price'
                type='number'
                min='0'
                value={price}
                onChange={(event) => setPrice(Number(event.target.value) || 0)}
                placeholder={NAMING_FORM_COPY.pricePlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>Status</Label>
            <FormDescription>
              {NAMING_FORM_COPY.statusDescription}
            </FormDescription>
            <InputGroup icon={Shapes}>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as AdminNamingStatus)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMING_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>Visibility</Label>
            <FormDescription>
              {NAMING_FORM_COPY.visibilityDescription}
            </FormDescription>
            <InputGroup icon={Eye}>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as AdminNamingOpportunity['visibility'])
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENE_VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
        </div>
      </CollapsibleFormSection>
      <CollapsibleFormSection
        title={NAMING_FORM_COPY.contentSection}
        icon={AlignLeft}
        description={NAMING_FORM_COPY.contentSectionDescription}
      >
        <div className='grid gap-2'>
          <Label htmlFor='new-naming-body'>Body</Label>
          <FormDescription>{NAMING_FORM_COPY.bodyDescription}</FormDescription>
          <Textarea
            id='new-naming-body'
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={NAMING_FORM_COPY.bodyPlaceholder}
            disabled={!canEdit}
          />
          <FormHint>{NAMING_FORM_COPY.bodyHint}</FormHint>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='new-naming-video'>{NAMING_FORM_COPY.videoUrl}</Label>
          <FormDescription>
            {NAMING_FORM_COPY.videoUrlDescription}
          </FormDescription>
          <InputGroup icon={Link2}>
            <Input
              id='new-naming-video'
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder={NAMING_FORM_COPY.videoUrlPlaceholder}
              disabled={!canEdit}
            />
          </InputGroup>
        </div>
      </CollapsibleFormSection>
      <CollapsibleFormSection
        title={NAMING_FORM_COPY.donorSection}
        icon={HandHeart}
        description={NAMING_FORM_COPY.donorSectionDescription}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='new-naming-donor-name'>
              {NAMING_FORM_COPY.donorName}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorNameDescription}
            </FormDescription>
            <InputGroup icon={UserRound}>
              <Input
                id='new-naming-donor-name'
                value={donorName}
                placeholder={NAMING_FORM_COPY.donorNamePlaceholder}
                onChange={(event) => setDonorName(event.target.value)}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>{NAMING_FORM_COPY.donorKind}</Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorKindDescription}
            </FormDescription>
            <InputGroup icon={Shapes}>
              <Select
                value={donorKind}
                onValueChange={(value) =>
                  setDonorKind(value as 'organization' | 'person')
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMING_DONOR_KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='new-naming-donor-affiliation'>
              {NAMING_FORM_COPY.donorAffiliation}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorAffiliationDescription}
            </FormDescription>
            <InputGroup icon={Building2}>
              <Input
                id='new-naming-donor-affiliation'
                value={donorAffiliation}
                onChange={(event) => setDonorAffiliation(event.target.value)}
                placeholder={NAMING_FORM_COPY.donorAffiliationPlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='new-naming-donor-website'>
              {NAMING_FORM_COPY.donorWebsite}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorWebsiteDescription}
            </FormDescription>
            <InputGroup icon={Link2}>
              <Input
                id='new-naming-donor-website'
                value={donorWebsite}
                onChange={(event) => setDonorWebsite(event.target.value)}
                placeholder={NAMING_FORM_COPY.donorWebsitePlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
        </div>
      </CollapsibleFormSection>
      <StickyFormActions>
        <FormCancelButton
          disabled={isSaving}
          onReset={() => {
            setSceneId(scenes[0]?.id ?? '');
            setName('');
            setPrice(0);
            setStatus('open');
            setBody('');
            setVideoUrl('');
            setVisibility('public');
            setDonorName('');
            setDonorKind('organization');
            setDonorAffiliation('');
            setDonorWebsite('');
            setCreateOpen(false);
          }}
        />
        <PendingButton
          type='submit'
          pending={isSaving}
          pendingLabel='Creating…'
          disabled={!canEdit || !sceneId}
        >
          <Plus aria-hidden='true' />
          {NAMING_CATALOG_SECTION.createButtonLabel}
        </PendingButton>
      </StickyFormActions>
    </form>
  );

  return (
    <div className='grid gap-4'>
      <SectionHeader
        title={NAMING_CATALOG_SECTION.manageTitle}
        description={NAMING_CATALOG_SECTION.manageDescription}
        icon={LayoutList}
        actions={
          <>
            <TableFilterDropdown
              sections={[
                {
                  id: 'status',
                  label: 'Status',
                  kind: 'namingStatus',
                  options: NAMING_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                },
                {
                  id: 'visibility',
                  label: 'Visibility',
                  kind: 'visibility',
                  options: SCENE_VISIBILITY_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                },
              ]}
              selected={filters}
              onSelectedChange={setFilters}
            />
            {canEdit ?
              <CreateSheet
                title={NAMING_CATALOG_SECTION.title}
                description={NAMING_CATALOG_SECTION.description}
                triggerLabel={NAMING_CATALOG_SECTION.addButtonLabel}
                open={createOpen}
                onOpenChange={setCreateOpen}
              >
                {createForm}
              </CreateSheet>
            : null}
          </>
        }
      />

      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead
                className={cn('hidden sm:table-cell', tableMediaCellClass)}
              >
                <span className='sr-only'>Thumb</span>
              </TableHead>
              <SortableHead
                label='Naming'
                column='name'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='Status'
                column='status'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='Visibility'
                column='visibility'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='Price'
                column='price'
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggle}
              />
              <SortableHead
                label='Placements'
                column='placements'
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
                  namings.length === 0 ?
                    'No namings yet'
                  : 'No namings match these filters'
                }
                description={
                  namings.length === 0 ?
                    NAMING_CATALOG_SECTION.emptyMessage
                  : 'Clear or change the active filters to see more namings.'
                }
              />
            : rows.map((naming) => (
                <NamingForm
                  key={naming.id}
                  canEdit={canEdit}
                  clientId={clientId}
                  naming={naming}
                  onSaved={changed}
                  rowRef={flipRef(naming.id)}
                  scenes={scenes}
                  tourId={tourId}
                />
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
