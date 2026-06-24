import type {
  Hotspot,
  NamingOpportunityStatus,
  ViewPosition,
} from '../types/tour';

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
}

export interface DevNamingHotspotPayload extends DevHotspotBasePayload {
  price: string;
  status: NamingOpportunityStatus;
  body: string;
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

export function devApplySceneDefaultView(payload: DevScenePayload) {
  return postDevTourJson<{
    ok: true;
    defaultView: ViewPosition;
    thumbnail: string;
  }>('/scene/default-view', payload);
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
