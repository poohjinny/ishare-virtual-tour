import { cache } from 'react';

import {
  adminClientCatalog,
  adminTourCatalog,
  type AdminTourSummary,
  type TourVisibility,
} from '@/lib/tour-catalog';
import {
  clientLogoUrl,
  sceneThumbUrl,
  tourLogoUrl,
  resolveTourMediaUrl,
} from '@/lib/admin-media';
import {
  categoryChartColor,
  VIEWER_COLORS,
  VISIBILITY_COLORS,
} from '@/lib/semantic-colors';

/**
 * Catalog-wide roll-up for Overview and list polish. Media paths follow
 * apps/tour-viewer/assets/README.md (inferred, not stored in tour JSON).
 */

export interface AdminTourOverview extends AdminTourSummary {
  title: string;
  viewerType: 'panorama' | 'model3d';
  sceneCount: number;
  hotspotCount: number;
  namingCount: number;
  coverUrl?: string;
  logoUrl?: string;
  brandColor?: string;
}

export interface AdminClientOverview {
  id: string;
  name: string;
  tourCount: number;
  logoUrl: string;
  brandColor?: string;
  licensed: boolean;
}

export interface AdminOverviewStats {
  clients: number;
  tours: number;
  scenes: number;
  namings: number;
  hotspots: number;
  visibility: Record<TourVisibility, number>;
  categories: Array<{ name: string; count: number }>;
}

interface LocalOverviewHotspot {
  namingId?: string;
  sceneId?: string;
}

interface LocalOverviewScene {
  thumbnail?: string;
  hotspots?: LocalOverviewHotspot[];
}

interface LocalOverviewTour {
  clientId?: string;
  title?: string;
  firstScene: string;
  sceneOrder?: string[];
  viewerType?: string;
  scenes: Record<string, LocalOverviewScene>;
  hotspots?: LocalOverviewHotspot[];
  namingOpportunities?: Record<string, unknown>;
  branding?: { logo?: string | true; primaryColor?: string };
}

async function loadLocalTour(tourId: string) {
  try {
    const tourModule = await import(
      `../../../tour-viewer/tours/${tourId}.json`
    );
    return tourModule.default as LocalOverviewTour;
  } catch {
    return undefined;
  }
}

function resolveCoverUrl(
  tour: LocalOverviewTour,
  clientId: string,
  tourId: string,
) {
  const coverSceneId = tour.sceneOrder?.[0] ?? tour.firstScene;
  const scene = tour.scenes[coverSceneId];
  if (!scene) return undefined;
  return sceneThumbUrl(clientId, tourId, coverSceneId, scene.thumbnail);
}

function resolveLogoUrl(
  tour: LocalOverviewTour,
  clientId: string,
  tourId: string,
) {
  const logo = tour.branding?.logo;
  if (typeof logo === 'string' && logo) {
    return resolveTourMediaUrl(logo, clientId, tourId);
  }
  if (logo === true) return tourLogoUrl(clientId, tourId);
  return clientLogoUrl(clientId);
}

function countHotspots(tour: LocalOverviewTour) {
  if (tour.viewerType === 'model3d') return (tour.hotspots ?? []).length;
  return Object.values(tour.scenes).reduce(
    (total, scene) => total + (scene.hotspots?.length ?? 0),
    0,
  );
}

async function buildTourOverview(
  summary: AdminTourSummary,
): Promise<AdminTourOverview> {
  const tour = await loadLocalTour(summary.id);
  const client = adminClientCatalog.find(
    (item) => item.id === summary.clientId,
  );

  if (!tour) {
    return {
      ...summary,
      title: summary.name,
      viewerType: 'panorama',
      sceneCount: 0,
      hotspotCount: 0,
      namingCount: 0,
      logoUrl: clientLogoUrl(summary.clientId),
      brandColor: client?.brandColor,
    };
  }

  const clientId = tour.clientId ?? summary.clientId;

  return {
    ...summary,
    title: tour.title || summary.name,
    viewerType: tour.viewerType === 'model3d' ? 'model3d' : 'panorama',
    sceneCount: Object.keys(tour.scenes).length,
    hotspotCount: countHotspots(tour),
    namingCount: Object.keys(tour.namingOpportunities ?? {}).length,
    coverUrl: resolveCoverUrl(tour, clientId, summary.id),
    logoUrl: resolveLogoUrl(tour, clientId, summary.id),
    brandColor: tour.branding?.primaryColor ?? client?.brandColor,
  };
}

export const getAdminTourOverviews = cache(async () =>
  Promise.all(adminTourCatalog.map(buildTourOverview)),
);

export function adminTourCrumbPeers(
  tourId: string,
  overviews: AdminTourOverview[],
  hrefTemplate = '/tours/{id}',
) {
  return {
    value: tourId,
    label: 'Switch tour',
    hrefTemplate,
    imageFit: 'cover' as const,
    options: overviews.map((item) => ({
      value: item.id,
      label: item.title,
      image: item.coverUrl,
      fallbackImage: item.logoUrl,
    })),
  };
}

export async function getAdminOverview() {
  const tours = await getAdminTourOverviews();

  const visibility: Record<TourVisibility, number> = {
    public: 0,
    unlisted: 0,
    internal: 0,
  };
  const categoryCounts = new Map<string, number>();

  for (const tour of tours) {
    visibility[tour.visibility] += 1;
    categoryCounts.set(
      tour.category,
      (categoryCounts.get(tour.category) ?? 0) + 1,
    );
  }

  const stats: AdminOverviewStats = {
    clients: adminClientCatalog.length,
    tours: tours.length,
    scenes: tours.reduce((total, tour) => total + tour.sceneCount, 0),
    namings: tours.reduce((total, tour) => total + tour.namingCount, 0),
    hotspots: tours.reduce((total, tour) => total + tour.hotspotCount, 0),
    visibility,
    categories: [...categoryCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };

  const clients: AdminClientOverview[] = adminClientCatalog.map((client) => ({
    id: client.id,
    name: client.name,
    tourCount: client.tours.length,
    logoUrl: clientLogoUrl(client.id),
    brandColor: client.brandColor,
    licensed: client.licensed,
  }));

  return { tours, clients, stats };
}

/** Shared Tours / Overview roll-up — same slices on both pages. */
export function buildTourStatDonuts(
  tours: AdminTourOverview[],
  visibility: Record<TourVisibility, number>,
  categories: Array<{ name: string; count: number }>,
) {
  const visibilitySlices = [
    {
      label: 'Public',
      count: visibility.public,
      color: VISIBILITY_COLORS.public,
    },
    {
      label: 'Unlisted',
      count: visibility.unlisted,
      color: VISIBILITY_COLORS.unlisted,
    },
    {
      label: 'Internal',
      count: visibility.internal,
      color: VISIBILITY_COLORS.internal,
    },
  ];
  const categorySlices = categories.map((category, index) => ({
    label: category.name,
    count: category.count,
    color: categoryChartColor(category.name, index),
  }));
  const viewerSlices = [
    {
      label: '360°',
      count: tours.filter((tour) => tour.viewerType !== 'model3d').length,
      color: VIEWER_COLORS.panorama,
    },
    {
      label: '3D',
      count: tours.filter((tour) => tour.viewerType === 'model3d').length,
      color: VIEWER_COLORS.model3d,
    },
  ];

  return [
    { label: 'Categories', slices: categorySlices },
    { label: 'Visibility', slices: visibilitySlices },
    { label: 'Viewer', slices: viewerSlices },
  ];
}
