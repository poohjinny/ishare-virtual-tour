import { sceneThumbUrl } from '@/lib/admin-media';
import { getAdminTour, type TourVisibility } from '@/lib/tour-catalog';

interface LocalHotspot {
  id: string;
  type: 'nav' | 'info';
  label?: string;
  targetScene?: string;
  namingId?: string;
  role?: string;
  instant?: boolean;
  navVariant?: string;
  sceneId?: string;
  popup?: {
    title?: string;
    body?: string;
    display?: 'modal' | 'anchored';
    videoUrl?: string;
    image?: string;
    visitScene?: string;
  };
  position?: Record<string, number>;
}

interface LocalTourScene {
  id: string;
  title: string;
  description?: string;
  visibility?: TourVisibility;
  thumbnail?: string;
  previewVideoUrl?: string;
  videoUrl?: string;
  defaultView?: Record<string, number>;
  hotspots?: LocalHotspot[];
}

interface LocalTourConfig {
  clientId?: string;
  firstScene: string;
  sceneOrder?: string[];
  scenes: Record<string, LocalTourScene>;
  viewerType?: string;
  hotspots?: LocalHotspot[];
}

export interface AdminSceneSummary {
  id: string;
  title: string;
  visibility: TourVisibility;
  hotspotCount: number;
  isFirstScene: boolean;
  thumbnailUrl?: string;
}

export interface AdminHotspotSummary {
  id: string;
  type: 'nav' | 'info';
  label: string;
  targetScene?: string;
  namingId?: string;
  role?: string;
  instant?: boolean;
  navVariant?: string;
  title?: string;
  body?: string;
  display?: 'modal' | 'anchored';
  videoUrl?: string;
  image?: string;
  visitScene?: string;
  position: Array<{ axis: string; value: number }>;
}

export interface AdminSceneDetail extends AdminSceneSummary {
  description: string;
  previewVideoUrl?: string;
  videoUrl?: string;
  defaultView: Array<{ axis: string; value: number }>;
  hotspots: AdminHotspotSummary[];
}

async function loadLocalTourConfig(tourId: string) {
  if (!getAdminTour(tourId)) return undefined;

  try {
    const tourModule = await import(
      `../../../tour-viewer/tours/${tourId}.json`
    );
    return tourModule.default as LocalTourConfig;
  } catch {
    return undefined;
  }
}

export async function getAdminTourScenes(tourId: string) {
  const config = await loadLocalTourConfig(tourId);
  const summary = getAdminTour(tourId);
  if (!config || !summary) return [];

  const clientId = config.clientId ?? summary.clientId;
  const authoredOrder = config.sceneOrder ?? [];
  const remainingSceneIds = Object.keys(config.scenes).filter(
    (sceneId) => !authoredOrder.includes(sceneId),
  );

  return [...authoredOrder, ...remainingSceneIds]
    .map((sceneId) => config.scenes[sceneId])
    .filter((scene): scene is LocalTourScene => Boolean(scene))
    .map(
      (scene): AdminSceneSummary => ({
        id: scene.id,
        title: scene.title,
        visibility: scene.visibility ?? 'public',
        hotspotCount:
          config.viewerType === 'model3d' ?
            (config.hotspots ?? []).filter(
              (hotspot) => (hotspot.sceneId ?? config.firstScene) === scene.id,
            ).length
          : (scene.hotspots?.length ?? 0),
        isFirstScene: scene.id === config.firstScene,
        thumbnailUrl: sceneThumbUrl(
          clientId,
          tourId,
          scene.id,
          scene.thumbnail,
        ),
      }),
    );
}

export async function getAdminTourScene(tourId: string, sceneId: string) {
  const config = await loadLocalTourConfig(tourId);
  const summary = getAdminTour(tourId);
  const scene = config?.scenes[sceneId];
  if (!config || !scene || !summary) return undefined;

  const clientId = config.clientId ?? summary.clientId;
  const hotspots =
    config.viewerType === 'model3d' ?
      (config.hotspots ?? []).filter(
        (hotspot) => (hotspot.sceneId ?? config.firstScene) === sceneId,
      )
    : (scene.hotspots ?? []);

  return {
    id: scene.id,
    title: scene.title,
    description: scene.description ?? '',
    visibility: scene.visibility ?? 'public',
    hotspotCount: hotspots.length,
    isFirstScene: scene.id === config.firstScene,
    thumbnailUrl: sceneThumbUrl(clientId, tourId, scene.id, scene.thumbnail),
    previewVideoUrl: scene.previewVideoUrl,
    videoUrl: scene.videoUrl,
    defaultView: Object.entries(scene.defaultView ?? {}).map(
      ([axis, value]) => ({ axis, value }),
    ),
    hotspots: hotspots.map((hotspot) => ({
      id: hotspot.id,
      type: hotspot.type,
      label: hotspot.label ?? '',
      targetScene: hotspot.targetScene,
      namingId: hotspot.namingId,
      role: hotspot.role,
      instant: hotspot.instant,
      navVariant: hotspot.navVariant,
      title: hotspot.popup?.title,
      body: hotspot.popup?.body,
      display: hotspot.popup?.display,
      videoUrl: hotspot.popup?.videoUrl,
      image: hotspot.popup?.image,
      visitScene: hotspot.popup?.visitScene,
      position: Object.entries(hotspot.position ?? {}).map(([axis, value]) => ({
        axis,
        value,
      })),
    })),
  } satisfies AdminSceneDetail;
}
