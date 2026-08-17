import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';
import { getAdminTourDetail } from '@/lib/tour-detail';

const CREATE_PATHS = {
  nav: '/hotspot/nav',
  info: '/hotspot/info',
  naming: '/hotspot/naming',
  'place-overview': '/hotspot/place-overview',
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tourId: string; sceneId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { tourId, sceneId } = await params;
    const tour = await getAdminTourDetail(tourId);
    if (!tour) return Response.json({ error: 'Tour not found' }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const kind = body.kind;
    if (typeof kind !== 'string' || !(kind in CREATE_PATHS)) {
      throw new Error('Invalid hotspot kind');
    }
    if (kind === 'place-overview' && tour.viewerType !== 'panorama') {
      throw new Error('Overview hotspots are panorama-only');
    }

    const payload = { ...body };
    delete payload.kind;
    return forwardViewerDevApi(CREATE_PATHS[kind as keyof typeof CREATE_PATHS], {
      tourId,
      sceneId,
      ...payload,
    });
  } catch (error) {
    return badRequest(error);
  }
}
