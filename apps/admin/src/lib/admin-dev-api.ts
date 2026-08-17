import type { TourVisibility } from '@/lib/tour-catalog';
import type {
  AdminBrandingMode,
  AdminImmersiveMode,
  AdminTourDetail,
  AdminTransitionEffect,
} from '@/lib/tour-detail';
import type {
  AdminNamingOpportunity,
  AdminNamingStatus,
} from '@/lib/tour-namings';

export interface AdminSceneUpdate {
  title: string;
  description: string;
  previewVideoUrl: string;
  videoUrl: string;
  visibility: TourVisibility;
  setAsFirstScene: boolean;
}

export interface AdminTourUpdate {
  tourTitle: string;
  tourSummary: string;
  category: string;
  visibility: TourVisibility;
  askGuideEnabled: boolean;
  productFullName: string;
  brandingMode: AdminBrandingMode;
  primaryColor: string;
  logoAlt: string;
  fontFamily: string;
  fontSourceUrl: string;
  clearFontFamily: boolean;
  clearFontSourceUrl: boolean;
  transitionEffect: AdminTransitionEffect;
  transitionSpeed: string;
  immersiveMode: AdminImmersiveMode;
  immersiveAudio: string;
  immersivePlaylistText: string;
  immersivePlaylistManifest: string;
  immersiveVolume: string;
  logoFileBase64?: string;
  faviconFileBase64?: string;
}

async function readJsonResult<T extends object = Record<string, unknown>>(
  response: Response,
) {
  const result = (await response.json()) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(result.error ?? `Request failed (${response.status})`);
  }
  return result;
}

async function requestJson<T extends object = Record<string, unknown>>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readJsonResult<T>(response);
}

export async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function base64ToImageFile(base64: string, fileName: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: 'image/png' });
}

export async function updateLocalScene(
  tourId: string,
  sceneId: string,
  update: AdminSceneUpdate,
) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/${encodeURIComponent(sceneId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    },
  );
  return readJsonResult(response);
}

export async function updateLocalTour(tourId: string, update: AdminTourUpdate) {
  const response = await fetch(`/api/dev/tours/${encodeURIComponent(tourId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  return readJsonResult(response);
}

export async function fetchLocalTour(tourId: string) {
  const response = await fetch(`/api/dev/tours/${encodeURIComponent(tourId)}`);
  return readJsonResult<AdminTourDetail>(response);
}

export interface AdminSceneCreate {
  title: string;
  description?: string;
  previewVideoUrl?: string;
  videoUrl?: string;
  createPlaceOverview?: boolean;
  panoramaFileBase64?: string;
  panoramaFileName?: string;
}

export interface AdminSceneDuplicate {
  namingMode?: 'duplicate' | 'keep' | 'clear';
  includeChildren?: boolean;
  linkUnderSameParent?: boolean;
}

export async function createLocalScene(
  tourId: string,
  payload: AdminSceneCreate,
) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  return readJsonResult(response);
}

export async function deleteLocalScene(tourId: string, sceneId: string) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/${encodeURIComponent(sceneId)}`,
    { method: 'DELETE' },
  );
  return readJsonResult(response);
}

export async function duplicateLocalScene(
  tourId: string,
  sceneId: string,
  options: AdminSceneDuplicate,
) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/${encodeURIComponent(sceneId)}/duplicate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    },
  );
  return readJsonResult(response);
}

export async function reorderLocalScenes(tourId: string, sceneOrder: string[]) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/order`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneOrder }),
    },
  );
  return readJsonResult(response);
}

export async function applyLocalSceneDefaultView(
  tourId: string,
  sceneId: string,
  defaultView: Record<string, number>,
) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/${encodeURIComponent(sceneId)}/default-view`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultView }),
    },
  );
  return readJsonResult(response);
}

