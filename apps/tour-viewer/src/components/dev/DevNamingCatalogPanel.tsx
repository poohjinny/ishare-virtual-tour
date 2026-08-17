import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEV_NAMING_DONOR_KIND_OPTIONS,
  DEV_NAMING_MANAGE_FILTER_TABS,
  DEV_NAMING_STATUS_OPTIONS,
  type DevNamingManageFilter,
  getDevNamingCatalogSectionConfig,
  type DevHotspotManageScope,
} from '../../constants/devHotspot';
import {
  DEV_SCENE_VISIBILITY_OPTIONS,
  type DevCatalogTourVisibility,
} from '../../constants/devPanel';
import type {
  NamingDonorKind,
  NamingOpportunityRecord,
  NamingOpportunityStatus,
  Tour,
  ViewPosition,
} from '../../types/tour';
import {
  formatNamingPriceInput,
  parseNamingPriceInput,
} from '../../utils/namingPrice';
import { resolveNamingVisibility } from '../../utils/namingVisibility';
import {
  namingOpportunityStatusConfig,
  namingOpportunityStatusShowsBadge,
  resolveNamingOpportunityStatus,
} from '../../data/namingOpportunityStatus';
import {
  DEV_NO_NAME_STORAGE_KEY,
  type DevSceneRef,
} from '../../utils/devHotspotLogger';
import { withBaseUrl } from '../../utils/assetUrl';
import {
  DevTourApiError,
  devCreateNamingOpportunity,
  devDeleteHotspot,
  devDuplicateNamingOpportunity,
  devUpdateNamingHotspot,
  type DevTourMutateOptions,
} from '../../utils/devTourApi';
import { findNamingHotspotByNamingId } from '../../utils/findTourHotspot';
import {
  catalogVisibilityManageBadgeLabel,
  catalogVisibilityShowsManageBadge,
} from '../../utils/sceneVisibility';
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
  devViewPanelToggleInputClassName,
  devViewPanelToggleLabelMultilineClassName,
  devViewPanelToggleListClassName,
  devViewPanelToggleNameClassName,
  devViewPanelToggleHintClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemBodyClassName,
  devViewPanelManageListItemContentClassName,
  devViewPanelManageListItemIconActionsClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelManageListItemMainRowClassName,
  devViewPanelManageListItemDescStackClassName,
  devViewPanelManageListItemDescBulletListClassName,
  devViewPanelManageListItemDescBulletItemClassName,
  formatManageListItemId,
  devViewPanelManageListItemMetaClassName,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemSceneBadgesClassName,
  devNamingManageStatusBadgeVariants,
  devViewPanelBrandLogoClassName,
  devViewPanelFormCheckboxFieldClassName,
} from './devViewPanelVariants';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import { DevPanelFileField } from './DevPanelFileField';
import { DevPanelFileInput } from './DevPanelFileInput';
import { DevLocalFilePreview } from './DevLocalFilePreview';
import { DevPanelFormGroup } from './DevPanelFormGroup';
import { DevPanelDescriptionTextarea } from './DevPanelDescriptionTextarea';
import { DevPanelTertiaryTabs } from './DevPanelTertiaryTabs';
import { Badge } from '../ui/Badge';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import {
  type ActionStatus,
  buildDevNamingDonorPayload,
  confirmDevPanelDelete,
  hotspotDisplayLabel,
  readSessionValue,
  writeSessionValue,
} from './devViewPanelHelpers';


type DevNamingCatalogPanelProps = {
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  scene: DevSceneRef;
  openNamingOpportunity?: (sceneId: string, hotspotId: string) => void;
  activeNamingHotspotId?: string | null;
  getCurrentView?: () => ViewPosition | null;
  animateToView?: (view: ViewPosition) => Promise<void> | void;
  focusHotspot?: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
  ensureOpenKey: number;
  catalogClearKey: number;
  onSelectNamingId?: (namingId: string) => void;
  onClearHotspotInteraction?: () => void;
  deletedNamingId: string | null;
  deletedNamingHotspotKey: number;
};

