'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlignLeft,
  Eye,
  FileImage,
  Hash,
  Link2,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Settings2,
  Shapes,
  Trash2,
  Type,
  PanelTop,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { SceneOptionLabel } from '@/components/branded-avatar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { useHeaderEdit } from '@/components/header-edit';
import { FileInput } from '@/components/file-input';
import {
  AUTHORING_SHEET_BODY_CLASS,
  AUTHORING_SHEET_CLASS,
  CreateSheet,
} from '@/components/create-panel-shell';
import { HotspotPositionFields } from '@/components/hotspot-position-fields';
import { InputGroup } from '@/components/input-group';
import {
  FormCancelButton,
  InfoField,
  InfoFieldList,
  InfoLink,
  StickyFormActions,
} from '@/components/form-status';
import {
  CheckboxField,
  CollapsibleFormSection,
  FormDescription,
  FormHint,
} from '@/components/form-field';
import { PendingButton } from '@/components/pending-button';
import { HotspotTypeBadge, VisibilityBadge } from '@/components/status-badges';
import {
  useTableRowActionMenu,
  type TableRowMenuContentProps,
} from '@/hooks/use-table-row-action-menu';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  applyLocalSceneDefaultView,
  createLocalHotspot,
  deleteLocalHotspot,
  replaceLocalScenePanorama,
  updateLocalHotspot,
  updateLocalHotspotPosition,
  updateLocalScene,
  type AdminHotspotCreate,
  type AdminSceneUpdate,
} from '@/lib/admin-dev-api';
import { httpHref } from '@/lib/admin-routes';
import {
  AUTHORING_SURFACE,
  HOTSPOT_FORM_COPY,
  HOTSPOT_SECTION,
  INFO_DISPLAY_OPTIONS,
  SCENE_FORM_COPY,
  SCENE_VISIBILITY_OPTIONS,
} from '@/lib/authoring-copy';
import {
  axesToRecord,
  mergePreviewAxes,
  publishPreviewReload,
  subscribePreviewClick,
  subscribePreviewView,
} from '@/lib/preview-click';
import type { AdminViewerType } from '@/lib/tour-detail';
import type { AdminNamingOpportunity } from '@/lib/tour-namings';
import type {
  AdminHotspotSummary,
  AdminSceneDetail,
  AdminSceneSummary,
} from '@/lib/tour-scenes';
import { tableActionsCellClass } from '@/lib/utils';

