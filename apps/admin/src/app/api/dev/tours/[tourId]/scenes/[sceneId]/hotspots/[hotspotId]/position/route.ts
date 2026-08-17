import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ tourId: string; sceneId: string; hotspotId: string }>;
  },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { tourId, sceneId, hotspotId } = await params;
    const body = (await request.json()) as { position?: unknown };
    if (!body.position || typeof body.position !== 'object') {
      throw new Error('Position is required');
    }
    return forwardViewerDevApi('/hotspot/position', {
      tourId,
      sceneId,
      hotspotId,
      position: body.position,
    });
  } catch (error) {
    return badRequest(error);
  }
}
