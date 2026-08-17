import { getAdminTour } from '@/lib/tour-catalog';

export type AdminNamingStatus = 'open' | 'reserved' | 'soon' | 'sold';

export interface AdminNamingPlacement {
  hotspotId: string;
  sceneId: string;
}

export interface AdminNamingOpportunity {
  id: string;
  name: string;
  price: number;
  status: AdminNamingStatus;
  body: string;
  videoUrl: string;
  image: string;
  visibility: 'public' | 'unlisted' | 'internal';
  donor?: {
    name: string;
    kind: 'organization' | 'person';
    affiliation?: string;
    website?: string;
  };
  placements: AdminNamingPlacement[];
}

interface LocalNamingOpportunity {
  id: string;
  name?: string;
  price: number;
  status?: AdminNamingStatus;
  body?: string;
  videoUrl?: string;
  image?: string;
  visibility?: 'public' | 'unlisted' | 'internal';
  donor?: AdminNamingOpportunity['donor'];
}

interface LocalHotspot {
  id: string;
  namingId?: string;
  sceneId?: string;
}

interface LocalTourConfig {
  firstScene: string;
  viewerType?: string;
  scenes: Record<
    string,
    { title: string; hotspots?: LocalHotspot[] }
  >;
  hotspots?: LocalHotspot[];
  namingOpportunities?: Record<string, LocalNamingOpportunity>;
}

export async function getAdminTourNamings(tourId: string) {
  if (!getAdminTour(tourId)) return [];

  try {
    const tourModule = await import(
      `../../../tour-viewer/tours/${tourId}.json`
    );
    const tour = tourModule.default as LocalTourConfig;
    const placements = new Map<string, AdminNamingPlacement[]>();

    if (tour.viewerType === 'model3d') {
      for (const hotspot of tour.hotspots ?? []) {
        if (!hotspot.namingId) continue;
        const current = placements.get(hotspot.namingId) ?? [];
        current.push({
          hotspotId: hotspot.id,
          sceneId: hotspot.sceneId ?? tour.firstScene,
        });
        placements.set(hotspot.namingId, current);
      }
    } else {
      for (const [sceneId, scene] of Object.entries(tour.scenes)) {
        for (const hotspot of scene.hotspots ?? []) {
          if (!hotspot.namingId) continue;
          const current = placements.get(hotspot.namingId) ?? [];
          current.push({ hotspotId: hotspot.id, sceneId });
          placements.set(hotspot.namingId, current);
        }
      }
    }

    return Object.values(tour.namingOpportunities ?? {}).map(
      (record): AdminNamingOpportunity => {
        const hostSceneId = placements.get(record.id)?.[0]?.sceneId;
        return {
          id: record.id,
          name:
            record.name ??
            (hostSceneId ? tour.scenes[hostSceneId]?.title : undefined) ??
            record.id,
          price: record.price,
          status: record.status ?? 'open',
          body: record.body ?? '',
          videoUrl: record.videoUrl ?? '',
          image: record.image ?? '',
          visibility: record.visibility ?? 'public',
          donor: record.donor,
          placements: placements.get(record.id) ?? [],
        };
      },
    );
  } catch {
    return [];
  }
}

export async function getAdminTourNaming(tourId: string, namingId: string) {
  const namings = await getAdminTourNamings(tourId);
  return namings.find((naming) => naming.id === namingId);
}
