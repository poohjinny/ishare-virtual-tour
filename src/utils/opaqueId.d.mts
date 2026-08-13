export function createOpaqueId(prefix: string, length?: number): string;

export function allocateOpaqueId(
  prefix: string,
  taken: Iterable<string>,
  length?: number,
): string;

export const OPAQUE_SCENE_ID_PREFIX: 's_';
export const OPAQUE_TOUR_ID_PREFIX: 't_';
export const OPAQUE_NAMING_ID_PREFIX: 'no_';
export const OPAQUE_HOTSPOT_ID_PREFIX: 'h_';

export function isOpaqueHotspotId(value?: string | null): boolean;
export function isOpaqueTourId(value?: string | null): boolean;
export function isOpaqueSceneId(value?: string | null): boolean;

export function assertOpaqueTourId(value: unknown, label?: string): string;
export function assertOpaqueSceneId(value: unknown, label?: string): string;
export function assertClientId(value: unknown, label?: string): string;
/** @deprecated Use {@link assertClientId} or assertOpaqueTourId / assertOpaqueSceneId. */
export function assertEntityId(value: unknown, label?: string): string;
