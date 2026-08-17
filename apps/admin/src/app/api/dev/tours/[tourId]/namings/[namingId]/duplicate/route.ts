import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tourId: string; namingId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { tourId, namingId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    return forwardViewerDevApi('/naming-opportunity/duplicate', {
      tourId,
      namingId,
      ...body,
    });
  } catch (error) {
    return badRequest(error);
  }
}
