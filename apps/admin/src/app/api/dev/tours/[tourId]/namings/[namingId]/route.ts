import { badRequest, requireDevMode } from '@/lib/admin-dev-proxy';
import { getAdminTourDetail } from '@/lib/tour-detail';
import { getAdminTourScenes } from '@/lib/tour-scenes';
import { buildViewerDevApiUrl } from '@/lib/viewer-url';

interface Placement {
  sceneId?: unknown;
  hotspotId?: unknown;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tourId: string; namingId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { tourId, namingId } = await params;
    const body = (await request.json()) as { placements?: Placement[] };
    if (!Array.isArray(body.placements)) {
      throw new Error('Invalid naming placements');
    }

    const placements = [...body.placements];
    if (placements.length === 0) {
      const [tour, scenes] = await Promise.all([
        getAdminTourDetail(tourId),
        getAdminTourScenes(tourId),
      ]);
      const sceneId = scenes[0]?.id;
      if (!tour || !sceneId) throw new Error('Tour has no host scene');

      const createResponse = await fetch(
        buildViewerDevApiUrl('/hotspot/naming'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId,
            sceneId,
            namingId,
            position:
              tour.viewerType === 'model3d'
                ? { x: 0, y: 0, z: 0 }
                : { yaw: 0, pitch: 0 },
          }),
        },
      );
      const created = (await createResponse.json()) as {
        error?: string;
        hotspot?: { id?: string };
      };
      if (!createResponse.ok || !created.hotspot?.id) {
        return Response.json(
          { error: created.error ?? 'Could not prepare naming deletion' },
          { status: createResponse.status },
        );
      }
      placements.push({ sceneId, hotspotId: created.hotspot.id });
    }

    for (const placement of placements) {
      if (
        typeof placement.sceneId !== 'string' ||
        typeof placement.hotspotId !== 'string'
      ) {
        throw new Error('Invalid naming placement');
      }
      const response = await fetch(buildViewerDevApiUrl('/hotspot/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId,
          sceneId: placement.sceneId,
          hotspotId: placement.hotspotId,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        return Response.json(
          { error: result.error ?? 'Viewer dev API request failed' },
          { status: response.status },
        );
      }
    }

    return Response.json({ ok: true, namingId });
  } catch (error) {
    return badRequest(error);
  }
}
