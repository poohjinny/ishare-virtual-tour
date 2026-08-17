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
      panoramaFileName?: unknown;
      panoramaFileBase64?: unknown;
    };
    if (
      typeof body.panoramaFileName !== 'string' ||
      typeof body.panoramaFileBase64 !== 'string' ||
      !body.panoramaFileName ||
      !body.panoramaFileBase64
    ) {
      throw new Error('Panorama file is required');
    }

    return forwardViewerDevApi('/scene/replace-panorama', {
      tourId,
      sceneId,
      panoramaFileName: body.panoramaFileName,
      panoramaFileBase64: body.panoramaFileBase64,
    });
  } catch (error) {
    return badRequest(error);
  }
}
