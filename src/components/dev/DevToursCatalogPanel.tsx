import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  listRoutableTourIds,
  loadTour,
  removeDevTourCache,
  setDevTourCache,
  tryLoadTour,
} from '../../data/loadTour';
import { normalizeTourAssets } from '../../services/normalizeTourAssets';
import {
  listTourCategories,
  findCatalogClient,
  findCatalogTour,
  listCatalogClients,
  resolveCatalogTourVisibility,
} from '../../data/tourCatalog';
import {
  buildTourLocation,
  isRootPathWithoutTour,
  preservedSearchStringFrom,
  resolveSceneId,
} from '../../utils/tourPaths';
import { TOUR_PUBLIC_ORIGIN } from '../../constants/tourOrigin';
import { copyToClipboard } from '../../utils/clipboard';
import { getTourClientId } from '../../utils/tourClientId';
import { appendCacheBust, withBaseUrl } from '../../utils/assetUrl';
import {
  resolveClientLogoPath,
  resolveTourBranding,
  tourUsesCustomBranding,
} from '../../utils/resolveTourBranding';
import { getTourProductFullName } from '../../utils/tourProductName';
import {
  DEV_CATALOG_VISIBILITY_OPTIONS,
  type DevCatalogTourVisibility,
} from '../../constants/devPanel';
import type { TourCategory } from '../../constants/tourCategories';
import type { Tour, ViewPosition } from '../../types/tour';
import { toViewPosition } from '../../utils/devHotspotLogger';
import {
  allocateOpaqueId,
  createOpaqueId,
  OPAQUE_SCENE_ID_PREFIX,
  OPAQUE_TOUR_ID_PREFIX,
} from '../../utils/opaqueId';
import {
  DevTourApiError,
  devBase64ToImageFile,
  devCreateTour,
  devDeleteTour,
  devFetchTour,
  devFetchTourRecord,
  devSuggestBranding,
  devUpdateTour,
  refreshDevCatalogSnapshot,
  type DevCatalogClient,
  type DevTourBrandingMode,
  type DevTourMutateOptions,
} from '../../utils/devTourApi';
import { cn } from '../../lib/cn';
import {
  devViewPanelActionsClassName,
  devViewPanelInlineActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelIconBtnVariants,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelBrandFaviconClassName,
  devViewPanelBrandLogoClassName,
  devViewPanelInputClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSelectClassName,
  devViewPanelFormCheckboxInputClassName,
  devViewPanelFormCheckboxFieldClassName,
  devViewPanelFormCheckboxLabelClassName,
  devViewPanelFormCheckboxStackClassName,
  devViewPanelFormRadioInputClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelControlRadiusClassName,
  devViewPanelFormGroupTitleClassName,
  devViewPanelFormRadioLabelClassName,
  devViewPanelToggleListClassName,
  devViewPanelToggleNameClassName,
  devViewPanelManageListClassName,
  devViewPanelStackedFormFooterClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemBodyClassName,
  devViewPanelManageListItemContentClassName,
  devViewPanelManageListItemMainRowWithLogoClassName,
  devViewPanelManageListItemIconActionsClassName,
  devViewPanelManageListItemDescBulletItemClassName,
  devViewPanelManageListItemDescBulletListClassName,
  devViewPanelManageListItemDescStackClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemLogoClassName,
  devViewPanelManageListItemLogoWrapClassName,
  devViewPanelManageListItemTitleClassName,
  formatManageListItemId,
  devSceneManageBadgeVariants,
  devViewPanelManageListItemSceneBadgesClassName,
} from './devViewPanelVariants';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import { DevPanelFileField } from './DevPanelFileField';
import { DevPanelFileInput } from './DevPanelFileInput';
import { DevLocalFilePreview } from './DevLocalFilePreview';
import { DevPanoramaFilePreview } from './DevPanoramaFilePreview';
import {
  DevPanelColorField,
  normalizeHexColorInput,
} from './DevPanelColorField';
import {
  buildDevExperienceApiFields,
  DEFAULT_DEV_EXPERIENCE_FORM,
  DevPanelExperienceSection,
  type DevImmersiveMode,
} from './DevPanelExperienceSection';
import {
  DevPanelFormGroup,
  DevPanelFormRow,
  DevPanelFormSection,
} from './DevPanelFormGroup';
import { DevPanelDescriptionTextarea } from './DevPanelDescriptionTextarea';
import { Badge } from '../ui/Badge';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from '../ui/materialSymbolClasses';
import {
  catalogVisibilityManageBadgeLabel,
  catalogVisibilityShowsManageBadge,
} from '../../utils/sceneVisibility';
import { type ActionStatus } from './devViewPanelHelpers';

const DEFAULT_NEW_TOUR_PRIMARY_COLOR = '#007078';


type DevToursCatalogPanelProps = {
  tour: Tour;
  onTourMutated?: (options?: DevTourMutateOptions) => Promise<void>;
  view: ViewPosition | null;
  catalogTick: number;
  catalogClients: DevCatalogClient[];
  currentSceneId: string;
  active: boolean;
};

