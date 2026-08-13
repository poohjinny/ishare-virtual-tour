import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from 'react';
import {
  AUTHORING_SCENE_AUDIENCE,
  catalogVisibilityManageBadgeLabel,
  catalogVisibilityShowsManageBadge,
  resolveSceneVisibility,
} from '../../utils/sceneVisibility';
import {
  DEV_SCENE_VISIBILITY_OPTIONS,
  type DevCatalogTourVisibility,
} from '../../constants/devPanel';
import type { Scene, Tour, ViewPosition } from '../../types/tour';
import {
  DEV_SCENE_TITLE_STORAGE_KEY,
  formatViewPosition,
  toViewPosition,
  type DevSceneRef,
} from '../../utils/devHotspotLogger';
import {
  allocateOpaqueId,
  createOpaqueId,
  OPAQUE_SCENE_ID_PREFIX,
} from '../../utils/opaqueId';
import {
  DevTourApiError,
  devCreateScene,
  devDeleteScene,
  devDuplicateScene,
  devUpdateScene,
  devUpdateSceneOrder,
  type DevTourMutateOptions,
} from '../../utils/devTourApi';
import {
  moveGroupBlockToIndex,
  moveSceneAmongPeersToIndex,
  resolveTourSceneOrder,
  sortSceneGroupsByTourOrder,
} from '../../utils/sceneOrder';
import {
  buildDefaultPanoramaRelativePath,
  buildDefaultPanoramaWebPath,
  buildDefaultSceneThumbnailRelativePath,
  buildDefaultSceneThumbnailWebPath,
} from '../../utils/devScenePanoramaPath';
import { isDefaultSceneDescription } from '../../utils/sceneDescriptionPlaceholder';
import { buildScenePlaceLeadFromNaming } from '../../utils/resolveScenePlaceLead';
import { TOUR_DIRECTORY_GROUP_OTHER } from '../../constants/tourDirectory';
import {
  buildSceneGroups,
  buildSceneGroupSecondaryById,
  buildSceneParentMap,
  SCENE_GROUP_OTHER_ID,
} from '../../viewer-shared/sceneDepth';
import { cn } from '../../lib/cn';
import {
  devViewPanelActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelIconBtnVariants,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelInputClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelFormCheckboxFieldClassName,
  devViewPanelToggleInputClassName,
  devViewPanelToggleLabelClassName,
  devViewPanelToggleLabelMultilineClassName,
  devViewPanelToggleListClassName,
  devViewPanelToggleNameClassName,
  devViewPanelToggleHintClassName,
  devViewPanelToggleTextClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemReorderRowClassName,
  devViewPanelManageListItemBodyClassName,
  devViewPanelManageListItemContentClassName,
  devViewPanelManageListItemIconActionsClassName,
  devViewPanelReorderDropTargetClassName,
  devViewPanelManageListItemDescClassName,
  devViewPanelManageListItemDescBulletItemClassName,
  devViewPanelManageListItemDescBulletListClassName,
  devViewPanelManageListItemDescStackClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemTitleClassName,
  formatManageListItemId,
  devViewPanelManageListItemMetaClassName,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemSceneBadgesClassName,
  devViewPanelManageListItemMainRowClassName,
  devViewPanelManageListItemBulletClassName,
} from './devViewPanelVariants';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import { DevPanelReorderHandle } from './DevPanelReorderHandle';
import { DevPanelDescriptionTextarea } from './DevPanelDescriptionTextarea';
import { DevPanelFileField } from './DevPanelFileField';
import { DevPanelFileInput } from './DevPanelFileInput';
import { DevPanoramaFilePreview } from './DevPanoramaFilePreview';
import { DevPanelFormGroup } from './DevPanelFormGroup';
import { Badge } from '../ui/Badge';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import {
  type ActionStatus,
  confirmDevPanelDelete,
  countBfsDescendantScenes,
  readSessionValue,
  resolveModel3dSceneCreatePayload,
  writeSessionValue,
} from './devViewPanelHelpers';


type DevScenesListPanelProps = {
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  scene: DevSceneRef;
  view: ViewPosition | null;
  captureSceneThumbnail?: () => Promise<Blob | null>;
  getCurrentView?: () => ViewPosition | null;
  isModel3dTour: boolean;
  onRequestSceneTab?: () => void;
};

