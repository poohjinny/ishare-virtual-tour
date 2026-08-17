import { getAdminTourScene } from '@/lib/tour-scenes';
import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

const SCENE_VISIBILITIES = new Set(['public', 'unlisted', 'internal']);

interface SceneUpdateBody {
  title?: unknown;
  description?: unknown;
  previewVideoUrl?: unknown;
  videoUrl?: unknown;
  visibility?: unknown;
  setAsFirstScene?: unknown;
}

function validateSceneUpdate(body: SceneUpdateBody) {
  if (typeof body.title !== 'string' || !body.title.trim()) {
    throw new Error('Scene title is required');
  }
  if (
    typeof body.description !== 'string' ||
    typeof body.previewVideoUrl !== 'string' ||
    typeof body.videoUrl !== 'string'
  ) {
    throw new Error('Scene text fields must be strings');
  }
  if (
    typeof body.visibility !== 'string' ||
    !SCENE_VISIBILITIES.has(body.visibility)
  ) {
    throw new Error('Invalid scene visibility');
  }

  return {
    title: body.title,
    description: body.description,
    previewVideoUrl: body.previewVideoUrl,
    videoUrl: body.videoUrl,
    visibility: body.visibility,
    setAsFirstScene: body.setAsFirstScene === true,
  };
}

export async function PATCH(
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
    const body = validateSceneUpdate((await request.json()) as SceneUpdateBody);
    return forwardViewerDevApi('/scene/update', { tourId, sceneId, ...body });
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tourId: string; sceneId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  const { tourId, sceneId } = await params;
  const scene = await getAdminTourScene(tourId, sceneId);
  if (!scene) {
    return Response.json({ error: 'Scene not found' }, { status: 404 });
  }
  if (scene.isFirstScene) {
    return Response.json(
      { error: 'Cannot delete the first scene' },
      { status: 400 },
    );
  }

  return forwardViewerDevApi('/scene/delete', { tourId, sceneId });
}
