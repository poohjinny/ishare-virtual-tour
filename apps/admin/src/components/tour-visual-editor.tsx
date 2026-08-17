'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Copy,
  HandHeart,
  Layers3,
  Link2,
  ListTree,
  MapPin,
  MonitorPlay,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  PanelTop,
  Pencil,
  Plus,
  Settings2,
  Shapes,
  Trash2,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { SceneOptionLabel, MediaThumb } from '@/components/branded-avatar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CreateSheet } from '@/components/create-panel-shell';
import { FileInput } from '@/components/file-input';
import {
  CheckboxField,
  CollapsibleFormSection,
  FormDescription,
  FormHint,
} from '@/components/form-field';
import { FormCancelButton, StickyFormActions } from '@/components/form-status';
import { HotspotPositionFields } from '@/components/hotspot-position-fields';
import { InputGroup } from '@/components/input-group';
import { PendingButton } from '@/components/pending-button';
import { HotspotTypeBadge, VisibilityBadge } from '@/components/status-badges';
import { TourPreviewPanel } from '@/components/tour-preview-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { fileToBase64 } from '@/lib/admin-dev-api';
import { tourVisualEditPath } from '@/lib/admin-routes';
import {
  HOTSPOT_FORM_COPY,
  HOTSPOT_SECTION,
  INFO_DISPLAY_OPTIONS,
  SCENE_FORM_COPY,
} from '@/lib/authoring-copy';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import {
  axesToRecord,
  mergePreviewAxes,
  publishPreviewReload,
  subscribePreviewClick,
  subscribePreviewView,
  type PreviewClickAxis,
} from '@/lib/preview-click';
import {
  tourAuthoringRepository,
  type AuthoringHotspotCreate,
} from '@/lib/tour-authoring-repository';
import type { AdminNamingOpportunity } from '@/lib/tour-namings';
import type {
  AdminHotspotSummary,
  AdminSceneDetail,
  AdminSceneSummary,
} from '@/lib/tour-scenes';
import { cn } from '@/lib/utils';

/**
 * Pane names are shared by the mobile tabs (below xl) and the desktop fold
 * toggles, so one pane cannot be called two things at two breakpoints.
 */
const EDITOR_PANES = {
  scenes: { label: 'Scenes', tabIcon: Layers3, foldIcon: PanelLeft },
  viewer: { label: 'Viewer', tabIcon: MonitorPlay },
  inspector: { label: 'Inspector', tabIcon: Pencil, foldIcon: PanelRight },
} as const;

const EDITOR_PANE_IDS = ['scenes', 'viewer', 'inspector'] as const;

/**
 * Desktop columns. The viewer is the hero and takes whatever the side panels
 * leave, so folding one hands it the space instead of stretching the panel that
 * stays open.
 */
const EDITOR_COLUMN = {
  scenes: 'minmax(14rem,16rem)',
  viewer: 'minmax(0,1fr)',
  inspector: 'minmax(18rem,20rem)',
} as const;

/**
 * The stage is a definite height, not a floor: the columns scroll inside it, so
 * a long scene list or an open hotspot inspector cannot stretch the row and
 * leave the viewer as a tall black box. `22rem` is the chrome above the stage
 * (Admin header, route padding, tour identity, tabs, toolbar); the clamp keeps a
 * short laptop usable and stops a tall display from inflating the columns.
 */
const EDITOR_STAGE_HEIGHT = 'clamp(30rem, calc(100svh - 22rem), 54rem)';

/**
 * All three column headers reserve the height of a `sm` action button, so the
 * scene list, the viewer, and the inspector start on the same line whether or
 * not a header carries an action.
 */
const EDITOR_HEADER_CLASS = 'min-h-7.5 shrink-0 items-center';

type MobilePane = (typeof EDITOR_PANE_IDS)[number];
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type WorkMode = 'browse' | 'place' | 'move';

const DEFAULT_PANORAMA_POSITION: PreviewClickAxis[] = [
  { axis: 'yaw', value: 0 },
  { axis: 'pitch', value: 0 },
];

