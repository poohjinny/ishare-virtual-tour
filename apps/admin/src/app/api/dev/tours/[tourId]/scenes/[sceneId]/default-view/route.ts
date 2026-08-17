import { getAdminTourScene } from '@/lib/tour-scenes';
import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tourId: string; sceneId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  const { tourId, sceneId } = await params;
  const scene = await getAdminTourScene(tourId, sceneId);
  if (!scene) {
    return Response.json({ error: 'Scene not found' }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { defaultView?: unknown };
    if (
      !body.defaultView ||
      typeof body.defaultView !== 'object' ||
      Array.isArray(body.defaultView)
    ) {
      throw new Error('defaultView is required');
    }

    const defaultView: Record<string, number> = {};
    for (const [axis, value] of Object.entries(
      body.defaultView as Record<string, unknown>,
    )) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`defaultView.${axis} must be a number`);
      }
      defaultView[axis] = value;
    }

    return forwardViewerDevApi('/scene/default-view', {
      tourId,
      sceneId,
      defaultView,
    });
  } catch (error) {
    return badRequest(error);
  }
}
