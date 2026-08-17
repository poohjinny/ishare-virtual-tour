import { getAdminTour } from '@/lib/tour-catalog';
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

  const { tourId } = await params;
  if (!getAdminTour(tourId)) {
    return Response.json({ error: 'Tour not found' }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { sceneOrder?: unknown };
    if (
      !Array.isArray(body.sceneOrder) ||
      !body.sceneOrder.every((id) => typeof id === 'string')
    ) {
      throw new Error('sceneOrder must be a string array');
    }

    return forwardViewerDevApi('/scene/order', {
      tourId,
      sceneOrder: body.sceneOrder,
    });
  } catch (error) {
    return badRequest(error);
  }
}