export async function replaceLocalScenePanorama(
  tourId: string,
  sceneId: string,
  file: File,
) {
  const response = await fetch(
    `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/${encodeURIComponent(sceneId)}/replace-panorama`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        panoramaFileName: file.name,
        panoramaFileBase64: await fileToBase64(file),
      }),
    },
  );
  return readJsonResult(response);
}

export type AdminHotspotPosition =
  | { yaw: number; pitch: number }
  | { x: number; y: number; z: number };

export interface AdminHotspotCreate {
  kind: 'nav' | 'info' | 'naming' | 'place-overview';
  position: AdminHotspotPosition;
  name?: string;
  targetSceneId?: string;
  namingId?: string;
  title?: string;
  body?: string;
  display?: 'modal' | 'anchored';
  videoUrl?: string;
  image?: string;
  visitScene?: string;
}

export interface AdminHotspotUpdate {
  kind: 'nav' | 'info' | 'naming';
  label?: string;
  targetSceneId?: string;
  namingId?: string;
  title?: string;
  price?: number;
  status?: AdminNamingStatus;
  body?: string;
  display?: 'modal' | 'anchored';
  videoUrl?: string;
  image?: string;
  donor?: AdminNamingOpportunity['donor'];
  visitScene?: string;
  visibility?: TourVisibility;
}

function hotspotPath(tourId: string, sceneId: string, suffix = '') {
  return `/api/dev/tours/${encodeURIComponent(tourId)}/scenes/${encodeURIComponent(sceneId)}/hotspots${suffix}`;
}

export function createLocalHotspot(
  tourId: string,
  sceneId: string,
  payload: AdminHotspotCreate,
) {
  return requestJson(hotspotPath(tourId, sceneId), 'POST', payload);
}

export function updateLocalHotspot(
  tourId: string,
  sceneId: string,
  hotspotId: string,
  payload: AdminHotspotUpdate,
) {
  return requestJson(
    hotspotPath(tourId, sceneId, `/${encodeURIComponent(hotspotId)}`),
    'PATCH',
    payload,
  );
}

export function deleteLocalHotspot(
  tourId: string,
  sceneId: string,
  hotspotId: string,
) {
  return requestJson(
    hotspotPath(tourId, sceneId, `/${encodeURIComponent(hotspotId)}`),
    'DELETE',
  );
}

export function updateLocalHotspotPosition(
  tourId: string,
  sceneId: string,
  hotspotId: string,
  position: AdminHotspotPosition,
) {
  return requestJson(
    hotspotPath(tourId, sceneId, `/${encodeURIComponent(hotspotId)}/position`),
    'POST',
    { position },
  );
}

export interface AdminNamingCreate {
  sceneId: string;
  name: string;
  price: number;
  status: AdminNamingStatus;
  body: string;
  videoUrl: string;
  image: string;
  visibility: TourVisibility;
  donor?: AdminNamingOpportunity['donor'];
}

export function createLocalNaming(tourId: string, payload: AdminNamingCreate) {
  return requestJson(
    `/api/dev/tours/${encodeURIComponent(tourId)}/namings`,
    'POST',
    payload,
  );
}

export function updateLocalNaming(
  tourId: string,
  naming: AdminNamingOpportunity,
) {
  const placement = naming.placements[0];
  if (!placement)
    throw new Error('Place this naming opportunity before editing it.');
  return updateLocalHotspot(tourId, placement.sceneId, placement.hotspotId, {
    kind: 'naming',
    title: naming.name,
    price: naming.price,
    status: naming.status,
    body: naming.body,
    videoUrl: naming.videoUrl,
    image: naming.image,
    donor: naming.donor,
    visibility: naming.visibility,
    namingId: naming.id,
  });
}

export function duplicateLocalNaming(
  tourId: string,
  namingId: string,
  options?: { includePlacements?: boolean; resetAsOpen?: boolean },
) {
  return requestJson(
    `/api/dev/tours/${encodeURIComponent(tourId)}/namings/${encodeURIComponent(namingId)}/duplicate`,
    'POST',
    options ?? { includePlacements: false },
  );
}

