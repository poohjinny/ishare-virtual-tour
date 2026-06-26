import type {
  FaqEntry,
  Hotspot,
  NamingOpportunityStatus,
  PopupDisplay,
  SceneMapPosition,
  Tour,
  TourKnowledge,
  ViewPosition,
} from '../types/tour';
import {
  setDevCatalogSnapshot,
  type DevCatalogSnapshot,
} from '../data/devCatalogSnapshot';

const DEV_API_BASE = '/__dev/api';

export class DevTourApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevTourApiError';
  }
}

interface DevScenePayload {
  tourId: string;
  sceneId: string;
  defaultView: ViewPosition;
}

interface DevHotspotBasePayload {
  tourId: string;
  sceneId: string;
  name: string;
  position: { yaw: number; pitch: number };
}

export interface DevNavHotspotPayload extends DevHotspotBasePayload {
  targetSceneId: string;
  instant?: boolean;
  previewImage?: string;
}

export interface DevNamingHotspotPayload extends DevHotspotBasePayload {
  price: string;
  status: NamingOpportunityStatus;
  body?: string;
  videoUrl?: string;
  image?: string;
}

export interface DevInfoHotspotPayload extends DevHotspotBasePayload {
  body?: string;
  title?: string;
  display?: PopupDisplay;
  videoUrl?: string;
  image?: string;
}

async function postDevTourJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${DEV_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { error?: string } & T;
  if (!response.ok) {
    throw new DevTourApiError(
      data.error ?? `Dev API failed (${response.status})`,
    );
  }

  return data;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export interface DevCreateScenePayload {
  tourId: string;
  title: string;
  panoramaFile: File;
  defaultView?: ViewPosition;
  description?: string;
}

export function devApplySceneDefaultView(payload: DevScenePayload) {
  return postDevTourJson<{
    ok: true;
    defaultView: ViewPosition;
    thumbnail: string;
  }>('/scene/default-view', payload);
}

export async function devCreateScene({
  panoramaFile,
  ...payload
}: DevCreateScenePayload) {
  const panoramaFileBase64 = await fileToBase64(panoramaFile);

  return postDevTourJson<{ ok: true; scene: { id: string; title: string } }>(
    '/scene/create',
    { ...payload, panoramaFileName: panoramaFile.name, panoramaFileBase64 },
  );
}

export function devCreateNavHotspot(payload: DevNavHotspotPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/nav',
    payload,
  );
}

export function devCreateNamingHotspot(payload: DevNamingHotspotPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/naming',
    payload,
  );
}

export function devCreateInfoHotspot(payload: DevInfoHotspotPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/info',
    payload,
  );
}

export interface DevHotspotIdPayload {
  tourId: string;
  sceneId: string;
  hotspotId: string;
}

export interface DevHotspotPositionPayload extends DevHotspotIdPayload {
  position: { yaw: number; pitch: number };
}

export interface DevReplacePanoramaPayload {
  tourId: string;
  sceneId: string;
  panoramaFile: File;
}

export function devDeleteHotspot(payload: DevHotspotIdPayload) {
  return postDevTourJson<{ ok: true; hotspotId: string }>(
    '/hotspot/delete',
    payload,
  );
}

export function devUpdateHotspotPosition(payload: DevHotspotPositionPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/position',
    payload,
  );
}

export async function devReplaceScenePanorama({
  panoramaFile,
  ...payload
}: DevReplacePanoramaPayload) {
  const panoramaFileBase64 = await fileToBase64(panoramaFile);

  return postDevTourJson<{ ok: true; panorama: string; thumbnail: string }>(
    '/scene/replace-panorama',
    { ...payload, panoramaFileName: panoramaFile.name, panoramaFileBase64 },
  );
}

export interface DevTourMutateOptions {
  navigateToScene?: string;
  refreshKnowledge?: boolean;
}

export type DevNewTourClientMode = 'existing' | 'new';

export interface DevCatalogClient {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  phoneLabel?: string;
  fax?: string;
  faxLabel?: string;
  address?: string;
  tourCount: number;
}

export interface DevTourCatalogMeta {
  visibility: 'public' | 'unlisted' | 'internal';
  featured: boolean;
}

export interface DevUpdateTourPayload {
  tourId: string;
  tourTitle: string;
  category: string;
  websiteUrl?: string;
  primaryColor?: string;
  logoAlt?: string;
  logoFile?: File | null;
  faviconFile?: File | null;
  visibility?: 'public' | 'unlisted' | 'internal';
  featured?: boolean;
  clientDisplayName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientPhoneLabel?: string;
  clientFax?: string;
  clientFaxLabel?: string;
  clientAddress?: string;
  fontFamily?: string;
  fontSourceUrl?: string;
  clearFontFamily?: boolean;
  clearFontSourceUrl?: boolean;
  productFullName?: string;
  transitionEffect?: 'fade' | 'black';
  transitionSpeed?: string;
  clearDefaultTransition?: boolean;
  immersiveAudio?: string;
  /** Newline-separated track URLs/paths */
  immersivePlaylist?: string;
  immersivePlaylistManifest?: string;
  immersiveVolume?: number;
  clearImmersiveBackground?: boolean;
}

