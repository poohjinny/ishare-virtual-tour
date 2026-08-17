import { getAdminTour } from '@/lib/tour-catalog';
import { getAdminTourDetail } from '@/lib/tour-detail';
import { buildViewerDevApiUrl } from '@/lib/viewer-url';
import {
  badRequest,
  forwardViewerDevApi,
  requireDevMode,
} from '@/lib/admin-dev-proxy';

const VISIBILITIES = new Set(['public', 'unlisted', 'internal']);
const BRANDING_MODES = new Set(['client', 'custom']);
const TRANSITION_EFFECTS = new Set(['fade', 'black']);
const IMMERSIVE_MODES = new Set(['platform', 'manifest', 'audio', 'playlist']);

interface TourUpdateBody {
  tourTitle?: unknown;
  tourSummary?: unknown;
  category?: unknown;
  visibility?: unknown;
  askGuideEnabled?: unknown;
  productFullName?: unknown;
  brandingMode?: unknown;
  primaryColor?: unknown;
  logoAlt?: unknown;
  fontFamily?: unknown;
  fontSourceUrl?: unknown;
  clearFontFamily?: unknown;
  clearFontSourceUrl?: unknown;
  transitionEffect?: unknown;
  transitionSpeed?: unknown;
  immersiveMode?: unknown;
  immersiveAudio?: unknown;
  immersivePlaylistText?: unknown;
  immersivePlaylistManifest?: unknown;
  immersiveVolume?: unknown;
  logoFileBase64?: unknown;
  faviconFileBase64?: unknown;
}

function requireString(value: unknown, label: string) {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

function validateTourUpdate(body: TourUpdateBody) {
  const tourTitle = requireString(body.tourTitle, 'tourTitle').trim();
  const category = requireString(body.category, 'category').trim();
  if (!tourTitle) throw new Error('Tour title is required');
  if (!category) throw new Error('Category is required');

  const visibility = requireString(body.visibility, 'visibility');
  if (!VISIBILITIES.has(visibility)) {
    throw new Error('Invalid tour visibility');
  }

  const brandingMode = requireString(body.brandingMode, 'brandingMode');
  if (!BRANDING_MODES.has(brandingMode)) {
    throw new Error('Invalid branding mode');
  }

  const transitionEffect = requireString(
    body.transitionEffect,
    'transitionEffect',
  );
  if (!TRANSITION_EFFECTS.has(transitionEffect)) {
    throw new Error('Invalid transition effect');
  }

  const immersiveMode = requireString(body.immersiveMode, 'immersiveMode');
  if (!IMMERSIVE_MODES.has(immersiveMode)) {
    throw new Error('Invalid immersive mode');
  }

  const immersiveVolume = requireString(body.immersiveVolume, 'immersiveVolume');
  const payload: Record<string, unknown> = {
    tourTitle,
    tourSummary: requireString(body.tourSummary, 'tourSummary'),
    category,
    visibility,
    askGuideEnabled: body.askGuideEnabled === true,
    productFullName: requireString(body.productFullName, 'productFullName'),
    brandingMode,
    primaryColor: requireString(body.primaryColor, 'primaryColor'),
    logoAlt: requireString(body.logoAlt, 'logoAlt'),
    fontFamily: requireString(body.fontFamily, 'fontFamily'),
    fontSourceUrl: requireString(body.fontSourceUrl, 'fontSourceUrl'),
    clearFontFamily: body.clearFontFamily === true,
    clearFontSourceUrl: body.clearFontSourceUrl === true,
    transitionEffect,
    transitionSpeed:
      requireString(body.transitionSpeed, 'transitionSpeed').trim() ||
      undefined,
    clearImmersiveBackground: immersiveMode === 'platform',
    immersiveAudio:
      immersiveMode === 'audio'
        ? requireString(body.immersiveAudio, 'immersiveAudio')
        : undefined,
    immersivePlaylist:
      immersiveMode === 'playlist'
        ? requireString(body.immersivePlaylistText, 'immersivePlaylistText')
        : undefined,
    immersivePlaylistManifest:
      immersiveMode === 'manifest'
        ? requireString(
            body.immersivePlaylistManifest,
            'immersivePlaylistManifest',
          )
        : undefined,
  };

  if (immersiveMode !== 'platform' && immersiveVolume.trim()) {
    const volume = Number(immersiveVolume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new Error('Immersive volume must be between 0 and 1');
    }
    payload.immersiveVolume = volume;
  }

  if (typeof body.logoFileBase64 === 'string' && body.logoFileBase64) {
    payload.logoFileBase64 = body.logoFileBase64;
  }
  if (typeof body.faviconFileBase64 === 'string' && body.faviconFileBase64) {
    payload.faviconFileBase64 = body.faviconFileBase64;
  }

  return payload;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const tour = await getAdminTourDetail(tourId);
  if (!tour) {
    return Response.json({ error: 'Tour not found' }, { status: 404 });
  }
  return Response.json(tour);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tourId: string }> },
) {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const { tourId } = await params;
  if (!getAdminTour(tourId)) {
    return Response.json({ error: 'Tour not found' }, { status: 404 });
  }

  try {
    const body = validateTourUpdate((await request.json()) as TourUpdateBody);
    const response = await fetch(buildViewerDevApiUrl('/tour/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourId, ...body }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      return Response.json(
        { error: result.error ?? 'Viewer dev API update failed' },
        { status: response.status },
      );
    }

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid tour update';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const blocked = requireDevMode();
  if (blocked) return blocked;

  try {
    const { tourId } = await params;
    const body = (await request.json()) as { confirmTourId?: unknown };
    if (body.confirmTourId !== tourId) {
      throw new Error('Tour confirmation does not match');
    }
    return forwardViewerDevApi('/tour/delete', { tourId, ...body });
  } catch (error) {
    return badRequest(error);
  }
}