export function deleteLocalNaming(
  tourId: string,
  namingId: string,
  placements: Array<{ sceneId: string; hotspotId: string }>,
) {
  return requestJson(
    `/api/dev/tours/${encodeURIComponent(tourId)}/namings/${encodeURIComponent(namingId)}`,
    'DELETE',
    { placements },
  );
}

export interface AdminClientPayload {
  clientId: string;
  clientName: string;
  websiteUrl: string;
  clientEmail: string;
  clientPhone: string;
  clientPhoneLabel: string;
  clientFax: string;
  clientFaxLabel: string;
  clientAddress: string;
  clientLogoAlt: string;
  primaryColor: string;
  fontFamily: string;
  fontSourceUrl: string;
  logoFileBase64?: string;
  faviconFileBase64?: string;
}

export function createLocalClient(payload: AdminClientPayload) {
  return requestJson('/api/dev/clients', 'POST', payload);
}

export function updateLocalClient(
  clientId: string,
  payload: AdminClientPayload,
) {
  return requestJson(
    `/api/dev/clients/${encodeURIComponent(clientId)}`,
    'PATCH',
    payload,
  );
}

export function deleteLocalClient(clientId: string) {
  return requestJson(
    `/api/dev/clients/${encodeURIComponent(clientId)}`,
    'DELETE',
    { confirmClientId: clientId },
  );
}

export function suggestLocalClient(
  kind: 'contact' | 'branding',
  websiteUrl: string,
) {
  return requestJson<{
    email?: string | null;
    phone?: string | null;
    phoneLabel?: string | null;
    address?: string | null;
    primaryColor?: string | null;
    faviconFileBase64?: string | null;
    faviconFileName?: string | null;
    logoFileBase64?: string | null;
    logoFileName?: string | null;
    notes?: string[];
  }>(`/api/dev/clients/suggestions/${kind}`, 'POST', { websiteUrl });
}

export interface AdminTourCreate {
  clientId: string;
  tourId: string;
  tourTitle: string;
  tourSummary: string;
  category: string;
  firstSceneTitle: string;
  visibility: TourVisibility;
  askGuideEnabled?: boolean;
  productFullName?: string;
  brandingMode: AdminBrandingMode;
  primaryColor: string;
  logoAlt: string;
  fontFamily: string;
  fontSourceUrl: string;
  transitionEffect: AdminTransitionEffect;
  transitionSpeed: string;
  immersiveMode: AdminImmersiveMode;
  immersiveAudio: string;
  immersivePlaylistText: string;
  immersivePlaylistManifest: string;
  immersiveVolume: string;
  logoFileBase64?: string;
  faviconFileBase64?: string;
  panoramaFileBase64: string;
  panoramaFileName: string;
}

export function createLocalTour({
  immersiveMode,
  immersivePlaylistText,
  immersiveVolume,
  ...payload
}: AdminTourCreate) {
  return requestJson('/api/dev/tours', 'POST', {
    ...payload,
    clearImmersiveBackground: immersiveMode === 'platform',
    immersiveAudio:
      immersiveMode === 'audio' ? payload.immersiveAudio : undefined,
    immersivePlaylist:
      immersiveMode === 'playlist' ? immersivePlaylistText : undefined,
    immersivePlaylistManifest:
      immersiveMode === 'manifest' ?
        payload.immersivePlaylistManifest
      : undefined,
    immersiveVolume:
      immersiveMode !== 'platform' && immersiveVolume.trim() ?
        Number(immersiveVolume)
      : undefined,
    viewerType: 'panorama',
  });
}

export function deleteLocalTour(tourId: string) {
  return requestJson(`/api/dev/tours/${encodeURIComponent(tourId)}`, 'DELETE', {
    confirmTourId: tourId,
  });
}