/** Folds one side column away so the viewer can use its width. */
function PaneFoldToggle({
  icon: Icon,
  label,
  open,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  const action = `${open ? 'Hide' : 'Show'} ${label.toLowerCase()}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label={action}
          aria-pressed={open}
          onClick={onToggle}
        >
          <Icon aria-hidden='true' />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{action}</TooltipContent>
    </Tooltip>
  );
}

/**
 * One group inside the inspector column. The column is already a card, so the
 * groups are separated the way sections in a save form are — a hairline between
 * siblings, not a box each — and only the glyph and heading row mark them.
 * `titleFor` keeps the heading as the control's label where a group is a single
 * field.
 */
function InspectorSection({
  action,
  children,
  count,
  icon: Icon,
  title,
  titleFor,
}: {
  action?: ReactNode;
  children: ReactNode;
  count?: number;
  icon: LucideIcon;
  title: string;
  titleFor?: string;
}) {
  const heading = (
    <>
      <Icon aria-hidden='true' className='icon-inline shrink-0' />
      {title}
      {count !== undefined ?
        <Badge variant='secondary' size='sm' className='tabular-nums'>
          {count}
        </Badge>
      : null}
    </>
  );

  return (
    <section data-slot='form-section' className='grid gap-2'>
      <div className='flex items-center justify-between gap-2'>
        {titleFor ?
          <Label
            htmlFor={titleFor}
            className='flex min-w-0 items-center gap-1.5'
          >
            {heading}
          </Label>
        : <h3 className='type-label flex min-w-0 items-center gap-1.5 text-foreground'>
            {heading}
          </h3>
        }
        {action}
      </div>
      {children}
    </section>
  );
}

function SceneDuplicateMenu({
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

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return <Badge variant='secondary'>Saving…</Badge>;
  }
  if (status === 'saved') {
    return <Badge variant='success'>Saved</Badge>;
  }
  if (status === 'error') {
    return <Badge variant='destructive'>Save failed</Badge>;
  }
  return <Badge variant='outline'>Ready</Badge>;
}

function SelectedHotspotInspector({
  busy,
  canEdit,
  dirtyRef,
  hotspot,
  namings,
  onBusyChange,
  onDeleted,
  onSaved,
  sceneId,
  scenes,
  tourId,
}: {
  busy: boolean;
  canEdit: boolean;
  dirtyRef: { current: boolean };
  hotspot: AdminHotspotSummary;
  namings: AdminNamingOpportunity[];
  onBusyChange: (busy: boolean) => void;
  onDeleted: () => void;
  onSaved: () => void;
  sceneId: string;
  scenes: AdminSceneSummary[];
  tourId: string;
}) {
  const router = useRouter();
  const [editLabel, setEditLabel] = useState(hotspot.label);
  const [editTarget, setEditTarget] = useState(hotspot.targetScene ?? '');
  const [editNamingId, setEditNamingId] = useState(hotspot.namingId ?? '');
  const [editTitle, setEditTitle] = useState(hotspot.title ?? '');
  const [editBody, setEditBody] = useState(hotspot.body ?? '');
  const [editDisplay, setEditDisplay] = useState<'modal' | 'anchored'>(
    hotspot.display ?? 'modal',
  );
  const [editPosition, setEditPosition] = useState(hotspot.position);

  const dirty =
    editLabel !== hotspot.label ||
    editTarget !== (hotspot.targetScene ?? '') ||
    editNamingId !== (hotspot.namingId ?? '') ||
    editTitle !== (hotspot.title ?? '') ||
    editBody !== (hotspot.body ?? '') ||
    editDisplay !== (hotspot.display ?? 'modal');

  useEffect(() => {
    dirtyRef.current = dirty;
    return () => {
      dirtyRef.current = false;
    };
  }, [dirty, dirtyRef]);

  useEffect(() => {
    if (!canEdit) return;
    return subscribePreviewClick((next) => {
      let merged = next;
      setEditPosition((current) => {
        merged = mergePreviewAxes(current, next);
        return merged;
      });
      void (async () => {
        if (busy) return;
        onBusyChange(true);
        try {
          await tourAuthoringRepository.updateHotspotPosition(
            tourId,
            sceneId,
            hotspot.id,
            axesToRecord(merged) as AuthoringHotspotCreate['position'],
          );
          showFormSuccess('Hotspot moved.');
          publishPreviewReload();
          router.refresh();
        } catch (error) {
          showFormError(error, 'Position save failed.');
        } finally {
          onBusyChange(false);
        }
      })();
    });
  }, [
    busy,
    canEdit,
    dirtyRef,
    hotspot.id,
    onBusyChange,
    router,
    sceneId,
    tourId,
  ]);

  async function saveDetails() {
    const kind =
      hotspot.namingId ? 'naming'
      : hotspot.type === 'nav' ? 'nav'
      : 'info';
    if (kind === 'nav' && !editTarget) {
      showFormError(
        new Error('Choose a target scene'),
        'Choose a target scene',
      );
      return;
    }
    onBusyChange(true);
    try {
      await tourAuthoringRepository.updateHotspot(tourId, sceneId, hotspot.id, {
        kind,
        ...(kind === 'nav' ?
          { label: editLabel, targetSceneId: editTarget }
        : {}),
        ...(kind === 'naming' ? { namingId: editNamingId } : {}),
        ...(kind === 'info' ?
          { title: editTitle, body: editBody, display: editDisplay }
        : {}),
      });
      showFormSuccess('Hotspot details saved.');
      onSaved();
      router.refresh();
    } catch (error) {
      showFormError(error, 'Hotspot save failed.');
    } finally {
      onBusyChange(false);
    }
  }

  async function remove() {
    onBusyChange(true);
    try {
      await tourAuthoringRepository.deleteHotspot(tourId, sceneId, hotspot.id);
      showFormSuccess('Hotspot deleted.');
      onDeleted();
      publishPreviewReload();
      router.refresh();
    } catch (error) {
      showFormError(error, 'Hotspot deletion failed.');
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <InspectorSection
      icon={Pencil}
      title='Selected hotspot'
      action={
        <Button type='button' size='xs' variant='ghost' onClick={onDeleted}>
          Clear
        </Button>
      }
    >
      <div className='grid gap-2'>
        <Label>Position</Label>
        <HotspotPositionFields
          idPrefix={`visual-hotspot-${hotspot.id}`}
          position={editPosition}
          readOnly
        />
        <FormHint>
          Click the panorama to move this hotspot. The new position saves
          immediately.
        </FormHint>
      </div>
      {hotspot.type === 'nav' && !hotspot.namingId ?
        <>
          <div className='grid gap-2'>
            <Label htmlFor='visual-edit-label'>Label</Label>
            <InputGroup icon={Type}>
              <Input
                id='visual-edit-label'
                value={editLabel}
                onChange={(event) => setEditLabel(event.target.value)}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>Target scene</Label>
            <Select
              value={editTarget}
              onValueChange={setEditTarget}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={HOTSPOT_FORM_COPY.targetScenePlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                {scenes
                  .filter((entry) => entry.id !== sceneId)
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
        </>
      : null}
      {hotspot.namingId ?
        <div className='grid gap-2'>
          <Label>Naming opportunity</Label>
          <InputGroup icon={MapPin}>
            <Select
              value={editNamingId}
              onValueChange={setEditNamingId}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
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
      {hotspot.type === 'info' && !hotspot.role ?
        <>
          <div className='grid gap-2'>
            <Label htmlFor='visual-edit-title'>Title</Label>
            <InputGroup icon={Type}>
              <Input
                id='visual-edit-title'
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='visual-edit-body'>Body</Label>
            <Textarea
              id='visual-edit-body'
              value={editBody}
              onChange={(event) => setEditBody(event.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className='grid gap-2'>
            <Label>Display</Label>
            <InputGroup icon={PanelTop}>
              <Select
                value={editDisplay}
                onValueChange={(value) =>
                  setEditDisplay(value as 'modal' | 'anchored')
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
        </>
      : null}
      {!hotspot.role ?
        <Button
          type='button'
          size='sm'
          className='w-fit'
          disabled={!canEdit || busy || !dirty}
          onClick={() => void saveDetails()}
        >
          <Pencil aria-hidden='true' />
          Save details
        </Button>
      : null}
      <div className='grid gap-2 border-t pt-3'>
        <div>
          <div className='type-label text-destructive'>Danger zone</div>
          <p className='type-body text-muted-foreground'>
            Permanently remove this hotspot from the scene.
          </p>
        </div>
        <ConfirmDeleteDialog
          title={`Delete “${hotspot.label || hotspot.id}”?`}
          description='This hotspot will be permanently removed from the scene. This action cannot be undone.'
          disabled={!canEdit || busy}
          onConfirm={() => void remove()}
          trigger={
            <Button
              type='button'
              variant='destructive'
              size='sm'
              className='w-fit'
            >
              <Trash2 aria-hidden='true' />
              Delete
            </Button>
          }
        />
      </div>
    </InspectorSection>
  );
}

export function TourVisualEditor({
  canEdit,
  namings,
  previewRoute,
  scene,
  scenes,
  tourId,
}: {
  canEdit: boolean;
  namings: AdminNamingOpportunity[];
  previewRoute: string;
  scene: AdminSceneDetail;
  scenes: AdminSceneSummary[];
  tourId: string;
}) {
  const router = useRouter();
  const hotspotSection = HOTSPOT_SECTION.panorama;

  const [mobilePane, setMobilePane] = useState<MobilePane>('viewer');
  const [openPanes, setOpenPanes] = useState({
    scenes: true,
    inspector: true,
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [busy, setBusy] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    null,
  );
  const hotspotEditDirtyRef = useRef(false);
  const [liveView, setLiveView] = useState<PreviewClickAxis[] | null>(null);
  const [createSceneOpen, setCreateSceneOpen] = useState(false);
  const [createHotspotOpen, setCreateHotspotOpen] = useState(false);

  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [createPlaceOverview, setCreatePlaceOverview] = useState(false);
  const [panoramaFile, setPanoramaFile] = useState<File | null>(null);
  const [replacePanoramaFile, setReplacePanoramaFile] = useState<File | null>(
    null,
  );

  const [hotspotKind, setHotspotKind] =
    useState<AuthoringHotspotCreate['kind']>('nav');
  const [hotspotName, setHotspotName] = useState('');
  const [hotspotTarget, setHotspotTarget] = useState('');
  const [hotspotNamingId, setHotspotNamingId] = useState('');
  const [hotspotBody, setHotspotBody] = useState('');
  const [hotspotPosition, setHotspotPosition] = useState(
    DEFAULT_PANORAMA_POSITION,
  );

  const selectedHotspot = useMemo(
    () => scene.hotspots.find((item) => item.id === selectedHotspotId) ?? null,
    [scene.hotspots, selectedHotspotId],
  );

  const workMode: WorkMode =
    createHotspotOpen ? 'place'
    : selectedHotspot ? 'move'
    : 'browse';

  const createDirty =
    Boolean(sceneTitle.trim()) ||
    Boolean(sceneDescription.trim()) ||
    Boolean(panoramaFile) ||
    createPlaceOverview;
  const hotspotCreateDirty =
    createHotspotOpen ||
    Boolean(hotspotName.trim()) ||
    Boolean(hotspotTarget) ||
    Boolean(hotspotNamingId) ||
    Boolean(hotspotBody.trim());

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!createDirty && !hotspotCreateDirty && !hotspotEditDirtyRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [createDirty, hotspotCreateDirty]);

  useEffect(() => {
    if (!canEdit) return;
    return subscribePreviewView((next) => setLiveView(next));
  }, [canEdit]);

  useEffect(() => {
    if (!canEdit || !createHotspotOpen) return;
    return subscribePreviewClick((next) => {
      setHotspotPosition((current) => mergePreviewAxes(current, next));
    });
  }, [canEdit, createHotspotOpen]);

  const confirmLeave = useCallback(() => {
    if (!createDirty && !hotspotCreateDirty && !hotspotEditDirtyRef.current) {
      return true;
    }
    return window.confirm(
      'You have unsaved changes in the editor. Leave this scene anyway?',
    );
  }, [createDirty, hotspotCreateDirty]);

  const runSave = useCallback(
    async (action: () => Promise<void>, options?: { soft?: boolean }) => {
      if (busy) return false;
      setBusy(true);
      setSaveStatus('saving');
      try {
        await action();
        setSaveStatus('saved');
        if (!options?.soft) {
          window.setTimeout(() => setSaveStatus('idle'), 1600);
        }
        return true;
      } catch (error) {
        setSaveStatus('error');
        showFormError(error, 'Save failed.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  /**
   * The editor stays mounted across scenes so the viewer iframe survives the
   * hop — clear what belonged to the scene we are leaving.
   */
  function resetSceneWork() {
    setSelectedHotspotId(null);
    setCreateHotspotOpen(false);
    setHotspotKind('nav');
    setHotspotName('');
    setHotspotTarget('');
    setHotspotNamingId('');
    setHotspotBody('');
    setHotspotPosition(DEFAULT_PANORAMA_POSITION);
    setReplacePanoramaFile(null);
    setLiveView(null);
    setSaveStatus('idle');
    hotspotEditDirtyRef.current = false;
  }

  function selectScene(nextSceneId: string) {
    if (nextSceneId === scene.id) return;
    if (!confirmLeave()) return;
    resetSceneWork();
    router.push(tourVisualEditPath(tourId, nextSceneId));
  }

  async function handleCreateScene(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sceneTitle.trim()) {
      showFormError(
        new Error('Scene title is required'),
        'Scene title is required',
      );
      return;
    }
    if (!panoramaFile) {
      showFormError(
        new Error('Panorama file is required'),
        'Panorama file is required',
      );
      return;
    }
    const ok = await runSave(async () => {
      const result = await tourAuthoringRepository.createScene(tourId, {
        title: sceneTitle.trim(),
        description: sceneDescription,
        createPlaceOverview,
        panoramaFileBase64: await fileToBase64(panoramaFile),
        panoramaFileName: panoramaFile.name,
      });
      setSceneTitle('');
      setSceneDescription('');
      setCreatePlaceOverview(false);
      setPanoramaFile(null);
      setCreateSceneOpen(false);
      showFormSuccess('Scene created.');
      const createdId =
        (
          result &&
          typeof result === 'object' &&
          'scene' in result &&
          result.scene &&
          typeof result.scene === 'object' &&
          'id' in result.scene &&
          typeof (result.scene as { id?: unknown }).id === 'string'
        ) ?
          (result.scene as { id: string }).id
        : undefined;
      if (createdId) {
        resetSceneWork();
        router.push(tourVisualEditPath(tourId, createdId));
      } else {
        publishPreviewReload();
        router.refresh();
      }
    });
    if (!ok) return;
  }

  async function moveScene(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= scenes.length) return;
    const order = scenes.map((item) => item.id);
    const [moved] = order.splice(index, 1);
    order.splice(nextIndex, 0, moved);
    await runSave(async () => {
      await tourAuthoringRepository.reorderScenes(tourId, order);
      showFormSuccess('Scene order saved.');
      router.refresh();
    });
  }

  async function duplicateScene(
    sceneId: string,
    options: {
      includeChildren: boolean;
      linkUnderSameParent: boolean;
      namingMode: 'duplicate' | 'keep';
    },
  ) {
    await runSave(async () => {
      await tourAuthoringRepository.duplicateScene(tourId, sceneId, options);
      showFormSuccess('Scene duplicated.');
      publishPreviewReload();
      router.refresh();
    });
  }

  async function deleteScene(sceneId: string, isFirst: boolean) {
    if (isFirst) return;
    await runSave(async () => {
      await tourAuthoringRepository.deleteScene(tourId, sceneId);
      showFormSuccess('Scene deleted.');
      const fallback =
        scenes.find((item) => item.id !== sceneId)?.id ?? undefined;
      resetSceneWork();
      if (fallback) router.push(tourVisualEditPath(tourId, fallback));
      else router.push(`/tours/${tourId}/scenes`);
    });
  }

  async function handleDefaultViewSave() {
    const viewToApply = liveView ?? scene.defaultView;
    if (viewToApply.length === 0) return;
    await runSave(async () => {
      await tourAuthoringRepository.applyDefaultView(
        tourId,
        scene.id,
        axesToRecord(viewToApply),
      );
      showFormSuccess('Start view saved.');
      publishPreviewReload();
      router.refresh();
    });
  }

  async function handlePanoramaReplace() {
    if (!replacePanoramaFile) return;
    await runSave(async () => {
      await tourAuthoringRepository.replacePanorama(
        tourId,
        scene.id,
        replacePanoramaFile,
      );
      setReplacePanoramaFile(null);
      showFormSuccess('Panorama replaced.');
      publishPreviewReload();
      router.refresh();
    });
  }

  async function handleHotspotCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hotspotKind === 'nav' && !hotspotTarget) {
      showFormError(
        new Error('Choose a target scene'),
        'Choose a target scene',
      );
      return;
    }
    if (hotspotKind === 'naming' && !hotspotNamingId) {
      showFormError(
        new Error('Choose a naming opportunity'),
        'Choose a naming opportunity',
      );
      return;
    }
    if (hotspotPosition.length === 0) {
      showFormError(
        new Error('Click the viewer to set a position'),
        'Click the viewer to set a position',
      );
      return;
    }
    await runSave(async () => {
      await tourAuthoringRepository.createHotspot(tourId, scene.id, {
        kind: hotspotKind,
        position: Object.fromEntries(
          hotspotPosition.map(({ axis, value }) => [axis, value]),
        ) as AuthoringHotspotCreate['position'],
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
      setHotspotTarget('');
      setHotspotNamingId('');
      setHotspotPosition(DEFAULT_PANORAMA_POSITION);
      setCreateHotspotOpen(false);
      showFormSuccess('Hotspot created.');
      publishPreviewReload();
      router.refresh();
    });
  }

  const modeHint =
    workMode === 'place' ? 'Click the panorama to place the new hotspot.'
    : workMode === 'move' ?
      'Click the panorama to move the selected hotspot. Changes save immediately.'
    : 'Look around to set a start view, or select a hotspot to edit.';

  const sceneRail = (
    <Card size='sm' className='flex h-full min-h-0 flex-col'>
      <CardHeader className={EDITOR_HEADER_CLASS}>
        <CardTitle className='flex items-center gap-2'>
          Scenes
          <Badge variant='secondary' size='sm' className='tabular-nums'>
            {scenes.length}
          </Badge>
        </CardTitle>
        {canEdit ?
          <CardAction>
            <CreateSheet
              title={SCENE_FORM_COPY.addTitle}
              description={SCENE_FORM_COPY.addPanoramaDescription}
              triggerLabel='Add'
              disabled={busy}
              open={createSceneOpen}
              onOpenChange={(open) => {
                if (!open && createDirty) {
                  if (!window.confirm('Discard the new scene draft?')) return;
                }
                setCreateSceneOpen(open);
              }}
            >
              <form className='admin-form' onSubmit={handleCreateScene}>
                <CollapsibleFormSection
                  title={SCENE_FORM_COPY.basicsSection}
                  icon={Settings2}
                  description={SCENE_FORM_COPY.basicsSectionDescription}
                  defaultOpen
                >
                  <div className='grid gap-2'>
                    <Label htmlFor='visual-scene-title'>Title</Label>
                    <InputGroup icon={Type}>
                      <Input
                        id='visual-scene-title'
                        value={sceneTitle}
                        onChange={(event) => setSceneTitle(event.target.value)}
                        placeholder={SCENE_FORM_COPY.titlePlaceholder}
                        required
                      />
                    </InputGroup>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='visual-scene-description'>
                      Description
                    </Label>
                    <Textarea
                      id='visual-scene-description'
                      value={sceneDescription}
                      onChange={(event) =>
                        setSceneDescription(event.target.value)
                      }
                      placeholder={SCENE_FORM_COPY.descriptionPlaceholder}
                    />
                  </div>
                </CollapsibleFormSection>
                <CollapsibleFormSection
                  title={SCENE_FORM_COPY.mediaSection}
                  icon={Layers3}
                  description={SCENE_FORM_COPY.mediaSectionDescription}
                  defaultOpen
                >
                  <div className='grid gap-2'>
                    <Label htmlFor='visual-scene-panorama'>Panorama</Label>
                    <FileInput
                      id='visual-scene-panorama'
                      accept='image/*'
                      file={panoramaFile}
                      onFileChange={setPanoramaFile}
                      aspect='video'
                    />
                    <FormHint>
                      {SCENE_FORM_COPY.panoramaFileDescription}
                    </FormHint>
                  </div>
                  <CheckboxField
                    id='visual-scene-overview'
                    label={SCENE_FORM_COPY.createPlaceOverview}
                    description={SCENE_FORM_COPY.createPlaceOverviewDescription}
                    hint={SCENE_FORM_COPY.createPlaceOverviewHint}
                    checked={createPlaceOverview}
                    onCheckedChange={setCreatePlaceOverview}
                  />
                </CollapsibleFormSection>
                <StickyFormActions>
                  <FormCancelButton
                    disabled={busy}
                    onReset={() => {
                      setSceneTitle('');
                      setSceneDescription('');
                      setCreatePlaceOverview(false);
                      setPanoramaFile(null);
                      setCreateSceneOpen(false);
                    }}
                  />
                  <PendingButton
                    type='submit'
                    pending={busy}
                    pendingLabel='Creating…'
                    disabled={!sceneTitle.trim() || !panoramaFile}
                  >
                    <Plus aria-hidden='true' />
                    {SCENE_FORM_COPY.createButton}
                  </PendingButton>
                </StickyFormActions>
              </form>
            </CreateSheet>
          </CardAction>
        : null}
      </CardHeader>
      <CardContent className='ishare-scrollbar min-h-0 flex-1 overflow-y-auto'>
        {/* A definite column, not one measured by the rows: a truncated title
            never wraps, so an auto track takes the longest scene name as its
            floor, widens every row past the card, and pushes the row menu out
            of view behind a horizontal scrollbar. */}
        <ul className='grid grid-cols-[minmax(0,1fr)] gap-1.5'>
          {scenes.map((item, index) => {
            const active = item.id === scene.id;
            return (
              <li key={item.id}>
                <div
                  className={cn(
                    'flex items-start gap-1 rounded-lg border p-2 transition-colors',
                    active ?
                      'border-primary bg-primary/5'
                    : 'hover:bg-muted/50',
                  )}
                >
                  <button
                    type='button'
                    className='flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left'
                    onClick={() => selectScene(item.id)}
                  >
                    <MediaThumb
                      src={item.thumbnailUrl}
                      label={item.title}
                      className='w-14 shrink-0'
                    />
                    <span className='min-w-0 flex-1 space-y-1'>
                      <span className='block truncate font-medium'>
                        {item.title}
                      </span>
                      <span className='flex flex-wrap items-center gap-1'>
                        <VisibilityBadge
                          visibility={item.visibility}
                          size='sm'
                        />
                        {item.isFirstScene ?
                          <Badge variant='outline' size='sm'>
                            First
                          </Badge>
                        : null}
                        <span className='type-meta'>
                          {item.hotspotCount}{' '}
                          {item.hotspotCount === 1 ? 'pin' : 'pins'}
                        </span>
                      </span>
                    </span>
                  </button>
                  {/* Inline, and on every row: a menu that appeared under the
                      selected scene grew that row and shifted the list. Centered
                      on the row, so badges that wrap to a second line do not
                      leave the trigger hanging high. */}
                  {canEdit ?
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type='button'
                          size='icon-sm'
                          variant='ghost'
                          className='self-center'
                          aria-label={`Actions for ${item.title}`}
                          disabled={busy}
                        >
                          <MoreHorizontal aria-hidden='true' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Scene actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          disabled={index === 0}
                          onSelect={() => void moveScene(index, -1)}
                        >
                          <ArrowUp aria-hidden='true' />
                          Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === scenes.length - 1}
                          onSelect={() => void moveScene(index, 1)}
                        >
                          <ArrowDown aria-hidden='true' />
                          Move down
                        </DropdownMenuItem>
                        <SceneDuplicateMenu
                          disabled={busy}
                          onDuplicate={(options) =>
                            void duplicateScene(item.id, options)
                          }
                        />
                        <DropdownMenuSeparator />
                        <ConfirmDeleteDialog
                          title={`Delete “${item.title}”?`}
                          description='This scene and its hotspots will be permanently deleted. This action cannot be undone.'
                          disabled={busy || item.isFirstScene}
                          onConfirm={() =>
                            void deleteScene(item.id, item.isFirstScene)
                          }
                          trigger={
                            <DropdownMenuItem
                              variant='destructive'
                              disabled={item.isFirstScene}
                              onSelect={(event) => event.preventDefault()}
                            >
                              <Trash2 aria-hidden='true' />
                              Delete
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  : null}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );

  const inspector = (
    <Card size='sm' className='flex h-full min-h-0 flex-col'>
      {/* Save status lives once, in the editor toolbar above all three panes. */}
      <CardHeader className={EDITOR_HEADER_CLASS}>
        <CardTitle className='truncate'>{scene.title}</CardTitle>
      </CardHeader>
      {/* Form rhythm without a second frame: the column is already a card, so
          the field tokens stay and the box the recipe would draw comes off. */}
      <CardContent className='admin-form min-h-0 flex-1 overflow-y-auto rounded-none border-0 bg-transparent py-0 [--admin-form-gap:var(--card-spacing)]'>
        <InspectorSection icon={Camera} title='Start view'>
          <FormDescription>
            {SCENE_FORM_COPY.applyDefaultViewDescription}
          </FormDescription>
          <HotspotPositionFields
            idPrefix='visual-default-view'
            position={liveView ?? scene.defaultView}
            readOnly
          />
          <FormHint>{SCENE_FORM_COPY.applyDefaultViewHint}</FormHint>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='w-fit'
            disabled={
              !canEdit || busy || (liveView ?? scene.defaultView).length === 0
            }
            onClick={() => void handleDefaultViewSave()}
          >
            <Camera aria-hidden='true' />
            Set as start view
          </Button>
        </InspectorSection>

        {canEdit ?
          <InspectorSection
            icon={Layers3}
            title={SCENE_FORM_COPY.replacePanorama}
            titleFor='visual-replace-panorama'
          >
            <FileInput
              id='visual-replace-panorama'
              accept='image/*'
              file={replacePanoramaFile}
              onFileChange={setReplacePanoramaFile}
              aspect='video'
            />
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='w-fit'
              disabled={!replacePanoramaFile || busy}
              onClick={() => void handlePanoramaReplace()}
            >
              Upload panorama
            </Button>
          </InspectorSection>
        : null}

        <InspectorSection
          icon={MapPin}
          title={hotspotSection.title}
          count={scene.hotspotCount}
          action={
            canEdit ?
              <CreateSheet
                title={hotspotSection.addButtonLabel}
                description='Click the preview to set the pin, then fill the fields.'
                triggerLabel={hotspotSection.addButtonLabel}
                open={createHotspotOpen}
                onOpenChange={(open) => {
                  if (!open && hotspotCreateDirty) {
                    if (!window.confirm('Discard the new hotspot draft?')) {
                      return;
                    }
                  }
                  setCreateHotspotOpen(open);
                  if (open) setSelectedHotspotId(null);
                }}
              >
                <form className='admin-form' onSubmit={handleHotspotCreate}>
                  <CollapsibleFormSection
                    title={HOTSPOT_FORM_COPY.targetSection}
                    icon={Settings2}
                    description={HOTSPOT_FORM_COPY.targetSectionDescription}
                    defaultOpen
                  >
                    <div className='grid gap-2'>
                      <Label htmlFor='visual-hotspot-kind'>Type</Label>
                      <InputGroup icon={Shapes}>
                        <Select
                          value={hotspotKind}
                          onValueChange={(value) =>
                            setHotspotKind(
                              value as AuthoringHotspotCreate['kind'],
                            )
                          }
                        >
                          <SelectTrigger id='visual-hotspot-kind'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='nav'>Navigation</SelectItem>
                            <SelectItem value='info'>Information</SelectItem>
                            <SelectItem value='naming'>
                              Naming placement
                            </SelectItem>
                            <SelectItem value='place-overview'>
                              Place overview
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </InputGroup>
                    </div>
                    {hotspotKind === 'nav' || hotspotKind === 'info' ?
                      <div className='grid gap-2'>
                        <Label htmlFor='visual-hotspot-name'>
                          {hotspotKind === 'nav' ? 'Label' : 'Title'}
                        </Label>
                        <InputGroup icon={Type}>
                          <Input
                            id='visual-hotspot-name'
                            value={hotspotName}
                            onChange={(event) =>
                              setHotspotName(event.target.value)
                            }
                            required={hotspotKind === 'info'}
                          />
                        </InputGroup>
                      </div>
                    : null}
                    {hotspotKind === 'nav' ?
                      <div className='grid gap-2'>
                        <Label>Target scene</Label>
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
                    {hotspotKind === 'info' ?
                      <div className='grid gap-2'>
                        <Label htmlFor='visual-hotspot-body'>Body</Label>
                        <Textarea
                          id='visual-hotspot-body'
                          value={hotspotBody}
                          onChange={(event) =>
                            setHotspotBody(event.target.value)
                          }
                        />
                      </div>
                    : null}
                  </CollapsibleFormSection>
                  <CollapsibleFormSection
                    title={HOTSPOT_FORM_COPY.placementSection}
                    icon={MapPin}
                    description={HOTSPOT_FORM_COPY.placementSectionDescription}
                    defaultOpen
                  >
                    <HotspotPositionFields
                      idPrefix='visual-new-hotspot'
                      position={hotspotPosition}
                      readOnly
                    />
                    <FormHint>
                      Click the panorama to set yaw / pitch before creating.
                    </FormHint>
                  </CollapsibleFormSection>
                  <StickyFormActions>
                    <FormCancelButton
                      disabled={busy}
                      onReset={() => {
                        setHotspotKind('nav');
                        setHotspotName('');
                        setHotspotTarget('');
                        setHotspotNamingId('');
                        setHotspotBody('');
                        setHotspotPosition(DEFAULT_PANORAMA_POSITION);
                        setCreateHotspotOpen(false);
                      }}
                    />
                    <Button
                      type='submit'
                      size='sm'
                      disabled={
                        busy ||
                        (hotspotKind === 'nav' && !hotspotTarget) ||
                        (hotspotKind === 'naming' && !hotspotNamingId) ||
                        hotspotPosition.length === 0
                      }
                    >
                      <Plus aria-hidden='true' />
                      {hotspotSection.addButtonLabel}
                    </Button>
                  </StickyFormActions>
                </form>
              </CreateSheet>
            : null
          }
        >
          {scene.hotspots.length === 0 ?
            <p className='type-body text-muted-foreground'>
              {hotspotSection.emptyMessage}
            </p>
          : /* Rows sit inside a card that already frames them, so they carry a
               tint instead of a border of their own. */
            <ul className='grid gap-0.5'>
              {scene.hotspots.map((hotspot) => {
                const active = hotspot.id === selectedHotspotId;
                const name =
                  hotspot.label ||
                  hotspot.namingId ||
                  hotspot.title ||
                  hotspot.id;
                return (
                  <li key={hotspot.id}>
                    <button
                      type='button'
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                        active ? 'bg-primary/10' : 'hover:bg-muted/50',
                      )}
                      onClick={() => {
                        setCreateHotspotOpen(false);
                        setSelectedHotspotId(hotspot.id);
                        setMobilePane('inspector');
                      }}
                    >
                      <span className='min-w-0 flex-1 truncate font-medium'>
                        {name}
                      </span>
                      <HotspotTypeBadge
                        type={hotspot.type}
                        namingId={hotspot.namingId}
                        className='shrink-0'
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          }
        </InspectorSection>

        {selectedHotspot && !createHotspotOpen ?
          <SelectedHotspotInspector
            key={selectedHotspot.id}
            busy={busy}
            canEdit={canEdit}
            dirtyRef={hotspotEditDirtyRef}
            hotspot={selectedHotspot}
            namings={namings}
            onBusyChange={setBusy}
            onDeleted={() => setSelectedHotspotId(null)}
            onSaved={() => setSaveStatus('saved')}
            sceneId={scene.id}
            scenes={scenes}
            tourId={tourId}
          />
        : null}
      </CardContent>
    </Card>
  );

  const viewer = (
    <TourPreviewPanel
      compact
      sceneId={scene.id}
      title={scene.title}
      tourId={tourId}
      viewerType='panorama'
      previewRoute={previewRoute}
      sceneNav='live'
    />
  );

  const editorColumns = [
    ...(openPanes.scenes ? [EDITOR_COLUMN.scenes] : []),
    EDITOR_COLUMN.viewer,
    ...(openPanes.inspector ? [EDITOR_COLUMN.inspector] : []),
  ].join(' ');

  function togglePane(pane: 'scenes' | 'inspector') {
    setOpenPanes((current) => ({ ...current, [pane]: !current[pane] }));
  }

  return (
    <div className='grid gap-4'>
      {/* One toolbar for the whole editor: which panes are open, what a click on
          the panorama will do, and whether the last write landed. */}
      <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        <div
          className='flex gap-1 rounded-lg border bg-muted/40 p-1 xl:hidden'
          role='tablist'
          aria-label='Editor panes'
        >
          {EDITOR_PANE_IDS.map((id) => {
            const pane = EDITOR_PANES[id];
            const Icon = pane.tabIcon;
            const active = mobilePane === id;
            return (
              <button
                key={id}
                type='button'
                role='tab'
                aria-selected={active}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                  active ?
                    'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                )}
                onClick={() => setMobilePane(id)}
              >
                <Icon aria-hidden='true' className='size-3.5' />
                {pane.label}
              </button>
            );
          })}
        </div>
        <div className='hidden gap-1 rounded-lg border bg-muted/40 p-1 xl:flex'>
          <PaneFoldToggle
            icon={EDITOR_PANES.scenes.foldIcon}
            label={EDITOR_PANES.scenes.label}
            open={openPanes.scenes}
            onToggle={() => togglePane('scenes')}
          />
          <PaneFoldToggle
            icon={EDITOR_PANES.inspector.foldIcon}
            label={EDITOR_PANES.inspector.label}
            open={openPanes.inspector}
            onToggle={() => togglePane('inspector')}
          />
        </div>
        <p className='min-w-0 flex-1 text-sm text-muted-foreground'>
          {modeHint}
        </p>
        <SaveStatusBadge status={saveStatus} />
      </div>

      {/* The row is pinned to the stage, not sized by what is in it: an auto row
          would measure the scene list and grow past the stage height, and a
          column that is taller than its scroll box never scrolls. */}
      <div
        className='grid h-(--editor-stage) grid-rows-[minmax(0,1fr)] gap-4 xl:grid-cols-(--editor-columns)'
        style={
          {
            '--editor-columns': editorColumns,
            '--editor-stage': EDITOR_STAGE_HEIGHT,
          } as CSSProperties
        }
      >
        {/* Folded panes stay mounted and only lose their box: the inspector is
            what listens for panorama clicks while a hotspot is selected. */}
        <div
          className={cn(
            mobilePane === 'scenes' ? 'block' : 'hidden',
            'min-h-0',
            openPanes.scenes ? 'xl:block' : 'xl:hidden',
          )}
        >
          {sceneRail}
        </div>
        <div
          className={cn(
            mobilePane === 'viewer' ? 'block' : 'hidden',
            'min-h-0 xl:block',
          )}
        >
          {viewer}
        </div>
        <div
          className={cn(
            mobilePane === 'inspector' ? 'block' : 'hidden',
            'min-h-0',
            openPanes.inspector ? 'xl:block' : 'xl:hidden',
          )}
        >
          {inspector}
        </div>
      </div>
    </div>
  );
}
