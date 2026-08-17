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
    for (const field of [
      'clientId',
      'tourId',
      'tourTitle',
      'category',
      'firstSceneTitle',
      'panoramaFileBase64',
      'panoramaFileName',
    ]) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        throw new Error(`${field} is required`);
      }
    }
    return forwardViewerDevApi('/tour/create', {
      ...body,
      viewerType: 'panorama',
    });
  } catch (error) {
    return badRequest(error);
  }
}