function HotspotSheet({
  canEdit,
  hotspot,
  menuContentProps,
  menuOpen,
  namings,
  onChanged,
  onMenuOpenChange,
  sceneId,
  scenes,
  tourId,
}: {
  canEdit: boolean;
  hotspot: AdminHotspotSummary;
  menuContentProps: TableRowMenuContentProps;
  menuOpen: boolean;
  namings: AdminNamingOpportunity[];
  onChanged: (
    message: string,
    kind?: 'success' | 'error',
    options?: { refresh?: boolean },
  ) => void;
  onMenuOpenChange: (open: boolean) => void;
  sceneId: string;
  scenes: AdminSceneSummary[];
  tourId: string;
}) {
  const displayName = hotspot.label || hotspot.namingId || hotspot.id;
  const kind =
    hotspot.namingId ? 'naming'
    : hotspot.type === 'nav' ? 'nav'
    : 'info';
  const [label, setLabel] = useState(hotspot.label);
  const [targetSceneId, setTargetSceneId] = useState(hotspot.targetScene ?? '');
  const [namingId, setNamingId] = useState(hotspot.namingId ?? '');
  const [title, setTitle] = useState(hotspot.title ?? '');
  const [body, setBody] = useState(hotspot.body ?? '');
  const [display, setDisplay] = useState(hotspot.display ?? 'modal');
  const [position, setPosition] = useState(hotspot.position);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!canEdit || !open) return;
    return subscribePreviewClick((next) => {
      let merged = next;
      setPosition((current) => {
        merged = mergePreviewAxes(current, next);
        return merged;
      });
      void (async () => {
        setIsSaving(true);
        try {
          await updateLocalHotspotPosition(
            tourId,
            sceneId,
            hotspot.id,
            axesToRecord(merged) as AdminHotspotCreate['position'],
          );
          onChanged('Hotspot moved.', 'success', { refresh: false });
        } catch (error) {
          onChanged(
            error instanceof Error ? error.message : 'Position save failed.',
            'error',
          );
        } finally {
          setIsSaving(false);
        }
      })();
    });
  }, [canEdit, hotspot.id, onChanged, open, sceneId, tourId]);

  async function saveDetails() {
    setIsSaving(true);
    try {
      await updateLocalHotspot(tourId, sceneId, hotspot.id, {
        kind,
        ...(kind === 'nav' ? { label, targetSceneId } : {}),
        ...(kind === 'naming' ? { namingId } : {}),
        ...(kind === 'info' ? { title, body, display } : {}),
      });
      onChanged('Hotspot details saved.');
    } catch (error) {
      onChanged(
        error instanceof Error ? error.message : 'Hotspot save failed.',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    setIsSaving(true);
    try {
      await deleteLocalHotspot(tourId, sceneId, hotspot.id);
      setOpen(false);
      onChanged('Hotspot deleted.');
    } catch (error) {
      onChanged(
        error instanceof Error ? error.message : 'Hotspot deletion failed.',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {canEdit ?
        <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`Actions for ${displayName}`}
              disabled={isSaving}
            >
              <MoreVertical aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' {...menuContentProps}>
            <DropdownMenuLabel>Hotspot actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              <Pencil aria-hidden='true' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ConfirmDeleteDialog
              title={`Delete “${displayName}”?`}
              description='This hotspot will be permanently removed from the scene. This action cannot be undone.'
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
          </DropdownMenuContent>
        </DropdownMenu>
      : <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={`View ${displayName}`}
          onClick={() => setOpen(true)}
        >
          <Eye aria-hidden='true' />
        </Button>
      }
      <SheetContent className={AUTHORING_SHEET_CLASS}>
        <SheetHeader>
          <div className='flex items-center gap-2'>
            <SheetTitle>{displayName}</SheetTitle>
            <HotspotTypeBadge type={hotspot.type} namingId={hotspot.namingId} />
          </div>
          <SheetDescription>
            Edit this hotspot in the local tour JSON.
          </SheetDescription>
        </SheetHeader>

        <div className={AUTHORING_SHEET_BODY_CLASS}>
          <div className='admin-form'>
            <CollapsibleFormSection
              title={HOTSPOT_FORM_COPY.targetSection}
              icon={Settings2}
              description={HOTSPOT_FORM_COPY.targetSectionDescription}
              defaultOpen
            >
              <div className='grid gap-2'>
                <Label htmlFor={`hotspot-id-${hotspot.id}`}>Hotspot ID</Label>
                <FormDescription>
                  {HOTSPOT_FORM_COPY.idDescription}
                </FormDescription>
                <InputGroup icon={Hash}>
                  <Input
                    id={`hotspot-id-${hotspot.id}`}
                    className='font-mono'
                    value={hotspot.id}
                    readOnly
                    disabled
                  />
                </InputGroup>
              </div>

              {kind === 'nav' ?
                <div className='grid gap-2'>
                  <Label htmlFor={`hotspot-label-${hotspot.id}`}>Label</Label>
                  <FormDescription>
                    {HOTSPOT_FORM_COPY.labelDescription}
                  </FormDescription>
                  <InputGroup icon={Type}>
                    <Input
                      id={`hotspot-label-${hotspot.id}`}
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder={HOTSPOT_FORM_COPY.labelPlaceholder}
                      disabled={!canEdit}
                    />
                  </InputGroup>
                </div>
              : null}

              {kind === 'nav' ?
                <div className='grid gap-2'>
                  <Label htmlFor={`hotspot-target-${hotspot.id}`}>
                    Target scene
                  </Label>
                  <FormDescription>
                    {HOTSPOT_FORM_COPY.targetSceneDescription}
                  </FormDescription>
                  <Select
                    value={targetSceneId}
                    onValueChange={setTargetSceneId}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id={`hotspot-target-${hotspot.id}`}>
                      <SelectValue
                        placeholder={HOTSPOT_FORM_COPY.targetScenePlaceholder}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {scenes
                        .filter((scene) => scene.id !== sceneId)
                        .map((scene) => (
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
              : null}

              {kind === 'naming' ?
                <div className='grid gap-2'>
                  <Label htmlFor={`hotspot-naming-${hotspot.id}`}>
                    Naming opportunity
                  </Label>
                  <FormDescription>
                    {HOTSPOT_FORM_COPY.namingDescription}
                  </FormDescription>
                  <InputGroup icon={MapPin}>
                    <Select
                      value={namingId}
                      onValueChange={setNamingId}
                      disabled={!canEdit}
                    >
                      <SelectTrigger id={`hotspot-naming-${hotspot.id}`}>
                        <SelectValue
                          placeholder={HOTSPOT_FORM_COPY.namingPlaceholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {namings.map((naming) => (
                          <SelectItem key={naming.id} value={naming.id}>
                            {naming.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InputGroup>
                </div>
              : null}
            </CollapsibleFormSection>

            {kind === 'info' && !hotspot.role ?
              <CollapsibleFormSection
                title={HOTSPOT_FORM_COPY.contentSection}
                icon={Pencil}
                description={HOTSPOT_FORM_COPY.contentSectionDescription}
              >
                <div className='grid gap-2'>
                  <Label htmlFor={`hotspot-title-${hotspot.id}`}>Title</Label>
                  <FormDescription>
                    {HOTSPOT_FORM_COPY.titleDescription}
                  </FormDescription>
                  <InputGroup icon={Type}>
                    <Input
                      id={`hotspot-title-${hotspot.id}`}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={HOTSPOT_FORM_COPY.titlePlaceholder}
                      disabled={!canEdit}
                    />
                  </InputGroup>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor={`hotspot-body-${hotspot.id}`}>Body</Label>
                  <FormDescription>
                    {HOTSPOT_FORM_COPY.bodyDescription}
                  </FormDescription>
                  <Textarea
                    id={`hotspot-body-${hotspot.id}`}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={HOTSPOT_FORM_COPY.bodyPlaceholder}
                    disabled={!canEdit}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label>Display</Label>
                  <FormDescription>
                    {HOTSPOT_FORM_COPY.displayDescription}
                  </FormDescription>
                  <InputGroup icon={PanelTop}>
                    <Select
                      value={display}
                      onValueChange={(value) =>
                        setDisplay(value as 'modal' | 'anchored')
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INFO_DISPLAY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InputGroup>
                </div>
              </CollapsibleFormSection>
            : null}

            <CollapsibleFormSection
              title={HOTSPOT_FORM_COPY.placementSection}
              icon={MapPin}
              description={HOTSPOT_FORM_COPY.placementSectionDescription}
            >
              <div className='grid gap-2'>
                <Label>Position</Label>
                <FormDescription>
                  {HOTSPOT_FORM_COPY.positionDescription}
                </FormDescription>
                <HotspotPositionFields
                  idPrefix={`hotspot-position-${hotspot.id}`}
                  position={position}
                  readOnly
                />
                <FormHint>
                  Click the preview to move this hotspot. The new position saves
                  immediately.
                </FormHint>
              </div>
            </CollapsibleFormSection>
            {!hotspot.role ?
              <Button
                type='button'
                size='sm'
                className='w-fit'
                disabled={!canEdit || isSaving}
                onClick={saveDetails}
              >
                <Save aria-hidden='true' />
                Save details
              </Button>
            : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SceneEditorPanel({
  canEdit,
  namings = [],
  scene,
  scenes = [],
  tourId,
  viewerType = 'panorama',
}: {
  canEdit: boolean;
  namings?: AdminNamingOpportunity[];
  scene: AdminSceneDetail;
  scenes?: AdminSceneSummary[];
  tourId: string;
  viewerType?: AdminViewerType;
}) {
  const router = useRouter();
  const initialValues: AdminSceneUpdate = {
    title: scene.title,
    description: scene.description,
    previewVideoUrl: scene.previewVideoUrl ?? '',
    videoUrl: scene.videoUrl ?? '',
    visibility: scene.visibility,
    setAsFirstScene: false,
  };
  const [form, setForm] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [defaultView, setDefaultView] = useState(scene.defaultView);
  const [liveView, setLiveView] = useState<typeof scene.defaultView | null>(
    null,
  );
  const [panoramaFile, setPanoramaFile] = useState<File | null>(null);
  const [hotspotCreateOpen, setHotspotCreateOpen] = useState(false);
  const localEdit = useState(false);
  const headerEdit = useHeaderEdit();
  const editOpen = headerEdit?.open ?? localEdit[0];
  const setEditOpen = headerEdit?.setOpen ?? localEdit[1];
  const [hotspotKind, setHotspotKind] =
    useState<AdminHotspotCreate['kind']>('nav');
  const [hotspotName, setHotspotName] = useState('');
  const [hotspotTarget, setHotspotTarget] = useState('');
  const [hotspotNamingId, setHotspotNamingId] = useState('');
  const [hotspotBody, setHotspotBody] = useState('');
  const [hotspotPosition, setHotspotPosition] = useState(
    viewerType === 'model3d' ?
      [
        { axis: 'x', value: 0 },
        { axis: 'y', value: 0 },
        { axis: 'z', value: 0 },
      ]
    : [
        { axis: 'yaw', value: 0 },
        { axis: 'pitch', value: 0 },
      ],
  );
  const [isSaving, setIsSaving] = useState(false);
  const rowActionMenu = useTableRowActionMenu();
  const hotspotSection = HOTSPOT_SECTION[viewerType];

  useEffect(() => {
    if (!canEdit) return;
    return subscribePreviewClick((next) => {
      setHotspotPosition((current) => mergePreviewAxes(current, next));
    });
  }, [canEdit]);

  useEffect(() => {
    if (!canEdit) return;
    return subscribePreviewView((next) => {
      setLiveView(next);
    });
  }, [canEdit]);

  const isDirty =
    form.title !== savedValues.title ||
    form.description !== savedValues.description ||
    form.previewVideoUrl !== savedValues.previewVideoUrl ||
    form.videoUrl !== savedValues.videoUrl ||
    form.visibility !== savedValues.visibility ||
    form.setAsFirstScene !== savedValues.setAsFirstScene;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await updateLocalScene(tourId, scene.id, form);
      setSavedValues(form);
      showFormSuccess('Scene saved to local JSON.');
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      showFormError(error, 'Scene save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDefaultViewSave() {
    const viewToApply = liveView ?? defaultView;
    if (viewToApply.length === 0) return;
    setIsSaving(true);
    try {
      await applyLocalSceneDefaultView(
        tourId,
        scene.id,
        axesToRecord(viewToApply),
      );
      setDefaultView(viewToApply);
      showFormSuccess('Default view saved.');
      publishPreviewReload();
      router.refresh();
    } catch (error) {
      showFormError(error, 'Default view save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePanoramaReplace() {
    if (!panoramaFile) return;
    setIsSaving(true);
    try {
      await replaceLocalScenePanorama(tourId, scene.id, panoramaFile);
      setPanoramaFile(null);
      showFormSuccess('Panorama replaced.');
      router.refresh();
    } catch (error) {
      showFormError(error, 'Panorama replace failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleHotspotCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createLocalHotspot(tourId, scene.id, {
        kind: hotspotKind,
        position: Object.fromEntries(
          hotspotPosition.map(({ axis, value }) => [axis, value]),
        ) as AdminHotspotCreate['position'],
        ...(hotspotKind === 'nav' ?
          { name: hotspotName, targetSceneId: hotspotTarget }
        : {}),
        ...(hotspotKind === 'info' ?
          { name: hotspotName, title: hotspotName, body: hotspotBody }
        : {}),
        ...(hotspotKind === 'naming' ? { namingId: hotspotNamingId } : {}),
      });
      setHotspotName('');
      setHotspotBody('');
      showFormSuccess('Hotspot created.');
      setHotspotCreateOpen(false);
      router.refresh();
    } catch (error) {
      showFormError(error, 'Hotspot creation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const handleHotspotChanged = useCallback(
    (
      message: string,
      kind: 'success' | 'error' = 'success',
      options?: { refresh?: boolean },
    ) => {
      if (kind === 'success') showFormSuccess(message);
      else showFormError(message, message);
      if (kind === 'success' && options?.refresh !== false) {
        router.refresh();
      }
    },
    [router],
  );

  return (
    <>
      <Tabs defaultValue='settings' className='h-full min-h-0'>
        <TabsList level='secondary' className='shrink-0'>
          <TabsTrigger value='settings'>
            <Settings2 aria-hidden='true' />
            Settings
          </TabsTrigger>
          <TabsTrigger value='hotspots'>
            <MapPin aria-hidden='true' />
            Hotspots
          </TabsTrigger>
        </TabsList>

      <TabsContent
        value='settings'
        className='flex min-h-0 flex-col overflow-hidden'
      >
        <Card className='max-h-full min-h-0'>
          <CardHeader className='shrink-0'>
            <CardTitle>Scene</CardTitle>
          </CardHeader>
          <CardContent className='ishare-scrollbar min-h-0 flex-1 overflow-y-auto'>
            <InfoFieldList layout='stack'>
              <InfoField icon={Type} label='Title'>
                {savedValues.title}
              </InfoField>
              <InfoField icon={Eye} label='Visibility'>
                <VisibilityBadge visibility={savedValues.visibility} />
              </InfoField>
              <InfoField icon={AlignLeft} label='Description'>
                {savedValues.description || '—'}
              </InfoField>
              {viewerType === 'panorama' ?
                <>
                  <InfoField
                    icon={Link2}
                    label={SCENE_FORM_COPY.previewVideo}
                  >
                    {savedValues.previewVideoUrl ?
                      <InfoLink href={httpHref(savedValues.previewVideoUrl)}>
                        {savedValues.previewVideoUrl}
                      </InfoLink>
                    : '—'}
                  </InfoField>
                  <InfoField icon={Link2} label={SCENE_FORM_COPY.bodyVideo}>
                    {savedValues.videoUrl ?
                      <InfoLink href={httpHref(savedValues.videoUrl)}>
                        {savedValues.videoUrl}
                      </InfoLink>
                    : '—'}
                  </InfoField>
                </>
              : null}
            </InfoFieldList>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value='hotspots'
        className='flex min-h-0 flex-col overflow-hidden'
      >
        <Card className='max-h-full min-h-0'>
          <CardHeader className='shrink-0'>
            <CardTitle>{hotspotSection.title}</CardTitle>
            <CardDescription>
              {scene.hotspotCount}{' '}
              {scene.hotspotCount === 1 ? 'hotspot' : 'hotspots'} on this
              scene.
              {hotspotSection.description ?
                ` ${hotspotSection.description}`
              : null}
            </CardDescription>
            {canEdit ?
              <CardAction>
                <CreateSheet
                  title={hotspotSection.addButtonLabel}
                  description='Click the preview to set the pin, then fill the fields.'
                  triggerLabel={hotspotSection.addButtonLabel}
                  open={hotspotCreateOpen}
                  onOpenChange={setHotspotCreateOpen}
                >
                <form className='admin-form' onSubmit={handleHotspotCreate}>
                  <CollapsibleFormSection
                    title={HOTSPOT_FORM_COPY.targetSection}
                    icon={Settings2}
                    description={HOTSPOT_FORM_COPY.targetSectionDescription}
                    defaultOpen
                  >
                    <div className='grid gap-2'>
                      <Label htmlFor='new-hotspot-kind'>New hotspot type</Label>
                      <FormDescription>
                        {HOTSPOT_FORM_COPY.typeDescription}
                      </FormDescription>
                      <InputGroup icon={Shapes}>
                        <Select
                          value={hotspotKind}
                          onValueChange={(value) =>
                            setHotspotKind(value as AdminHotspotCreate['kind'])
                          }
                        >
                          <SelectTrigger id='new-hotspot-kind'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='nav'>Navigation</SelectItem>
                            <SelectItem value='info'>Information</SelectItem>
                            <SelectItem value='naming'>
                              Naming placement
                            </SelectItem>
                            {viewerType === 'panorama' ?
                              <SelectItem value='place-overview'>
                                Place overview
                              </SelectItem>
                            : null}
                          </SelectContent>
                        </Select>
                      </InputGroup>
                    </div>

                    {hotspotKind === 'nav' || hotspotKind === 'info' ?
                      <div className='grid gap-2'>
                        <Label htmlFor='new-hotspot-name'>
                          {hotspotKind === 'nav' ? 'Label' : 'Title'}
                        </Label>
                        <FormDescription>
                          {hotspotKind === 'nav' ?
                            HOTSPOT_FORM_COPY.labelDescription
                          : HOTSPOT_FORM_COPY.titleDescription}
                        </FormDescription>
                        <InputGroup icon={Type}>
                          <Input
                            id='new-hotspot-name'
                            value={hotspotName}
                            onChange={(event) =>
                              setHotspotName(event.target.value)
                            }
                            placeholder={
                              hotspotKind === 'nav' ?
                                HOTSPOT_FORM_COPY.labelPlaceholder
                              : HOTSPOT_FORM_COPY.titlePlaceholder
                            }
                            required={hotspotKind === 'info'}
                          />
                        </InputGroup>
                      </div>
                    : null}

                    {hotspotKind === 'nav' ?
                      <div className='grid gap-2'>
                        <Label>Target scene</Label>
                        <FormDescription>
                          {HOTSPOT_FORM_COPY.targetSceneDescription}
                        </FormDescription>
                        <Select
                          value={hotspotTarget}
                          onValueChange={setHotspotTarget}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                HOTSPOT_FORM_COPY.targetScenePlaceholder
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {scenes
                              .filter((entry) => entry.id !== scene.id)
                              .map((entry) => (
                                <SelectItem key={entry.id} value={entry.id}>
                                  <SceneOptionLabel
                                    title={entry.title}
                                    thumbnailUrl={entry.thumbnailUrl}
                                  />
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    : null}

                    {hotspotKind === 'naming' ?
                      <div className='grid gap-2'>
                        <Label>Naming opportunity</Label>
                        <FormDescription>
                          {HOTSPOT_FORM_COPY.namingDescription}
                        </FormDescription>
                        <InputGroup icon={MapPin}>
                          <Select
                            value={hotspotNamingId}
                            onValueChange={setHotspotNamingId}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  HOTSPOT_FORM_COPY.namingPlaceholder
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {namings.map((naming) => (
                                <SelectItem key={naming.id} value={naming.id}>
                                  {naming.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </InputGroup>
                      </div>
                    : null}
                  </CollapsibleFormSection>

                  {hotspotKind === 'info' ?
                    <CollapsibleFormSection
                      title={HOTSPOT_FORM_COPY.contentSection}
                      icon={Pencil}
                      description={HOTSPOT_FORM_COPY.contentSectionDescription}
                    >
                      <div className='grid gap-2'>
                        <Label htmlFor='new-hotspot-body'>Body</Label>
                        <FormDescription>
                          {HOTSPOT_FORM_COPY.bodyDescription}
                        </FormDescription>
                        <Textarea
                          id='new-hotspot-body'
                          value={hotspotBody}
                          onChange={(event) =>
                            setHotspotBody(event.target.value)
                          }
                          placeholder={HOTSPOT_FORM_COPY.bodyPlaceholder}
                        />
                      </div>
                    </CollapsibleFormSection>
                  : null}

                  <CollapsibleFormSection
                    title={HOTSPOT_FORM_COPY.placementSection}
                    icon={MapPin}
                    description={HOTSPOT_FORM_COPY.placementSectionDescription}
                  >
                    <div className='grid gap-2'>
                      <Label>Position</Label>
                      <FormDescription>
                        {HOTSPOT_FORM_COPY.positionDescription}
                      </FormDescription>
                      <HotspotPositionFields
                        idPrefix='new-hotspot-position'
                        position={hotspotPosition}
                        onChange={(axis, value) =>
                          setHotspotPosition((current) =>
                            current.map((entry) =>
                              entry.axis === axis ? { ...entry, value } : entry,
                            ),
                          )
                        }
                      />
                    </div>
                  </CollapsibleFormSection>
                  <StickyFormActions>
                    <FormCancelButton
                      disabled={isSaving}
                      onReset={() => {
                        setHotspotKind('nav');
                        setHotspotName('');
                        setHotspotTarget('');
                        setHotspotNamingId('');
                        setHotspotBody('');
                        setHotspotPosition(
                          viewerType === 'model3d' ?
                            [
                              { axis: 'x', value: 0 },
                              { axis: 'y', value: 0 },
                              { axis: 'z', value: 0 },
                            ]
                          : [
                              { axis: 'yaw', value: 0 },
                              { axis: 'pitch', value: 0 },
                            ],
                        );
                        setHotspotCreateOpen(false);
                      }}
                    />
                    <Button
                      type='submit'
                      size='sm'
                      disabled={
                        isSaving ||
                        (hotspotKind === 'nav' && !hotspotTarget) ||
                        (hotspotKind === 'naming' && !hotspotNamingId)
                      }
                    >
                      <Plus aria-hidden='true' />
                      {hotspotSection.addButtonLabel}
                    </Button>
                  </StickyFormActions>
                </form>
                </CreateSheet>
              </CardAction>
            : null}
          </CardHeader>
          <CardContent className='admin-form ishare-scrollbar min-h-0 flex-1 overflow-y-auto'>
            {scene.hotspots.length > 0 ?
              <div className='overflow-hidden rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotspot</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className={tableActionsCellClass}>
                        <span className='sr-only'>Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scene.hotspots.map((hotspot) => {
                      const menuProps = rowActionMenu.menuProps(hotspot.id);
                      return (
                        <TableRow
                          key={hotspot.id}
                          {...rowActionMenu.rowActionProps(
                            hotspot.id,
                            !canEdit,
                          )}
                        >
                          <TableCell>
                            <div className='font-medium'>
                              {hotspot.label || 'Untitled hotspot'}
                            </div>
                            <div className='font-mono type-meta'>
                              {hotspot.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <HotspotTypeBadge
                              type={hotspot.type}
                              namingId={hotspot.namingId}
                            />
                          </TableCell>
                          <TableCell className='font-mono text-xs'>
                            {hotspot.targetScene ?? hotspot.namingId ?? '—'}
                          </TableCell>
                          <TableCell className={tableActionsCellClass}>
                            <HotspotSheet
                              canEdit={canEdit}
                              hotspot={hotspot}
                              menuContentProps={rowActionMenu.contentProps(
                                hotspot.id,
                              )}
                              menuOpen={menuProps.open}
                              namings={namings}
                              onChanged={handleHotspotChanged}
                              onMenuOpenChange={menuProps.onOpenChange}
                              sceneId={scene.id}
                              scenes={scenes}
                              tourId={tourId}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            : <p className='text-sm text-muted-foreground'>
                {hotspotSection.emptyMessage}
              </p>
            }
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      <Sheet
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setForm(savedValues);
        }}
      >
        <SheetContent className={AUTHORING_SHEET_CLASS}>
          <SheetHeader>
            <SheetTitle>Edit scene</SheetTitle>
            <SheetDescription>
              {AUTHORING_SURFACE.scene.description}
            </SheetDescription>
          </SheetHeader>
          <div className={AUTHORING_SHEET_BODY_CLASS}>
              <form className='admin-form' onSubmit={handleSubmit}>
                <CollapsibleFormSection
                  title={SCENE_FORM_COPY.basicsSection}
                  icon={Settings2}
                  description={SCENE_FORM_COPY.basicsSectionDescription}
                  defaultOpen
                >
                  <div className='grid gap-2'>
                    <Label htmlFor='scene-title'>Title</Label>
                    <FormDescription>
                      {SCENE_FORM_COPY.titleDescription}
                    </FormDescription>
                    <InputGroup icon={Type}>
                      <Input
                        id='scene-title'
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        disabled={!canEdit}
                        required
                        placeholder={SCENE_FORM_COPY.titlePlaceholder}
                      />
                    </InputGroup>
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='scene-visibility'>Visibility</Label>
                    <FormDescription>
                      {SCENE_FORM_COPY.visibilityDescription}
                    </FormDescription>
                    <InputGroup icon={Eye}>
                      <Select
                        value={form.visibility}
                        onValueChange={(visibility) =>
                          setForm((current) => ({
                            ...current,
                            visibility:
                              visibility as AdminSceneUpdate['visibility'],
                          }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger id='scene-visibility'>
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

                  <div className='grid gap-2'>
                    <Label htmlFor='scene-description'>Description</Label>
                    <FormDescription>
                      {SCENE_FORM_COPY.descriptionDescription}
                    </FormDescription>
                    <Textarea
                      id='scene-description'
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder={SCENE_FORM_COPY.descriptionPlaceholder}
                      disabled={!canEdit}
                    />
                  </div>
                </CollapsibleFormSection>

                <CollapsibleFormSection
                  title={SCENE_FORM_COPY.mediaSection}
                  icon={FileImage}
                  description={SCENE_FORM_COPY.mediaSectionDescription}
                >
                  {viewerType === 'panorama' ?
                    <>
                      <div className='grid gap-2'>
                        <Label htmlFor='scene-preview-video'>
                          {SCENE_FORM_COPY.previewVideo}
                        </Label>
                        <FormDescription>
                          {SCENE_FORM_COPY.previewVideoDescription}
                        </FormDescription>
                        <InputGroup icon={Link2}>
                          <Input
                            id='scene-preview-video'
                            type='url'
                            value={form.previewVideoUrl}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                previewVideoUrl: event.target.value,
                              }))
                            }
                            placeholder={
                              SCENE_FORM_COPY.previewVideoPlaceholder
                            }
                            disabled={!canEdit}
                          />
                        </InputGroup>
                      </div>

                      <div className='grid gap-2'>
                        <Label htmlFor='scene-video'>
                          {SCENE_FORM_COPY.bodyVideo}
                        </Label>
                        <FormDescription>
                          {SCENE_FORM_COPY.bodyVideoDescription}
                        </FormDescription>
                        <InputGroup icon={Link2}>
                          <Input
                            id='scene-video'
                            type='url'
                            value={form.videoUrl}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                videoUrl: event.target.value,
                              }))
                            }
                            placeholder={SCENE_FORM_COPY.bodyVideoPlaceholder}
                            disabled={!canEdit}
                          />
                        </InputGroup>
                      </div>
                    </>
                  : null}

                  {!scene.isFirstScene ?
                    <CheckboxField
                      id='scene-first'
                      label={SCENE_FORM_COPY.setAsFirstScene}
                      description={SCENE_FORM_COPY.setAsFirstSceneDescription}
                      hint={SCENE_FORM_COPY.setAsFirstSceneHint}
                      checked={form.setAsFirstScene}
                      onCheckedChange={(setAsFirstScene) =>
                        setForm((current) => ({ ...current, setAsFirstScene }))
                      }
                      disabled={!canEdit}
                    />
                  : null}

                  <div className='grid gap-2'>
                    <Label>
                      {viewerType === 'model3d' ? 'Viewpoint' : 'Default view'}
                    </Label>
                    <FormDescription>
                      {SCENE_FORM_COPY.applyDefaultViewDescription}
                    </FormDescription>
                    <HotspotPositionFields
                      idPrefix='scene-default-view'
                      position={liveView ?? defaultView}
                      readOnly
                    />
                    <FormHint>{SCENE_FORM_COPY.applyDefaultViewHint}</FormHint>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='w-fit'
                      disabled={
                        !canEdit ||
                        isSaving ||
                        (liveView ?? defaultView).length === 0
                      }
                      onClick={handleDefaultViewSave}
                    >
                      {SCENE_FORM_COPY.applyDefaultView}
                    </Button>
                  </div>

                  {viewerType === 'panorama' && canEdit ?
                    <div className='grid gap-2'>
                      <Label htmlFor='scene-replace-panorama'>
                        {SCENE_FORM_COPY.replacePanorama}
                      </Label>
                      <FormDescription>
                        {SCENE_FORM_COPY.replacePanoramaDescription}
                      </FormDescription>
                      <FileInput
                        id='scene-replace-panorama'
                        accept='image/*'
                        file={panoramaFile}
                        onFileChange={setPanoramaFile}
                        aspect='video'
                      />
                      <FormHint>{SCENE_FORM_COPY.replacePanoramaHint}</FormHint>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={!panoramaFile || isSaving}
                        onClick={handlePanoramaReplace}
                      >
                        Upload panorama
                      </Button>
                    </div>
                  : null}
                </CollapsibleFormSection>

                <StickyFormActions>
                  <FormCancelButton
                    disabled={isSaving}
                    onReset={() => {
                      setForm(savedValues);
                      setEditOpen(false);
                    }}
                  />
                  <PendingButton
                    type='submit'
                    pending={isSaving}
                    pendingLabel='Saving…'
                    disabled={!canEdit || !isDirty}
                  >
                    <Save aria-hidden='true' />
                    Save changes
                  </PendingButton>
                </StickyFormActions>
              </form>
            </div>
          </SheetContent>
        </Sheet>
    </>
  );
}
