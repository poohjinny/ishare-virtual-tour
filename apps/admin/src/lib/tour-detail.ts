import {
  getAdminTour,
  type TourVisibility,
} from '@/lib/tour-catalog';

export type AdminViewerType = 'panorama' | 'model3d';
export type AdminBrandingMode = 'client' | 'custom';
export type AdminImmersiveMode = 'platform' | 'manifest' | 'audio' | 'playlist';
export type AdminTransitionEffect = 'fade' | 'black';

export interface AdminTourBranding {
  logoAlt: string;
  primaryColor: string;
  fontFamily: string;
  fontSourceUrl: string;
  hasLogo: boolean;
  hasFavicon: boolean;
}

export interface AdminTourDetail {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  summary: string;
  category: string;
  visibility: TourVisibility;
  viewerType: AdminViewerType;
  productFullName: string;
  askGuideEnabled: boolean;
  brandingMode: AdminBrandingMode;
  branding: AdminTourBranding;
  clientBranding: AdminTourBranding;
  transitionEffect: AdminTransitionEffect;
  transitionSpeed: string;
  immersiveMode: AdminImmersiveMode;
  immersiveAudio: string;
  immersivePlaylistText: string;
  immersivePlaylistManifest: string;
  immersiveVolume: string;
}

interface LocalTourBranding {
  logo?: string | true;
  logoAlt?: string;
  primaryColor?: string;
  fontFamily?: string;
  fontSourceUrl?: string;
  favicon?: string;
}

interface LocalTourConfig {
  id: string;
  clientId?: string;
  title: string;
  category?: string;
  productFullName?: string;
  askGuideEnabled?: boolean;
  viewerType?: string;
  branding?: LocalTourBranding;
  defaultTransition?: {
    effect?: string;
    speed?: string;
  };
  immersiveBackground?: {
    audio?: string;
    playlist?: string[];
    playlistManifest?: string;
    volume?: number;
  };
}

interface CatalogTourEntry {
  id: string;
  name: string;
  category: string;
  visibility?: string;
  summary?: string;
}

interface CatalogClientBranding {
  logoAlt?: string;
  primaryColor?: string;
  fontFamily?: string;
  fontSourceUrl?: string;
  logo?: string | true;
  favicon?: string;
}

function emptyBranding(): AdminTourBranding {
  return {
    logoAlt: '',
    primaryColor: '',
    fontFamily: '',
    fontSourceUrl: '',
    hasLogo: false,
    hasFavicon: false,
  };
}

function normalizeBranding(
  branding: LocalTourBranding | CatalogClientBranding | undefined,
): AdminTourBranding {
  if (!branding) return emptyBranding();
  return {
    logoAlt: branding.logoAlt ?? '',
    primaryColor: branding.primaryColor ?? '',
    fontFamily: branding.fontFamily ?? '',
    fontSourceUrl: branding.fontSourceUrl ?? '',
    hasLogo: Boolean(branding.logo),
    hasFavicon: Boolean(branding.favicon),
  };
}

function tourUsesCustomBranding(branding: LocalTourBranding | undefined) {
  if (!branding) return false;
  return Boolean(
    branding.logo ||
      branding.favicon ||
      branding.primaryColor ||
      branding.logoAlt ||
      branding.fontFamily ||
      branding.fontSourceUrl,
  );
}

function resolveImmersiveMode(
  immersive: LocalTourConfig['immersiveBackground'],
): AdminImmersiveMode {
  if (!immersive) return 'platform';
  if (immersive.playlistManifest) return 'manifest';
  if (immersive.playlist?.length) return 'playlist';
  if (immersive.audio) return 'audio';
  return 'platform';
}

async function loadLocalTourConfig(tourId: string) {
  try {
    const tourModule = await import(
      `../../../tour-viewer/tours/${tourId}.json`
    );
    return tourModule.default as LocalTourConfig;
  } catch {
    return undefined;
  }
}

export async function getAdminTourDetail(tourId: string) {
  const summary = getAdminTour(tourId);
  if (!summary) return undefined;

  const config = await loadLocalTourConfig(tourId);
  if (!config) return undefined;

  const catalogModule = await import('../../../tour-viewer/tours/catalog.json');
  const catalogClients = catalogModule.default.clients as Array<{
    id: string;
    name: string;
    branding?: CatalogClientBranding;
    tours: CatalogTourEntry[];
  }>;
  const catalogClient = catalogClients.find(
    (client) => client.id === summary.clientId,
  );
  const catalogTour = catalogClient?.tours.find((tour) => tour.id === tourId);
  const clientBranding = normalizeBranding(catalogClient?.branding);
  const brandingMode = tourUsesCustomBranding(config.branding)
    ? 'custom'
    : 'client';

  return {
    id: summary.id,
    clientId: summary.clientId,
    clientName: summary.clientName,
    title: config.title || summary.name,
    summary: catalogTour?.summary ?? '',
    category: config.category || summary.category,
    visibility: (catalogTour?.visibility as TourVisibility) ?? summary.visibility,
    viewerType: config.viewerType === 'model3d' ? 'model3d' : 'panorama',
    productFullName: config.productFullName ?? '',
    askGuideEnabled: config.askGuideEnabled === true,
    brandingMode,
    branding:
      brandingMode === 'custom'
        ? normalizeBranding(config.branding)
        : clientBranding,
    clientBranding,
    transitionEffect:
      config.defaultTransition?.effect === 'black' ? 'black' : 'fade',
    transitionSpeed: config.defaultTransition?.speed ?? '500ms',
    immersiveMode: resolveImmersiveMode(config.immersiveBackground),
    immersiveAudio: config.immersiveBackground?.audio ?? '',
    immersivePlaylistText: (config.immersiveBackground?.playlist ?? []).join(
      '\n',
    ),
    immersivePlaylistManifest:
      config.immersiveBackground?.playlistManifest ?? '',
    immersiveVolume:
      typeof config.immersiveBackground?.volume === 'number'
        ? String(config.immersiveBackground.volume)
        : '',
  } satisfies AdminTourDetail;
}
