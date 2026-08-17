export function isHttpUrl(value?: string | null): boolean;

export function getTourAssetBasePath(tour: {
  id: string;
  clientId?: string | null;
}): string;

export function tourAssetPath(
  tour: { id: string; clientId?: string | null },
  ...segments: Array<string | null | undefined>
): string;

export function isModel3dTour(tour?: { viewerType?: string | null }): boolean;

export const SCENE_THUMB_DIR: 'scene-thumbs';
export const HOTSPOT_THUMB_DIR: 'hotspot-thumbs';

export function conventionalPanoramaPath(
  tour: { id: string; clientId?: string | null },
  sceneId: string,
): string;

export function conventionalThumbnailPath(
  tour: { id: string; clientId?: string | null },
  sceneId: string,
): string;

export function conventionalPreviewPath(
  tour: { id: string; clientId?: string | null },
  hotspotId: string,
): string;

export function conventionalDonorLogoPath(
  tour: { id: string; clientId?: string | null },
  folderId: string,
): string;

export function conventionalTourModelPath(
  tour: { id: string; clientId?: string | null },
  ext?: string,
): string;

export function conventionalSceneModelPath(
  tour: { id: string; clientId?: string | null },
  sceneId: string,
  ext?: string,
): string;

export function conventionalClientLogoPath(clientId: string): string;

export function conventionalClientFaviconPngPath(clientId: string): string;

export function conventionalClientFaviconIcoPath(clientId: string): string;

export function conventionalTourLogoPath(tour: {
  id: string;
  clientId?: string | null;
}): string;

export function conventionalTourFaviconPngPath(tour: {
  id: string;
  clientId?: string | null;
}): string;

export function conventionalTourFaviconIcoPath(tour: {
  id: string;
  clientId?: string | null;
}): string;

export function resolveClientLogoPath(
  clientId?: string | null,
  explicit?: unknown,
): string | null;

export function hydrateCatalogClientBranding(
  client?: { id?: string | null; branding?: object | null } | null,
): object | null;

export function resolveTourLogoPath(
  tour: { id: string; clientId?: string | null },
  explicit?: unknown,
): string | null;

export function isConventionalClientLogoPath(
  clientId: string,
  path?: unknown,
): boolean;

export function isConventionalClientFaviconPath(
  clientId: string,
  path?: unknown,
): boolean;

export function isConventionalTourLogoPath(
  tour: { id: string; clientId?: string | null },
  path?: unknown,
): boolean;

export function isConventionalTourFaviconPath(
  tour: { id: string; clientId?: string | null },
  path?: unknown,
): boolean;

export function explicitAssetPath(value?: unknown): string | null;

export function isNamingHotspot(
  hotspot?: {
    type?: string | null;
    namingId?: string | null;
    popup?: { namingOpportunity?: unknown };
  } | null,
): boolean;

export function findHostHotspotIdForNaming(
  tour?: {
    hotspots?: Array<{ id?: string; namingId?: string | null }> | null;
    scenes?: Record<
      string,
      { hotspots?: Array<{ id?: string; namingId?: string | null }> | null }
    > | null;
  } | null,
  namingId?: string | null,
): string | null;

export function resolveScenePanoramaPath(
  tour: { id: string; clientId?: string | null; viewerType?: string | null },
  sceneId: string,
  explicit?: unknown,
): string | null;

export function resolveSceneThumbnailPath(
  tour: { id: string; clientId?: string | null },
  sceneId: string,
  explicit?: unknown,
): string | null;

export function resolveHotspotPreviewPath(
  tour: { id: string; clientId?: string | null },
  hotspot?: {
    id?: string;
    type?: string | null;
    namingId?: string | null;
    popup?: { namingOpportunity?: unknown };
  } | null,
  explicit?: unknown,
): string | null;

export function resolveDonorLogoPath(
  tour: {
    id: string;
    clientId?: string | null;
    hotspots?: Array<{ id?: string; namingId?: string | null }> | null;
    scenes?: Record<
      string,
      { hotspots?: Array<{ id?: string; namingId?: string | null }> | null }
    > | null;
  },
  namingId?: string | null,
  explicit?: unknown,
): string | null;

export function isConventionalPanoramaPath(
  tour: { id: string; clientId?: string | null; viewerType?: string | null },
  sceneId: string,
  path?: unknown,
): boolean;

export function isConventionalThumbnailPath(
  tour: { id: string; clientId?: string | null },
  sceneId: string,
  path?: unknown,
): boolean;

export function isConventionalPreviewPath(
  tour: { id: string; clientId?: string | null },
  hotspotId: string,
  path?: unknown,
): boolean;

export function isConventionalDonorLogoPath(
  tour: {
    id: string;
    clientId?: string | null;
    hotspots?: Array<{ id?: string; namingId?: string | null }> | null;
    scenes?: Record<
      string,
      { hotspots?: Array<{ id?: string; namingId?: string | null }> | null }
    > | null;
  },
  namingId: string,
  path?: unknown,
): boolean;

export function stripConventionalTourAssets(tour: unknown): {
  panorama: number;
  thumbnail: number;
  preview: number;
  logo: number;
};

export function stripConventionalCatalogBranding(catalog: unknown): {
  logo: number;
  favicon: number;
};