export function DevNamingCatalogPanel({
  tour,
  onTourMutated,
  scene,
  openNamingOpportunity,
  activeNamingHotspotId = null,
  getCurrentView,
  animateToView,
  focusHotspot,
  ensureOpenKey,
  catalogClearKey,
  onSelectNamingId,
  onClearHotspotInteraction,
  deletedNamingId,
  deletedNamingHotspotKey,
}: DevNamingCatalogPanelProps) {
  const [hotspotManageStatus, setHotspotManageStatus] =
    useState<ActionStatus>('idle');
  const [hotspotManageError, setHotspotManageError] = useState<string | null>(
    null,
  );
  const [catalogEditNamingId, setCatalogEditNamingId] = useState<string | null>(
    null,
  );
  const [duplicatingNamingId, setDuplicatingNamingId] = useState<string | null>(
    null,
  );
  const [
    duplicateNamingIncludePlacements,
    setDuplicateNamingIncludePlacements,
  ] = useState(true);
  const [duplicateNamingResetAsOpen, setDuplicateNamingResetAsOpen] =
    useState(false);
  const [catalogEditName, setCatalogEditName] = useState('');
  const [catalogEditPrice, setCatalogEditPrice] = useState('');
  const [catalogEditStatus, setCatalogEditStatus] = useState<
    NamingOpportunityStatus | ''
  >('');
  const [catalogEditVisibility, setCatalogEditVisibility] =
    useState<DevCatalogTourVisibility>('public');
  const [catalogEditBody, setCatalogEditBody] = useState('');
  const [catalogEditVideoUrl, setCatalogEditVideoUrl] = useState('');
  const [catalogEditImage, setCatalogEditImage] = useState('');
  const [catalogEditDonorName, setCatalogEditDonorName] = useState('');
  const [catalogEditDonorKind, setCatalogEditDonorKind] =
    useState<NamingDonorKind>('organization');
  const [catalogEditDonorAffiliation, setCatalogEditDonorAffiliation] =
    useState('');
  const [catalogEditDonorWebsite, setCatalogEditDonorWebsite] = useState('');
  const [catalogEditDonorLogoFile, setCatalogEditDonorLogoFile] =
    useState<File | null>(null);
  const [catalogEditDonorLogoPath, setCatalogEditDonorLogoPath] = useState('');
  const [catalogEditClearDonorLogo, setCatalogEditClearDonorLogo] =
    useState(false);
  const [noName, setNoName] = useState(() =>
    readSessionValue(DEV_NO_NAME_STORAGE_KEY),
  );
  const [noPrice, setNoPrice] = useState('');
  const [noStatus, setNoStatus] = useState<NamingOpportunityStatus | ''>('');
  const [noVisibility, setNoVisibility] =
    useState<DevCatalogTourVisibility>('public');
  const [noDonorName, setNoDonorName] = useState('');
  const [noDonorKind, setNoDonorKind] =
    useState<NamingDonorKind>('organization');
  const [noDonorAffiliation, setNoDonorAffiliation] = useState('');
  const [noDonorWebsite, setNoDonorWebsite] = useState('');
  const [noDonorLogoFile, setNoDonorLogoFile] = useState<File | null>(null);
  const [noBody, setNoBody] = useState('');
  const [noVideoUrl, setNoVideoUrl] = useState('');
  const [noImage, setNoImage] = useState('');
  const [namingCatalogStatus, setNamingCatalogStatus] =
    useState<ActionStatus>('idle');
  const [namingCatalogError, setNamingCatalogError] = useState<string | null>(
    null,
  );
  const [namingAddCloseKey, setNamingAddCloseKey] = useState(0);
  const [namingManageFilter, setNamingManageFilter] =
    useState<DevNamingManageFilter>('all');

  const isModel3dTour = tour.viewerType === 'model3d';
  const hotspotManageScope = useMemo((): DevHotspotManageScope => {
    return isModel3dTour ? 'model3d-tour' : 'panorama-scene';
  }, [isModel3dTour]);


  const namingCatalogSectionConfig = useMemo(
    () => getDevNamingCatalogSectionConfig(hotspotManageScope),
    [hotspotManageScope],
  );

  const namingCatalogRows = useMemo(() => {
    const catalog = tour.namingOpportunities ?? {};
    return Object.values(catalog)
      .map((record) => {
        const placement = findNamingHotspotByNamingId(tour, record.id);
        const hostScene =
          placement ? tour.scenes[placement.sceneId] : undefined;
        const displayName =
          record.name?.trim() || hostScene?.title?.trim() || record.id;
        return {
          record,
          placement,
          displayName,
          sceneTitle: hostScene?.title?.trim() || placement?.sceneId || '',
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [tour]);

  const filteredNamingCatalogRows = useMemo(() => {
    if (namingManageFilter === 'all') return namingCatalogRows;
    return namingCatalogRows.filter(
      (row) =>
        resolveNamingOpportunityStatus(row.record.status) ===
        namingManageFilter,
    );
  }, [namingCatalogRows, namingManageFilter]);

  const trimmedNoName = noName.trim();
  const hostSceneRecord = tour.scenes[scene.id];
  const inheritedNoTitle = hostSceneRecord?.title?.trim() ?? '';
  const inheritedNoBody = hostSceneRecord?.description?.trim() ?? '';
  const inheritedNoVideo = hostSceneRecord?.previewVideoUrl?.trim() ?? '';
  const canCreateNamingCatalog = Boolean(
    scene.tourId && parseNamingPriceInput(noPrice) != null && noStatus,
  );


  useEffect(() => {
    writeSessionValue(DEV_NO_NAME_STORAGE_KEY, noName);
  }, [noName]);

  useEffect(() => {
    if (!ensureOpenKey) return;
    setCatalogEditNamingId(null);
    setDuplicatingNamingId(null);
    setNamingCatalogError(null);
    setNamingCatalogStatus('idle');
  }, [ensureOpenKey]);

  useEffect(() => {
    if (!catalogClearKey) return;
    setCatalogEditNamingId(null);
    setDuplicatingNamingId(null);
  }, [catalogClearKey]);

  useEffect(() => {
    if (!deletedNamingHotspotKey) return;
    if (deletedNamingId && catalogEditNamingId === deletedNamingId) {
      setCatalogEditNamingId(null);
    }
    if (deletedNamingId && duplicatingNamingId === deletedNamingId) {
      setDuplicatingNamingId(null);
    }
  }, [
    catalogEditNamingId,
    deletedNamingHotspotKey,
    deletedNamingId,
    duplicatingNamingId,
  ]);


  const createNamingCatalogEntry = useCallback(async () => {
    const priceAmount = parseNamingPriceInput(noPrice);
    if (!scene.tourId || priceAmount == null || !noStatus) {
      return;
    }

    setNamingCatalogStatus('working');
    setNamingCatalogError(null);

    try {
      const result = await devCreateNamingOpportunity({
        tourId: scene.tourId,
        sceneId: scene.id,
        name: trimmedNoName,
        price: priceAmount,
        status: noStatus,
        visibility: noVisibility,
        body: noBody.trim() || undefined,
        videoUrl: noVideoUrl.trim() || undefined,
        image: noImage.trim() || undefined,
        donor: buildDevNamingDonorPayload({
          status: noStatus,
          name: noDonorName,
          kind: noDonorKind,
          affiliation: noDonorAffiliation,
          website: noDonorWebsite,
        }),
        donorLogoFile: noDonorLogoFile,
      });
      await onTourMutated?.({ keepCurrentScene: true });
      onSelectNamingId?.(result.record.id);
      setNamingCatalogStatus('done');
      setNoName('');
      setNoPrice('');
      setNoStatus('');
      setNoVisibility('public');
      setNoDonorName('');
      setNoDonorKind('organization');
      setNoDonorAffiliation('');
      setNoDonorWebsite('');
      setNoDonorLogoFile(null);
      setNoBody('');
      setNoVideoUrl('');
      setNoImage('');
    } catch (error) {
      setNamingCatalogStatus('error');
      setNamingCatalogError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create naming opportunity',
      );
    }
  }, [
    noBody,
    noDonorAffiliation,
    noDonorKind,
    noDonorLogoFile,
    noDonorName,
    noDonorWebsite,
    noImage,
    noPrice,
    noStatus,
    noVisibility,
    noVideoUrl,
    onTourMutated,
    scene.id,
    scene.tourId,
    onSelectNamingId,
    trimmedNoName,
  ]);

  const startCatalogNamingEdit = useCallback(
    (namingId: string, recordOverride?: NamingOpportunityRecord) => {
      const record = recordOverride ?? tour.namingOpportunities?.[namingId];
      if (!record) return;
      const placement = findNamingHotspotByNamingId(tour, namingId);
      const hostScene =
        placement ? tour.scenes[placement.sceneId] : tour.scenes[scene.id];
      const sceneBody = hostScene?.description?.trim() ?? '';
      const sceneVideo = hostScene?.previewVideoUrl?.trim() ?? '';
      const storedBody = record.body?.trim() ?? '';
      const storedVideo = record.videoUrl?.trim() ?? '';
      setDuplicatingNamingId(null);
      setCatalogEditNamingId(namingId);
      onClearHotspotInteraction?.();
      setCatalogEditName(record.name?.trim() ?? '');
      setCatalogEditPrice(formatNamingPriceInput(record.price));
      setCatalogEditStatus(record.status ?? '');
      setCatalogEditVisibility(resolveNamingVisibility(record));
      setCatalogEditBody(
        storedBody && storedBody !== sceneBody ? storedBody : '',
      );
      setCatalogEditVideoUrl(
        storedVideo && storedVideo !== sceneVideo ? storedVideo : '',
      );
      setCatalogEditImage(record.image?.trim() ?? '');
      setCatalogEditDonorName(record.donor?.name ?? '');
      setCatalogEditDonorKind(record.donor?.kind ?? 'organization');
      setCatalogEditDonorAffiliation(record.donor?.affiliation ?? '');
      setCatalogEditDonorWebsite(record.donor?.website ?? '');
      setCatalogEditDonorLogoFile(null);
      setCatalogEditDonorLogoPath(
        typeof record.donor?.logo === 'string' ? record.donor.logo : '',
      );
      setCatalogEditClearDonorLogo(false);
    },
    [onClearHotspotInteraction, scene.id, tour],
  );

  const startDuplicateNaming = useCallback(
    (namingId: string) => {
      const record = tour.namingOpportunities?.[namingId];
      if (!record) return;
      const placement = findNamingHotspotByNamingId(tour, namingId);
      setCatalogEditNamingId(null);
      onClearHotspotInteraction?.();
      setDuplicatingNamingId(namingId);
      setDuplicateNamingIncludePlacements(Boolean(placement));
      setDuplicateNamingResetAsOpen(false);
      setHotspotManageError(null);
    },
    [onClearHotspotInteraction, tour],
  );

  const duplicateNamingCatalogEntry = useCallback(async () => {
    if (!scene.tourId || !duplicatingNamingId) return;
    const source = tour.namingOpportunities?.[duplicatingNamingId];
    if (!source) return;

    setHotspotManageStatus('working');
    setHotspotManageError(null);

    try {
      const result = await devDuplicateNamingOpportunity({
        tourId: scene.tourId,
        namingId: duplicatingNamingId,
        includePlacements: duplicateNamingIncludePlacements,
        resetAsOpen: duplicateNamingResetAsOpen,
      });
      setDuplicatingNamingId(null);
      await onTourMutated?.({ keepCurrentScene: true });
      startCatalogNamingEdit(result.record.id, result.record);
      setHotspotManageStatus('done');
    } catch (error) {
      setHotspotManageStatus('error');
      setHotspotManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not duplicate naming opportunity',
      );
    }
  }, [
    duplicateNamingIncludePlacements,
    duplicateNamingResetAsOpen,
    duplicatingNamingId,
    onTourMutated,
    scene.tourId,
    startCatalogNamingEdit,
    tour.namingOpportunities,
  ]);

  const saveCatalogNamingEdit = useCallback(async () => {
    if (!scene.tourId || !catalogEditNamingId) return;
    const placement = findNamingHotspotByNamingId(tour, catalogEditNamingId);
    if (!placement) {
      setHotspotManageStatus('error');
      setHotspotManageError('No placement hotspot for this naming opportunity');
      return;
    }

    setHotspotManageStatus('working');
    setHotspotManageError(null);

    try {
      await devUpdateNamingHotspot({
        tourId: scene.tourId,
        sceneId: placement.sceneId,
        hotspotId: placement.hotspot.id,
        title: catalogEditName.trim(),
        price: parseNamingPriceInput(catalogEditPrice) ?? undefined,
        status: catalogEditStatus || undefined,
        visibility: catalogEditVisibility,
        body: catalogEditBody.trim(),
        videoUrl: catalogEditVideoUrl.trim(),
        image: catalogEditImage,
        donor: buildDevNamingDonorPayload({
          status: catalogEditStatus,
          name: catalogEditDonorName,
          kind: catalogEditDonorKind,
          affiliation: catalogEditDonorAffiliation,
          website: catalogEditDonorWebsite,
        }),
        donorLogoFile: catalogEditDonorLogoFile,
        clearDonorLogo: catalogEditClearDonorLogo,
      });
      setCatalogEditNamingId(null);
      await onTourMutated?.({ keepCurrentScene: true });
      setHotspotManageStatus('done');
    } catch (error) {
      setHotspotManageStatus('error');
      setHotspotManageError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save naming opportunity',
      );
    }
  }, [
    catalogEditBody,
    catalogEditClearDonorLogo,
    catalogEditDonorAffiliation,
    catalogEditDonorKind,
    catalogEditDonorLogoFile,
    catalogEditDonorName,
    catalogEditDonorWebsite,
    catalogEditImage,
    catalogEditName,
    catalogEditNamingId,
    catalogEditPrice,
    catalogEditStatus,
    catalogEditVisibility,
    catalogEditVideoUrl,
    onTourMutated,
    scene.tourId,
    tour,
  ]);


  const deleteNamingCatalogEntry = useCallback(
    async (namingId: string) => {
      if (!scene.tourId) return;
      const placement = findNamingHotspotByNamingId(tour, namingId);
      const record = tour.namingOpportunities?.[namingId];
      const label =
        record?.name?.trim() ||
        (placement ? hotspotDisplayLabel(placement.hotspot, tour) : namingId);
      if (
        !confirmDevPanelDelete(
          `Delete naming opportunity “${label}” from the catalog? This also removes its hotspot(s).`,
        )
      ) {
        return;
      }
      if (!placement) {
        setHotspotManageStatus('error');
        setHotspotManageError(
          'No placement hotspot to delete for this naming id',
        );
        return;
      }

      setHotspotManageStatus('working');
      setHotspotManageError(null);

      try {
        await devDeleteHotspot({
          tourId: scene.tourId,
          sceneId: placement.sceneId,
          hotspotId: placement.hotspot.id,
        });
        if (catalogEditNamingId === namingId) {
          setCatalogEditNamingId(null);
        }
        if (duplicatingNamingId === namingId) {
          setDuplicatingNamingId(null);
        }
        onClearHotspotInteraction?.();
        await onTourMutated?.({ keepCurrentScene: true });
        setHotspotManageStatus('done');
      } catch (error) {
        setHotspotManageStatus('error');
        setHotspotManageError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not delete naming opportunity',
        );
      }
    },
    [
      catalogEditNamingId,
      duplicatingNamingId,
      onClearHotspotInteraction,
      onTourMutated,
      scene.tourId,
      tour,
    ],
  );

  const openNamingHotspot = useCallback(
    (sceneId: string, hotspotId: string) => {
      if (!openNamingOpportunity) return;
      // Keep the current Dev tab (e.g. Namings manage/edit) — only move the viewer.
      openNamingOpportunity(sceneId, hotspotId);
    },
    [openNamingOpportunity],
  );

  const focusHotspotRef = useRef(focusHotspot);
  focusHotspotRef.current = focusHotspot;
  const getCurrentViewRef = useRef(getCurrentView);
  getCurrentViewRef.current = getCurrentView;
  const animateToViewRef = useRef(animateToView);
  animateToViewRef.current = animateToView;
  const hoverPreviewReturnViewRef = useRef<ViewPosition | null>(null);

  const previewHotspotHighlight = useCallback((hotspotId: string | null) => {
    if (!hotspotId) return;
    if (!hoverPreviewReturnViewRef.current) {
      hoverPreviewReturnViewRef.current =
        getCurrentViewRef.current?.() ?? null;
    }
    focusHotspotRef.current?.(hotspotId, { animate: true });
  }, []);

  const endManageHoverPreview = useCallback(() => {
    focusHotspotRef.current?.(null, { animate: false });
    const returnView = hoverPreviewReturnViewRef.current;
    hoverPreviewReturnViewRef.current = null;
    if (returnView) {
      void animateToViewRef.current?.(returnView);
    }
  }, []);

  const catalogEditDonorLogoPreviewUrl = useMemo(() => {
    if (catalogEditDonorLogoFile || catalogEditClearDonorLogo) return null;
    const path = catalogEditDonorLogoPath.trim();
    if (!path) return null;
    return withBaseUrl(path);
  }, [
    catalogEditClearDonorLogo,
    catalogEditDonorLogoFile,
    catalogEditDonorLogoPath,
  ]);

  useEffect(() => {
    if (hotspotManageStatus === 'idle') return;
    const t = window.setTimeout(() => {
      if (hotspotManageStatus !== 'working') {
        setHotspotManageStatus('idle');
        setHotspotManageError(null);
      }
    }, 2500);
    return () => window.clearTimeout(t);
  }, [hotspotManageStatus]);


  return (
    <DevPanelSectionAccordion
      persistKey='tab:naming'
      defaultOpenIndex={1}
      ensureOpenIndex={0}
      ensureOpenKey={ensureOpenKey}
      ensureCloseIndex={0}
      ensureCloseKey={namingAddCloseKey}
    >
      <>
        <DevPanelSection
          title='Add naming'
          description='Create a naming opportunity in the tour catalog, then place it with a hotspot.'
        >
          <DevPanelFormGroup title='New naming opportunity'>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Name (optional)
              </span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={noName}
                onChange={(e) => setNoName(e.target.value)}
                placeholder={inheritedNoTitle || 'Uses scene title'}
                spellCheck={false}
                autoComplete='off'
              />
            </label>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Visibility
              </span>
              <select
                className={devViewPanelSelectClassName}
                value={noVisibility}
                onChange={(e) =>
                  setNoVisibility(e.target.value as DevCatalogTourVisibility)
                }
              >
                {DEV_SCENE_VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Price</span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={noPrice}
                onChange={(e) => setNoPrice(e.target.value)}
                placeholder='e.g. 75000'
                spellCheck={false}
                autoComplete='off'
              />
            </label>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Status</span>
              <select
                className={devViewPanelSelectClassName}
                value={noStatus}
                onChange={(e) =>
                  setNoStatus(e.target.value as NamingOpportunityStatus | '')
                }
              >
                <option value=''>Select status…</option>
                {DEV_NAMING_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {noStatus === 'sold' ?
              <>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Donor kind
                  </span>
                  <select
                    className={devViewPanelSelectClassName}
                    value={noDonorKind}
                    onChange={(e) =>
                      setNoDonorKind(e.target.value as NamingDonorKind)
                    }
                  >
                    {DEV_NAMING_DONOR_KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Donor name
                  </span>
                  <input
                    className={devViewPanelInputClassName}
                    type='text'
                    value={noDonorName}
                    onChange={(e) => setNoDonorName(e.target.value)}
                    placeholder='e.g. Jane Smith'
                    spellCheck={false}
                    autoComplete='off'
                  />
                </label>
                {noDonorKind === 'person' ?
                  <label className={devViewPanelFieldClassName}>
                    <span className={devViewPanelFieldLabelClassName}>
                      Affiliation (optional)
                    </span>
                    <input
                      className={devViewPanelInputClassName}
                      type='text'
                      value={noDonorAffiliation}
                      onChange={(e) => setNoDonorAffiliation(e.target.value)}
                      placeholder='e.g. ABC Foundation'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </label>
                : null}
                {(
                  noDonorKind === 'organization' ||
                  (noDonorKind === 'person' && noDonorAffiliation.trim())
                ) ?
                  <>
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        {noDonorKind === 'person' ?
                          'Affiliation website (optional)'
                        : 'Donor website (optional)'}
                      </span>
                      <input
                        className={devViewPanelInputClassName}
                        type='url'
                        value={noDonorWebsite}
                        onChange={(e) => setNoDonorWebsite(e.target.value)}
                        placeholder='https://…'
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </label>
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        {noDonorKind === 'person' ?
                          'Affiliation logo (optional)'
                        : 'Donor logo (optional)'}
                      </span>
                      <DevPanelFileField
                        {...(noDonorLogoFile != null ?
                          { file: noDonorLogoFile }
                        : {})}
                        preview={
                          noDonorLogoFile ?
                            <DevLocalFilePreview
                              file={noDonorLogoFile}
                              className={devViewPanelBrandLogoClassName}
                              alt='Donor logo preview'
                            />
                          : null
                        }
                        onClearPreview={() => setNoDonorLogoFile(null)}
                        showClear={Boolean(noDonorLogoFile)}
                      >
                        <DevPanelFileInput
                          accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                          file={noDonorLogoFile}
                          onChange={setNoDonorLogoFile}
                        />
                      </DevPanelFileField>
                    </label>
                  </>
                : null}
              </>
            : null}
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Body (optional)
              </span>
              <DevPanelDescriptionTextarea
                value={noBody}
                onChange={(e) => setNoBody(e.target.value)}
                placeholder={inheritedNoBody || 'Uses scene description'}
                spellCheck={true}
              />
              <p className={devViewPanelSectionHintClassName}>
                Supports **bold** and *italic*.
              </p>
            </label>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Video URL (optional)
              </span>
              <input
                className={devViewPanelInputClassName}
                type='url'
                value={noVideoUrl}
                onChange={(e) => setNoVideoUrl(e.target.value)}
                placeholder={inheritedNoVideo || 'Uses scene preview video URL'}
                spellCheck={false}
                autoComplete='off'
              />
            </label>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Image path (optional)
              </span>
              <input
                className={devViewPanelInputClassName}
                type='text'
                value={noImage}
                onChange={(e) => setNoImage(e.target.value)}
                placeholder='/assets/…/photo.webp'
                spellCheck={false}
                autoComplete='off'
              />
            </label>
            {namingCatalogError ?
              <p className={devViewPanelSectionHintClassName}>
                {namingCatalogError}
              </p>
            : null}
            <div className={devViewPanelActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => {
                  setNoName('');
                  setNoPrice('');
                  setNoStatus('');
                  setNoVisibility('public');
                  setNoBody('');
                  setNoVideoUrl('');
                  setNoImage('');
                  setNoDonorName('');
                  setNoDonorKind('organization');
                  setNoDonorAffiliation('');
                  setNoDonorWebsite('');
                  setNoDonorLogoFile(null);
                  setNamingCatalogError(null);
                  setNamingCatalogStatus('idle');
                  setNamingAddCloseKey((key) => key + 1);
                }}
                disabled={namingCatalogStatus === 'working'}
              >
                Cancel
              </button>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'naming' })}
                onClick={() => void createNamingCatalogEntry()}
                disabled={
                  !canCreateNamingCatalog || namingCatalogStatus === 'working'
                }
              >
                {namingCatalogStatus === 'working' ?
                  'Creating…'
                : namingCatalogStatus === 'done' ?
                  'NO created!'
                : 'Create naming opportunity'}
              </button>
            </div>
          </DevPanelFormGroup>
        </DevPanelSection>

        <DevPanelSection
          title='Manage namings'
          description={namingCatalogSectionConfig.description}
        >
          <DevPanelTertiaryTabs
            aria-label='Filter naming opportunities by status'
            value={namingManageFilter}
            onChange={(filter) => {
              setNamingManageFilter(filter);
              setCatalogEditNamingId(null);
              setDuplicatingNamingId(null);
            }}
            tabs={DEV_NAMING_MANAGE_FILTER_TABS.map((tab) => ({
              id: tab.id,
              label: tab.label,
              kind: 'naming',
            }))}
          />
          <DevPanelFormGroup>
            {filteredNamingCatalogRows.length > 0 ?
              <ul
                className={devViewPanelManageListClassName}
                onMouseLeave={endManageHoverPreview}
              >
                {filteredNamingCatalogRows.map((row) => {
                  const isEditing = catalogEditNamingId === row.record.id;
                  const isDuplicating = duplicatingNamingId === row.record.id;
                  const hasPlacement = Boolean(row.placement);
                  const isCurrent =
                    Boolean(activeNamingHotspotId) &&
                    row.placement?.hotspot.id === activeNamingHotspotId;
                  const hostSceneBody =
                    row.placement ?
                      tour.scenes[row.placement.sceneId]?.description?.trim() ||
                      ''
                    : '';
                  const statusConfig =
                    (
                      row.record.status &&
                      namingOpportunityStatusShowsBadge(row.record.status)
                    ) ?
                      namingOpportunityStatusConfig(row.record.status)
                    : null;
                  const namingVisibility = resolveNamingVisibility(row.record);
                  return (
                    <li
                      key={row.record.id}
                      className={cn(
                        devViewPanelManageListItemClassName,
                        (isEditing || isDuplicating || isCurrent) &&
                          devViewPanelManageListItemActiveClassName,
                      )}
                      onMouseEnter={() => {
                        if (row.placement?.sceneId === scene.id) {
                          previewHotspotHighlight(row.placement.hotspot.id);
                        }
                      }}
                    >
                      <div className={devViewPanelManageListItemBodyClassName}>
                        <div
                          className={devViewPanelManageListItemMainRowClassName}
                        >
                          <div
                            className={
                              devViewPanelManageListItemContentClassName
                            }
                          >
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
                                {row.displayName}
                              </span>
                            </div>
                            {(
                              catalogVisibilityShowsManageBadge(
                                namingVisibility,
                              ) || statusConfig
                            ) ?
                              <div
                                className={
                                  devViewPanelManageListItemSceneBadgesClassName
                                }
                              >
                                {(
                                  catalogVisibilityShowsManageBadge(
                                    namingVisibility,
                                  )
                                ) ?
                                  <Badge
                                    variant='fill'
                                    size='sm'
                                    tone='none'
                                    className={devSceneManageBadgeVariants({
                                      kind: namingVisibility,
                                    })}
                                  >
                                    {catalogVisibilityManageBadgeLabel(
                                      namingVisibility,
                                    )}
                                  </Badge>
                                : null}
                                {statusConfig ?
                                  <Badge
                                    variant='fill'
                                    size='sm'
                                    tone='none'
                                    className={devNamingManageStatusBadgeVariants(
                                      { kind: statusConfig.cssModifier },
                                    )}
                                  >
                                    {statusConfig.shortLabel}
                                  </Badge>
                                : null}
                              </div>
                            : null}
                          </div>
                          <div
                            className={
                              devViewPanelManageListItemIconActionsClassName
                            }
                          >
                            {row.placement && openNamingOpportunity ?
                              <button
                                type='button'
                                className={devViewPanelIconBtnVariants({
                                  tone: 'secondary',
                                })}
                                disabled={hotspotManageStatus === 'working'}
                                onClick={() =>
                                  openNamingHotspot(
                                    row.placement!.sceneId,
                                    row.placement!.hotspot.id,
                                  )
                                }
                                aria-label={`Open ${row.displayName}`}
                                title='Open'
                              >
                                <MaterialSymbol
                                  name='visibility'
                                  sizePx={MATERIAL_SYMBOL_SIZE_18}
                                  className={materialSymbolLayoutClassName}
                                  aria-hidden
                                />
                              </button>
                            : null}
                            <button
                              type='button'
                              className={devViewPanelIconBtnVariants({
                                tone: 'secondary',
                              })}
                              disabled={
                                hotspotManageStatus === 'working' ||
                                isEditing ||
                                isDuplicating
                              }
                              onClick={() =>
                                startCatalogNamingEdit(row.record.id)
                              }
                              aria-label={`Edit ${row.displayName}`}
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
                              className={devViewPanelIconBtnVariants({
                                tone: 'secondary',
                              })}
                              disabled={
                                hotspotManageStatus === 'working' ||
                                isEditing ||
                                isDuplicating
                              }
                              onClick={() =>
                                startDuplicateNaming(row.record.id)
                              }
                              aria-label={`Duplicate ${row.displayName}`}
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
                              className={devViewPanelIconBtnVariants({
                                tone: 'danger',
                              })}
                              disabled={hotspotManageStatus === 'working'}
                              onClick={() =>
                                void deleteNamingCatalogEntry(row.record.id)
                              }
                              aria-label={`Delete ${row.displayName}`}
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
                        <div
                          className={
                            devViewPanelManageListItemDescStackClassName
                          }
                        >
                          <ul
                            className={
                              devViewPanelManageListItemDescBulletListClassName
                            }
                          >
                            <li
                              className={
                                devViewPanelManageListItemDescBulletItemClassName
                              }
                              title={row.record.id}
                            >
                              {formatManageListItemId('naming', row.record.id)}
                            </li>
                            {row.record.price ?
                              <li
                                className={cn(
                                  devViewPanelManageListItemDescBulletItemClassName,
                                  devViewPanelManageListItemMetaClassName,
                                )}
                              >
                                {`Price: ${formatNamingPriceInput(row.record.price)}`}
                              </li>
                            : null}
                          </ul>
                          {row.record.body?.trim() ?
                            <p
                              className={cn('m-0 line-clamp-2')}
                              title={row.record.body.trim()}
                            >
                              {row.record.body.trim()}
                            </p>
                          : null}
                        </div>

                        {isEditing ?
                          <DevPanelFormGroup inline manageEdit>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Name (optional)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={catalogEditName}
                                onChange={(e) =>
                                  setCatalogEditName(e.target.value)
                                }
                                placeholder={
                                  row.sceneTitle || 'Uses scene title'
                                }
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Visibility
                              </span>
                              <select
                                className={devViewPanelSelectClassName}
                                value={catalogEditVisibility}
                                onChange={(e) =>
                                  setCatalogEditVisibility(
                                    e.target.value as DevCatalogTourVisibility,
                                  )
                                }
                              >
                                {DEV_SCENE_VISIBILITY_OPTIONS.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Price
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={catalogEditPrice}
                                onChange={(e) =>
                                  setCatalogEditPrice(e.target.value)
                                }
                              />
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Status
                              </span>
                              <select
                                className={devViewPanelSelectClassName}
                                value={catalogEditStatus}
                                onChange={(e) =>
                                  setCatalogEditStatus(
                                    e.target.value as
                                      | NamingOpportunityStatus
                                      | '',
                                  )
                                }
                              >
                                <option value=''>Select status…</option>
                                {DEV_NAMING_STATUS_OPTIONS.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {catalogEditStatus === 'sold' ?
                              <>
                                <label className={devViewPanelFieldClassName}>
                                  <span
                                    className={devViewPanelFieldLabelClassName}
                                  >
                                    Donor kind
                                  </span>
                                  <select
                                    className={devViewPanelSelectClassName}
                                    value={catalogEditDonorKind}
                                    onChange={(e) =>
                                      setCatalogEditDonorKind(
                                        e.target.value as NamingDonorKind,
                                      )
                                    }
                                  >
                                    {DEV_NAMING_DONOR_KIND_OPTIONS.map(
                                      (option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                                <label className={devViewPanelFieldClassName}>
                                  <span
                                    className={devViewPanelFieldLabelClassName}
                                  >
                                    Donor name
                                  </span>
                                  <input
                                    className={devViewPanelInputClassName}
                                    type='text'
                                    value={catalogEditDonorName}
                                    onChange={(e) =>
                                      setCatalogEditDonorName(e.target.value)
                                    }
                                    placeholder='e.g. Jane Smith'
                                    spellCheck={false}
                                    autoComplete='off'
                                  />
                                </label>
                                {catalogEditDonorKind === 'person' ?
                                  <label className={devViewPanelFieldClassName}>
                                    <span
                                      className={
                                        devViewPanelFieldLabelClassName
                                      }
                                    >
                                      Affiliation (optional)
                                    </span>
                                    <input
                                      className={devViewPanelInputClassName}
                                      type='text'
                                      value={catalogEditDonorAffiliation}
                                      onChange={(e) =>
                                        setCatalogEditDonorAffiliation(
                                          e.target.value,
                                        )
                                      }
                                      placeholder='e.g. ABC Foundation'
                                      spellCheck={false}
                                      autoComplete='off'
                                    />
                                  </label>
                                : null}
                                {(
                                  catalogEditDonorKind === 'organization' ||
                                  (catalogEditDonorKind === 'person' &&
                                    catalogEditDonorAffiliation.trim())
                                ) ?
                                  <>
                                    <label
                                      className={devViewPanelFieldClassName}
                                    >
                                      <span
                                        className={
                                          devViewPanelFieldLabelClassName
                                        }
                                      >
                                        {catalogEditDonorKind === 'person' ?
                                          'Affiliation website (optional)'
                                        : 'Donor website (optional)'}
                                      </span>
                                      <input
                                        className={devViewPanelInputClassName}
                                        type='url'
                                        value={catalogEditDonorWebsite}
                                        onChange={(e) =>
                                          setCatalogEditDonorWebsite(
                                            e.target.value,
                                          )
                                        }
                                        placeholder='https://…'
                                        spellCheck={false}
                                        autoComplete='off'
                                      />
                                    </label>
                                    <label
                                      className={devViewPanelFieldClassName}
                                    >
                                      <span
                                        className={
                                          devViewPanelFieldLabelClassName
                                        }
                                      >
                                        {catalogEditDonorLogoPreviewUrl ?
                                          catalogEditDonorKind === 'person' ?
                                            'Affiliation logo (replace)'
                                          : 'Donor logo (replace)'
                                        : catalogEditDonorKind === 'person' ?
                                          'Affiliation logo (optional)'
                                        : 'Donor logo (optional)'}
                                      </span>
                                      <DevPanelFileField
                                        {...(catalogEditDonorLogoFile != null ?
                                          { file: catalogEditDonorLogoFile }
                                        : {})}
                                        preview={
                                          catalogEditDonorLogoFile ?
                                            <DevLocalFilePreview
                                              file={catalogEditDonorLogoFile}
                                              className={
                                                devViewPanelBrandLogoClassName
                                              }
                                              alt='Donor logo preview'
                                            />
                                          : catalogEditDonorLogoPreviewUrl ?
                                            <img
                                              className={
                                                devViewPanelBrandLogoClassName
                                              }
                                              src={
                                                catalogEditDonorLogoPreviewUrl
                                              }
                                              alt='Current donor logo'
                                            />
                                          : null
                                        }
                                        onClearPreview={() => {
                                          if (catalogEditDonorLogoFile) {
                                            setCatalogEditDonorLogoFile(null);
                                            return;
                                          }
                                          if (catalogEditDonorLogoPath) {
                                            setCatalogEditClearDonorLogo(true);
                                          }
                                        }}
                                        showClear={Boolean(
                                          catalogEditDonorLogoFile ||
                                          catalogEditDonorLogoPreviewUrl,
                                        )}
                                        clearLabel={
                                          catalogEditDonorLogoFile ? 'Clear' : (
                                            'Remove'
                                          )
                                        }
                                      >
                                        <DevPanelFileInput
                                          accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                                          file={catalogEditDonorLogoFile}
                                          onChange={(file) => {
                                            setCatalogEditDonorLogoFile(file);
                                            if (file) {
                                              setCatalogEditClearDonorLogo(
                                                false,
                                              );
                                            }
                                          }}
                                        />
                                      </DevPanelFileField>
                                    </label>
                                  </>
                                : null}
                              </>
                            : null}
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Body (optional)
                              </span>
                              <DevPanelDescriptionTextarea
                                value={catalogEditBody}
                                onChange={(e) =>
                                  setCatalogEditBody(e.target.value)
                                }
                                placeholder={
                                  hostSceneBody || 'Uses scene description'
                                }
                              />
                              <p className={devViewPanelSectionHintClassName}>
                                Supports **bold** and *italic*.
                              </p>
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Video URL (optional)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='url'
                                value={catalogEditVideoUrl}
                                onChange={(e) =>
                                  setCatalogEditVideoUrl(e.target.value)
                                }
                                placeholder={
                                  (row.placement ?
                                    tour.scenes[row.placement.sceneId]
                                      ?.previewVideoUrl
                                  : undefined) || 'Uses scene preview video URL'
                                }
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Image path (optional)
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={catalogEditImage}
                                onChange={(e) =>
                                  setCatalogEditImage(e.target.value)
                                }
                                placeholder='/assets/…/photo.webp'
                                spellCheck={false}
                                autoComplete='off'
                              />
                            </label>
                            <div className={devViewPanelActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => setCatalogEditNamingId(null)}
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Cancel
                              </button>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'primary',
                                })}
                                onClick={() => void saveCatalogNamingEdit()}
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Save catalog
                              </button>
                            </div>
                          </DevPanelFormGroup>
                        : isDuplicating ?
                          <DevPanelFormGroup inline manageEdit>
                            <p className={devViewPanelSectionHintClassName}>
                              Duplicate “{row.displayName}” as a new naming
                              opportunity.
                            </p>
                            <div className={devViewPanelToggleListClassName}>
                              <label
                                className={
                                  devViewPanelToggleLabelMultilineClassName
                                }
                              >
                                <input
                                  type='checkbox'
                                  className={devViewPanelToggleInputClassName}
                                  checked={duplicateNamingIncludePlacements}
                                  onChange={(e) =>
                                    setDuplicateNamingIncludePlacements(
                                      e.currentTarget.checked,
                                    )
                                  }
                                  disabled={
                                    hotspotManageStatus === 'working' ||
                                    !hasPlacement
                                  }
                                />
                                <span
                                  className={
                                    devViewPanelFormCheckboxFieldClassName
                                  }
                                >
                                  <span
                                    className={devViewPanelToggleNameClassName}
                                  >
                                    Clone placement pin
                                  </span>
                                  <span
                                    className={devViewPanelToggleHintClassName}
                                  >
                                    {!hasPlacement ?
                                      'No placement pin on this naming — catalog entry only.'
                                    : duplicateNamingIncludePlacements ?
                                      'Also copy the hotspot on the same scene.'
                                    : 'Catalog only — place a pin later if needed.'
                                    }
                                  </span>
                                </span>
                              </label>
                              <label
                                className={
                                  devViewPanelToggleLabelMultilineClassName
                                }
                              >
                                <input
                                  type='checkbox'
                                  className={devViewPanelToggleInputClassName}
                                  checked={duplicateNamingResetAsOpen}
                                  onChange={(e) =>
                                    setDuplicateNamingResetAsOpen(
                                      e.currentTarget.checked,
                                    )
                                  }
                                  disabled={hotspotManageStatus === 'working'}
                                />
                                <span
                                  className={
                                    devViewPanelFormCheckboxFieldClassName
                                  }
                                >
                                  <span
                                    className={devViewPanelToggleNameClassName}
                                  >
                                    Reset as open
                                  </span>
                                  <span
                                    className={devViewPanelToggleHintClassName}
                                  >
                                    Set status to open and clear donor details
                                    on the copy.
                                  </span>
                                </span>
                              </label>
                            </div>
                            <div className={devViewPanelActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={() => setDuplicatingNamingId(null)}
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Cancel
                              </button>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'primary',
                                })}
                                onClick={() =>
                                  void duplicateNamingCatalogEntry()
                                }
                                disabled={hotspotManageStatus === 'working'}
                              >
                                Duplicate naming
                              </button>
                            </div>
                          </DevPanelFormGroup>
                        : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            : <p className={devViewPanelSectionHintClassName}>
                {namingCatalogRows.length === 0 ?
                  namingCatalogSectionConfig.emptyMessage
                : namingManageFilter === 'all' ?
                  namingCatalogSectionConfig.emptyMessage
                : `No ${namingOpportunityStatusConfig(namingManageFilter).label.toLowerCase()} naming opportunities.`
                }
              </p>
            }
            {hotspotManageError && catalogEditNamingId ?
              <p className={devViewPanelSectionHintClassName}>
                {hotspotManageError}
              </p>
            : null}
          </DevPanelFormGroup>
        </DevPanelSection>
      </>
    </DevPanelSectionAccordion>
  );
}
