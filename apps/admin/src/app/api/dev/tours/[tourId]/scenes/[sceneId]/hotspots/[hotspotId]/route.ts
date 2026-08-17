import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

const UPDATE_PATHS = {
  nav: '/hotspot/nav/update',
  info: '/hotspot/info/update',
  naming: '/hotspot/naming/update',
} as const;

export async function PATCH(
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
    const body = (await request.json()) as Record<string, unknown>;
    const kind = body.kind;
    if (typeof kind !== 'string' || !(kind in UPDATE_PATHS)) {
      throw new Error('Invalid hotspot kind');
    }
    const payload = { ...body };
    delete payload.kind;
    return forwardViewerDevApi(UPDATE_PATHS[kind as keyof typeof UPDATE_PATHS], {
      tourId,
      sceneId,
      hotspotId,
      ...payload,
    });
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ tourId: string; sceneId: string; hotspotId: string }>;
  },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;
  const { tourId, sceneId, hotspotId } = await params;
  return forwardViewerDevApi('/hotspot/delete', {
    tourId,
    sceneId,
    hotspotId,
  });
}