export interface DevSuggestBrandingResult {
  primaryColor: string | null;
  faviconFileBase64: string | null;
  faviconFileName: string | null;
  logoFileBase64: string | null;
  logoFileName: string | null;
  notes: string[];
}

export interface DevSuggestContactResult {
  email: string | null;
  phone: string | null;
  phoneLabel: string | null;
  address: string | null;
  notes: string[];
}

export interface DevCreateTourPayload {
  mode: DevNewTourClientMode;
  clientId?: string;
  clientName?: string;
  tourId: string;
  tourTitle: string;
  category: string;
  websiteUrl?: string;
  firstSceneTitle: string;
  panoramaFile: File;
  logoFile?: File | null;
  faviconFile?: File | null;
  primaryColor?: string;
  defaultView?: ViewPosition;
  visibility?: 'public' | 'unlisted' | 'internal';
  featured?: boolean;
  clientEmail?: string;
  clientPhone?: string;
  clientPhoneLabel?: string;
  clientAddress?: string;
}

function base64ToFile(base64: string, fileName: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mimeType });
}

export function devBase64ToImageFile(base64: string, fileName: string) {
  return base64ToFile(base64, fileName, 'image/png');
}

export async function devFetchCatalogClients(): Promise<DevCatalogClient[]> {
  const response = await fetch(`${DEV_API_BASE}/catalog/clients`);
  const data = (await response.json()) as {
    error?: string;
    clients?: DevCatalogClient[];
  };
  if (!response.ok || !data.clients) {
    throw new DevTourApiError(
      data.error ?? `Dev API failed (${response.status})`,
    );
  }
  return data.clients;
}

export async function devUpdateTour({
  logoFile,
  faviconFile,
  ...payload
}: DevUpdateTourPayload) {
  const logoFileBase64 = logoFile ? await fileToBase64(logoFile) : undefined;
  const faviconFileBase64 =
    faviconFile ? await fileToBase64(faviconFile) : undefined;

  return postDevTourJson<{ ok: true; tourId: string; tour: Tour }>(
    '/tour/update',
    { ...payload, logoFileBase64, faviconFileBase64 },
  );
}

export async function devSuggestBranding(
  websiteUrl: string,
): Promise<DevSuggestBrandingResult> {
  const data = await postDevTourJson<{ ok: true } & DevSuggestBrandingResult>(
    '/tour/suggest-branding',
    { websiteUrl },
  );
  return {
    primaryColor: data.primaryColor,
    faviconFileBase64: data.faviconFileBase64,
    faviconFileName: data.faviconFileName,
    logoFileBase64: data.logoFileBase64,
    logoFileName: data.logoFileName,
    notes: data.notes,
  };
}

export async function devSuggestContact(
  websiteUrl: string,
): Promise<DevSuggestContactResult> {
  const data = await postDevTourJson<{ ok: true } & DevSuggestContactResult>(
    '/tour/suggest-contact',
    { websiteUrl },
  );
  return {
    email: data.email,
    phone: data.phone,
    phoneLabel: data.phoneLabel,
    address: data.address,
    notes: data.notes,
  };
}

export async function devCreateTour({
  panoramaFile,
  logoFile,
  faviconFile,
  ...payload
}: DevCreateTourPayload) {
  const panoramaFileBase64 = await fileToBase64(panoramaFile);
  const logoFileBase64 = logoFile ? await fileToBase64(logoFile) : undefined;
  const faviconFileBase64 =
    faviconFile ? await fileToBase64(faviconFile) : undefined;

  return postDevTourJson<{
    ok: true;
    tourId: string;
    clientId: string;
    firstSceneId: string;
    tour: Tour;
  }>('/tour/create', {
    ...payload,
    panoramaFileName: panoramaFile.name,
    panoramaFileBase64,
    logoFileBase64,
    faviconFileBase64,
  });
}

export async function devFetchTourRecord(
  tourId: string,
): Promise<{ tour: Tour; catalog: DevTourCatalogMeta | null }> {
  const response = await fetch(
    `${DEV_API_BASE}/tour/${encodeURIComponent(tourId)}`,
  );
  const data = (await response.json()) as {
    error?: string;
    tour?: Tour;
    catalog?: DevTourCatalogMeta | null;
  };
  if (!response.ok || !data.tour) {
    throw new DevTourApiError(
      data.error ?? `Dev API failed (${response.status})`,
    );
  }
  return { tour: data.tour, catalog: data.catalog ?? null };
}

export async function devFetchTour(tourId: string): Promise<Tour> {
  const { tour } = await devFetchTourRecord(tourId);
  return tour;
}