export function DevScenesListPanel({
  tour,
  onTourMutated,
  scene,
  view,
  captureSceneThumbnail,
  getCurrentView,
  isModel3dTour,
  onRequestSceneTab,
}: DevScenesListPanelProps) {
  const [sceneStatus, setSceneStatus] = useState<ActionStatus>('idle');
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneTitle, setEditSceneTitle] = useState('');
  const [editSceneDescription, setEditSceneDescription] = useState('');
  const [editScenePreviewVideoUrl, setEditScenePreviewVideoUrl] = useState('');
  const [editSceneVideoUrl, setEditSceneVideoUrl] = useState('');
  const [editSceneVisibility, setEditSceneVisibility] =
    useState<DevCatalogTourVisibility>('public');
  const [editSceneAsFirst, setEditSceneAsFirst] = useState(false);
  const [duplicatingSceneId, setDuplicatingSceneId] = useState<string | null>(
    null,
  );
  const [duplicateCloneNamings, setDuplicateCloneNamings] = useState(true);
  const [duplicateIncludeChildren, setDuplicateIncludeChildren] =
    useState(true);
  const [duplicateLinkUnderParent, setDuplicateLinkUnderParent] =
    useState(true);
  const [sceneManageStatus, setSceneManageStatus] =
    useState<ActionStatus>('idle');
  const [sceneManageError, setSceneManageError] = useState<string | null>(null);
  const [sceneOrderDrag, setSceneOrderDrag] = useState<
    | null
    | { kind: 'group'; groupId: string }
    | { kind: 'scene'; sceneId: string; peerKey: string }
  >(null);
  const [sceneOrderDropTarget, setSceneOrderDropTarget] = useState<
    | null
    | { kind: 'group'; groupId: string }
    | { kind: 'scene'; sceneId: string; peerKey: string }
  >(null);
  const [sceneTitle, setSceneTitle] = useState(() =>
    readSessionValue(DEV_SCENE_TITLE_STORAGE_KEY),
  );
  const [scenePanoramaFile, setScenePanoramaFile] = useState<File | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [sceneCreatePlaceOverview, setSceneCreatePlaceOverview] =
    useState(false);
  const [scenePreviewVideoUrl, setScenePreviewVideoUrl] = useState('');
  const [sceneVideoUrl, setSceneVideoUrl] = useState('');
  const [sceneAddCloseKey, setSceneAddCloseKey] = useState(0);
  const [pendingSceneId, setPendingSceneId] = useState(() =>
    createOpaqueId(OPAQUE_SCENE_ID_PREFIX),
  );

  const tourScenes = useMemo(() => {
    const byId = tour.scenes;
    return resolveTourSceneOrder(tour)
      .map((id) => byId[id])
      .filter((entry): entry is Scene => Boolean(entry));
  }, [tour]);

  /** Dev Manage secondary — floor / department title only (not scene id). */
  const sceneManageSecondaryById = useMemo(
    () =>
      buildSceneGroupSecondaryById(
        tour,
        tour.scenes,
        tour.firstScene,
        TOUR_DIRECTORY_GROUP_OTHER,
        AUTHORING_SCENE_AUDIENCE,
      ),
    [tour],
  );
  const sceneManageGroups = useMemo(
    () =>
      sortSceneGroupsByTourOrder(
        tour,
        buildSceneGroups(
          tour,
          tour.scenes,
          tour.firstScene,
          TOUR_DIRECTORY_GROUP_OTHER,
          AUTHORING_SCENE_AUDIENCE,
        ),
      ),
    [tour],
  );
  const sceneManageGroupingActive = sceneManageGroups.some(
    (group) => group.id !== SCENE_GROUP_OTHER_ID,
  );
  const firstManageScene = tour.scenes[tour.firstScene] ?? null;

  const persistTourSceneOrder = useCallback(
    async (next: string[]) => {
      if (!scene.tourId) return;
      setSceneManageStatus('working');
      setSceneManageError(null);
      try {
        await devUpdateSceneOrder({ tourId: scene.tourId, sceneOrder: next });
        await onTourMutated?.();
        setSceneManageStatus('done');
      } catch (error) {
        setSceneManageStatus('error');
        setSceneManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not reorder scenes',
        );
      }
    },
    [onTourMutated, scene.tourId],
  );

  const relocateTourSceneAmongPeers = useCallback(
    async (
      sceneId: string,
      peerIds: readonly string[],
      toPeerIndex: number,
    ) => {
      const next = moveSceneAmongPeersToIndex(
        resolveTourSceneOrder(tour),
        sceneId,
        peerIds,
        toPeerIndex,
      );
      if (!next) return;
      await persistTourSceneOrder(next);
    },
    [persistTourSceneOrder, tour],
  );

  const relocateTourSceneGroup = useCallback(
    async (groupId: string, toIndex: number) => {
      const fromIndex = sceneManageGroups.findIndex(
        (group) => group.id === groupId,
      );
      if (fromIndex < 0) return;
      const next = moveGroupBlockToIndex(
        resolveTourSceneOrder(tour),
        sceneManageGroups.map((group) => group.scenes.map((entry) => entry.id)),
        fromIndex,
        toIndex,
      );
      if (!next) return;
      await persistTourSceneOrder(next);
    },
    [persistTourSceneOrder, sceneManageGroups, tour],
  );

  const clearSceneOrderDrag = useCallback(() => {
    setSceneOrderDrag(null);
    setSceneOrderDropTarget(null);
  }, []);

  const readSceneOrderDragPayload = (
    event: DragEvent,
  ):
    | { kind: 'group'; groupId: string }
    | { kind: 'scene'; sceneId: string; peerKey: string }
    | null => {
    const raw = event.dataTransfer.getData('text/plain');
    if (!raw) return sceneOrderDrag;
    try {
      const parsed = JSON.parse(raw) as {
        kind?: string;
        groupId?: string;
        sceneId?: string;
        peerKey?: string;
      };
      if (parsed.kind === 'group' && typeof parsed.groupId === 'string') {
        return { kind: 'group', groupId: parsed.groupId };
      }
      if (
        parsed.kind === 'scene' &&
        typeof parsed.sceneId === 'string' &&
        typeof parsed.peerKey === 'string'
      ) {
        return {
          kind: 'scene',
          sceneId: parsed.sceneId,
          peerKey: parsed.peerKey,
        };
      }
    } catch {
      /* ignore malformed payloads */
    }
    return sceneOrderDrag;
  };

  const trimmedSceneTitle = sceneTitle.trim();
  const sceneSlug = pendingSceneId;
  const canCreateScene = Boolean(
    scene.tourId &&
    trimmedSceneTitle &&
    (isModel3dTour ? view : scenePanoramaFile),
  );
  const scenePanoramaAutoPath =
    sceneSlug ?
      isModel3dTour ?
        buildDefaultSceneThumbnailWebPath(
          tour.clientId ?? tour.id,
          tour.id,
          sceneSlug,
        )
      : buildDefaultPanoramaWebPath(
          tour.clientId ?? tour.id,
          tour.id,
          sceneSlug,
        )
    : '';


  const mintCreateSceneId = useCallback(() => {
    setPendingSceneId(
      allocateOpaqueId(OPAQUE_SCENE_ID_PREFIX, Object.keys(tour.scenes)),
    );
  }, [tour.scenes]);

  useEffect(() => {
    writeSessionValue(DEV_SCENE_TITLE_STORAGE_KEY, sceneTitle);
  }, [sceneTitle]);

  const createScene = useCallback(async () => {
    if (!scene.tourId || !trimmedSceneTitle) return;
    if (!isModel3dTour && !scenePanoramaFile) return;

    setSceneStatus('working');
    setSceneError(null);

    try {
      const model3dPayload =
        isModel3dTour ?
          await resolveModel3dSceneCreatePayload({
            getCurrentView,
            view,
            captureSceneThumbnail,
            fallbackThumbnailFile: scenePanoramaFile,
            sceneIdForFile: pendingSceneId,
          })
        : null;

      const result = await devCreateScene({
        tourId: scene.tourId,
        title: trimmedSceneTitle,
        sceneId: pendingSceneId,
        ...(isModel3dTour ?
          {
            thumbnailFile: model3dPayload?.thumbnailFile,
            defaultView: model3dPayload?.defaultView,
          }
        : {
            panoramaFile: scenePanoramaFile!,
            defaultView:
              view ?
                toViewPosition(view.yaw, view.pitch, view.zoom ?? 0)
              : undefined,
          }),
        description: sceneDescription.trim() || undefined,
        ...(!isModel3dTour ?
          {
            previewVideoUrl: scenePreviewVideoUrl.trim() || undefined,
            videoUrl: sceneVideoUrl.trim() || undefined,
            createPlaceOverview: sceneCreatePlaceOverview,
          }
        : {}),
      });
      setSceneTitle('');
      setSceneDescription('');
      setSceneCreatePlaceOverview(false);
      setScenePreviewVideoUrl('');
      setSceneVideoUrl('');
      setScenePanoramaFile(null);
      mintCreateSceneId();
      setSceneStatus('done');
      await onTourMutated?.({ navigateToScene: result.scene.id });
      onRequestSceneTab?.();
    } catch (error) {
      setSceneStatus('error');
      setSceneError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create scene',
      );
    }
  }, [
    captureSceneThumbnail,
    getCurrentView,
    isModel3dTour,
    mintCreateSceneId,
    onRequestSceneTab,
    onTourMutated,
    pendingSceneId,
    resolveModel3dSceneCreatePayload,
    scene.tourId,
    sceneCreatePlaceOverview,
    sceneDescription,
    scenePreviewVideoUrl,
    sceneVideoUrl,
    scenePanoramaFile,
    trimmedSceneTitle,
    view,
  ]);

  const deleteTourScene = useCallback(
    async (sceneId: string) => {
      if (!scene.tourId || sceneId === tour.firstScene) return;

      const sceneEntry = tour.scenes[sceneId];
      const title = sceneEntry?.title ?? sceneId;
      if (
        !confirmDevPanelDelete(
          `Delete scene “${title}” (${sceneId}) and all hotspots on it?`,
        )
      ) {
        return;
      }

      setSceneManageStatus('working');
      setSceneManageError(null);

      try {
        const parentSceneId = buildSceneParentMap(
          tour.firstScene,
          tour.scenes,
          tour.hotspots,
        ).get(sceneId);
        const deleteFallbackSceneId =
          parentSceneId && tour.scenes[parentSceneId] ?
            parentSceneId
          : tour.firstScene;

        await devDeleteScene({ tourId: scene.tourId, sceneId });
        if (editingSceneId === sceneId) {
          setEditingSceneId(null);
        }
        if (duplicatingSceneId === sceneId) {
          setDuplicatingSceneId(null);
        }
        await onTourMutated?.(
          sceneId === scene.id ?
            { navigateToScene: deleteFallbackSceneId }
          : undefined,
        );
        setSceneManageStatus('done');
      } catch (error) {
        setSceneManageStatus('error');
        setSceneManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not delete scene',
        );
      }
    },
    [
      duplicatingSceneId,
      editingSceneId,
      onTourMutated,
      scene.id,
      scene.tourId,
      tour.firstScene,
      tour.hotspots,
      tour.scenes,
    ],
  );

  const openTourScene = useCallback(
    async (sceneId: string) => {
      await onTourMutated?.({ navigateToScene: sceneId });
    },
    [onTourMutated],
  );

  const startEditScene = useCallback(
    (entry: Scene) => {
      setDuplicatingSceneId(null);
      setEditingSceneId(entry.id);
      setEditSceneTitle(entry.title);
      setEditSceneDescription(entry.description ?? '');
      setEditScenePreviewVideoUrl(entry.previewVideoUrl ?? '');
      setEditSceneVideoUrl(entry.videoUrl ?? '');
      setEditSceneVisibility(resolveSceneVisibility(entry));
      setEditSceneAsFirst(entry.id === tour.firstScene);
    },
    [tour.firstScene],
  );

  const startDuplicateScene = useCallback((entry: Scene) => {
    setEditingSceneId(null);
    setDuplicatingSceneId(entry.id);
    setDuplicateCloneNamings(true);
    setDuplicateIncludeChildren(true);
    setDuplicateLinkUnderParent(true);
    setSceneManageError(null);
  }, []);

  const duplicateTourScene = useCallback(async () => {
    if (!scene.tourId || !duplicatingSceneId) return;

    const sceneEntry = tour.scenes[duplicatingSceneId];
    if (!sceneEntry) return;

    setSceneManageStatus('working');
    setSceneManageError(null);

    try {
      const result = await devDuplicateScene({
        tourId: scene.tourId,
        sceneId: duplicatingSceneId,
        namingMode: duplicateCloneNamings ? 'duplicate' : 'keep',
        includeChildren: duplicateIncludeChildren,
        linkUnderSameParent: duplicateLinkUnderParent,
      });
      setDuplicatingSceneId(null);
      await onTourMutated?.({ navigateToScene: result.scene.id });
      startEditScene(result.scene);
      setSceneManageStatus('done');
    } catch (error) {
      setSceneManageStatus('error');
      setSceneManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not duplicate scene',
      );
    }
  }, [
    duplicateCloneNamings,
    duplicateIncludeChildren,
    duplicateLinkUnderParent,
    duplicatingSceneId,
    onTourMutated,
    scene.tourId,
    startEditScene,
    tour.scenes,
  ]);

  const saveSceneEdit = useCallback(async () => {
    if (!scene.tourId || !editingSceneId) return;

    const isAlreadyFirst = editingSceneId === tour.firstScene;

    setSceneManageStatus('working');
    setSceneManageError(null);

    try {
      await devUpdateScene({
        tourId: scene.tourId,
        sceneId: editingSceneId,
        title: editSceneTitle.trim() || undefined,
        description: editSceneDescription,
        visibility:
          isAlreadyFirst || editSceneAsFirst ? 'public' : editSceneVisibility,
        ...(!isModel3dTour ?
          {
            previewVideoUrl: editScenePreviewVideoUrl,
            videoUrl: editSceneVideoUrl,
          }
        : {}),
        setAsFirstScene: editSceneAsFirst && !isAlreadyFirst,
      });
      setEditingSceneId(null);
      await onTourMutated?.();
      setSceneManageStatus('done');
    } catch (error) {
      setSceneManageStatus('error');
      setSceneManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save scene',
      );
    }
  }, [
    editSceneAsFirst,
    editSceneDescription,
    editScenePreviewVideoUrl,
    editSceneVideoUrl,
    editSceneTitle,
    editSceneVisibility,
    editingSceneId,
    isModel3dTour,
    onTourMutated,
    scene.tourId,
    tour.firstScene,
  ]);

  useEffect(() => {
    if (sceneStatus === 'idle' && sceneManageStatus === 'idle') return;
    const t = window.setTimeout(() => {
      if (sceneStatus !== 'working') {
        setSceneStatus('idle');
        setSceneError(null);
      }
      if (sceneManageStatus !== 'working') {
        setSceneManageStatus('idle');
        setSceneManageError(null);
      }
    }, 2500);
    return () => window.clearTimeout(t);
  }, [sceneManageStatus, sceneStatus]);


  const renderSceneManageItem = (
    entry: Scene,
    options: {
      peerIds: readonly string[];
      /** Stable key for this peer list (group id or flat). */
      peerKey: string;
      allowReorder: boolean;
      showGroupSecondary?: boolean;
    },
  ) => {
    const { peerIds, peerKey, allowReorder } = options;
    const showGroupSecondary = options.showGroupSecondary !== false;
    const isCurrent = entry.id === scene.id;
    const isFirst = entry.id === tour.firstScene;
    const isEditing = editingSceneId === entry.id;
    const isDuplicating = duplicatingSceneId === entry.id;
    const showReorder = allowReorder && !isEditing && !isDuplicating;
    const canDelete = entry.id !== tour.firstScene;
    const groupSecondary = sceneManageSecondaryById[entry.id];
    const sceneVisibility = resolveSceneVisibility(entry);
    const peerIndex = peerIds.indexOf(entry.id);
    const childPlaceCount = countBfsDescendantScenes(
      tour.firstScene,
      tour.scenes,
      entry.id,
      tour.hotspots,
    );
    const parentSceneId = buildSceneParentMap(
      tour.firstScene,
      tour.scenes,
      tour.hotspots,
    ).get(entry.id);
    const parentSceneTitle =
      parentSceneId ? tour.scenes[parentSceneId]?.title?.trim() : '';
    const canLinkUnderParent = Boolean(parentSceneId);
    const isSceneDropTarget =
      sceneOrderDropTarget?.kind === 'scene' &&
      sceneOrderDropTarget.sceneId === entry.id &&
      sceneOrderDropTarget.peerKey === peerKey;
    const isSceneDragging =
      sceneOrderDrag?.kind === 'scene' &&
      sceneOrderDrag.sceneId === entry.id &&
      sceneOrderDrag.peerKey === peerKey;
    return (
      <li
        key={entry.id}
        className={cn(
          showReorder ?
            devViewPanelManageListItemReorderRowClassName
          : devViewPanelManageListItemClassName,
          (isEditing || isDuplicating || isCurrent) &&
            devViewPanelManageListItemActiveClassName,
          isSceneDropTarget && devViewPanelReorderDropTargetClassName,
          isSceneDragging && 'opacity-55',
        )}
        onDragOver={
          showReorder ?
            (event) => {
              const payload = readSceneOrderDragPayload(event);
              if (
                !payload ||
                payload.kind !== 'scene' ||
                payload.peerKey !== peerKey
              ) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = 'move';
              setSceneOrderDropTarget({
                kind: 'scene',
                sceneId: entry.id,
                peerKey,
              });
            }
          : undefined
        }
        onDrop={
          showReorder ?
            (event) => {
              event.preventDefault();
              event.stopPropagation();
              const payload = readSceneOrderDragPayload(event);
              clearSceneOrderDrag();
              if (
                !payload ||
                payload.kind !== 'scene' ||
                payload.peerKey !== peerKey ||
                payload.sceneId === entry.id
              ) {
                return;
              }
              void relocateTourSceneAmongPeers(
                payload.sceneId,
                peerIds,
                peerIndex,
              );
            }
          : undefined
        }
      >
        {showReorder ?
          <DevPanelReorderHandle
            disabled={sceneManageStatus === 'working'}
            label={`Reorder ${entry.title}`}
            onDragStart={(event) => {
              const payload = {
                kind: 'scene' as const,
                sceneId: entry.id,
                peerKey,
              };
              event.dataTransfer.setData('text/plain', JSON.stringify(payload));
              event.dataTransfer.effectAllowed = 'move';
              setSceneOrderDrag(payload);
            }}
            onDragEnd={clearSceneOrderDrag}
          />
        : null}
        <div className={devViewPanelManageListItemBodyClassName}>
          <div className={devViewPanelManageListItemMainRowClassName}>
            <div className={devViewPanelManageListItemContentClassName}>
              <div
                className={cn(
                  devViewPanelManageListItemHeadMainClassName,
                  'flex-nowrap',
                )}
              >
                <span
                  className={cn(
                    devViewPanelManageListItemTitleClassName,
                    'truncate',
                  )}
                >
                  {entry.title}
                </span>
                {showGroupSecondary && groupSecondary ?
                  <>
                    <span
                      className={devViewPanelManageListItemBulletClassName}
                      aria-hidden='true'
                    >
                      ·
                    </span>
                    <span className={devViewPanelManageListItemMetaClassName}>
                      {groupSecondary}
                    </span>
                  </>
                : null}
              </div>
              {catalogVisibilityShowsManageBadge(sceneVisibility) || isFirst ?
                <div className={devViewPanelManageListItemSceneBadgesClassName}>
                  {catalogVisibilityShowsManageBadge(sceneVisibility) ?
                    <Badge
                      variant='fill'
                      size='sm'
                      tone='none'
                      className={devSceneManageBadgeVariants({
                        kind: sceneVisibility,
                      })}
                    >
                      {catalogVisibilityManageBadgeLabel(sceneVisibility)}
                    </Badge>
                  : null}
                  {isFirst ?
                    <Badge
                      variant='fill'
                      size='sm'
                      tone='none'
                      className={devSceneManageBadgeVariants({ kind: 'first' })}
                    >
                      First
                    </Badge>
                  : null}
                </div>
              : null}
            </div>
            <div className={devViewPanelManageListItemIconActionsClassName}>
              <button
                type='button'
                className={devViewPanelIconBtnVariants({ tone: 'secondary' })}
                onClick={() => void openTourScene(entry.id)}
                disabled={sceneManageStatus === 'working'}
                aria-label={`Open ${entry.title}`}
                title='Open'
              >
                <MaterialSymbol
                  name='visibility'
                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </button>
              <button
                type='button'
                className={devViewPanelIconBtnVariants({ tone: 'secondary' })}
                onClick={() => startEditScene(entry)}
                disabled={
                  sceneManageStatus === 'working' || isEditing || isDuplicating
                }
                aria-label={`Edit ${entry.title}`}
                title='Edit'
              >
                <MaterialSymbol
                  name='edit'
                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </button>
              <button
                type='button'
                className={devViewPanelIconBtnVariants({ tone: 'secondary' })}
                onClick={() => startDuplicateScene(entry)}
                disabled={
                  sceneManageStatus === 'working' || isEditing || isDuplicating
                }
                aria-label={`Duplicate ${entry.title}`}
                title='Duplicate'
              >
                <MaterialSymbol
                  name='control_point_duplicate'
                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </button>
              <button
                type='button'
                className={devViewPanelIconBtnVariants({ tone: 'danger' })}
                onClick={() => void deleteTourScene(entry.id)}
                disabled={!canDelete || sceneManageStatus === 'working'}
                aria-label={`Delete ${entry.title}`}
                title='Delete'
              >
                <MaterialSymbol
                  name='delete'
                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </button>
            </div>
          </div>
          <div className={devViewPanelManageListItemDescStackClassName}>
            <ul className={devViewPanelManageListItemDescBulletListClassName}>
              <li
                className={devViewPanelManageListItemDescBulletItemClassName}
                title={entry.id}
              >
                {formatManageListItemId('scene', entry.id)}
              </li>
            </ul>
            {(() => {
              const hasRealDescription =
                Boolean(entry.description) &&
                !isDefaultSceneDescription(
                  entry.description!,
                  tour.title,
                  entry.title,
                );
              if (hasRealDescription) {
                return (
                  <p className='m-0 line-clamp-2' title={entry.description}>
                    {entry.description}
                  </p>
                );
              }
              const lead = buildScenePlaceLeadFromNaming(tour, entry);
              if (lead) {
                return (
                  <p className='m-0 line-clamp-2' title={lead}>
                    From NO · {lead}
                  </p>
                );
              }
              return <p className='m-0'>No description</p>;
            })()}
          </div>

          {isEditing ?
            <DevPanelFormGroup inline manageEdit>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>Title</span>
                <input
                  className={devViewPanelInputClassName}
                  type='text'
                  value={editSceneTitle}
                  onChange={(e) => setEditSceneTitle(e.target.value)}
                />
              </label>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Visibility
                </span>
                <select
                  className={devViewPanelSelectClassName}
                  value={
                    isFirst || editSceneAsFirst ? 'public' : editSceneVisibility
                  }
                  onChange={(e) =>
                    setEditSceneVisibility(
                      e.target.value as DevCatalogTourVisibility,
                    )
                  }
                  disabled={isFirst || editSceneAsFirst}
                >
                  {DEV_SCENE_VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className={devViewPanelSectionHintClassName}>
                  {isFirst || editSceneAsFirst ?
                    'firstScene must stay Public.'
                  : 'Explore shows Public only. Unlisted is link/share. Internal needs ?dev=1.'
                  }
                </p>
              </label>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Description
                </span>
                <DevPanelDescriptionTextarea
                  value={editSceneDescription}
                  onChange={(e) => setEditSceneDescription(e.target.value)}
                  placeholder='Optional client place copy — leave empty to remove'
                />
                <p className={devViewPanelSectionHintClassName}>
                  When set, Explore / nav and place overview use this copy.
                  Leave empty to inherit the first public naming body (short in
                  nav, full in place overview). Supports **bold** and *italic*.
                </p>
              </label>
              <div className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Inherited place copy
                </span>
                {(() => {
                  const draftDesc = editSceneDescription.trim();
                  const usingRealDescription =
                    Boolean(draftDesc) &&
                    !isDefaultSceneDescription(
                      draftDesc,
                      tour.title,
                      entry.title,
                    );
                  const autoLead =
                    buildScenePlaceLeadFromNaming(tour, entry) || '';
                  if (usingRealDescription) {
                    return (
                      <p className={devViewPanelSectionHintClassName}>
                        Using Description — naming inherit is ignored while
                        Description is set.
                      </p>
                    );
                  }
                  if (autoLead) {
                    return (
                      <>
                        <p
                          className={devViewPanelManageListItemDescClassName}
                          title={autoLead}
                        >
                          From NO (nav teaser) · {autoLead}
                        </p>
                        <p className={devViewPanelSectionHintClassName}>
                          Updates automatically when NO copy changes. Place
                          overview shows the full NO body.
                        </p>
                      </>
                    );
                  }
                  return (
                    <p className={devViewPanelSectionHintClassName}>
                      No place copy yet — add Description or NO body copy.
                    </p>
                  );
                })()}
              </div>
              {!isModel3dTour ?
                <>
                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Preview video URL (hero, optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='url'
                      value={editScenePreviewVideoUrl}
                      onChange={(e) =>
                        setEditScenePreviewVideoUrl(e.target.value)
                      }
                      placeholder='https://share.synthesia.io/… or hosted mp4'
                      spellCheck={false}
                      autoComplete='off'
                    />
                    <p className={devViewPanelSectionHintClassName}>
                      Synthesia — Explore scene detail and nav preview hero for
                      links to this scene.
                    </p>
                  </label>
                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Body video URL (optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='url'
                      value={editSceneVideoUrl}
                      onChange={(e) => setEditSceneVideoUrl(e.target.value)}
                      placeholder='https://youtube.com/…'
                      spellCheck={false}
                      autoComplete='off'
                    />
                    <p className={devViewPanelSectionHintClassName}>
                      YouTube — shown in Explore scene detail and nav preview
                      body below the description.
                    </p>
                  </label>
                </>
              : null}
              <div className={devViewPanelToggleListClassName}>
                {!isFirst ?
                  <label className={devViewPanelToggleLabelClassName}>
                    <input
                      type='checkbox'
                      className={devViewPanelToggleInputClassName}
                      checked={editSceneAsFirst}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setEditSceneAsFirst(checked);
                        if (checked) {
                          setEditSceneVisibility('public');
                        }
                      }}
                    />
                    <span className={devViewPanelToggleTextClassName}>
                      Set as firstScene
                    </span>
                  </label>
                : null}
              </div>
              <div className={devViewPanelActionsClassName}>
                <button
                  type='button'
                  className={devViewPanelBtnVariants({ tone: 'secondary' })}
                  onClick={() => setEditingSceneId(null)}
                  disabled={sceneManageStatus === 'working'}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={devViewPanelBtnVariants({ tone: 'primary' })}
                  onClick={() => void saveSceneEdit()}
                  disabled={
                    sceneManageStatus === 'working' || !editSceneTitle.trim()
                  }
                >
                  Save scene
                </button>
              </div>
            </DevPanelFormGroup>
          : isDuplicating ?
            <DevPanelFormGroup inline manageEdit>
              <p className={devViewPanelSectionHintClassName}>
                Duplicate “{entry.title}” as a new scene
                {childPlaceCount > 0 ?
                  ` (${childPlaceCount} child place${
                    childPlaceCount === 1 ? '' : 's'
                  } in the tour hierarchy)`
                : ''}
                .
              </p>
              <div className={devViewPanelToggleListClassName}>
                <label className={devViewPanelToggleLabelMultilineClassName}>
                  <input
                    type='checkbox'
                    className={devViewPanelToggleInputClassName}
                    checked={duplicateCloneNamings}
                    onChange={(e) =>
                      setDuplicateCloneNamings(e.currentTarget.checked)
                    }
                    disabled={sceneManageStatus === 'working'}
                  />
                  <span className={devViewPanelFormCheckboxFieldClassName}>
                    <span className={devViewPanelToggleNameClassName}>
                      Clone naming opportunities
                    </span>
                    <span className={devViewPanelToggleHintClassName}>
                      {duplicateCloneNamings ?
                        'New catalog entries for this copy (recommended for similar floors).'
                      : 'Pins keep sharing the original catalog entries.'}
                    </span>
                  </span>
                </label>
                <label className={devViewPanelToggleLabelMultilineClassName}>
                  <input
                    type='checkbox'
                    className={devViewPanelToggleInputClassName}
                    checked={duplicateLinkUnderParent}
                    onChange={(e) =>
                      setDuplicateLinkUnderParent(e.currentTarget.checked)
                    }
                    disabled={
                      sceneManageStatus === 'working' || !canLinkUnderParent
                    }
                  />
                  <span className={devViewPanelFormCheckboxFieldClassName}>
                    <span className={devViewPanelToggleNameClassName}>
                      Link under same parent
                    </span>
                    <span className={devViewPanelToggleHintClassName}>
                      {!canLinkUnderParent ?
                        'No parent in the tour hierarchy (root or unreachable).'
                      : `Add a nav from “${parentSceneTitle || parentSceneId}” to the copy so it sits in the same place.`
                      }
                    </span>
                  </span>
                </label>
                <label className={devViewPanelToggleLabelMultilineClassName}>
                  <input
                    type='checkbox'
                    className={devViewPanelToggleInputClassName}
                    checked={duplicateIncludeChildren}
                    onChange={(e) =>
                      setDuplicateIncludeChildren(e.currentTarget.checked)
                    }
                    disabled={
                      sceneManageStatus === 'working' || childPlaceCount === 0
                    }
                  />
                  <span className={devViewPanelFormCheckboxFieldClassName}>
                    <span className={devViewPanelToggleNameClassName}>
                      Include child places
                    </span>
                    <span className={devViewPanelToggleHintClassName}>
                      {childPlaceCount === 0 ?
                        'No child places under this scene in the tour hierarchy.'
                      : 'Clone the subtree and remap navs among the copies. Shared hubs (reached via another parent) stay shared.'
                      }
                    </span>
                  </span>
                </label>
              </div>
              <div className={devViewPanelActionsClassName}>
                <button
                  type='button'
                  className={devViewPanelBtnVariants({ tone: 'secondary' })}
                  onClick={() => setDuplicatingSceneId(null)}
                  disabled={sceneManageStatus === 'working'}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={devViewPanelBtnVariants({ tone: 'primary' })}
                  onClick={() => void duplicateTourScene()}
                  disabled={sceneManageStatus === 'working'}
                >
                  Duplicate scene
                </button>
              </div>
            </DevPanelFormGroup>
          : null}
        </div>
      </li>
    );
  };

  return (
    <DevPanelSectionAccordion
      persistKey='tab:scenes'
      defaultOpenIndex={1}
      ensureCloseIndex={0}
      ensureCloseKey={sceneAddCloseKey}
    >
    <>
      <DevPanelSection
        title='Add scene'
        description={
          isModel3dTour ?
            'Create a new viewpoint on the shared 3D model.'
          : 'Upload a new panorama and add it to this tour.'
        }
      >
        <DevPanelFormGroup>
          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>Title</span>
            <input
              className={devViewPanelInputClassName}
              type='text'
              value={sceneTitle}
              onChange={(e) => setSceneTitle(e.target.value)}
              placeholder='e.g. Main Entrance'
              spellCheck={false}
              autoComplete='off'
            />
            {!isModel3dTour ?
              <p className={devViewPanelSectionHintClassName}>
                Scene id is opaque and stays fixed if you rename later.
              </p>
            : <p className={devViewPanelSectionHintClassName}>
                Orbit the model first — current camera is saved as{' '}
                <code>defaultView</code> on create.
              </p>
            }
          </label>

          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              {isModel3dTour ?
                'Card thumbnail (optional — auto-captures from view)'
              : 'Panorama file'}
            </span>
            <DevPanelFileField
              file={scenePanoramaFile}
              preview={<DevPanoramaFilePreview file={scenePanoramaFile} />}
              onClearPreview={() => setScenePanoramaFile(null)}
              showClear={Boolean(scenePanoramaFile)}
            >
              <DevPanelFileInput
                accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                file={scenePanoramaFile}
                onChange={setScenePanoramaFile}
              />
            </DevPanelFileField>
            {isModel3dTour ?
              <p className={devViewPanelSectionHintClassName}>
                Optional upload; otherwise captures from the current 3D view.
              </p>
            : <p className={devViewPanelSectionHintClassName}>
                Converts to webp under this tour&apos;s panoramas folder.
              </p>
            }
          </label>

          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Description (optional)
            </span>
            <DevPanelDescriptionTextarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              spellCheck={true}
            />
          </label>

          {!isModel3dTour ?
            <label className={devViewPanelToggleLabelMultilineClassName}>
              <input
                type='checkbox'
                className={devViewPanelToggleInputClassName}
                checked={sceneCreatePlaceOverview}
                onChange={(e) =>
                  setSceneCreatePlaceOverview(e.currentTarget.checked)
                }
              />
              <span className={devViewPanelFormCheckboxFieldClassName}>
                <span className={devViewPanelToggleNameClassName}>
                  Create place overview hotspot
                </span>
                <span className={devViewPanelToggleHintClassName}>
                  Off by default. Overview pins are never auto-created on edit —
                  use this checkbox or Manage → Overview later.
                </span>
              </span>
            </label>
          : null}

          {!isModel3dTour ?
            <>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Preview video URL (hero, optional)
                </span>
                <input
                  className={devViewPanelInputClassName}
                  type='url'
                  value={scenePreviewVideoUrl}
                  onChange={(e) => setScenePreviewVideoUrl(e.target.value)}
                  placeholder='https://share.synthesia.io/… or hosted mp4'
                  spellCheck={false}
                  autoComplete='off'
                />
                <p className={devViewPanelSectionHintClassName}>
                  Synthesia — Explore scene detail and nav preview hero for
                  links to this scene.
                </p>
              </label>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Body video URL (optional)
                </span>
                <input
                  className={devViewPanelInputClassName}
                  type='url'
                  value={sceneVideoUrl}
                  onChange={(e) => setSceneVideoUrl(e.target.value)}
                  placeholder='https://youtube.com/…'
                  spellCheck={false}
                  autoComplete='off'
                />
                <p className={devViewPanelSectionHintClassName}>
                  YouTube — shown in Explore scene detail and nav preview body
                  below the description.
                </p>
              </label>
            </>
          : null}

          {sceneSlug ?
            <p className={devViewPanelSlugPreviewClassName}>
              stable id <code>{sceneSlug}</code> ·{' '}
              <code>
                {isModel3dTour ?
                  buildDefaultSceneThumbnailRelativePath(sceneSlug)
                : buildDefaultPanoramaRelativePath(sceneSlug)}
              </code>
              {view ?
                <> · defaultView {formatViewPosition(view)}</>
              : isModel3dTour ?
                ' · orbit the model to set defaultView before creating'
              : ' · defaultView 0, 0, 17'}
            </p>
          : null}
          {scenePanoramaAutoPath ?
            <p className={devViewPanelSectionHintClassName}>
              {isModel3dTour ?
                <>
                  card image path <code>{scenePanoramaAutoPath}</code>
                </>
              : <>
                  saves to <code>{scenePanoramaAutoPath}</code>
                </>
              }
            </p>
          : null}

          {sceneError ?
            <p className={devViewPanelSectionHintClassName}>{sceneError}</p>
          : null}

          <div className={devViewPanelActionsClassName}>
            <button
              type='button'
              className={devViewPanelBtnVariants({ tone: 'secondary' })}
              onClick={() => {
                setSceneTitle('');
                setSceneDescription('');
                setSceneCreatePlaceOverview(false);
                setScenePreviewVideoUrl('');
                setSceneVideoUrl('');
                setScenePanoramaFile(null);
                setSceneError(null);
                setSceneStatus('idle');
                mintCreateSceneId();
                setSceneAddCloseKey((key) => key + 1);
              }}
              disabled={sceneStatus === 'working'}
            >
              Cancel
            </button>
            <button
              type='button'
              className={devViewPanelBtnVariants({ tone: 'primary' })}
              onClick={() => void createScene()}
              disabled={!canCreateScene || sceneStatus === 'working'}
            >
              {sceneStatus === 'working' ?
                'Creating…'
              : sceneStatus === 'done' ?
                'Created!'
              : 'Create scene'}
            </button>
          </div>
        </DevPanelFormGroup>
      </DevPanelSection>

      <DevPanelSection
        title='Manage scenes'
        description='Groups follow nav hierarchy. Drag to change Explore tour list order only — not floor links. First badge marks the start scene.'
      >
        {tourScenes.length === 0 ?
          <p className={devViewPanelSectionHintClassName}>
            No scenes on this tour yet.
          </p>
        : sceneManageGroupingActive ?
          <DevPanelFormGroup className='pb-0'>
            {firstManageScene ?
              <ul className={devViewPanelManageListClassName}>
                {renderSceneManageItem(firstManageScene, {
                  peerIds: [firstManageScene.id],
                  peerKey: `first:${firstManageScene.id}`,
                  allowReorder: false,
                  showGroupSecondary: false,
                })}
              </ul>
            : null}
            <DevPanelSectionAccordion
              persistKey='tab:scenes:groups'
              variant='nested'
            >
              {sceneManageGroups.map((group, groupIndex) => {
                const peerIds = group.scenes.map((item) => item.id);
                const canReorderGroup = group.id !== SCENE_GROUP_OTHER_ID;
                const isGroupDropTarget =
                  sceneOrderDropTarget?.kind === 'group' &&
                  sceneOrderDropTarget.groupId === group.id;
                const isGroupDragging =
                  sceneOrderDrag?.kind === 'group' &&
                  sceneOrderDrag.groupId === group.id;
                return (
                  <DevPanelSection
                    key={group.id}
                    className={cn(
                      isGroupDropTarget &&
                        devViewPanelReorderDropTargetClassName,
                      isGroupDragging && 'opacity-55',
                    )}
                    title={`${group.title} (${group.scenes.length})`}
                    onDragOver={(event) => {
                      const payload = readSceneOrderDragPayload(event);
                      if (!payload || payload.kind !== 'group') return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setSceneOrderDropTarget({
                        kind: 'group',
                        groupId: group.id,
                      });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const payload = readSceneOrderDragPayload(event);
                      clearSceneOrderDrag();
                      if (
                        !payload ||
                        payload.kind !== 'group' ||
                        payload.groupId === group.id
                      ) {
                        return;
                      }
                      void relocateTourSceneGroup(payload.groupId, groupIndex);
                    }}
                    headerLeading={
                      canReorderGroup ?
                        <DevPanelReorderHandle
                          disabled={sceneManageStatus === 'working'}
                          label={`Reorder ${group.title} group`}
                          onDragStart={(event) => {
                            const payload = {
                              kind: 'group' as const,
                              groupId: group.id,
                            };
                            event.dataTransfer.setData(
                              'text/plain',
                              JSON.stringify(payload),
                            );
                            event.dataTransfer.effectAllowed = 'move';
                            setSceneOrderDrag(payload);
                          }}
                          onDragEnd={clearSceneOrderDrag}
                        />
                      : undefined
                    }
                  >
                    {group.scenes.length > 0 ?
                      <DevPanelFormGroup>
                        <ul className={devViewPanelManageListClassName}>
                          {group.scenes.map((entry) =>
                            renderSceneManageItem(entry, {
                              peerIds,
                              peerKey: `group:${group.id}`,
                              allowReorder: group.scenes.length > 1,
                              showGroupSecondary: false,
                            }),
                          )}
                        </ul>
                      </DevPanelFormGroup>
                    : <p className={devViewPanelSectionHintClassName}>
                        No scenes in this group.
                      </p>
                    }
                  </DevPanelSection>
                );
              })}
            </DevPanelSectionAccordion>
          </DevPanelFormGroup>
        : <DevPanelFormGroup>
            <ul className={devViewPanelManageListClassName}>
              {tourScenes.map((entry) =>
                renderSceneManageItem(entry, {
                  peerIds: tourScenes.map((item) => item.id),
                  peerKey: 'flat',
                  allowReorder: true,
                  showGroupSecondary: true,
                }),
              )}
            </ul>
          </DevPanelFormGroup>
        }
        {sceneManageError ?
          <p className={devViewPanelSectionHintClassName}>{sceneManageError}</p>
        : null}
      </DevPanelSection>
    </>
    </DevPanelSectionAccordion>
  );
}
