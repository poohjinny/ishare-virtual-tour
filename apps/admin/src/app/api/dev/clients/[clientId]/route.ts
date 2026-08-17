import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { clientId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    return forwardViewerDevApi(
      '/client/update',
      { ...body, clientId },
      'PATCH',
    );
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { clientId } = await params;
    const body = (await request.json()) as { confirmClientId?: unknown };
    if (body.confirmClientId !== clientId) {
      throw new Error('Client confirmation does not match');
    }
    return forwardViewerDevApi('/client/delete', { clientId, ...body });
  } catch (error) {
    return badRequest(error);
  }
}