export async function devFetchKnowledge(
  tourId: string,
): Promise<{ knowledge: TourKnowledge; missing: boolean }> {
  const response = await fetch(
    `${DEV_API_BASE}/knowledge/${encodeURIComponent(tourId)}`,
  );
  const data = (await response.json()) as {
    error?: string;
    knowledge?: TourKnowledge;
    missing?: boolean;
  };
  if (!response.ok || !data.knowledge) {
    throw new DevTourApiError(
      data.error ?? `Dev API failed (${response.status})`,
    );
  }
  return { knowledge: data.knowledge, missing: data.missing ?? false };
}

export interface DevUpdateKnowledgePayload {
  tourId: string;
  url?: string;
  global?: { facilityName?: string; summary?: string };
  sceneId?: string;
  scene?: {
    title?: string;
    description?: string;
    facts?: string[];
    faqs?: FaqEntry[];
    suggestedQuestions?: string[];
  };
}

export function devUpdateKnowledge(payload: DevUpdateKnowledgePayload) {
  return postDevTourJson<{
    ok: true;
    tourId: string;
    knowledge: TourKnowledge;
    created: boolean;
  }>('/knowledge/update', payload);
}

export interface DevDeleteTourPayload {
  tourId: string;
  confirmTourId: string;
}

export function devDeleteTour(payload: DevDeleteTourPayload) {
  return postDevTourJson<{
    ok: true;
    tourId: string;
    clientId: string;
    redirectTourId: string | null;
  }>('/tour/delete', payload);
}

export function devDeleteScene(payload: { tourId: string; sceneId: string }) {
  return postDevTourJson<{ ok: true; sceneId: string; firstScene: string }>(
    '/scene/delete',
    payload,
  );
}

export async function devFetchCatalog(): Promise<DevCatalogSnapshot> {
  const response = await fetch(`${DEV_API_BASE}/catalog`);
  const data = (await response.json()) as {
    error?: string;
    catalog?: DevCatalogSnapshot;
  };
  if (!response.ok || !data.catalog) {
    throw new DevTourApiError(
      data.error ?? `Dev API failed (${response.status})`,
    );
  }
  return data.catalog;
}

export async function refreshDevCatalogSnapshot(): Promise<DevCatalogSnapshot> {
  const catalog = await devFetchCatalog();
  setDevCatalogSnapshot(catalog);
  return catalog;
}

export interface DevUpdateScenePayload {
  tourId: string;
  sceneId: string;
  title?: string;
  description?: string;
  setAsFirstScene?: boolean;
  map?: SceneMapPosition;
  clearMap?: boolean;
}

export function devUpdateScene(payload: DevUpdateScenePayload) {
  return postDevTourJson<{
    ok: true;
    scene: { id: string; title: string };
    firstScene: string;
  }>('/scene/update', payload);
}

export interface DevUpdateNavHotspotPayload extends DevHotspotIdPayload {
  label?: string;
  targetSceneId?: string;
  targetView?: ViewPosition;
  syncTargetViewFromScene?: boolean;
  instant?: boolean;
  previewImage?: string;
  clearPreviewImage?: boolean;
}

export interface DevUpdateNamingHotspotPayload extends DevHotspotIdPayload {
  title?: string;
  price?: string;
  status?: NamingOpportunityStatus;
  body?: string;
  videoUrl?: string;
  image?: string;
}

export interface DevUpdateInfoHotspotPayload extends DevHotspotIdPayload {
  title?: string;
  body?: string;
  display?: PopupDisplay;
  videoUrl?: string;
  image?: string;
}

export function devUpdateNavHotspot(payload: DevUpdateNavHotspotPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/nav/update',
    payload,
  );
}

export function devUpdateNamingHotspot(payload: DevUpdateNamingHotspotPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/naming/update',
    payload,
  );
}

export function devUpdateInfoHotspot(payload: DevUpdateInfoHotspotPayload) {
  return postDevTourJson<{ ok: true; hotspot: Hotspot }>(
    '/hotspot/info/update',
    payload,
  );
}

export interface DevUpdateTourFloorPlanPayload {
  tourId: string;
  floorPlanFile?: File | null;
  width?: number;
  height?: number;
  clearFloorPlan?: boolean;
}

export async function devUpdateTourFloorPlan({
  floorPlanFile,
  ...payload
}: DevUpdateTourFloorPlanPayload) {
  const floorPlanFileBase64 =
    floorPlanFile ? await fileToBase64(floorPlanFile) : undefined;

  return postDevTourJson<{
    ok: true;
    tourId: string;
    tour: Tour;
    floorPlan: Tour['floorPlan'] | null;
  }>('/tour/floor-plan/update', {
    ...payload,
    floorPlanFileBase64,
    floorPlanFileName: floorPlanFile?.name,
  });
}
