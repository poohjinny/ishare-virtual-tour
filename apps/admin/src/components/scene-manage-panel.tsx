'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  FileImage,
  GripVertical,
  HandHeart,
  Info,
  LayoutList,
  Link2,
  ListTree,
  MoreVertical,
  PencilRuler,
  Plus,
  Settings2,
  Trash2,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CreateSheet } from '@/components/create-panel-shell';
import { MediaThumb } from '@/components/branded-avatar';
import { FileInput } from '@/components/file-input';
import {
  CheckboxField,
  CollapsibleFormSection,
  FormDescription,
} from '@/components/form-field';
import { FormCancelButton, StickyFormActions } from '@/components/form-status';
import { InputGroup } from '@/components/input-group';
import { SectionHeader } from '@/components/page-header';
import { PendingButton } from '@/components/pending-button';
import { TableEmptyState } from '@/components/table-empty-state';
import { TableFilterDropdown } from '@/components/table-filter-dropdown';
import { SortableHead } from '@/components/sortable-head';
import { VisibilityBadge } from '@/components/status-badges';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSortableRows } from '@/hooks/use-sortable-rows';
import { useFlipList } from '@/hooks/use-flip-list';
import { useTableRowActionMenu } from '@/hooks/use-table-row-action-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  createLocalScene,
  deleteLocalScene,
  duplicateLocalScene,
  fileToBase64,
  reorderLocalScenes,
} from '@/lib/admin-dev-api';
import {
  TOUR_LAYOUT_FROM_SCENES,
  tourVisualEditPath,
} from '@/lib/admin-routes';
import { AUTHORING_SURFACE, SCENE_FORM_COPY } from '@/lib/authoring-copy';
import type { AdminViewerType } from '@/lib/tour-detail';
import type { AdminSceneSummary } from '@/lib/tour-scenes';
import {
  cn,
  tableActionsCellClass,
  tableBadgeCellClass,
  tableBadgeClass,
  tableMediaCellClass,
  tableThumbClass,
  titleLinkClass,
} from '@/lib/utils';
import { buildAdminPreviewUrl } from '@/lib/viewer-url';

