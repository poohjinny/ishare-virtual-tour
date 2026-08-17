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
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      previewVideoUrl?: unknown;
      videoUrl?: unknown;
      createPlaceOverview?: unknown;
      panoramaFileBase64?: unknown;
      panoramaFileName?: unknown;
    };

    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw new Error('Scene title is required');
    }

    const payload: Record<string, unknown> = {
      tourId,
      title: body.title.trim(),
    };
    if (typeof body.description === 'string') {
      payload.description = body.description;
    }
    if (typeof body.previewVideoUrl === 'string') {
      payload.previewVideoUrl = body.previewVideoUrl;
    }
    if (typeof body.videoUrl === 'string') payload.videoUrl = body.videoUrl;
    if (body.createPlaceOverview === true) {
      payload.createPlaceOverview = true;
    }
    if (
      typeof body.panoramaFileBase64 === 'string' &&
      typeof body.panoramaFileName === 'string'
    ) {
      payload.panoramaFileBase64 = body.panoramaFileBase64;
      payload.panoramaFileName = body.panoramaFileName;
    }

    return forwardViewerDevApi('/scene/create', payload);
  } catch (error) {
    return badRequest(error);
  }
}
