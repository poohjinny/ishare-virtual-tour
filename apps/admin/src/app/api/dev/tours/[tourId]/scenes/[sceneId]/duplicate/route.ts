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
    const body = (await request.json()) as {
      namingMode?: unknown;
      includeChildren?: unknown;
      linkUnderSameParent?: unknown;
    };
    const namingMode =
      (
        body.namingMode === 'duplicate' ||
        body.namingMode === 'keep' ||
        body.namingMode === 'clear'
      ) ?
        body.namingMode
      : 'keep';

    return forwardViewerDevApi('/scene/duplicate', {
      tourId,
      sceneId,
      namingMode,
      includeChildren: body.includeChildren === true,
      linkUnderSameParent: body.linkUnderSameParent === true,
    });
  } catch (error) {
    return badRequest(error);
  }
}