function SceneDuplicateSubmenu({
  disabled,
  onDuplicate,
}: {
  disabled?: boolean;
  onDuplicate: (options: {
    includeChildren: boolean;
    linkUnderSameParent: boolean;
    namingMode: 'duplicate' | 'keep';
  }) => void;
}) {
  const [cloneNaming, setCloneNaming] = useState(true);
  const [includeChildren, setIncludeChildren] = useState(false);
  const [linkUnderSameParent, setLinkUnderSameParent] = useState(false);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <Copy aria-hidden='true' />
        Duplicate
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='min-w-56'>
        <DropdownMenuCheckboxItem
          checked={cloneNaming}
          onCheckedChange={(checked) => setCloneNaming(checked === true)}
          onSelect={(event) => event.preventDefault()}
        >
          <HandHeart aria-hidden='true' />
          {SCENE_FORM_COPY.duplicateCloneNaming}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={linkUnderSameParent}
          onCheckedChange={(checked) =>
            setLinkUnderSameParent(checked === true)
          }
          onSelect={(event) => event.preventDefault()}
        >
          <Link2 aria-hidden='true' />
          {SCENE_FORM_COPY.duplicateLinkParent}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={includeChildren}
          onCheckedChange={(checked) => setIncludeChildren(checked === true)}
          onSelect={(event) => event.preventDefault()}
        >
          <ListTree aria-hidden='true' />
          {SCENE_FORM_COPY.duplicateIncludeChildren}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={disabled}
          onSelect={() =>
            onDuplicate({
              namingMode: cloneNaming ? 'duplicate' : 'keep',
              includeChildren,
              linkUnderSameParent,
            })
          }
        >
          <Copy aria-hidden='true' />
          Duplicate scene
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function SceneManagePanel({
  canEdit,
  scenes,
  tourId,
  viewerType,
}: {
  canEdit: boolean;
  scenes: AdminSceneSummary[];
  tourId: string;
  viewerType: AdminViewerType;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [createPlaceOverview, setCreatePlaceOverview] = useState(false);
  const [panoramaFile, setPanoramaFile] = useState<File | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const rowActionMenu = useTableRowActionMenu();
  const filteredScenes = useMemo(() => {
    const visibilities = filters.visibility ?? [];
    if (visibilities.length === 0) return scenes;
    return scenes.filter((scene) => visibilities.includes(scene.visibility));
  }, [filters, scenes]);
  const { rows, sortKey, sortDir, toggle } = useSortableRows(
    filteredScenes,
    (scene, key) => {
      if (key === 'title') return scene.title;
      if (key === 'visibility') return scene.visibility;
      if (key === 'hotspots') return scene.hotspotCount;
      return 0;
    },
  );

  async function runAction(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      showFormSuccess(success);
      router.refresh();
      return true;
    } catch (error) {
      showFormError(error, 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    const ok = await runAction(async () => {
      if (!title.trim()) throw new Error('Scene title is required');
      if (viewerType === 'panorama' && !panoramaFile) {
        throw new Error('Panorama file is required');
      }
      await createLocalScene(tourId, {
        title: title.trim(),
        description,
        previewVideoUrl:
          viewerType === 'panorama' ? previewVideoUrl : undefined,
        videoUrl: viewerType === 'panorama' ? videoUrl : undefined,
        createPlaceOverview:
          viewerType === 'panorama' ? createPlaceOverview : undefined,
        panoramaFileBase64:
          panoramaFile ? await fileToBase64(panoramaFile) : undefined,
        panoramaFileName: panoramaFile?.name,
      });
      setTitle('');
      setDescription('');
      setPreviewVideoUrl('');
      setVideoUrl('');
      setCreatePlaceOverview(false);
      setPanoramaFile(null);
    }, 'Scene created.');
    if (ok) setCreateOpen(false);
  }

  async function moveScene(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= scenes.length) return;
    const order = scenes.map((scene) => scene.id);
    const [moved] = order.splice(index, 1);
    order.splice(nextIndex, 0, moved);
    await runAction(
      () => reorderLocalScenes(tourId, order),
      'Scene order saved.',
    );
  }

  async function dropScene(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const order = scenes.map((scene) => scene.id);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    setDragId(null);
    setDragOverId(null);
    await runAction(
      () => reorderLocalScenes(tourId, order),
      'Scene order saved.',
    );
  }

  const filterActive = Object.values(filters).some(
    (values) => values.length > 0,
  );
  const canReorder = canEdit && !sortKey && !filterActive;
  const flipRef = useFlipList(rows.map((row) => row.id));

  const createForm = (
    <div className='admin-form'>
      <CollapsibleFormSection
        title={SCENE_FORM_COPY.basicsSection}
        icon={Info}
        description={SCENE_FORM_COPY.basicsSectionDescription}
        defaultOpen
      >
        <div className='grid gap-2'>
          <Label htmlFor='new-scene-title'>Title</Label>
          <FormDescription>{SCENE_FORM_COPY.titleDescription}</FormDescription>
          <InputGroup icon={Type}>
            <Input
              id='new-scene-title'
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={SCENE_FORM_COPY.titlePlaceholder}
            />
          </InputGroup>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='new-scene-description'>Description</Label>
          <FormDescription>
            {SCENE_FORM_COPY.descriptionDescription}
          </FormDescription>
          <Textarea
            id='new-scene-description'
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={SCENE_FORM_COPY.descriptionPlaceholder}
          />
        </div>
      </CollapsibleFormSection>
      {viewerType === 'panorama' ?
        <CollapsibleFormSection
          title={SCENE_FORM_COPY.mediaSection}
          icon={FileImage}
          description={SCENE_FORM_COPY.mediaSectionDescription}
        >
          <div className='grid gap-2 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='new-scene-preview-video'>
                {SCENE_FORM_COPY.previewVideo}
              </Label>
              <FormDescription>
                {SCENE_FORM_COPY.previewVideoDescription}
              </FormDescription>
              <InputGroup icon={Link2}>
                <Input
                  id='new-scene-preview-video'
                  type='url'
                  value={previewVideoUrl}
                  onChange={(event) => setPreviewVideoUrl(event.target.value)}
                  placeholder={SCENE_FORM_COPY.previewVideoPlaceholder}
                />
              </InputGroup>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='new-scene-video'>
                {SCENE_FORM_COPY.bodyVideo}
              </Label>
              <FormDescription>
                {SCENE_FORM_COPY.bodyVideoDescription}
              </FormDescription>
              <InputGroup icon={Link2}>
                <Input
                  id='new-scene-video'
                  type='url'
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder={SCENE_FORM_COPY.bodyVideoPlaceholder}
                />
              </InputGroup>
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='new-scene-panorama'>Panorama file</Label>
            <FormDescription>
              {SCENE_FORM_COPY.panoramaFileDescription}
            </FormDescription>
            <FileInput
              id='new-scene-panorama'
              accept='image/*'
              file={panoramaFile}
              onFileChange={setPanoramaFile}
              aspect='video'
            />
          </div>
          <CheckboxField
            id='scene-create-place-overview'
            label={SCENE_FORM_COPY.createPlaceOverview}
            description={SCENE_FORM_COPY.createPlaceOverviewDescription}
            hint={SCENE_FORM_COPY.createPlaceOverviewHint}
            checked={createPlaceOverview}
            onCheckedChange={setCreatePlaceOverview}
          />
        </CollapsibleFormSection>
      : null}
      <StickyFormActions>
        <FormCancelButton
          disabled={busy}
          onReset={() => {
            setTitle('');
            setDescription('');
            setPreviewVideoUrl('');
            setVideoUrl('');
            setCreatePlaceOverview(false);
            setPanoramaFile(null);
            setCreateOpen(false);
          }}
        />
        <PendingButton
          type='button'
          pending={busy}
          pendingLabel='Creating…'
          disabled={busy}
          onClick={handleCreate}
        >
          <Plus aria-hidden='true' />
          {SCENE_FORM_COPY.createButton}
        </PendingButton>
      </StickyFormActions>
    </div>
  );

  return (
    <div className='grid gap-4'>
      <SectionHeader
        title={SCENE_FORM_COPY.manageTitle}
        description={SCENE_FORM_COPY.manageDescription}
        icon={LayoutList}
        actions={
          <>
            <TableFilterDropdown
              sections={[
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
              ]}
              selected={filters}
              onSelectedChange={setFilters}
            />
            {canEdit ?
              <CreateSheet
                title={SCENE_FORM_COPY.addTitle}
                description={
                  viewerType === 'model3d' ?
                    SCENE_FORM_COPY.addModel3dDescription
                  : SCENE_FORM_COPY.addPanoramaDescription
                }
                triggerLabel='Add scene'
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
              <TableHead className='w-10 pl-3 pr-1'>
                <span className='sr-only'>Order</span>
              </TableHead>
              <TableHead
                className={cn('hidden pl-2 sm:table-cell', tableMediaCellClass)}
              >
                <span className='sr-only'>Thumb</span>
              </TableHead>
              <SortableHead
                label='Scene'
                column='title'
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
                className={tableBadgeCellClass}
              />
              <SortableHead
                label='Hotspots'
                column='hotspots'
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
                colSpan={6}
                title={
                  scenes.length === 0 ?
                    'No scenes yet'
                  : 'No scenes match these filters'
                }
                description={
                  scenes.length === 0 ?
                    'Add a scene to begin building this tour.'
                  : 'Clear or change the active filters to see more scenes.'
                }
              />
            : null}
            {rows.map((scene) => {
              const index = scenes.findIndex((item) => item.id === scene.id);
              return (
                <TableRow
                  key={scene.id}
                  ref={flipRef(scene.id)}
                  {...rowActionMenu.rowActionProps(scene.id, busy)}
                  onDragOver={(event) => {
                    if (!canReorder || !dragId) return;
                    event.preventDefault();
                    setDragOverId(scene.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void dropScene(scene.id);
                  }}
                  className={cn(
                    dragId === scene.id && 'opacity-50',
                    dragOverId === scene.id &&
                      dragId !== scene.id &&
                      'border-t-2 border-primary',
                  )}
                >
                  <TableCell className='pl-3 pr-1 text-muted-foreground'>
                    {canEdit ?
                      <button
                        type='button'
                        className={cn(
                          'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground',
                          canReorder ?
                            'cursor-grab hover:bg-muted active:cursor-grabbing'
                          : 'cursor-not-allowed opacity-40',
                        )}
                        aria-label={
                          canReorder ?
                            `Drag to reorder ${scene.title}`
                          : 'Clear column sort to reorder scenes'
                        }
                        disabled={!canReorder || busy}
                        draggable={canReorder && !busy}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move';
                          setDragId(scene.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOverId(null);
                        }}
                      >
                        <GripVertical aria-hidden='true' className='size-4' />
                      </button>
                    : <span className='tabular-nums'>{index + 1}</span>}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'hidden pl-2 sm:table-cell',
                      tableMediaCellClass,
                    )}
                  >
                    <MediaThumb
                      src={scene.thumbnailUrl}
                      label='Thumb'
                      aspect='auto'
                      className={tableThumbClass}
                    />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/tours/${tourId}/scenes/${scene.id}`}
                        className={titleLinkClass}
                      >
                        {scene.title}
                      </Link>
                      {scene.isFirstScene ?
                        <Badge variant='outline'>First</Badge>
                      : null}
                    </div>
                    <div className='font-mono type-meta'>{scene.id}</div>
                  </TableCell>
                  <TableCell className={tableBadgeCellClass}>
                    <VisibilityBadge
                      visibility={scene.visibility}
                      className={tableBadgeClass}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{scene.hotspotCount}</Badge>
                  </TableCell>
                  <TableCell className={tableActionsCellClass}>
                    <DropdownMenu {...rowActionMenu.menuProps(scene.id)}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              aria-label={`Actions for ${scene.title}`}
                              disabled={busy}
                            >
                              <MoreVertical aria-hidden='true' />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Scene actions</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        align='end'
                        {...rowActionMenu.contentProps(scene.id)}
                      >
                        <DropdownMenuLabel>Scene actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/tours/${tourId}/scenes/${scene.id}`}>
                            <Settings2 aria-hidden='true' />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={buildAdminPreviewUrl(tourId, {
                              sceneId: scene.id,
                            })}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <ExternalLink aria-hidden='true' />
                            Open preview
                          </a>
                        </DropdownMenuItem>
                        {viewerType === 'panorama' ?
                          <DropdownMenuItem asChild>
                            <Link
                              href={tourVisualEditPath(
                                tourId,
                                scene.id,
                                TOUR_LAYOUT_FROM_SCENES,
                              )}
                            >
                              <PencilRuler aria-hidden='true' />
                              {AUTHORING_SURFACE.edit.openLabel}
                            </Link>
                          </DropdownMenuItem>
                        : null}
                        {canEdit ?
                          <>
                            <DropdownMenuItem
                              disabled={!canReorder || index === 0}
                              onSelect={() => void moveScene(index, -1)}
                            >
                              <ArrowUp aria-hidden='true' />
                              Move up
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !canReorder || index === scenes.length - 1
                              }
                              onSelect={() => void moveScene(index, 1)}
                            >
                              <ArrowDown aria-hidden='true' />
                              Move down
                            </DropdownMenuItem>
                            <SceneDuplicateSubmenu
                              disabled={busy}
                              onDuplicate={(options) =>
                                void runAction(
                                  () =>
                                    duplicateLocalScene(
                                      tourId,
                                      scene.id,
                                      options,
                                    ),
                                  'Scene duplicated.',
                                )
                              }
                            />
                            <DropdownMenuSeparator />
                            <ConfirmDeleteDialog
                              title={`Delete “${scene.title}”?`}
                              description='This scene and its hotspots will be permanently deleted. This action cannot be undone.'
                              disabled={busy || scene.isFirstScene}
                              onConfirm={() =>
                                void runAction(
                                  () => deleteLocalScene(tourId, scene.id),
                                  'Scene deleted.',
                                )
                              }
                              trigger={
                                <DropdownMenuItem
                                  variant='destructive'
                                  disabled={scene.isFirstScene}
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
    </div>
  );
}
