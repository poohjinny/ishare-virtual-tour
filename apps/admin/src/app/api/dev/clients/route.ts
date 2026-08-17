import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function POST(request: Request) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.clientName !== 'string' || !body.clientName.trim()) {
      throw new Error('Client name is required');
    }
    return forwardViewerDevApi('/client/create', body);
  } catch (error) {
    return badRequest(error);
  }
}
