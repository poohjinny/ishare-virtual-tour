import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { tourId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.sceneId !== 'string' || !body.sceneId.trim()) {
      throw new Error('Host scene is required');
    }
    if (typeof body.name !== 'string') {
      throw new Error('Name must be a string');
    }
    if (typeof body.price !== 'number' || !Number.isFinite(body.price)) {
      throw new Error('Price must be a number');
    }
    return forwardViewerDevApi('/naming-opportunity', { tourId, ...body });
  } catch (error) {
    return badRequest(error);
  }
}
