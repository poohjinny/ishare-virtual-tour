import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { kind } = await params;
    if (kind !== 'contact' && kind !== 'branding') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const body = (await request.json()) as { websiteUrl?: unknown };
    if (typeof body.websiteUrl !== 'string' || !body.websiteUrl.trim()) {
      throw new Error('Website URL is required');
    }
    return forwardViewerDevApi(`/tour/suggest-${kind}`, {
      websiteUrl: body.websiteUrl,
    });
  } catch (error) {
    return badRequest(error);
  }
}