export function DevToursCatalogPanel({
  tour,
  onTourMutated,
  view,
  catalogTick,
  catalogClients,
  currentSceneId,
  active,
}: DevToursCatalogPanelProps) {
  const [, setTourCreateOpen] = useState(false);
  const [tourAddCloseKey, setTourAddCloseKey] = useState(0);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);
  const [tourLinkCopyState, setTourLinkCopyState] = useState<{
    id: string;
    status: 'copied' | 'failed';
  } | null>(null);
  const [newTourClientId, setNewTourClientId] = useState('');
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourSummary, setNewTourSummary] = useState('');
  const [newTourCategory, setNewTourCategory] =
    useState<TourCategory>('Healthcare');
  const [newTourVisibility, setNewTourVisibility] =
    useState<DevCatalogTourVisibility>('unlisted');
  const [newTourAskGuideEnabled, setNewTourAskGuideEnabled] = useState(false);
  const [newTourTransitionEffect, setNewTourTransitionEffect] = useState<
    'fade' | 'black'
  >(DEFAULT_DEV_EXPERIENCE_FORM.transitionEffect);
  const [newTourTransitionSpeed, setNewTourTransitionSpeed] = useState(
    DEFAULT_DEV_EXPERIENCE_FORM.transitionSpeed,
  );
  const [newTourImmersiveMode, setNewTourImmersiveMode] =
    useState<DevImmersiveMode>(DEFAULT_DEV_EXPERIENCE_FORM.immersiveMode);
  const [newTourImmersiveAudio, setNewTourImmersiveAudio] = useState(
    DEFAULT_DEV_EXPERIENCE_FORM.immersiveAudio,
  );
  const [newTourImmersivePlaylistText, setNewTourImmersivePlaylistText] =
    useState(DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistText);
  const [
    newTourImmersivePlaylistManifest,
    setNewTourImmersivePlaylistManifest,
  ] = useState(DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistManifest);
  const [newTourImmersiveVolume, setNewTourImmersiveVolume] = useState(
    DEFAULT_DEV_EXPERIENCE_FORM.immersiveVolume,
  );
  const [newTourPrimaryColor, setNewTourPrimaryColor] = useState(
    DEFAULT_NEW_TOUR_PRIMARY_COLOR,
  );
  const [newTourBrandingMode, setNewTourBrandingMode] =
    useState<DevTourBrandingMode>('client');
  const [newTourLogoAlt, setNewTourLogoAlt] = useState('');
  const [newTourLogoFile, setNewTourLogoFile] = useState<File | null>(null);
  const [newTourFaviconFile, setNewTourFaviconFile] = useState<File | null>(
    null,
  );
  const [suggestBrandingStatus, setSuggestBrandingStatus] =
    useState<ActionStatus>('idle');
  const [suggestBrandingNotes, setSuggestBrandingNotes] = useState<string[]>(
    [],
  );
  const [newFirstSceneTitle, setNewFirstSceneTitle] = useState('Overview');
  const [newTourPanoramaFile, setNewTourPanoramaFile] = useState<File | null>(
    null,
  );
  const [newTourStatus, setNewTourStatus] = useState<ActionStatus>('idle');
  const [newTourError, setNewTourError] = useState<string | null>(null);
  const [editTourTitle, setEditTourTitle] = useState('');
  const [editTourSummary, setEditTourSummary] = useState('');
  const [editTourCategory, setEditTourCategory] =
    useState<TourCategory>('Healthcare');
  const [editTourVisibility, setEditTourVisibility] =
    useState<DevCatalogTourVisibility>('unlisted');
  const [editTourAskGuideEnabled, setEditTourAskGuideEnabled] = useState(false);
  const [editTourPrimaryColor, setEditTourPrimaryColor] = useState(
    DEFAULT_NEW_TOUR_PRIMARY_COLOR,
  );
  const [editTourBrandingMode, setEditTourBrandingMode] =
    useState<DevTourBrandingMode>('client');
  const [editTourLogoAlt, setEditTourLogoAlt] = useState('');
  const [editTourFontFamily, setEditTourFontFamily] = useState('');
  const [editTourFontSourceUrl, setEditTourFontSourceUrl] = useState('');
  const [editTourProductFullName, setEditTourProductFullName] = useState('');
  const [editTransitionEffect, setEditTransitionEffect] = useState<
    'fade' | 'black'
  >('fade');
  const [editTransitionSpeed, setEditTransitionSpeed] = useState('500ms');
  const [editImmersiveMode, setEditImmersiveMode] = useState<
    'platform' | 'manifest' | 'audio' | 'playlist'
  >('platform');
  const [editImmersiveAudio, setEditImmersiveAudio] = useState('');
  const [editImmersivePlaylistText, setEditImmersivePlaylistText] =
    useState('');
  const [editImmersivePlaylistManifest, setEditImmersivePlaylistManifest] =
    useState('');
  const [editImmersiveVolume, setEditImmersiveVolume] = useState('');
  const [editTourLogoFile, setEditTourLogoFile] = useState<File | null>(null);
  const [editTourFaviconFile, setEditTourFaviconFile] = useState<File | null>(
    null,
  );
  const [editTourSuggestStatus, setEditTourSuggestStatus] =
    useState<ActionStatus>('idle');
  const [editTourSuggestNotes, setEditTourSuggestNotes] = useState<string[]>(
    [],
  );
  const [editTourStatus, setEditTourStatus] = useState<ActionStatus>('idle');
  const [editTourError, setEditTourError] = useState<string | null>(null);
  const [deleteTourConfirm, setDeleteTourConfirm] = useState('');
  const [deleteTourStatus, setDeleteTourStatus] =
    useState<ActionStatus>('idle');
  const [deleteTourError, setDeleteTourError] = useState<string | null>(null);
  const [pendingTourId, setPendingTourId] = useState(() =>
    createOpaqueId(OPAQUE_TOUR_ID_PREFIX),
  );
  const [pendingFirstSceneId, setPendingFirstSceneId] = useState(() =>
    createOpaqueId(OPAQUE_SCENE_ID_PREFIX),
  );
  const [tourManageClientFilter, setTourManageClientFilter] = useState('all');

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTourId = tour.id;
  const tourCategoryOptions = useMemo(() => listTourCategories(), []);
  const selectedCreateCatalogClient = useMemo(
    () => catalogClients.find((client) => client.id === newTourClientId),
    [catalogClients, newTourClientId],
  );
  const createTourClientWebsite = selectedCreateCatalogClient?.website ?? '';
  const openCatalogClient = useMemo(
    () => findCatalogClient(getTourClientId(tour)),
    [tour, catalogTick],
  );


  const catalogTourManageRows = useMemo(() => {
    return listCatalogClients()
      .flatMap((client) =>
        client.tours.map((entry) => {
          const loaded = tryLoadTour(entry.id);
          const branding =
            loaded ? resolveTourBranding(loaded) : client.branding;
          return {
            id: entry.id,
            title: entry.name,
            clientId: client.id,
            clientName: client.name,
            summary: entry.summary?.trim() || '',
            category: entry.category,
            visibility: resolveCatalogTourVisibility(entry),
            logoPath:
              (typeof branding?.logo === 'string' && branding.logo.trim()) ||
              resolveClientLogoPath(client.id, client.branding?.logo) ||
              '',
          };
        }),
      )
      .sort((a, b) => {
        const byClient = a.clientName.localeCompare(b.clientName, 'en');
        if (byClient !== 0) return byClient;
        return a.title.localeCompare(b.title, 'en');
      });
  }, [catalogTick]);
  const tourManageClientGroups = useMemo(() => {
    const byClient = new Map<
      string,
      { id: string; title: string; count: number }
    >();
    for (const row of catalogTourManageRows) {
      const existing = byClient.get(row.clientId);
      if (existing) {
        existing.count += 1;
        continue;
      }
      byClient.set(row.clientId, {
        id: row.clientId,
        title: row.clientName,
        count: 1,
      });
    }
    return [...byClient.values()].sort((a, b) =>
      a.title.localeCompare(b.title, 'en'),
    );
  }, [catalogTourManageRows]);
  const filteredCatalogTourManageRows = useMemo(() => {
    if (tourManageClientFilter === 'all') return catalogTourManageRows;
    return catalogTourManageRows.filter(
      (row) => row.clientId === tourManageClientFilter,
    );
  }, [catalogTourManageRows, tourManageClientFilter]);
  useEffect(() => {
    if (tourManageClientFilter === 'all') return;
    if (
      tourManageClientGroups.some(
        (group) => group.id === tourManageClientFilter,
      )
    ) {
      return;
    }
    setTourManageClientFilter('all');
  }, [tourManageClientFilter, tourManageClientGroups]);

  const trimmedNewTourTitle = newTourTitle.trim();
  const canCreateNewTour = Boolean(
    trimmedNewTourTitle &&
    newFirstSceneTitle.trim() &&
    pendingTourId &&
    pendingFirstSceneId &&
    newTourPanoramaFile &&
    newTourClientId,
  );


  const resetNewTourForm = useCallback((preferredClientId?: string) => {
    setNewTourTitle('');
    setNewTourSummary('');
    setNewTourCategory('Healthcare');
    setNewTourVisibility('unlisted');
    setNewTourAskGuideEnabled(false);
    setNewTourTransitionEffect(DEFAULT_DEV_EXPERIENCE_FORM.transitionEffect);
    setNewTourTransitionSpeed(DEFAULT_DEV_EXPERIENCE_FORM.transitionSpeed);
    setNewTourImmersiveMode(DEFAULT_DEV_EXPERIENCE_FORM.immersiveMode);
    setNewTourImmersiveAudio(DEFAULT_DEV_EXPERIENCE_FORM.immersiveAudio);
    setNewTourImmersivePlaylistText(
      DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistText,
    );
    setNewTourImmersivePlaylistManifest(
      DEFAULT_DEV_EXPERIENCE_FORM.immersivePlaylistManifest,
    );
    setNewTourImmersiveVolume(DEFAULT_DEV_EXPERIENCE_FORM.immersiveVolume);
    setNewTourPrimaryColor(DEFAULT_NEW_TOUR_PRIMARY_COLOR);
    setNewTourBrandingMode('client');
    setNewTourLogoAlt('');
    setNewTourLogoFile(null);
    setNewTourFaviconFile(null);
    setNewFirstSceneTitle('Overview');
    setNewTourPanoramaFile(null);
    setSuggestBrandingNotes([]);
    setSuggestBrandingStatus('idle');
    setNewTourStatus('idle');
    setNewTourError(null);
    setNewTourClientId(preferredClientId ?? '');
    const takenTours = listRoutableTourIds();
    setPendingTourId(allocateOpaqueId(OPAQUE_TOUR_ID_PREFIX, takenTours));
    setPendingFirstSceneId(createOpaqueId(OPAQUE_SCENE_ID_PREFIX));
  }, []);

  const canSaveEditTour = Boolean(editTourTitle.trim() && editTourCategory);
  const editingTourSource = useMemo(() => {
    if (!editingTourId) return tour;
    if (editingTourId === tour.id) return tour;
    return tryLoadTour(editingTourId) ?? tour;
  }, [editingTourId, tour, catalogTick]);
  const editTourProductNamePreview = useMemo(
    () =>
      getTourProductFullName({
        ...editingTourSource,
        title: editTourTitle.trim() || editingTourSource.title,
        productFullName: editTourProductFullName.trim() || undefined,
      }),
    [editTourProductFullName, editTourTitle, editingTourSource],
  );
  const canDeleteTour = Boolean(
    deletingTourId && deleteTourConfirm.trim() === deletingTourId,
  );

  useEffect(() => {
    if (!editingTourId) return;

    const targetId = editingTourId;
    const loaded =
      targetId === tour.id ? tour : (tryLoadTour(targetId) ?? null);
    let clientId = loaded ? getTourClientId(loaded) : '';
    let catalogEntry =
      clientId ? findCatalogTour(clientId, targetId) : undefined;
    if (!catalogEntry) {
      for (const client of listCatalogClients()) {
        const entry = client.tours.find((item) => item.id === targetId);
        if (entry) {
          clientId = client.id;
          catalogEntry = entry;
          break;
        }
      }
    }
    const catalogClient = findCatalogClient(clientId);

    setEditTourTitle(loaded?.title ?? catalogEntry?.name ?? '');
    setEditTourSummary(catalogEntry?.summary ?? '');
    setEditTourCategory(
      (loaded?.category as TourCategory | undefined) ??
        catalogEntry?.category ??
        'Healthcare',
    );
    setEditTourVisibility(
      catalogEntry ? resolveCatalogTourVisibility(catalogEntry) : 'unlisted',
    );
    setEditTourAskGuideEnabled(loaded?.askGuideEnabled === true);

    const brandingTour = loaded ?? tour;
    const usesCustomBranding = loaded ? tourUsesCustomBranding(loaded) : false;
    setEditTourBrandingMode(usesCustomBranding ? 'custom' : 'client');
    const brandingSource =
      usesCustomBranding ? brandingTour.branding : catalogClient?.branding;
    setEditTourPrimaryColor(
      brandingSource?.primaryColor ?? DEFAULT_NEW_TOUR_PRIMARY_COLOR,
    );
    setEditTourLogoAlt(brandingSource?.logoAlt ?? catalogClient?.name ?? '');
    setEditTourFontFamily(brandingSource?.fontFamily ?? '');
    setEditTourFontSourceUrl(brandingSource?.fontSourceUrl ?? '');
    setEditTourLogoFile(null);
    setEditTourFaviconFile(null);
    setEditTourSuggestNotes([]);
    setEditTourSuggestStatus('idle');
    setEditTourStatus('idle');
    setEditTourError(null);

    if (!active) return;

    let cancelled = false;
    void devFetchTourRecord(targetId)
      .then(({ tour: rawTour, catalog }) => {
        if (cancelled) return;

        if (catalog) {
          setEditTourVisibility(catalog.visibility);
          setEditTourSummary(catalog.summary);
        }

        setEditTourTitle(rawTour.title);
        setEditTourProductFullName(rawTour.productFullName ?? '');
        setEditTourAskGuideEnabled(rawTour.askGuideEnabled === true);
        setEditTourCategory(
          (rawTour.category as TourCategory | undefined) ?? 'Healthcare',
        );
        setEditTransitionEffect(rawTour.defaultTransition?.effect ?? 'fade');
        setEditTransitionSpeed(rawTour.defaultTransition?.speed ?? '500ms');

        const fetchClient = findCatalogClient(getTourClientId(rawTour));
        const usesCustom = tourUsesCustomBranding(rawTour);
        setEditTourBrandingMode(usesCustom ? 'custom' : 'client');
        const fetchBranding =
          usesCustom ? rawTour.branding : fetchClient?.branding;
        setEditTourPrimaryColor(
          fetchBranding?.primaryColor ?? DEFAULT_NEW_TOUR_PRIMARY_COLOR,
        );
        setEditTourLogoAlt(fetchBranding?.logoAlt ?? fetchClient?.name ?? '');
        setEditTourFontFamily(fetchBranding?.fontFamily ?? '');
        setEditTourFontSourceUrl(fetchBranding?.fontSourceUrl ?? '');

        const immersive = rawTour.immersiveBackground;
        if (!immersive) {
          setEditImmersiveMode('platform');
          setEditImmersiveAudio('');
          setEditImmersivePlaylistText('');
          setEditImmersivePlaylistManifest('');
          setEditImmersiveVolume('');
          return;
        }

        if (immersive.playlistManifest) {
          setEditImmersiveMode('manifest');
          setEditImmersivePlaylistManifest(immersive.playlistManifest);
          setEditImmersiveAudio('');
          setEditImmersivePlaylistText('');
        } else if (immersive.audio) {
          setEditImmersiveMode('audio');
          setEditImmersiveAudio(immersive.audio);
          setEditImmersivePlaylistManifest('');
          setEditImmersivePlaylistText('');
        } else if (immersive.playlist?.length) {
          setEditImmersiveMode('playlist');
          setEditImmersivePlaylistText(immersive.playlist.join('\n'));
          setEditImmersiveAudio('');
          setEditImmersivePlaylistManifest('');
        } else {
          setEditImmersiveMode('manifest');
          setEditImmersivePlaylistManifest('');
          setEditImmersiveAudio('');
          setEditImmersivePlaylistText('');
        }

        setEditImmersiveVolume(
          immersive.volume !== undefined ? String(immersive.volume) : '',
        );
      })
      .catch(() => {
        /* catalog entry may be missing for legacy tours */
      });

    return () => {
      cancelled = true;
    };
  }, [active, editingTourId]);

  const suggestEditTourBranding = useCallback(async () => {
    const editClientId = getTourClientId(editingTourSource);
    const websiteUrl =
      findCatalogClient(editClientId)?.website?.trim() ??
      openCatalogClient?.website?.trim() ??
      '';
    if (!websiteUrl) return;

    setEditTourSuggestStatus('working');
    setEditTourSuggestNotes([]);

    try {
      const result = await devSuggestBranding(websiteUrl);
      if (result.primaryColor) {
        setEditTourPrimaryColor(result.primaryColor);
      }
      if (result.logoFileBase64 && result.logoFileName) {
        setEditTourLogoFile(
          devBase64ToImageFile(result.logoFileBase64, result.logoFileName),
        );
      }
      if (result.faviconFileBase64 && result.faviconFileName) {
        setEditTourFaviconFile(
          devBase64ToImageFile(
            result.faviconFileBase64,
            result.faviconFileName,
          ),
        );
      }
      setEditTourSuggestNotes(result.notes);
      setEditTourSuggestStatus('done');
    } catch (error) {
      setEditTourSuggestStatus('error');
      setEditTourSuggestNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest branding from website',
      ]);
    }
  }, [editingTourSource, openCatalogClient?.website]);

  const saveEditTour = useCallback(async () => {
    const targetTourId = editingTourId;
    if (!canSaveEditTour || !targetTourId) return;

    setEditTourStatus('working');
    setEditTourError(null);

    try {
      await devUpdateTour({
        tourId: targetTourId,
        tourTitle: editTourTitle.trim(),
        tourSummary: editTourSummary,
        category: editTourCategory,
        brandingMode: editTourBrandingMode,
        primaryColor: normalizeHexColorInput(editTourPrimaryColor),
        logoAlt: editTourLogoAlt.trim() || undefined,
        fontFamily: editTourFontFamily,
        fontSourceUrl: editTourFontSourceUrl,
        productFullName: editTourProductFullName,
        ...buildDevExperienceApiFields({
          transitionEffect: editTransitionEffect,
          transitionSpeed: editTransitionSpeed,
          immersiveMode: editImmersiveMode,
          immersiveAudio: editImmersiveAudio,
          immersivePlaylistText: editImmersivePlaylistText,
          immersivePlaylistManifest: editImmersivePlaylistManifest,
          immersiveVolume: editImmersiveVolume,
        }),
        logoFile: editTourLogoFile,
        faviconFile: editTourFaviconFile,
        visibility: editTourVisibility,
        askGuideEnabled: editTourAskGuideEnabled,
      });
      setEditTourLogoFile(null);
      setEditTourFaviconFile(null);
      if (targetTourId !== tour.id) {
        removeDevTourCache(targetTourId);
      } else {
        await onTourMutated?.();
      }
      await refreshDevCatalogSnapshot();
      setEditTourStatus('done');
      setEditingTourId(null);
    } catch (error) {
      setEditTourStatus('error');
      setEditTourError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save tour',
      );
    }
  }, [
    canSaveEditTour,
    editImmersiveAudio,
    editImmersiveMode,
    editImmersivePlaylistManifest,
    editImmersivePlaylistText,
    editImmersiveVolume,
    editTourAskGuideEnabled,
    editTourCategory,
    editTourFaviconFile,
    editTourFontFamily,
    editTourFontSourceUrl,
    editTourProductFullName,
    editTransitionEffect,
    editTransitionSpeed,
    editTourLogoAlt,
    editTourLogoFile,
    editTourBrandingMode,
    editTourPrimaryColor,
    editTourTitle,
    editTourSummary,
    editTourVisibility,
    editingTourId,
    onTourMutated,
    tour.id,
  ]);

  const deleteManagedTour = useCallback(async () => {
    if (!canDeleteTour || !deletingTourId) return;

    const targetTourId = deletingTourId;
    setDeleteTourStatus('working');
    setDeleteTourError(null);

    try {
      const result = await devDeleteTour({
        tourId: targetTourId,
        confirmTourId: deleteTourConfirm.trim(),
      });

      removeDevTourCache(targetTourId);
      await refreshDevCatalogSnapshot();
      setDeletingTourId(null);
      setDeleteTourConfirm('');
      setEditingTourId((current) =>
        current === targetTourId ? null : current,
      );

      const wasOpenTour = targetTourId === tour.id;
      if (!wasOpenTour) {
        setDeleteTourStatus('done');
        return;
      }

      const resolveNextTour = async (tourId: string): Promise<Tour | null> => {
        try {
          const fresh = normalizeTourAssets(await devFetchTour(tourId));
          setDevTourCache(fresh);
          return fresh;
        } catch {
          return tryLoadTour(tourId);
        }
      };

      const nextTourId =
        result.redirectTourId ?? listRoutableTourIds()[0] ?? null;

      if (nextTourId) {
        const nextTour = await resolveNextTour(nextTourId);
        if (nextTour) {
          navigate(
            buildTourLocation(
              nextTour.id,
              nextTour.firstScene,
              nextTour.firstScene,
              searchParams,
            ),
            { replace: true },
          );
          return;
        }
      }

      navigate(`/${preservedSearchStringFrom(searchParams)}`, {
        replace: true,
      });
    } catch (error) {
      setDeleteTourStatus('error');
      setDeleteTourError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not delete tour',
      );
    }
  }, [
    canDeleteTour,
    deleteTourConfirm,
    deletingTourId,
    navigate,
    searchParams,
    tour.id,
  ]);

  const startDeleteTour = useCallback((tourId: string) => {
    setTourCreateOpen(false);
    setEditingTourId(null);
    setDeletingTourId(tourId);
    setDeleteTourConfirm('');
    setDeleteTourStatus('idle');
    setDeleteTourError(null);
  }, []);

  const cancelDeleteTour = useCallback(() => {
    setDeletingTourId(null);
    setDeleteTourConfirm('');
    setDeleteTourStatus('idle');
    setDeleteTourError(null);
  }, []);

  const suggestNewTourBranding = useCallback(async () => {
    const websiteUrl = createTourClientWebsite.trim();
    if (!websiteUrl) return;

    setSuggestBrandingStatus('working');
    setSuggestBrandingNotes([]);

    try {
      const result = await devSuggestBranding(websiteUrl);
      if (result.primaryColor) {
        setNewTourPrimaryColor(result.primaryColor);
      }
      if (result.logoFileBase64 && result.logoFileName) {
        setNewTourLogoFile(
          devBase64ToImageFile(result.logoFileBase64, result.logoFileName),
        );
      }
      if (result.faviconFileBase64 && result.faviconFileName) {
        setNewTourFaviconFile(
          devBase64ToImageFile(
            result.faviconFileBase64,
            result.faviconFileName,
          ),
        );
      }
      setSuggestBrandingNotes(result.notes);
      setSuggestBrandingStatus('done');
    } catch (error) {
      setSuggestBrandingStatus('error');
      setSuggestBrandingNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest branding from website',
      ]);
    }
  }, [createTourClientWebsite]);

  const createNewTour = useCallback(async () => {
    if (!canCreateNewTour || !newTourPanoramaFile || !pendingTourId) return;

    setNewTourStatus('working');
    setNewTourError(null);

    try {
      const result = await devCreateTour({
        clientId: newTourClientId,
        tourId: pendingTourId,
        tourTitle: trimmedNewTourTitle || pendingTourId,
        tourSummary: newTourSummary.trim() || undefined,
        category: newTourCategory,
        firstSceneTitle: newFirstSceneTitle.trim(),
        firstSceneId: pendingFirstSceneId,
        panoramaFile: newTourPanoramaFile,
        logoFile: newTourBrandingMode === 'custom' ? newTourLogoFile : null,
        faviconFile:
          newTourBrandingMode === 'custom' ? newTourFaviconFile : null,
        primaryColor:
          newTourBrandingMode === 'custom' ?
            normalizeHexColorInput(newTourPrimaryColor)
          : undefined,
        logoAlt:
          newTourBrandingMode === 'custom' ?
            newTourLogoAlt.trim() || undefined
          : undefined,
        defaultView:
          view ?
            toViewPosition(view.yaw, view.pitch, view.zoom ?? 0)
          : undefined,
        visibility: newTourVisibility,
        askGuideEnabled: newTourAskGuideEnabled,
        brandingMode: newTourBrandingMode,
        ...buildDevExperienceApiFields({
          transitionEffect: newTourTransitionEffect,
          transitionSpeed: newTourTransitionSpeed,
          immersiveMode: newTourImmersiveMode,
          immersiveAudio: newTourImmersiveAudio,
          immersivePlaylistText: newTourImmersivePlaylistText,
          immersivePlaylistManifest: newTourImmersivePlaylistManifest,
          immersiveVolume: newTourImmersiveVolume,
        }),
      });

      const freshTour = normalizeTourAssets(result.tour);
      setDevTourCache(freshTour);
      await refreshDevCatalogSnapshot();

      navigate(
        buildTourLocation(
          result.tourId,
          result.firstSceneId,
          result.firstSceneId,
          searchParams,
        ),
      );
    } catch (error) {
      setNewTourStatus('error');
      setNewTourError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create tour',
      );
    }
  }, [
    canCreateNewTour,
    navigate,
    newFirstSceneTitle,
    newTourBrandingMode,
    newTourCategory,
    newTourClientId,
    newTourFaviconFile,
    newTourLogoAlt,
    newTourLogoFile,
    newTourPanoramaFile,
    newTourPrimaryColor,
    newTourAskGuideEnabled,
    newTourImmersiveAudio,
    newTourImmersiveMode,
    newTourImmersivePlaylistManifest,
    newTourImmersivePlaylistText,
    newTourImmersiveVolume,
    pendingFirstSceneId,
    pendingTourId,
    newTourSummary,
    newTourTransitionEffect,
    newTourTransitionSpeed,
    newTourVisibility,
    searchParams,
    trimmedNewTourTitle,
    view,
  ]);

  const handleSwitchTour = useCallback(
    (nextTourId: string) => {
      if (!nextTourId) return;
      const atRootWithoutTour = isRootPathWithoutTour(location.pathname);
      if (nextTourId === currentTourId && !atRootWithoutTour) return;
      const nextTour = loadTour(nextTourId);
      const nextSceneId = resolveSceneId(nextTourId, currentSceneId);
      navigate(
        buildTourLocation(
          nextTourId,
          nextSceneId,
          nextTour.firstScene,
          searchParams,
          { intro: null },
        ),
        { replace: true },
      );
    },
    [currentSceneId, currentTourId, location.pathname, navigate, searchParams],
  );


  const startEditTour = useCallback((tourId: string) => {
    setTourCreateOpen(false);
    setDeletingTourId(null);
    setDeleteTourConfirm('');
    setDeleteTourStatus('idle');
    setDeleteTourError(null);
    setEditingTourId(tourId);
  }, []);

  const cancelEditTour = useCallback(() => {
    setEditingTourId(null);
    setEditTourStatus('idle');
    setEditTourError(null);
  }, []);

  const copyTourPublicLink = useCallback(async (tourId: string) => {
    const ok = await copyToClipboard(`${TOUR_PUBLIC_ORIGIN}/${tourId}`);
    setTourLinkCopyState({ id: tourId, status: ok ? 'copied' : 'failed' });
    window.setTimeout(
      () => {
        setTourLinkCopyState((prev) => (prev?.id === tourId ? null : prev));
      },
      ok ? 1600 : 2000,
    );
  }, []);

  useEffect(() => {
    if (newTourStatus === 'idle' && editTourStatus === 'idle') return;
    const t = window.setTimeout(() => {
      if (newTourStatus !== 'working') {
        setNewTourStatus('idle');
        setNewTourError(null);
      }
      if (editTourStatus !== 'working') {
        setEditTourStatus('idle');
        setEditTourError(null);
      }
    }, 2500);
    return () => window.clearTimeout(t);
  }, [editTourStatus, newTourStatus]);


  const createTourBrandingSection = (
    <DevPanelFormSection
      title='Branding (optional)'
      divided
      description='Choose whether this tour inherits the client brand or uses its own.'
    >
      <div className={devViewPanelToggleListClassName}>
        <label className={devViewPanelFormRadioLabelClassName}>
          <input
            className={devViewPanelFormRadioInputClassName}
            type='radio'
            name='new-tour-branding-mode'
            checked={newTourBrandingMode === 'client'}
            onChange={() => setNewTourBrandingMode('client')}
          />
          <span className={devViewPanelToggleNameClassName}>
            Use client branding
          </span>
        </label>
        <label className={devViewPanelFormRadioLabelClassName}>
          <input
            className={devViewPanelFormRadioInputClassName}
            type='radio'
            name='new-tour-branding-mode'
            checked={newTourBrandingMode === 'custom'}
            onChange={() => setNewTourBrandingMode('custom')}
          />
          <span className={devViewPanelToggleNameClassName}>
            Custom branding for this tour
          </span>
        </label>
      </div>
      <p className={devViewPanelSectionHintClassName}>
        {newTourBrandingMode === 'client' ?
          selectedCreateCatalogClient ?
            `Inherits ${selectedCreateCatalogClient.name} branding from the Client tab. Edit shared branding there.`
          : 'Select a client to inherit its catalog branding.'
        : 'Logo and colors are saved on this tour only.'}
      </p>

      {newTourBrandingMode === 'custom' ?
        <>
          <div className='flex flex-col gap-1'>
            <div className={devViewPanelInlineActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => void suggestNewTourBranding()}
                disabled={
                  !createTourClientWebsite.trim() ||
                  suggestBrandingStatus === 'working'
                }
              >
                {suggestBrandingStatus === 'working' ?
                  'Suggesting…'
                : 'Suggest from website'}
              </button>
            </div>
            <p className={devViewPanelSectionHintClassName}>
              Uses the client website from the Client tab to draft logo,
              favicon, and primary color — review before saving.
            </p>
          </div>

          {suggestBrandingNotes.length > 0 ?
            <ul className={devViewPanelSectionHintClassName}>
              {suggestBrandingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          : null}

          <DevPanelColorField
            label='Primary color'
            value={newTourPrimaryColor}
            onChange={setNewTourPrimaryColor}
            defaultColor={DEFAULT_NEW_TOUR_PRIMARY_COLOR}
            pickerAriaLabel='Primary color picker'
          />

          <label className={devViewPanelFieldClassName}>
            <span className={devViewPanelFieldLabelClassName}>
              Logo alt text
            </span>
            <input
              className={devViewPanelInputClassName}
              type='text'
              value={newTourLogoAlt}
              onChange={(e) => setNewTourLogoAlt(e.target.value)}
              placeholder={trimmedNewTourTitle || 'Tour title'}
              spellCheck={true}
              autoComplete='off'
            />
          </label>

          <DevPanelFormRow>
            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>Logo</span>
              <DevPanelFileField
                file={newTourLogoFile}
                preview={
                  newTourLogoFile ?
                    <DevLocalFilePreview
                      file={newTourLogoFile}
                      className={devViewPanelBrandLogoClassName}
                      alt='Logo preview'
                    />
                  : null
                }
                onClearPreview={() => setNewTourLogoFile(null)}
                showClear={Boolean(newTourLogoFile)}
              >
                <DevPanelFileInput
                  accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                  file={newTourLogoFile}
                  onChange={setNewTourLogoFile}
                />
              </DevPanelFileField>
            </label>

            <label className={devViewPanelFieldClassName}>
              <span className={devViewPanelFieldLabelClassName}>
                Favicon (optional)
              </span>
              <DevPanelFileField
                file={newTourFaviconFile}
                preview={
                  newTourFaviconFile ?
                    <DevLocalFilePreview
                      file={newTourFaviconFile}
                      className={devViewPanelBrandFaviconClassName}
                      alt='Favicon preview'
                    />
                  : null
                }
                onClearPreview={() => setNewTourFaviconFile(null)}
                showClear={Boolean(newTourFaviconFile)}
              >
                <DevPanelFileInput
                  accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                  file={newTourFaviconFile}
                  onChange={setNewTourFaviconFile}
                />
              </DevPanelFileField>
            </label>
          </DevPanelFormRow>
        </>
      : null}
    </DevPanelFormSection>
  );

  return (
    <DevPanelSectionAccordion
      persistKey='tab:tour'
      defaultOpenIndex={1}
      ensureCloseIndex={0}
      ensureCloseKey={tourAddCloseKey}
    >
                <DevPanelSection
                  title='Add tour'
                  description='Create a new tour under a catalog client, with a first scene panorama.'
                >
                  <DevPanelFormGroup stacked>
                    <DevPanelFormSection title='Client'>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Client
                        </span>
                        <select
                          className={devViewPanelSelectClassName}
                          value={newTourClientId}
                          onChange={(e) => setNewTourClientId(e.target.value)}
                        >
                          {catalogClients.length === 0 ?
                            <option value=''>Loading clients…</option>
                          : <>
                              <option value=''>Select client…</option>
                              {catalogClients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.name} ({client.id}) ·{' '}
                                  {client.tourCount} tour
                                  {client.tourCount === 1 ? '' : 's'}
                                </option>
                              ))}
                            </>
                          }
                        </select>
                        <p className={devViewPanelSectionHintClassName}>
                          Tours belong to a catalog client. Create clients on
                          the Client tab first if needed.
                        </p>
                      </label>
                      {catalogClients.length === 0 ?
                        <p className={devViewPanelSectionHintClassName}>
                          No clients yet — create one on the Client tab.
                        </p>
                      : null}
                    </DevPanelFormSection>

                    <DevPanelFormSection title='Tour details' divided>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Tour title
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='text'
                          value={newTourTitle}
                          onChange={(e) => setNewTourTitle(e.target.value)}
                          placeholder='e.g. Main Campus'
                          spellCheck={false}
                          autoComplete='off'
                        />
                      </label>

                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          Tour summary (optional)
                        </span>
                        <DevPanelDescriptionTextarea
                          value={newTourSummary}
                          onChange={(e) => setNewTourSummary(e.target.value)}
                          placeholder='Short marketing blurb for gallery cards and share previews'
                          spellCheck={true}
                        />
                        <p className={devViewPanelSectionHintClassName}>
                          Saved to <code>catalog.json</code> with the tour entry
                          (1–2 sentences).
                        </p>
                      </label>

                      <DevPanelFormRow>
                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Category
                          </span>
                          <select
                            className={devViewPanelSelectClassName}
                            value={newTourCategory}
                            onChange={(e) =>
                              setNewTourCategory(e.target.value as TourCategory)
                            }
                          >
                            {tourCategoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={devViewPanelFieldClassName}>
                          <span className={devViewPanelFieldLabelClassName}>
                            Catalog visibility
                          </span>
                          <select
                            className={devViewPanelSelectClassName}
                            value={newTourVisibility}
                            onChange={(e) =>
                              setNewTourVisibility(
                                e.target.value as DevCatalogTourVisibility,
                              )
                            }
                          >
                            {DEV_CATALOG_VISIBILITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </DevPanelFormRow>

                      <DevPanelFormRow>
                        <div className={devViewPanelFormCheckboxStackClassName}>
                          <label
                            className={devViewPanelFormCheckboxLabelClassName}
                          >
                            <input
                              className={devViewPanelFormCheckboxInputClassName}
                              type='checkbox'
                              checked={newTourAskGuideEnabled}
                              onChange={(e) =>
                                setNewTourAskGuideEnabled(e.target.checked)
                              }
                            />
                            <span
                              className={devViewPanelFormCheckboxFieldClassName}
                            >
                              <span className={devViewPanelToggleNameClassName}>
                                Enable Ask Tour Guide
                              </span>
                              <p className={devViewPanelSectionHintClassName}>
                                Shows the Tour Guide FAB and Help guidance on
                                this tour. Debug can force with{' '}
                                <code>?askGuide=1</code> /{' '}
                                <code>?askGuide=0</code>.
                              </p>
                            </span>
                          </label>
                        </div>
                      </DevPanelFormRow>
                    </DevPanelFormSection>

                    <DevPanelExperienceSection
                      divided
                      transitionEffect={newTourTransitionEffect}
                      onTransitionEffectChange={setNewTourTransitionEffect}
                      transitionSpeed={newTourTransitionSpeed}
                      onTransitionSpeedChange={setNewTourTransitionSpeed}
                      immersiveMode={newTourImmersiveMode}
                      onImmersiveModeChange={setNewTourImmersiveMode}
                      immersiveAudio={newTourImmersiveAudio}
                      onImmersiveAudioChange={setNewTourImmersiveAudio}
                      immersivePlaylistText={newTourImmersivePlaylistText}
                      onImmersivePlaylistTextChange={
                        setNewTourImmersivePlaylistText
                      }
                      immersivePlaylistManifest={
                        newTourImmersivePlaylistManifest
                      }
                      onImmersivePlaylistManifestChange={
                        setNewTourImmersivePlaylistManifest
                      }
                      immersiveVolume={newTourImmersiveVolume}
                      onImmersiveVolumeChange={setNewTourImmersiveVolume}
                    />

                    {createTourBrandingSection}

                    <DevPanelFormSection title='First scene' divided>
                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          First scene title
                        </span>
                        <input
                          className={devViewPanelInputClassName}
                          type='text'
                          value={newFirstSceneTitle}
                          onChange={(e) =>
                            setNewFirstSceneTitle(e.target.value)
                          }
                          placeholder='e.g. Overview'
                          spellCheck={false}
                          autoComplete='off'
                        />
                      </label>

                      <label className={devViewPanelFieldClassName}>
                        <span className={devViewPanelFieldLabelClassName}>
                          First panorama
                        </span>
                        <DevPanelFileField
                          file={newTourPanoramaFile}
                          preview={
                            newTourPanoramaFile ?
                              <DevPanoramaFilePreview
                                file={newTourPanoramaFile}
                              />
                            : null
                          }
                          onClearPreview={() => setNewTourPanoramaFile(null)}
                          showClear={Boolean(newTourPanoramaFile)}
                        >
                          <DevPanelFileInput
                            accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                            file={newTourPanoramaFile}
                            onChange={setNewTourPanoramaFile}
                          />
                        </DevPanelFileField>
                      </label>

                      {pendingTourId && pendingFirstSceneId ?
                        <p className={devViewPanelSlugPreviewClassName}>
                          opaque tour id <code>{pendingTourId}</code> · opaque
                          scene id <code>{pendingFirstSceneId}</code> ·{' '}
                          <code>
                            assets/{newTourClientId}/{pendingTourId}/panoramas/
                            {pendingFirstSceneId}.webp
                          </code>{' '}
                          · catalog <code>{newTourVisibility}</code>
                        </p>
                      : null}
                    </DevPanelFormSection>

                    <div className={devViewPanelStackedFormFooterClassName}>
                      {newTourError ?
                        <p className={devViewPanelSectionHintClassName}>
                          {newTourError}
                        </p>
                      : null}

                      <div className={devViewPanelInlineActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'secondary',
                          })}
                          onClick={() => {
                            resetNewTourForm(newTourClientId || undefined);
                            setNewTourStatus('idle');
                            setNewTourError(null);
                            setTourCreateOpen(false);
                            setTourAddCloseKey((key) => key + 1);
                          }}
                          disabled={newTourStatus === 'working'}
                        >
                          Cancel
                        </button>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'primary',
                          })}
                          onClick={() => void createNewTour()}
                          disabled={
                            !canCreateNewTour || newTourStatus === 'working'
                          }
                        >
                          {newTourStatus === 'working' ?
                            'Creating…'
                          : newTourStatus === 'done' ?
                            'Created!'
                          : 'Create tour'}
                        </button>
                      </div>
                    </div>
                  </DevPanelFormGroup>
                </DevPanelSection>

                <DevPanelSection
                  title='Manage tours'
                  description='All catalog tours — open one in the viewer, or edit settings inline.'
                >
                  {tourManageClientGroups.length > 0 ?
                    <label className={devViewPanelFieldClassName}>
                      <span className={devViewPanelFieldLabelClassName}>
                        Filter by client
                      </span>
                      <select
                        className={devViewPanelSelectClassName}
                        value={tourManageClientFilter}
                        onChange={(e) => {
                          setTourManageClientFilter(e.target.value);
                          setEditingTourId(null);
                          setDeletingTourId(null);
                        }}
                        disabled={
                          editTourStatus === 'working' ||
                          deleteTourStatus === 'working'
                        }
                      >
                        <option value='all'>
                          All tours ({catalogTourManageRows.length})
                        </option>
                        {tourManageClientGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.title} ({group.count})
                          </option>
                        ))}
                      </select>
                    </label>
                  : null}
                  <DevPanelFormGroup>
                    {filteredCatalogTourManageRows.length > 0 ?
                      <ul className={devViewPanelManageListClassName}>
                        {filteredCatalogTourManageRows.map((entry) => {
                          const isCurrent = entry.id === tour.id;
                          const isEditing = editingTourId === entry.id;
                          const isDeleting = deletingTourId === entry.id;
                          const logoUrl =
                            entry.logoPath ?
                              withBaseUrl(
                                appendCacheBust(entry.logoPath, catalogTick),
                              )
                            : null;
                          const busy =
                            editTourStatus === 'working' ||
                            deleteTourStatus === 'working';
                          return (
                            <li
                              key={entry.id}
                              className={cn(
                                devViewPanelManageListItemClassName,
                                (isEditing || isCurrent || isDeleting) &&
                                  devViewPanelManageListItemActiveClassName,
                              )}
                            >
                              <div
                                className={
                                  devViewPanelManageListItemBodyClassName
                                }
                              >
                                <div
                                  className={
                                    devViewPanelManageListItemMainRowWithLogoClassName
                                  }
                                >
                                  {logoUrl ?
                                    <span
                                      className={
                                        devViewPanelManageListItemLogoWrapClassName
                                      }
                                    >
                                      <img
                                        className={
                                          devViewPanelManageListItemLogoClassName
                                        }
                                        src={logoUrl}
                                        alt=''
                                      />
                                    </span>
                                  : null}
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
                                        {entry.title}
                                      </span>
                                    </div>
                                    {catalogVisibilityShowsManageBadge(
                                      entry.visibility,
                                    ) ?
                                      <div
                                        className={
                                          devViewPanelManageListItemSceneBadgesClassName
                                        }
                                      >
                                        <Badge
                                          variant='fill'
                                          size='sm'
                                          tone='none'
                                          className={devSceneManageBadgeVariants(
                                            { kind: entry.visibility },
                                          )}
                                        >
                                          {catalogVisibilityManageBadgeLabel(
                                            entry.visibility,
                                          )}
                                        </Badge>
                                      </div>
                                    : null}
                                  </div>
                                  <div
                                    className={
                                      devViewPanelManageListItemIconActionsClassName
                                    }
                                  >
                                    <button
                                      type='button'
                                      className={devViewPanelIconBtnVariants({
                                        tone: 'secondary',
                                      })}
                                      onClick={() => {
                                        setDeletingTourId(null);
                                        setEditingTourId(null);
                                        handleSwitchTour(entry.id);
                                      }}
                                      disabled={busy}
                                      aria-label={`Open ${entry.title}`}
                                      title='Open'
                                    >
                                      <MaterialSymbol
                                        name='visibility'
                                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                                        className={
                                          materialSymbolLayoutClassName
                                        }
                                        aria-hidden
                                      />
                                    </button>
                                    <button
                                      type='button'
                                      className={devViewPanelIconBtnVariants({
                                        tone: 'secondary',
                                      })}
                                      onClick={() =>
                                        void copyTourPublicLink(entry.id)
                                      }
                                      disabled={busy}
                                      aria-label={
                                        (
                                          tourLinkCopyState?.id === entry.id &&
                                          tourLinkCopyState.status === 'copied'
                                        ) ?
                                          'Link copied'
                                        : (
                                          tourLinkCopyState?.id === entry.id &&
                                          tourLinkCopyState.status === 'failed'
                                        ) ?
                                          'Copy failed'
                                        : `Copy public link for ${entry.title}`
                                      }
                                      title={
                                        (
                                          tourLinkCopyState?.id === entry.id &&
                                          tourLinkCopyState.status === 'copied'
                                        ) ?
                                          'Copied!'
                                        : (
                                          tourLinkCopyState?.id === entry.id &&
                                          tourLinkCopyState.status === 'failed'
                                        ) ?
                                          'Copy failed'
                                        : `Copy link · ${TOUR_PUBLIC_ORIGIN}/${entry.id}`

                                      }
                                    >
                                      <MaterialSymbol
                                        name={
                                          (
                                            tourLinkCopyState?.id ===
                                              entry.id &&
                                            tourLinkCopyState.status ===
                                              'copied'
                                          ) ?
                                            'check'
                                          : 'content_copy'
                                        }
                                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                                        className={
                                          materialSymbolLayoutClassName
                                        }
                                        aria-hidden
                                      />
                                    </button>
                                    <button
                                      type='button'
                                      className={devViewPanelIconBtnVariants({
                                        tone: 'secondary',
                                      })}
                                      onClick={() => startEditTour(entry.id)}
                                      disabled={busy || isEditing}
                                      aria-label={`Edit ${entry.title}`}
                                      title='Edit'
                                    >
                                      <MaterialSymbol
                                        name='edit'
                                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                                        className={
                                          materialSymbolLayoutClassName
                                        }
                                        aria-hidden
                                      />
                                    </button>
                                    <button
                                      type='button'
                                      className={devViewPanelIconBtnVariants({
                                        tone: 'danger',
                                      })}
                                      onClick={() => startDeleteTour(entry.id)}
                                      disabled={busy || isDeleting}
                                      aria-label={`Delete ${entry.title}`}
                                      title='Delete'
                                    >
                                      <MaterialSymbol
                                        name='delete'
                                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                                        className={
                                          materialSymbolLayoutClassName
                                        }
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
                                      title={entry.id}
                                    >
                                      {formatManageListItemId('tour', entry.id)}
                                    </li>
                                  </ul>
                                  <p
                                    className='m-0 line-clamp-2'
                                    title={
                                      entry.summary ? entry.summary : undefined
                                    }
                                  >
                                    {entry.summary || 'No summary'}
                                  </p>
                                </div>

                                {isDeleting ?
                                  <div
                                    className={cn(
                                      'mt-2 flex flex-col gap-2.5 border border-[rgba(248,113,113,0.35)] bg-[rgba(69,10,10,0.35)] p-3',
                                      devViewPanelControlRadiusClassName,
                                    )}
                                  >
                                    <h4
                                      className={
                                        devViewPanelFormGroupTitleClassName
                                      }
                                    >
                                      Danger zone
                                    </h4>
                                    <p
                                      className={
                                        devViewPanelSectionHintClassName
                                      }
                                    >
                                      Permanently deletes{' '}
                                      <code>tours/{entry.id}.json</code>,
                                      catalog entry, and{' '}
                                      <code>
                                        assets/{entry.clientId}/{entry.id}/
                                      </code>
                                      . This cannot be undone.
                                    </p>
                                    <label
                                      className={devViewPanelFieldClassName}
                                    >
                                      <span
                                        className={
                                          devViewPanelFieldLabelClassName
                                        }
                                      >
                                        Type <code>{entry.id}</code> to confirm
                                      </span>
                                      <input
                                        className={devViewPanelInputClassName}
                                        type='text'
                                        value={deleteTourConfirm}
                                        onChange={(e) =>
                                          setDeleteTourConfirm(e.target.value)
                                        }
                                        placeholder={entry.id}
                                        spellCheck={false}
                                        autoComplete='off'
                                        disabled={
                                          deleteTourStatus === 'working'
                                        }
                                      />
                                    </label>
                                    <div
                                      className={devViewPanelActionsClassName}
                                    >
                                      <button
                                        type='button'
                                        className={devViewPanelBtnVariants({
                                          tone: 'secondary',
                                        })}
                                        onClick={cancelDeleteTour}
                                        disabled={
                                          deleteTourStatus === 'working'
                                        }
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type='button'
                                        className={devViewPanelBtnVariants({
                                          tone: 'danger',
                                        })}
                                        onClick={() => void deleteManagedTour()}
                                        disabled={
                                          !canDeleteTour ||
                                          deleteTourStatus === 'working'
                                        }
                                      >
                                        {deleteTourStatus === 'working' ?
                                          'Deleting…'
                                        : 'Delete tour permanently'}
                                      </button>
                                    </div>
                                    {deleteTourError ?
                                      <p
                                        className={
                                          devViewPanelSectionHintClassName
                                        }
                                      >
                                        {deleteTourError}
                                      </p>
                                    : null}
                                  </div>
                                : null}

                                {isEditing ?
                                  <>
                                    <DevPanelFormGroup inline manageEdit>
                                      <DevPanelFormSection title='Basics'>
                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Tour title
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editTourTitle}
                                            onChange={(e) =>
                                              setEditTourTitle(e.target.value)
                                            }
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
                                            Tour summary (optional)
                                          </span>
                                          <DevPanelDescriptionTextarea
                                            value={editTourSummary}
                                            onChange={(e) =>
                                              setEditTourSummary(e.target.value)
                                            }
                                            placeholder='Short marketing blurb for gallery cards and share previews'
                                            spellCheck={true}
                                          />
                                          <p
                                            className={
                                              devViewPanelSectionHintClassName
                                            }
                                          >
                                            Stored in <code>catalog.json</code>{' '}
                                            (1–2 sentences). Not scene
                                            descriptions.
                                          </p>
                                        </label>

                                        <label
                                          className={devViewPanelFieldClassName}
                                        >
                                          <span
                                            className={
                                              devViewPanelFieldLabelClassName
                                            }
                                          >
                                            Product full name (optional)
                                          </span>
                                          <input
                                            className={
                                              devViewPanelInputClassName
                                            }
                                            type='text'
                                            value={editTourProductFullName}
                                            onChange={(e) =>
                                              setEditTourProductFullName(
                                                e.target.value,
                                              )
                                            }
                                            placeholder='Leave empty for “{client} Virtual Tour”'
                                            spellCheck={false}
                                            autoComplete='off'
                                          />
                                        </label>
                                        <p
                                          className={
                                            devViewPanelSectionHintClassName
                                          }
                                        >
                                          Tab title, splash, and in-tour chrome
                                          preview:{' '}
                                          <strong>
                                            {editTourProductNamePreview}
                                          </strong>
                                        </p>

                                        <DevPanelFormRow>
                                          <label
                                            className={
                                              devViewPanelFieldClassName
                                            }
                                          >
                                            <span
                                              className={
                                                devViewPanelFieldLabelClassName
                                              }
                                            >
                                              Category
                                            </span>
                                            <select
                                              className={
                                                devViewPanelSelectClassName
                                              }
                                              value={editTourCategory}
                                              onChange={(e) =>
                                                setEditTourCategory(
                                                  e.target
                                                    .value as TourCategory,
                                                )
                                              }
                                            >
                                              {tourCategoryOptions.map(
                                                (category) => (
                                                  <option
                                                    key={category}
                                                    value={category}
                                                  >
                                                    {category}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                          </label>

                                          <label
                                            className={
                                              devViewPanelFieldClassName
                                            }
                                          >
                                            <span
                                              className={
                                                devViewPanelFieldLabelClassName
                                              }
                                            >
                                              Catalog visibility
                                            </span>
                                            <select
                                              className={
                                                devViewPanelSelectClassName
                                              }
                                              value={editTourVisibility}
                                              onChange={(e) =>
                                                setEditTourVisibility(
                                                  e.target
                                                    .value as DevCatalogTourVisibility,
                                                )
                                              }
                                            >
                                              {DEV_CATALOG_VISIBILITY_OPTIONS.map(
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
                                        </DevPanelFormRow>

                                        <DevPanelFormRow>
                                          <div
                                            className={
                                              devViewPanelFormCheckboxStackClassName
                                            }
                                          >
                                            <label
                                              className={
                                                devViewPanelFormCheckboxLabelClassName
                                              }
                                            >
                                              <input
                                                className={
                                                  devViewPanelFormCheckboxInputClassName
                                                }
                                                type='checkbox'
                                                checked={
                                                  editTourAskGuideEnabled
                                                }
                                                onChange={(e) =>
                                                  setEditTourAskGuideEnabled(
                                                    e.target.checked,
                                                  )
                                                }
                                              />
                                              <span
                                                className={
                                                  devViewPanelFormCheckboxFieldClassName
                                                }
                                              >
                                                <span
                                                  className={
                                                    devViewPanelToggleNameClassName
                                                  }
                                                >
                                                  Enable Ask Tour Guide
                                                </span>
                                                <p
                                                  className={
                                                    devViewPanelSectionHintClassName
                                                  }
                                                >
                                                  Shows the Tour Guide FAB and
                                                  Help guidance on this tour.
                                                  Debug can force with{' '}
                                                  <code>?askGuide=1</code> /{' '}
                                                  <code>?askGuide=0</code>.
                                                </p>
                                              </span>
                                            </label>
                                          </div>
                                        </DevPanelFormRow>
                                      </DevPanelFormSection>

                                      <DevPanelExperienceSection
                                        divided
                                        transitionEffect={editTransitionEffect}
                                        onTransitionEffectChange={
                                          setEditTransitionEffect
                                        }
                                        transitionSpeed={editTransitionSpeed}
                                        onTransitionSpeedChange={
                                          setEditTransitionSpeed
                                        }
                                        immersiveMode={editImmersiveMode}
                                        onImmersiveModeChange={
                                          setEditImmersiveMode
                                        }
                                        immersiveAudio={editImmersiveAudio}
                                        onImmersiveAudioChange={
                                          setEditImmersiveAudio
                                        }
                                        immersivePlaylistText={
                                          editImmersivePlaylistText
                                        }
                                        onImmersivePlaylistTextChange={
                                          setEditImmersivePlaylistText
                                        }
                                        immersivePlaylistManifest={
                                          editImmersivePlaylistManifest
                                        }
                                        onImmersivePlaylistManifestChange={
                                          setEditImmersivePlaylistManifest
                                        }
                                        immersiveVolume={editImmersiveVolume}
                                        onImmersiveVolumeChange={
                                          setEditImmersiveVolume
                                        }
                                      />

                                      <DevPanelFormSection
                                        title='Branding'
                                        divided
                                      >
                                        <div
                                          className={
                                            devViewPanelToggleListClassName
                                          }
                                        >
                                          <label
                                            className={
                                              devViewPanelFormRadioLabelClassName
                                            }
                                          >
                                            <input
                                              className={
                                                devViewPanelFormRadioInputClassName
                                              }
                                              type='radio'
                                              name='edit-tour-branding-mode'
                                              checked={
                                                editTourBrandingMode ===
                                                'client'
                                              }
                                              onChange={() =>
                                                setEditTourBrandingMode(
                                                  'client',
                                                )
                                              }
                                            />
                                            <span
                                              className={
                                                devViewPanelToggleNameClassName
                                              }
                                            >
                                              Use client branding (shared)
                                            </span>
                                          </label>
                                          <label
                                            className={
                                              devViewPanelFormRadioLabelClassName
                                            }
                                          >
                                            <input
                                              className={
                                                devViewPanelFormRadioInputClassName
                                              }
                                              type='radio'
                                              name='edit-tour-branding-mode'
                                              checked={
                                                editTourBrandingMode ===
                                                'custom'
                                              }
                                              onChange={() =>
                                                setEditTourBrandingMode(
                                                  'custom',
                                                )
                                              }
                                            />
                                            <span
                                              className={
                                                devViewPanelToggleNameClassName
                                              }
                                            >
                                              Custom branding for this tour only
                                            </span>
                                          </label>
                                        </div>
                                        <p
                                          className={
                                            devViewPanelSectionHintClassName
                                          }
                                        >
                                          {editTourBrandingMode === 'client' ?
                                            'Inherits shared branding from the Client tab. Switch to custom to override on this tour only.'
                                          : 'Stored on this tour JSON only — overrides the client brand.'
                                          }
                                        </p>

                                        {editTourBrandingMode === 'custom' ?
                                          <>
                                            <div className='flex flex-col gap-1'>
                                              <div
                                                className={
                                                  devViewPanelInlineActionsClassName
                                                }
                                              >
                                                <button
                                                  type='button'
                                                  className={devViewPanelBtnVariants(
                                                    { tone: 'secondary' },
                                                  )}
                                                  onClick={() =>
                                                    void suggestEditTourBranding()
                                                  }
                                                  disabled={
                                                    !openCatalogClient?.website?.trim() ||
                                                    editTourSuggestStatus ===
                                                      'working'
                                                  }
                                                >
                                                  {(
                                                    editTourSuggestStatus ===
                                                    'working'
                                                  ) ?
                                                    'Suggesting…'
                                                  : 'Suggest from website'}
                                                </button>
                                              </div>
                                              <p
                                                className={
                                                  devViewPanelSectionHintClassName
                                                }
                                              >
                                                Uses the client website from the
                                                Client tab to draft logo,
                                                favicon, and primary color —
                                                review before saving.
                                              </p>
                                            </div>

                                            {editTourSuggestNotes.length > 0 ?
                                              <ul
                                                className={
                                                  devViewPanelSectionHintClassName
                                                }
                                              >
                                                {editTourSuggestNotes.map(
                                                  (note) => (
                                                    <li key={note}>{note}</li>
                                                  ),
                                                )}
                                              </ul>
                                            : null}

                                            <DevPanelColorField
                                              label='Primary color'
                                              value={editTourPrimaryColor}
                                              onChange={setEditTourPrimaryColor}
                                              defaultColor={
                                                DEFAULT_NEW_TOUR_PRIMARY_COLOR
                                              }
                                              pickerAriaLabel='Edit tour primary color picker'
                                            />

                                            <label
                                              className={
                                                devViewPanelFieldClassName
                                              }
                                            >
                                              <span
                                                className={
                                                  devViewPanelFieldLabelClassName
                                                }
                                              >
                                                Logo alt
                                              </span>
                                              <input
                                                className={
                                                  devViewPanelInputClassName
                                                }
                                                type='text'
                                                value={editTourLogoAlt}
                                                onChange={(e) =>
                                                  setEditTourLogoAlt(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder='Accessible logo label'
                                                spellCheck={false}
                                                autoComplete='off'
                                              />
                                            </label>

                                            <label
                                              className={
                                                devViewPanelFieldClassName
                                              }
                                            >
                                              <span
                                                className={
                                                  devViewPanelFieldLabelClassName
                                                }
                                              >
                                                Font family (CSS stack)
                                              </span>
                                              <input
                                                className={
                                                  devViewPanelInputClassName
                                                }
                                                type='text'
                                                value={editTourFontFamily}
                                                onChange={(e) =>
                                                  setEditTourFontFamily(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="'Montserrat', sans-serif"
                                                spellCheck={false}
                                                autoComplete='off'
                                              />
                                            </label>

                                            <label
                                              className={
                                                devViewPanelFieldClassName
                                              }
                                            >
                                              <span
                                                className={
                                                  devViewPanelFieldLabelClassName
                                                }
                                              >
                                                Google Fonts URL
                                              </span>
                                              <input
                                                className={
                                                  devViewPanelInputClassName
                                                }
                                                type='url'
                                                value={editTourFontSourceUrl}
                                                onChange={(e) =>
                                                  setEditTourFontSourceUrl(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder='https://fonts.googleapis.com/css2?family=…'
                                                spellCheck={false}
                                                autoComplete='off'
                                              />
                                            </label>
                                            <p
                                              className={
                                                devViewPanelSectionHintClassName
                                              }
                                            >
                                              Must be{' '}
                                              <code>
                                                https://fonts.googleapis.com/…
                                              </code>
                                              . Clear both font fields to revert
                                              to platform defaults.
                                            </p>

                                            <DevPanelFormRow>
                                              <label
                                                className={
                                                  devViewPanelFieldClassName
                                                }
                                              >
                                                <span
                                                  className={
                                                    devViewPanelFieldLabelClassName
                                                  }
                                                >
                                                  Logo (replace)
                                                </span>
                                                <DevPanelFileField
                                                  file={editTourLogoFile}
                                                  preview={
                                                    <DevLocalFilePreview
                                                      file={editTourLogoFile}
                                                      className={
                                                        devViewPanelBrandLogoClassName
                                                      }
                                                      alt='Logo preview'
                                                    />
                                                  }
                                                  onClearPreview={() =>
                                                    setEditTourLogoFile(null)
                                                  }
                                                  showClear={Boolean(
                                                    editTourLogoFile,
                                                  )}
                                                >
                                                  <DevPanelFileInput
                                                    accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
                                                    file={editTourLogoFile}
                                                    onChange={
                                                      setEditTourLogoFile
                                                    }
                                                  />
                                                </DevPanelFileField>
                                              </label>

                                              <label
                                                className={
                                                  devViewPanelFieldClassName
                                                }
                                              >
                                                <span
                                                  className={
                                                    devViewPanelFieldLabelClassName
                                                  }
                                                >
                                                  Favicon (replace)
                                                </span>
                                                <DevPanelFileField
                                                  file={editTourFaviconFile}
                                                  preview={
                                                    <DevLocalFilePreview
                                                      file={editTourFaviconFile}
                                                      className={
                                                        devViewPanelBrandFaviconClassName
                                                      }
                                                      alt='Favicon preview'
                                                    />
                                                  }
                                                  onClearPreview={() =>
                                                    setEditTourFaviconFile(null)
                                                  }
                                                  showClear={Boolean(
                                                    editTourFaviconFile,
                                                  )}
                                                >
                                                  <DevPanelFileInput
                                                    accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
                                                    file={editTourFaviconFile}
                                                    onChange={
                                                      setEditTourFaviconFile
                                                    }
                                                  />
                                                </DevPanelFileField>
                                              </label>
                                            </DevPanelFormRow>
                                          </>
                                        : null}

                                        {editTourError ?
                                          <p
                                            className={
                                              devViewPanelSectionHintClassName
                                            }
                                          >
                                            {editTourError}
                                          </p>
                                        : null}

                                        <div
                                          className={
                                            devViewPanelActionsClassName
                                          }
                                        >
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'secondary',
                                            })}
                                            onClick={cancelEditTour}
                                            disabled={
                                              editTourStatus === 'working'
                                            }
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type='button'
                                            className={devViewPanelBtnVariants({
                                              tone: 'primary',
                                            })}
                                            onClick={() => void saveEditTour()}
                                            disabled={
                                              !canSaveEditTour ||
                                              editTourStatus === 'working'
                                            }
                                          >
                                            {editTourStatus === 'working' ?
                                              'Saving…'
                                            : editTourStatus === 'done' ?
                                              'Saved!'
                                            : 'Save tour'}
                                          </button>
                                        </div>
                                      </DevPanelFormSection>
                                    </DevPanelFormGroup>{' '}
                                  </>
                                : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    : <p className={devViewPanelSectionHintClassName}>
                        {catalogTourManageRows.length === 0 ?
                          'No tours in the catalog yet — add one to get started.'
                        : tourManageClientFilter === 'all' ?
                          'No tours match this filter.'
                        : 'No tours for this client.'}
                      </p>
                    }
                  </DevPanelFormGroup>
                </DevPanelSection>
    </DevPanelSectionAccordion>
  );
}
